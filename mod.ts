import { dirname, fromFileUrl, resolve, toFileUrl } from 'deps';
import { makePreset, PresetBuildable } from 'src/preset.ts';
import Git from './src/git.ts';
import { BumpConstructable, BumpStrategy, makeStrategy } from 'src/strategy.ts';
import { makeChangelogWriter } from 'src/generator.ts';
import { GitProviderBuildable, makeGitProvider } from 'src/provider.ts';
import { DefaultWriter } from 'src/changelog/default.ts';
import { ChangelogWriter } from 'src/generator.ts';

export * from 'deps';

import args from './args.ts';

const CWD = Deno.cwd();

const git = new Git(CWD);

/**
 * 1. Get Latest Version.
 *
 * This involves us first checking the deps.ts file, then moving over to git fallbacks.
 * _WE ASSUME THAT THE VERSION IN THE `deps.ts` FILE IS THE SOURCE OF TRUTH OVER GIT TAGS._
 */

let version: string | undefined = undefined;
const strategyArg = args.strategy || 'deno';
let stratPath = '';
let strategy: BumpStrategy | undefined = undefined;

if (!strategyArg.startsWith('http')) {
  stratPath = './src/strategies/' + strategyArg + '.ts';
} else {
  stratPath = strategyArg;
}

const stratImport = await import(stratPath)
  .then((res) => (res.default || res) as BumpConstructable);

strategy = makeStrategy(stratImport, args, CWD);

if (!strategy) {
  throw Error('Could not load file bump strategy: ' + strategyArg);
}

const currentVersion = await strategy.getCurrentVersion();

if (currentVersion && !currentVersion.startsWith('v')) {
  version = `${args.versionPrefix}${currentVersion}`;
}

/**
 * 2. Gather the necessary commits
 */

let commits = [];
// If we have a version and the tag exists, we can safely pull the commits
// From the tag.
if (
  version &&
  await git.tagExists(version)
) {
  commits = await git.logs(version);
} else {
  version = '0.1.0';
  // Otherwise we are just going to need all of the logs.
  commits = await git.logs();
}

if (commits.length === 0) {
  throw new Deno.errors.BadResource('No commits to use');
}
/**
 * 3. Figure out our preset
 */

let preset = args.preset || 'angular';

if (!preset.startsWith('http')) {
  preset = toFileUrl(resolve(
    dirname(fromFileUrl(import.meta.url)),
    'src',
    'presets',
    `${preset}.ts`,
  )).href;
}

// Try to load preset.
const loadedPreset = await import(preset).then((res) =>
  (res.default || res) as PresetBuildable
);

// Make the preset.
const presetInstance = makePreset(loadedPreset);

// Bumped version
const bumpedVersion = await presetInstance.calculateBump({
  currentVersion: version.startsWith('v') ? version.slice(1) : version,
  commits,
  args,
});

const commitMessage = await presetInstance.generateCommit({
  version: bumpedVersion,
  commits,
  args,
});

const changelogPath = resolve(CWD, 'CHANGELOG.md');
const {
  stdout: gitRemote,
} = await git.remote();

if (!gitRemote) {
  throw new Deno.errors.NotFound('Could not find git remote URL');
}

const provider = args.provider || null;

let providerValue: GitProviderBuildable | null = null;
// First we see if we can guess the provider.

const parsedRemoteUrl = await Git.parseGitRemoteUrl(gitRemote);
// Can't go forward without a parsed URL.
if (!parsedRemoteUrl) throw new Deno.errors.BadResource('Cannot parse url');

// If the provider is null then we see if we have one that can be used.
if (provider === null) {
  try {
    providerValue = await import(
      `./src/providers/${parsedRemoteUrl.host.split(':')[0]}.ts`
    )
      .then((res) => (res.default || res) as GitProviderBuildable);
  } catch (e) {
    console.error(e);
    throw e;
  }
}

let changelogWriter: ChangelogWriter | null = null;

if (providerValue) {
  changelogWriter = makeChangelogWriter(
    DefaultWriter,
    args,
    parsedRemoteUrl,
    makeGitProvider(providerValue, parsedRemoteUrl),
  );
}

/**
 * Now we bring it all together.
 * 1. Write the commit
 * 2. Write the changelog
 * 3. Write the version file.
 */

if (!changelogWriter) {
  throw new Deno.errors.BadResource('Whoops');
}

const results = await Promise.allSettled([
  changelogWriter.write(changelogPath, bumpedVersion, commits),
  strategy.bump(bumpedVersion),
]);

if (results.some((result) => result.status === 'rejected')) {
  console.log(results);
  throw new Error('Something failed, abort ship');
}
// Commit the changes
await git.add();

await git.commit(commitMessage);

await git.tag(`${args.versionPrefix}${bumpedVersion}`);
