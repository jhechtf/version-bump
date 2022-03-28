import { Commit } from 'src/commit.ts';
import { IGitProvider } from 'src/provider.ts';
import { Args } from 'deps';

export interface ChangelogWriterBuldable {
  new (args: Args, remote: URL, provider: IGitProvider): ChangelogWriter;
}
export interface ChangelogWriter {
  write(
    filePath: string,
    newVersion: string,
    commits: Commit[],
  ): Promise<boolean>;
  read(filePath: string): Promise<string>;
}

export function makeChangelogWriter(
  clw: ChangelogWriterBuldable,
  args: Args,
  url: URL,
  provider: IGitProvider,
) {
  return new clw(args, url, provider);
}
