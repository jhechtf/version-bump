import { Commit } from 'src/commit.ts';
import { GitProvider } from 'src/gitProvider.ts';
import { Args, Injectable } from 'deps';

export interface ChangelogWriterBuldable {
  new (provider: GitProvider): ChangelogWriter;
}

export interface ChangelogWriter {
  write(
    filePath: string,
    newVersion: string,
    commits: Commit[],
  ): Promise<boolean>;
  read(filePath: string): Promise<string>;
}

/**
 * @description base class needed for Dependency inject, should not be used directly.
 */
@Injectable()
export class ChangelogWriter implements ChangelogWriter {
  // Class left empty on purpose.
}

export function makeChangelogWriter(
  clw: ChangelogWriterBuldable,
  provider: GitProvider,
) {
  return new clw(provider);
}
