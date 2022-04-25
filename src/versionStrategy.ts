import { Args, injectable } from '../deps.ts';

import { Git } from './git.ts';

export interface VersionStrategy {
  /**
   * @param newVersion the new version to write to the version strategy
   * @description writes the new version to the source.
   */
  bump(newVersion: string): Promise<boolean>;
  /**
   * @description gets the current version based on this strategy, e.g. from
   * the package.json(node) file or the deps.ts(deno).
   */
  getCurrentVersion(): Promise<string>;
}

// Do we need these anymore?
export interface VersionStrategyConstructable {
  new (cwd: string, git: Git, args: Args): VersionStrategy;
}

@injectable()
export class VersionStrategy {
  // Class left blank on purpose. Do not directly use this class
}
