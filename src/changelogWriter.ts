import { Commit } from './commit.ts';
import { GitProvider } from './gitProvider.ts';
import { injectable } from '../deps.ts';

export interface ChangelogWriterBuldable {
  new (provider: GitProvider): ChangelogWriter;
}

export interface ChangelogWriter {
  /**
   * @param filePath the filepath for the CHANGELOG.md file, determined at runtime
   * @param newVersion the NEW version that we have created.
   * @param commits the commits between this new version and the last version
   * how you format this is up to you.
   */
  write(
    filePath: string,
    newVersion: string,
    commits: Commit[],
  ): Promise<boolean>;
  /**
   * @param filePath the filepath for the CHANGELOG.md
   */
  read(filePath: string): Promise<string>;
  /**
   * @param provider sets the git provider for the current
   */
  setGitProvider(provider: GitProvider): void;
}

/**
 * @description base class needed for Dependency inject, should not be used directly.
 */
@injectable()
export class ChangelogWriter {
  // Class left empty on purpose.
}

export function makeChangelogWriter(
  clw: ChangelogWriterBuldable,
  provider: GitProvider,
) {
  return new clw(provider);
}
