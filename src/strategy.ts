import { Args } from 'deps';

import Git from 'src/git.ts';

export interface BumpStrategy {
  bump(newVersion: string): Promise<boolean>;
  getCurrentVersion(): Promise<string>;
}

export interface BumpConstructable {
  new (cwd: string, git: Git, args: Args): BumpStrategy;
}

export function makeStrategy(
  bc: BumpConstructable,
  args: Args,
  cwd: string = Deno.cwd(),
  git: Git = new Git(),
) {
  return new bc(cwd, git, args);
}
