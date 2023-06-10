import { dirname, emptyDir, resolve, toFileUrl } from '../deps.ts';
import { Commit } from './commit.ts';

export async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (e) {
    if (e && e instanceof Deno.errors.NotFound) {
      return false;
    } else {
      throw e;
    }
  }
}

export function capitalize(str: string): string {
  const diff = str.length - str.trimStart().length;
  const trimmedString = str.trimStart();
  return (str.trimStart().charAt(0).toLocaleUpperCase() +
    trimmedString.slice(1)).padStart(diff, ' ');
}

/**
 * @param url the URL that the user wants to resolve. Could be file-based or http-based
 * @description Note, we will assume that the URL is that of a _file_, and we will strip
 * that out.
 * @returns a string for the URL. If the string starts with http:// or https://
 * then we simply return a trimmed down version of it. Otherwise it returns a file://
 * url based in the current CWD to the end URL.
 */
export function resolveFileImportUrl(
  url: string,
  strip: boolean,
  ...parts: string[]
): string;
export function resolveFileImportUrl(url: string, ...parts: string[]): string;
export function resolveFileImportUrl(...args: unknown[]): string {
  let [url, strip, ...parts] = args;
  if (typeof url !== 'string') {
    throw new Deno.errors.BadResource('invalid arguments');
  }

  if (typeof strip !== 'boolean') {
    parts.unshift(strip);
    strip = true;
  }

  const parsedUrl = new URL(url);
  parsedUrl.pathname = [
    strip ? dirname(parsedUrl.pathname) : parsedUrl.pathname,
    ...parts,
  ].join('/');
  return parsedUrl.toString();
}

export async function runCommand(
  command: string,
  args: string[] = [],
  cwd = Deno.cwd(),
): Promise<{ code: number; stdout: string }> {
  const prefix = Deno.build.os === 'windows' ? ['cmd', '/c'] : [];
  const commandRun = Deno.run({
    cmd: prefix.concat([
      command,
      ...args,
    ]),
    stderr: 'piped',
    stdout: 'piped',
    stdin: 'null',
    cwd,
  });

  const decoder = new TextDecoder();
  const { code } = await commandRun.status();
  const errorOutput = decoder.decode(await commandRun.stderrOutput());
  const output = decoder.decode(await commandRun.output());
  commandRun.close();
  if (code !== 0) {
    throw new Error(errorOutput);
  }

  return {
    stdout: output,
    code,
  };
}

export async function setupPackage(
  name: string,
  origin = 'ssh://github.com:fake/repo,git',
  user = 'Fake Name',
  email = 'fake@test.com',
) {
  const filename = `packages/${name}`;

  // Ensure the dir is there
  await emptyDir(filename);
  // ensure it is git initialized
  await runCommand(
    'git',
    ['init'],
    filename,
  );
  // ensure we're not using the gpg signage
  await runCommand(
    'git',
    ['config', 'commit.gpgsign', 'false'],
    filename,
  );

  await runCommand(
    'git',
    ['remote', 'add', 'origin', origin],
    filename,
  );

  await runCommand(
    'git',
    ['config', 'user.name', user],
    filename,
  );

  await runCommand(
    'git',
    ['config', 'user.email', email],
    filename,
  );

  return filename;
}

export async function fakeGitHistory(
  gitRoot: string,
  commits: Omit<Commit, 'sha'>[],
) {
  /**
   * 1. Iterate over the commits
   * 2. create a new empty commit every time with the filled out properties.
   * 3. return true?
   */
  for (const commit of commits) {
    const optional = commit.author ? ['--author', commit.author] : [];
    await runCommand(
      'git',
      ['commit', '-m', `${commit.subject}`, '--allow-empty', ...optional],
      gitRoot,
    );

    if (commit.tag) {
      await runCommand(
        'git',
        ['tag', commit.tag],
        gitRoot,
      );
    }
  }
  return true;
}

export function normalizeImport(str: string): string {
  if (str.startsWith('file:') || /^https?:/.test(str)) return str;
  return toFileUrl(resolve(str)).href;
}

/**
 * @description Creates a fake version source file in the `location` direction of the corresponding type of a package.json,
 * deps.ts, or Cargo.toml file
 * @param location file location where the package is located, and where the appropriate file should be made.
 * @param type The type of package this is going to be.
 */
export async function generateFakeVersionSource(
  location: string,
  type: 'deno' | 'node' | 'cargo' = 'deno',
  version = '0.1.0',
) {
  console.info(location, version);
  let contents = '';
  switch (type) {
    case 'node':
      contents = JSON.stringify({ version });
      break;
    case 'cargo':
      // Cargo.toml
      contents = `[package]\nversion="${version}"[test]something="else"`;
      break;
    // Deno is the default
    default:
      // do stuff
      await Deno.writeTextFile(
        `${location}/deps.ts`,
        `export const VERSION = '${version}';`,
      );
      break;
  }
}
