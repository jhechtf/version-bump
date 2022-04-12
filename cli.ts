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
    await Promise.resolve('')
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

if(args.strategy !== 'deno') {
  if(!args.strategy.endsWith('.ts') && await fileExists(`src/strategies/${args.strategy}.ts`)) {
    console.log('load the preset strategy!');
  } else {
    let versionStrategy = args.strategy;
    if(!versionStrategy.startsWith('https://') ||  !versionStrategy.startsWith('file://')) {
      versionStrategy = toFileUrl(resolve(
        Deno.cwd(),
        versionStrategy
      )).href;
    }
    const importedVs = await import(versionStrategy)
      .then(res => (res.default || res) as unknown as VersionStrategyConstructable);
      
    overrides.set(VersionStrategy, importedVs);
  }
} 

const cli = bootstrap(VersionBumpCli, overrides);

export default cli;

if(import.meta.main) {
  await cli.run();
}