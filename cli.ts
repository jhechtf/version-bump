import {
  Bootstrapped,
  bootstrap,
  type Constructor
} from 'deps';

import {
  VersionStrategy
} from 'src/versionStrategy.ts';

import {
  Git
} from 'src/git.ts';

import args, { VersionArgs } from '@/args.ts';

import DenoTsStrategy from './src/strategies/deno.ts';

@Bootstrapped()
export class VersionBumpCli {
  constructor(
    public readonly args: VersionArgs,
    public readonly git: Git,
    public readonly versionStrategy: VersionStrategy
  ) {}
  async run() {
    await Promise.resolve('');
    console.info(
      await this.versionStrategy.getCurrentVersion()
    );
  }
}

console.info(args);

const overrides = new Map<Constructor<unknown>, Constructor<unknown>>(
  [
    [VersionStrategy, DenoTsStrategy]
  ]
)
const cli = bootstrap(VersionBumpCli, overrides);

export default cli;

if(import.meta.main) {
  await cli.run();
}