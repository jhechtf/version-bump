import { Commit } from './commit.ts';
import { type Args, injectable, inversify } from '../deps.ts';

export interface CalculateBumpArgs {
  currentVersion: string;
  commits: Commit[];
  args: Args;
}

export interface GenerateCommitArgs {
  version: string;
  commits: Commit[];
  args: Args;
}

export interface GitConvention {
  /**
   * @description takes the current version and the commits to calculate a new version
   */
  calculateBump(args: CalculateBumpArgs): Promise<string>;

  /**
   * @description Takes the _new_ version and the current commits in case you want to generate a commit
   * with some information in them.
   */
  generateCommit(args: GenerateCommitArgs): Promise<string>;
}

export interface GitConventionBuildable {
  new (args: Args): GitConvention;
}

@inversify.injectable()
export class GitConvention {
  // Class left empty on purpose do not directly use this class.
}
