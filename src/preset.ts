import { Commit } from './commit.ts';
import { Args } from '../deps.ts';

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

export interface IPreset {
  /**
   * @description takes the current version and the commits to calculate a new version
   */
  calculateBump: (args: CalculateBumpArgs) => Promise<string>;

  /**
   * @description Takes the _new_ version and the current commits in case you want to generate a commit
   * with some information in them.
   */
  generateCommit: (args: GenerateCommitArgs) => Promise<string>;
}

export interface PresetBuildable {
  new (): IPreset;
}

export function makePreset(pb: PresetBuildable) {
  return new pb();
}
