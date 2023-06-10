import {
  type Args,
  inject,
  injectable,
  inversify,
  readLines,
  resolve,
} from '../deps.ts';

import { Runnable } from './runnable.ts';
import { Git } from './git.ts';

import { fileExists } from './util.ts';
import { type LoggerInstance } from '../logger.ts';
import { Commit } from './commit.ts';
import { ChangelogWriter } from './changelogWriter.ts';
import { VersionStrategy } from './versionStrategy.ts';
import { GitConvention } from './gitConvention.ts';

/**
 * @description Historic CLI class is the CLI that is ran for generating a brand new commit
 */
@inversify.injectable()
export default class HistoricCli implements Runnable {
  constructor(
    @inject('cwd') public readonly cwd: string,
    @inject('args') public readonly args: Args,
    @inject('logger') public readonly log: LoggerInstance,
    @inject(Git) public readonly git: Git,
    @inject(ChangelogWriter) public readonly changelogWriter: ChangelogWriter,
    @inject(VersionStrategy) public readonly versionStrategy: VersionStrategy,
    @inject(GitConvention) public readonly gitConvention: GitConvention,
  ) {
  }

  async run() {
    // First, if we find a changelog file we have to make sure the user knows this is about to overwrite it.
    const changelogFile = resolve(this.cwd, this.args.changelogPath);
    if (await fileExists(changelogFile) && !this.args.y) {
      console.info(this.log.info('CHANGELOG File already exists!'));
      console.info(
        this.log.info(
          'Continuing will delete this file\'s contents: ' + changelogFile,
        ),
      );
      console.info(this.log.info('Are you sure?(y/n)'));
      const lineIterator = readLines(Deno.stdin);
      for (let i = 0; i < 3; i++) {
        const value = await lineIterator.next();
        if (value.value === 'n') {
          console.info(this.log.info('Aborting script.'));
          Deno.exit();
        }
        if (value.value === 'y') break;
        if (i === 2) {
          console.info('Response not giving. Aborting.');
          Deno.exit();
        }
      }
      // Delete the changelog file if it exists.
      await Deno.remove(changelogFile);
    }

    // Step 1, gather all commits with any appropriate tags.
    const commits = await this.git.logs();
    // Step 2: ???
    let previousVersion = '';
    let workingCommits: Commit[] = [];
    const contents: string[] = [];
    let bumpedVersion = '';

    this.log.debug('Commits', ...commits);

    for (let i = commits.length - 1; i >= 0; i--) {
      workingCommits.unshift(commits[i]);
      if (commits[i].tag !== '' || i === 0) {
        if (commits[i].tag === '') {
          this.log.debug('No commit tag, bumping version');
          bumpedVersion = commits[i].tag = await this.gitConvention
            .calculateBump({
              currentVersion: previousVersion,
              args: this.args,
              commits: workingCommits,
            });
        }
        const changelogEntry = await this.changelogWriter
          .generateChangelogEntry(
            commits[i].tag,
            previousVersion,
            workingCommits,
          );
        this.log.debug(
          'Entry contents:',
          commits[i].tag,
          previousVersion,
          workingCommits,
        );
        contents.unshift(changelogEntry);
        workingCommits = [];
        previousVersion = commits[i].tag;
      }
    }

    console.group('Writing changes...');
    console.info('Writing changelog contents...');
    await this.changelogWriter.write(changelogFile, contents.join('\n\n'));
    if (bumpedVersion) {
      console.info('Version bumped up, writing version');
      await this.versionStrategy.bump(bumpedVersion);
    }
    this.log.info('Adding commits');
    await this.git.add();
    this.log.info('Adding release commit');
    await this.git.commit(
      await this.gitConvention.generateCommit({
        args: this.args,
        commits: [],
        version: bumpedVersion || previousVersion,
      }),
    );
    this.log.info('Tagging version ' + (bumpedVersion || previousVersion));
    await this.git.tag(bumpedVersion || previousVersion);
    console.groupEnd();

    return Promise.resolve(0);
  }
}
