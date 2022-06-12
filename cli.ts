import { type Args, container, resolve, toFileUrl } from './deps.ts';
import AngularGitConvention from './src/presets/angular.ts';
import { DefaultWriter } from './src/changelog/default.ts';
import {
  ChangelogWriter,
  ChangelogWriterBuldable,
} from './src/changelogWriter.ts';
import {
  VersionStrategy,
  VersionStrategyConstructable,
} from './src/versionStrategy.ts';
import DenoTsStrategy from './src/strategies/deno.ts';
import { GitConvention, GitConventionBuildable } from './src/gitConvention.ts';
import { Git } from './src/git.ts';
import { resolveFileImportUrl } from './src/util.ts';
import {
  GitProvider,
  GitProviderBuildable,
  makeGitProvider,
} from './src/gitProvider.ts';

import './args.ts';
import './src/cwd.ts';
import log from './logger.ts';

import { VersionArgsCli } from './src/versionBumpCli.ts';
import HistoricCli from './src/historic.ts';

// Grab the args
const args = container.resolve<Args>('args');

if (args.preset !== 'angular') {
  let { preset } = args;
  if (!preset.startsWith('file://') && !preset.startsWith('http')) {
    preset = toFileUrl(resolve(preset)).href;
  }

  const importedPreset = await import(preset)
    .then((res) => res.default as GitConventionBuildable);

  if (importedPreset) {
    container.register<GitConvention>(GitConvention, {
      useClass: importedPreset,
    });
  }
} else {
  container.register(GitConvention, { useClass: AngularGitConvention });
}

if (args.changelogWriter !== 'default') {
  let { changelogWriter } = args;
  if (
    !changelogWriter.startsWith('file') && !changelogWriter.startsWith('http')
  ) {
    changelogWriter = toFileUrl(resolve(changelogWriter)).href;
  }

  const importedChangelog = await import(changelogWriter)
    .then((res) => res.default as ChangelogWriterBuldable);
  if (importedChangelog) {
    container.register(ChangelogWriter, { useClass: importedChangelog });
  }
} else {
  container.register(ChangelogWriter, { useClass: DefaultWriter });
}

if (args.versionStrategy === 'node') {
  const url = new URL('src/strategies/node.ts', import.meta.url).href;
  const imported = await import(url)
    .then((res) => res.default as VersionStrategyConstructable);
  container.register<VersionStrategy>(VersionStrategy, {
    useClass: imported,
  });
} else if (args.versionStrategy !== 'deno') {
  let { versionStrategy } = args;
  if (
    !versionStrategy.startsWith('file') && !versionStrategy.startsWith('http')
  ) {
    versionStrategy = toFileUrl(resolve(versionStrategy)).href;
  }

  const imported = await import(versionStrategy)
    .then((res) => res.default as VersionStrategyConstructable);

  if (imported) {
    container.register(VersionStrategy, { useClass: imported });
  }
} else {
  container.register<VersionStrategy>(VersionStrategy, {
    useClass: DenoTsStrategy,
  });
}

const git = container.resolve(Git);

const { stdout: gitRemote } = await git.remote();

if (!gitRemote) {
  log.critical('Invalid Git Remote', gitRemote);
  throw new Deno.errors.NotFound('Could not find Git remote URL');
}
const parsedGitRemote = Git.parseGitRemoteUrl(gitRemote.trim());

// Gotta do the provider shenanigans here too.
let providerArg = args.gitProvider;

// If the provider arg is not specified we try to find the values.
if (providerArg === '') {
  providerArg = new URL(`src/providers/${parsedGitRemote.hostname}.ts`, import.meta.url);
} else if (
  !providerArg.startsWith('file') && !providerArg.startsWith('http')
) {
  providerArg = toFileUrl(
    resolve(providerArg),
  ).href;
}

const gitProvider = await import(providerArg)
  .then((res) => res.default as GitProviderBuildable);

if (!gitProvider) {
  log.critical(gitProvider);
  throw new Deno.errors.NotFound('Could not determine Git Provider');
}

// Register the gitProvider
container.register<GitProvider>('gitProvider', {
  useValue: makeGitProvider(gitProvider, parsedGitRemote),
});

// If this is a historic run.
if (args.historic) {
  const historicCommand = container.resolve(HistoricCli);
  await historicCommand.run();
  Deno.exit();
}

// Resolve the CLI
const cli = container.resolve(VersionArgsCli);

export default cli;

if (import.meta.main) {
  await cli.run();
}
