import { Args, resolve, toFileUrl } from './deps.ts';
import './src/cwd.ts';

import { container } from './src/container.ts';
import {
  VersionStrategy,
  VersionStrategyConstructable,
} from './src/versionStrategy.ts';
import DenoVersionStrategy from './src/strategies/deno.ts';
import DenoJsonStrategy from './src/strategies/deno.json.ts';
import JsrStrategy from './src/strategies/jsr.ts';
import { VersionArgsCli } from './src/versionBumpCli.ts';
import NodeStrategy from './src/strategies/node.ts';
import CargoStrategy from './src/strategies/cargo.ts';
import { GitConvention, GitConventionBuildable } from './src/gitConvention.ts';
import AngularPreset from './src/presets/angular.ts';
import {
  ChangelogWriter,
  ChangelogWriterBuldable,
} from './src/changelogWriter.ts';
import DefaultWriter from './src/changelog/default.ts';
import { Git } from './src/git.ts';
import { GitProvider, GitProviderBuildable } from './src/gitProvider.ts';
import HistoricCli from './src/historic.ts';
import './logger.ts';
import { normalizeImport } from './src/util.ts';
import ConfigLoader from './src/config.ts';

/**
 * 1. Check which preset we are using, load if necessary.
 * 2. Check which ChangelogWriter we are using, load if necessary.
 * 3. Check the VersionStrategy, load id necessary.
 */

const configLoader = container.get(ConfigLoader);
await configLoader.loadConfig();
// We unfortunately need theese two things out here
const args = container.get<Args>('args');
const git = container.get<Git>(Git);
// Grab the git remote or exit
const { stdout: gitRemote } = await git.remote();
if (!gitRemote) {
  Deno.exit(1);
}

container.bind<ConfigLoader>(ConfigLoader).to(ConfigLoader);
container.bind<HistoricCli>(HistoricCli).to(HistoricCli);

// Parse this bitch
const parsedGitRemote = Git.parseGitRemoteUrl(gitRemote);

let providerArg: string = args.gitProvider;
// No provider given, best effort to find out
if (providerArg === '') {
  providerArg = new URL(
    `src/providers/${parsedGitRemote.hostname}.ts`,
    import.meta.url,
  ).href;
} else if (
  typeof providerArg === 'string' && !providerArg.startsWith('file') &&
  !providerArg.startsWith('http')
) {
  console.info(providerArg);
  providerArg = toFileUrl(
    resolve(providerArg),
  ).href;
  console.info(providerArg);
}

const gitProvider = await import(providerArg)
  .then((res) => res.default as GitProviderBuildable);

if (!gitProvider) {
  throw new Deno.errors.NotFound('Could not load git provider. ' + providerArg);
}

// TODO: think about just changing the git URL to be provided in the container registry
container.bind<GitProvider>('gitProvider').toConstantValue(
  new gitProvider(parsedGitRemote),
);

container.bind<VersionStrategy>(VersionStrategy).to(DenoVersionStrategy)
  .when((r) => {
    return r.parentContext.container.get<Args>('args').versionStrategy ===
      'deno';
  });

container.bind<VersionStrategy>(VersionStrategy).to(NodeStrategy)
  .when((r) =>
    r.parentContext.container.get<Args>('args').versionStrategy === 'node'
  );

container.bind<VersionStrategy>(VersionStrategy).to(CargoStrategy)
  .when((r) =>
    r.parentContext.container.get<Args>('args').versionStrategy === 'cargo'
  );

container.bind<VersionStrategy>(VersionStrategy).to(JsrStrategy)
  .when(r => r.parentContext.container.get<Args>('args').versionStrategy === 'jsr')

container.bind<VersionStrategy>(VersionStrategy).to(DenoJsonStrategy)
  .when(r => r.parentContext.container.get<Args>('args').versionStrategy === 'deno-json')

if (!['deno', 'node', 'cargo', 'jsr', 'deno-json'].includes(args.versionStrategy)) {
  // If a full URL is given, then this will house its value.
  // Otherwise this will be the file system.
  const url = args.versionStrategy.startsWith('file:') ||
      args.versionStrategy.startsWith('http')
    ? new URL(args.versionStrategy, import.meta.url)
    : toFileUrl(resolve(args.versionStrategy));

  const imported = await import(url.href).then((r) => {
    // If this gets loaded but does not have a default export, stop execution.
    if (!r.default) throw new Error('No default export');
    // Ensure that TS knows this is a constructable.
    return r.default as VersionStrategyConstructable;
  });

  // Bind it to the default
  container.bind<VersionStrategy>(VersionStrategy).to(imported);
}

// Bind the default preset

container.bind<GitConvention>(GitConvention).to(AngularPreset).when((r) => {
  return r.parentContext.container.get<Args>('args').preset === 'angular';
});

// Check to see if we have work to do.
if (args.preset !== 'angular') {
  const url = args.preset.startsWith('file:') || args.preset.startsWith('http')
    ? new URL(args.preset, import.meta.url)
    : toFileUrl(resolve(args.preset));

  const imported = await import(url.href).then((r) => {
    if (!r.default) throw new Error('No default export');
    return r.default as GitConventionBuildable;
  });

  container.bind<GitConvention>(GitConvention).to(imported);
}

container.bind<ChangelogWriter>(ChangelogWriter).to(DefaultWriter)
  .when((r) =>
    r.parentContext.container.get<Args>('args').changelogWriter === 'default'
  );

if (args.changelogWriter !== 'default') {
  const url = normalizeImport(args.changelogWriter);

  const imported = await import(url)
    .then((r) => {
      if (!r.default) throw new Error('No default export');

      return r.default as ChangelogWriterBuldable;
    });
  container.bind<ChangelogWriter>(ChangelogWriter).to(imported);
}

const cli = container.resolve<VersionArgsCli>(VersionArgsCli);

export default cli;

if (args.historic) {
  const historic = container.resolve<HistoricCli>(HistoricCli);
  await historic.run();
  Deno.exit();
}

if (import.meta.main) {
  await cli.run();
}
