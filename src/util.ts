import { dirname, fromFileUrl, toFileUrl } from '../deps.ts';

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
