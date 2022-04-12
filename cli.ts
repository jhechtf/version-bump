import {
  toFileUrl,
  resolve,
  Bootstrapped,
  bootstrap,
  type Constructor
} from 'deps';

import {
  fileExists
} from 'src/util.ts';

import {
  VersionStrategy,
  VersionStrategyConstructable
} from 'src/versionStrategy.ts';

import {
  Git
} from 'src/git.ts';

import {
  DefaultWriter
} from 'src/changelog/default.ts';

import {
  ChangelogWriter,
} from 'src/changelogWriter.ts';

import {
  GitConvention,
  GitConventionBuildable
} from 'src/gitConvention.ts';

import AngularPreset from 'src/presets/angular.ts';

import args, { VersionArgs } from '@/args.ts';

import DenoTsStrategy from './src/strategies/deno.ts';

import {
  Commit
} from 'src/commit.ts';

@Bootstrapped()
export class VersionBumpCli {
  constructor(
    public readonly args: VersionArgs,
    public readonly git: Git,
    public readonly versionStrategy: VersionStrategy,
    public readonly changelogWriter: ChangelogWriter,
    public readonly gitConvention: GitConvention
  ) {}
  async run() {
    const {
      args
    } = this.args;
    /**
     * 1. Get current strategy
     */
    let version = await this.versionStrategy.getCurrentVersion()
      .then(version => !version.startsWith(args.versionPrefix) ? `${args.versionPrefix}${version}` : version);
    console.info(`Current Version:...${version}`);
    
    /**
     * 2. Gather necessary commits
     */
    let commits: Commit[] = [];

    if(
      version &&
      await this.git.tagExists(version)
    ) {
      commits = await this.git.logs(version);
    } else {
      version = '0.1.0';
      commits = await this.git.logs();
    }

    if(commits.length === 0 && !args.allowEmpty) throw new Deno.errors.BadResource(`No commits to use`);

    console.info(commits);

  }
}

console.info(args);

const overrides = new Map<Constructor<unknown>, Constructor<unknown>>(
  [
    // These are the defaults needed by the item.
    [VersionStrategy, DenoTsStrategy],
    [ChangelogWriter, DefaultWriter],
    [GitConvention, AngularPreset]
  ]
);

// If the version is not deno
if(args.versionStrategy !== 'deno') {
  // Are we working with a prebuilt versionStrategy? Then they would have a file in the current project
  if(!args.versionStrategy.endsWith('.ts') && await fileExists(`src/strategies/${args.versionStrategy}.ts`)) {
    const importedVs = await import(`src/strategies/${args.versionStrategy}.ts`)
      .then(res => (res.default || res) as unknown as VersionStrategyConstructable);
    overrides.set(VersionStrategy, importedVs);

  } else {
    let versionStrategy = args.versionStrategy;
    if(!versionStrategy.startsWith('https://') ||  !versionStrategy.startsWith('file://')) {
      versionStrategy = toFileUrl(resolve(
        Deno.cwd(),
        versionStrategy
      )).href;
    }
    const importedVs = await import(versionStrategy)
      .then(res => (res.default || res) as unknown as VersionStrategyConstructable);
    // Doing this overrides the default deno import. 
    if(importedVs) {
      overrides.set(VersionStrategy, importedVs);
    }
  }
}

// If we are using something that is not angular...
if(args.preset !== 'angular') {
  const {preset} = args;
  if(!preset.startsWith('file://') ||  !preset.startsWith('https://')) {
    throw new Deno.errors.NotSupported(`You are trying to find an included Git convention that does not exist in the project (${preset})`);
  }
  const importedPreset = await import(preset)
    .then(res => (res.default || res) as unknown as GitConventionBuildable);
  
  if(importedPreset){

    overrides.set(GitConvention, importedPreset);
  }
}

const cli = bootstrap(VersionBumpCli, overrides);

export default cli;

if(import.meta.main) {
  await cli.run();
}
