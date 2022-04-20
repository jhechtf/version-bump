import {
  bootstrap,
  Bootstrapped,
  type Constructor,
  dirname,
  fromFileUrl,
  resolve,
  toFileUrl,
} from './deps.ts';

import { fileExists } from './src/util.ts';

import { resolveFileImportUrl } from './src/util.ts';

import { GitProviderBuildable, makeGitProvider } from './src/gitProvider.ts';
import {
  VersionStrategy,
  VersionStrategyConstructable,
} from './src/versionStrategy.ts';

import { Git } from './src/git.ts';

import { DefaultWriter } from './src/changelog/default.ts';

import { ChangelogWriter } from './src/changelogWriter.ts';

import { GitConvention, GitConventionBuildable } from './src/gitConvention.ts';

import AngularPreset from './src/presets/angular.ts';

import args, { VersionArgs } from './args.ts';

import DenoTsStrategy from './src/strategies/deno.ts';

import { Commit } from './src/commit.ts';

@Bootstrapped()
export class VersionBumpCli {
  constructor(
    public readonly args: VersionArgs,
    public readonly git: Git,
    public readonly versionStrategy: VersionStrategy,
    public readonly changelogWriter: ChangelogWriter,
    public readonly gitConvention: GitConvention,
  ) {}
  async run() {
    const {
      args,
    } = this.args;
    /**
     * 1. Get current strategy
     */
    let version = await this.versionStrategy.getCurrentVersion()
      .then((version) =>
        !version.startsWith(args.versionPrefix)
          ? `${args.versionPrefix}${version}`
          : version
      );
    console.info(`Current Version:...${version}`);

    /**
     * 2. Gather necessary commits
     */
    let commits: Commit[] = [];

    if (
      version &&
      await this.git.tagExists(version)
    ) {
      commits = await this.git.logs(version);
    } else {
      version = '0.1.0';
      commits = await this.git.logs();
    }

    if (commits.length === 0 && !args.allowEmpty) {
      throw new Deno.errors.BadResource(`No commits to use`);
    }

    const {
      stdout: gitRemote,
    } = await this.git.remote();

    if (!gitRemote) {
      throw new Deno.errors.NotFound('Could not find git remote URL');
    }

    const parsedGitUrl = Git.parseGitRemoteUrl(gitRemote);
    if (!parsedGitUrl) {
      throw new Deno.errors.BadResource('Cannot parse git URL');
    }

    /**
     * if the provider has been set, we just use it regardless*(for now)
     * otherwise check if the provider is available through resolving our
     * import.meta.url in combination with the pathname.
     */

    let providerArg = args.gitProvider;
    let gitProvider: GitProviderBuildable;
    console.info('PROVIDER', providerArg, providerArg.startsWith('file'));
    // If the provider arg is not specified we try to find the values.
    if (providerArg === '') {
      providerArg = resolveFileImportUrl(
        import.meta.url,
        'src',
        'providers',
        `${parsedGitUrl.hostname}.ts`,
      );
    } else if (
      !providerArg.startsWith('file') && !providerArg.startsWith('http')
    ) {
      const resolvedArg = resolve(providerArg);
      providerArg = toFileUrl(resolvedArg).href;
    }

    gitProvider = await import(providerArg)
      .then((res) => res.default as GitProviderBuildable);
    if (!gitProvider) {
      throw new Deno.errors.NotFound('Could not find git provider');
    }

    this.changelogWriter.setGitProvider(
      makeGitProvider(gitProvider, parsedGitUrl),
    );

    const bumpedVersion = await this.gitConvention.calculateBump({
      args,
      commits,
      currentVersion: version,
    });

    const releaseCommit = await this.gitConvention.generateCommit({
      args,
      commits,
      version: bumpedVersion,
    });

    if (args.dryRun) {
      console.info(
        'Bump commit to ',
        bumpedVersion,
        'Write commit:',
        releaseCommit,
        'Bump the files based on strategy: ',
        this.versionStrategy.constructor.name,
      );
      return 0;
    }

    // Version bump.
    await this.versionStrategy.bump(bumpedVersion);

    // Changelog.
    await this.changelogWriter.write(
      resolve(args.changelogPath),
      bumpedVersion,
      commits,
    );

    // Add the changes to the current commit
    await this.git.add();
    // Make the current release commit
    await this.git.commit(releaseCommit);
    // Tag the version
    await this.git.tag(`${args.versionPrefix}${bumpedVersion}`);

    console.info('');
  }
}

const overrides = new Map<Constructor<unknown>, Constructor<unknown>>(
  [
    // These are the defaults needed by the item.
    [VersionStrategy, DenoTsStrategy],
    [ChangelogWriter, DefaultWriter],
    [GitConvention, AngularPreset],
  ],
);

// If the version is not deno
if (args.versionStrategy !== 'deno') {
  // Grab the current execution directory.
  const execDir = dirname(fromFileUrl(import.meta.url));
  // Are we working with a prebuilt versionStrategy? Then they would have a file in the current project

  if (
    !args.versionStrategy.endsWith('.ts') &&
    await fileExists(
      resolve(execDir, `src/strategies/${args.versionStrategy}.ts`),
    )
  ) {
    const importedVs = await import(
      toFileUrl(resolve(execDir, `src/strategies/${args.versionStrategy}.ts`))
        .href
    )
      .then((res) => res.default as VersionStrategyConstructable);
    overrides.set(VersionStrategy, importedVs);
  } else {
    let versionStrategy = args.versionStrategy;
    if (
      !versionStrategy.startsWith('https://') ||
      !versionStrategy.startsWith('file://')
    ) {
      versionStrategy = toFileUrl(resolve(
        Deno.cwd(),
        versionStrategy,
      )).href;
    }

    const importedVs = await import(versionStrategy)
      .then((res) => res.default as VersionStrategyConstructable);
    // Doing this overrides the default deno import.
    if (importedVs) {
      overrides.set(VersionStrategy, importedVs);
    }
  }
}

// If we are using something that is not angular...
if (args.preset !== 'angular') {
  let { preset } = args;
  if (!preset.startsWith('file') && !preset.startsWith('http')) {
    preset = toFileUrl(
      resolve(preset),
    ).hash;
  }

  const importedPreset = await import(preset)
    .then((res) => res.default as GitConventionBuildable);

  if (importedPreset) {
    overrides.set(GitConvention, importedPreset);
  }
}

const cli = bootstrap(VersionBumpCli, overrides);

export default cli;

if (import.meta.main) {
  await cli.run();
}
