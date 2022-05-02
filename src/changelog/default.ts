import { ChangelogWriter } from '../changelogWriter.ts';
import { Commit } from '../commit.ts';
import { type Args, inject, injectable, readLines } from '../../deps.ts';
import { capitalize, fileExists } from '../util.ts';
import { GitProvider } from '../gitProvider.ts';
import { Git } from '../git.ts';
import { type LoggerInstance } from '../../logger.ts';
import '../../args.ts';

@injectable()
export class DefaultWriter extends ChangelogWriter {
  static HEADER = /^\s?##\s?(.*)$/m;

  constructor(
    @inject('gitProvider') public readonly gitProvider: GitProvider,
    @inject('args') public readonly args: Args,
    @inject('logger') public readonly log: LoggerInstance,
    public readonly git: Git,
  ) {
    super();
  }

  buildHeader() {
    const {
      changelogHeader = `
# Changelog

All notable changes to this project will be documented in this file.

File has been auto generated by version-bump. See [version-bump](https://deno.land/x/version_bump)
`,
    } = this.args;
    return changelogHeader;
  }

  buildChangelogEntries(commits: Commit[], showOtherOverride = false) {
    this.log.debug(commits);
    // Todo: Allow custom inputs.
    const groups = [
      {
        test: /^fix/i,
        heading: 'Bug Fixes',
        show: true,
      },
      {
        test: /^feat/i,
        heading: 'Features',
        show: true,
      },
      {
        test: /^test/i,
        show: true,
        heading: 'Testing',
      },
      {
        test: /^.*$/,
        heading: 'Other',
        show: showOtherOverride || this.args.firstRelease,
      },
    ];

    this.log.debug('Group matches', groups);

    const reduced = commits.reduce((cum, cur) => {
      const key = groups.find((group) => group.test.test(cur.subject));
      this.log.debug('Found grouping', cur, key);
      if (!key?.show) {
        return cum;
      }
      if (!cum[key.heading]) {
        cum[key.heading] = [];
      }
      cum[key.heading].push(cur);
      return cum;
    }, {} as Record<string, Commit[]>);

    this.log.debug('Commits by group', reduced);

    const output: string[] = [];

    for (const [heading, commits] of Object.entries(reduced)) {
      output.push(
        `### ${heading}`,
        '',
        ...(commits.map((commit) => this.buildChangelogEntry(commit))),
        '\n',
      );
    }

    return output.join('\n');
  }

  buildChangelogEntry(commit: Commit) {
    const [, ...subject] = commit.subject.split(':');
    return `- ${capitalize(subject.join(':'))}\n  [${commit.sha.slice(0, 8)}](${
      this.gitProvider.commitUrl(commit.sha)
    })`;
  }

  generateChangelogEntry(
    newVersion: string,
    previousVersion: string,
    commits: Commit[],
  ): Promise<string> {
    this.log.info('Building Entry for ' + newVersion, 'with ', commits);

    let contents = `## [${newVersion}](${
      this.gitProvider.gitDiffUrl(previousVersion, newVersion)
    })\n\n`;
    if (previousVersion === '') contents = `## ${newVersion}`;
    if (newVersion === '') {
      console.info('most recent aint got a tag');
    }
    contents += `\n${this.buildChangelogEntries(commits, true)}`;
    return Promise.resolve(contents);
  }

  async write(filePath: string, newVersion: string) {
    if (
      !(await fileExists(filePath))
    ) {
      this.log.info('No existing changelog');
      newVersion = this.buildHeader() + '\n\n' + newVersion;
    } else {
      this.log.info('Found existing CHANGELOG.');
      let currentValue = await Deno.readTextFile(filePath);

      this.log.debug('Current CHANGELOG values', currentValue);
      const mostRecent = /^## /m.exec(currentValue);
      // See if this match worked...
      if (mostRecent) {
        /**
         * If we get here this means that we need to go up until right before this match
         * Then we need to add in whatever value is there, and then we add
         * the contents after the match starts.
         */
        newVersion = currentValue.slice(0, mostRecent.index - 1) + newVersion +
          currentValue.slice(mostRecent.index);
        this.log.debug('Data after update', mostRecent);
      }
    }

    try {
      this.log.debug('Writing to ' + filePath, newVersion);
      await Deno.writeTextFile(filePath, newVersion);
      return true;
    } catch (e) {
      this.log.error(e);
      return false;
    }
  }

  async read(filePath: string) {
    if (!(await fileExists(filePath))) {
      console.info(`Changelog file not found at ${filePath}`);
      return '';
    }
    const lines = [];
    const file = await Deno.open(filePath);
    for await (const line of readLines(file)) {
      lines.push(line);
    }
    return lines.join('\n');
  }
}

export default DefaultWriter;
