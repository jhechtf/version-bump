import './cwd.ts';
import {
  Args,
  bgGreen,
  bgRed,
  bgYellow,
  inject,
  injectable,
  resolve,
  toFileUrl,
} from '../deps.ts';
import { VersionStrategy } from './versionStrategy.ts';
import { Git } from './git.ts';
import { Commit } from './commit.ts';
import { GitProviderBuildable, makeGitProvider } from './gitProvider.ts';
import { resolveFileImportUrl } from './util.ts';
import { ChangelogWriter } from './changelogWriter.ts';
import { GitConvention } from './gitConvention.ts';
import { LoggerInstance } from '../logger.ts';

@injectable()
export class VersionArgsCli {
  constructor(
    @inject('cwd') public readonly cwd: string,
    @inject('args') public readonly args: Args,
    @inject('logger') public readonly log: LoggerInstance,
    public readonly git: Git,
    public readonly versionStrategy: VersionStrategy,
    public readonly changelogWriter: ChangelogWriter,
    public readonly gitConvention: GitConvention,
  ) {}
  async run() {
    // Code needed to run this bitch here.
    // 1. Grab the current version
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

    const {
      stdout: gitRemote,
    } = await this.git.remote();
    // If we do not have a git remote, throw that error out.
    if (!gitRemote) {
      this.log.critical(gitRemote);
      throw new Deno.errors.NotFound('Could not find Git remote URL');
    }

    // Parse the git remote
    const parsedGitRemote = Git.parseGitRemoteUrl(gitRemote);
    // If we don't have a parsed remote, throw. We can't do anything from here.

    if (!parsedGitRemote) {
      this.log.critical(parsedGitRemote);
      throw new Deno.errors.BadResource('Cannot parse Git URL');
    }

    // Gotta do the provider shenanigans here too.
    let providerArg = this.args.gitProvider;
    let gitProvider: GitProviderBuildable;

    // If the provider arg is not specified we try to find the values.
    if (providerArg === '') {
      providerArg = resolveFileImportUrl(
        import.meta.url,
        'providers',
        `${parsedGitRemote.hostname}.ts`,
      );
    } else if (
      !providerArg.startsWith('file') && !providerArg.startsWith('http')
    ) {
      providerArg = toFileUrl(
        resolve(providerArg),
      ).href;
    }

    gitProvider = await import(providerArg)
      .then((res) => res.default as GitProviderBuildable);

    if (!gitProvider) {
      this.log.critical(gitProvider);
      throw new Deno.errors.NotFound('Could not determine Git Provider');
    }

    // Set the changelog writer in the version
    this.changelogWriter.setGitProvider(
      makeGitProvider(gitProvider, parsedGitRemote),
    );

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
        bumpedVersion,
        commits,
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
  }
}
