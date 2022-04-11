import { Args, Injectable } from 'deps';

import { Git } from 'src/git.ts';

export interface VersionStrategy {
  bump(newVersion: string): Promise<boolean>;
  getCurrentVersion(): Promise<string>;
}

// Do we need these anymore?
export interface VersionStrategyConstructable {
  new (cwd: string, git: Git, args: Args): VersionStrategy;
}

@Injectable()
export class VersionStrategy {
  // Class left blank on purpose. Do not directly use this class
}

export function makeStrategy(
  bc: VersionStrategyConstructable,
  args: Args,
  cwd: string = Deno.cwd(),
  git: Git = new Git({ args: {_:[]} }),
) {
  return new bc(cwd, git, args);
}
