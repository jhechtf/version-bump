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

import { resolveFileImportUrl } from './src/util.ts';

import './args.ts';
import './src/cwd.ts';
import './logger.ts';

import { VersionArgsCli } from './src/versionBumpCli.ts';

// Grab the args
const args = container.resolve<Args>('args');

if (args.preset !== 'angular') {
  let { preset } = args;
  if (!preset.startsWith('file') && !preset.startsWith('http')) {
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
  const url = resolveFileImportUrl(
    import.meta.url,
    'src',
    'strategies',
    'node.ts',
  );
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

const cli = container.resolve(VersionArgsCli);

export default cli;

if (import.meta.main) {
  await cli.run();
}
