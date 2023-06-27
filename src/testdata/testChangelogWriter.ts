import { ChangelogWriter } from '../changelogWriter.ts';
import { GitProvider } from '../gitProvider.ts';
import { Commit } from '../../mod.ts';
import { inject, injectable, inversify } from '../../deps.ts';

@injectable()
export default class TestChangelogWriter extends ChangelogWriter {
  constructor(
    @inject('gitProvider') public readonly gitProvider: GitProvider,
  ) {
    super();
  }
  generateChangelogEntry(
    newVersion: string,
    previousVersion: string,
    commits: Commit[],
  ) {
    return Promise.resolve(
      `## ${newVersion} (${
        this.gitProvider.gitDiffUrl(previousVersion, newVersion)
      })\n ${
        commits.map((com) =>
          `${com.subject} - ${this.gitProvider.commitUrl(com.sha)}`
        ).join('\n\n')
      }`,
    );
  }

  async write(filePath: string, newContent: string): Promise<boolean> {
    let content = await Deno.readTextFile(filePath).catch(() => '');
    if (content.length) {
      content = newContent + '\n\n' + content;
    }
    try {
      await Deno.writeTextFile(filePath, newContent);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}
