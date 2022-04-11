import { Commit } from 'src/commit.ts';
import { GitProvider } from 'src/gitProvider.ts';
import { Args, Injectable } from 'deps';

export interface ChangelogWriterBuldable {
  new (args: Args, remote: URL, provider: GitProvider): ChangelogWriter;
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
export class ChangelogWriterBase implements ChangelogWriter {
  write() {
    return Promise.resolve(false);
  }
  read() {
    return Promise.resolve('');
  }
}

export function makeChangelogWriter(
  clw: ChangelogWriterBuldable,
  args: Args,
  url: URL,
  provider: GitProvider,
) {
  return new clw(args, url, provider);
}
