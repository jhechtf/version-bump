import './cwd.ts';
import {
  type Args,
  bgGreen,
  bgRed,
  bgYellow,
  inject,
  injectable,
  inversify,
  resolve,
} from '../deps.ts';
import { VersionStrategy } from './versionStrategy.ts';
import { Git } from './git.ts';
import { Commit } from './commit.ts';
import { GitProvider } from './gitProvider.ts';
import { ChangelogWriter } from './changelogWriter.ts';
import { GitConvention } from './gitConvention.ts';
import { type LoggerInstance } from '../logger.ts';
import { Runnable } from './runnable.ts';

@injectable()
export class VersionArgsCli implements Runnable {
  constructor(
    @inject('cwd') public readonly cwd: string,
    @inject('args') public readonly args: Args,
    @inject('logger') public readonly log: LoggerInstance,
    @inject('gitProvider') public readonly gitProvider: GitProvider,
    @inject(Git) public readonly git: Git,
    @inject(VersionStrategy) public readonly versionStrategy: VersionStrategy,
    @inject(ChangelogWriter) public readonly changelogWriter: ChangelogWriter,
    @inject(GitConvention) public readonly gitConvention: GitConvention,
  ) {}
  async run() {
    this.log.debug(() => this);
    // Code needed to run this bitch here.
    // 1. Grab the current version
    console.log(this.versionStrategy.getCurrentVersion);
    let currentVersion = await this.versionStrategy.getCurrentVersion();
    console.info(this.log.info(`Current Version: ...${currentVersion}`));
    let commits: Commit[] = [];

    // 2. Grab the commits
    if (
      currentVersion &&
      await this.git.tagExists(`${this.args.versionPrefix}${currentVersion}`)
    ) {
      commits = await this.git.logs(
        `${this.args.versionPrefix}${currentVersion}`,
      );
    } else {
      currentVersion = '0.1.0';
      commits = await this.git.logs();
    }

    this.log.info('COMMITS', commits, this.args.allowEmpty);

    // If we do not have any commits, and we are not allowing empty versions, throw errors.
    if (commits.length === 0 && !this.args.allowEmpty) {
      this.log.critical(commits);
      throw new Deno.errors.NotFound('No commits found');
    }

    // calculate the bumped version
    const bumpedVersion = await this.gitConvention.calculateBump({
      args: this.args,
      commits: commits,
      currentVersion,
    });

    console.info(
      this.log.info(
        `New Version based on ${commits.length} commits:... ${bumpedVersion}`,
      ),
    );

    const releaseCommit = await this.gitConvention.generateCommit({
      args: this.args,
      commits,
      version: bumpedVersion,
    });

    console.info(this.log.info('Release commit...' + releaseCommit));

    if (this.args.dryRun) {
      console.info(bgYellow(' DRY RUN -- CHANGES WILL NOT BE SAVED '));
      return 0;
    }

    // Run the commands
    const results = await Promise.allSettled([
      this.versionStrategy.bump(bumpedVersion),
      this.changelogWriter.write(
        resolve(this.args.changelogPath),
        await this.changelogWriter.generateChangelogEntry(
          bumpedVersion,
          currentVersion,
          commits,
        ),
      ),
    ]);

    // grab any failed commands
    const failedCommands = results.filter((f) => f.status === 'rejected');

    // Failed commands
    if (failedCommands.length) {
      console.error(bgRed(' ERROR: '), failedCommands);
      console.info(
        bgYellow(' WARNING '),
        'You will have to undo any changes before trying again',
      );
      throw new Error('One or more command failed. See logs above');
    }

    // Add the changes to the current commit
    this.log.info('Adding commits...');
    await this.git.add();

    // Make the current release commit
    this.log.info('Release commit');
    await this.git.commit(releaseCommit);

    // Tag the version
    this.log.info('Tagging version');
    await this.git.tag(`${this.args.versionPrefix}${bumpedVersion}`);

    console.info(bgGreen(' SUCCESS! '));

    console.info('Please push your changes with the following command');
    console.info('git push origin && git push origin --tags');
    return 0;
  }
}
