import { Args, Injectable } from 'deps';
import { Commit } from './commit.ts';
import args, { VersionArgs } from '../args.ts';
import { Cwd } from './cwd.ts';

export const COMMIT_DELIMITER = '------';

interface CommandOutput {
  code: number;
  stderr?: string;
  stdout?: string;
}

const WHOLE =
  /^(?:(?<proto>\w+):\/\/)?(?:(?<username>\w+)(?::(?<pass>.+))?@)?(?<host>.+?)(?::(?<port>\d+))?(:|\/)(?<path>.*)\.git$/m;

@Injectable()
export class Git {
  prefix: string[] = [];
  #decoder = new TextDecoder();
  #args: Args;

  static parseGitRemoteUrl(url: string): URL {
    const matches = url.match(WHOLE);
    if (!matches) throw new Deno.errors.NotSupported('Bad syntax');

    const {
      username = 'git',
      host,
      port = '22',
      path,
    } = matches.groups as Record<string, string>;

    const fullUrl = `ssh://${username}:@${host}:${port}/${path}`;

    return new URL(fullUrl);
  }

  constructor(
    public readonly vargs: VersionArgs,
    public readonly cwd: Cwd,
  ) {
    this.#args = args;
    if (Deno.build.os === 'windows') this.prefix = ['cmd', '/c'];
  }

  async add(files: string[] = ['.']) {
    const { code, stderr } = await this.run('add', ...files);
    if (stderr) throw new Error(stderr);
    return code === 0;
  }

  /**
   * @param from the starting point (either commit SHA or tag) to start looking at logs from
   * @param to the end point. Defaults to the HEAD.
   * @returns an array of commits.
   */
  async logs(from?: string, to = 'HEAD'): Promise<Commit[]> {
    const { code, stdout, stderr } = await this.run(
      'log',
      `--format=subject:::%s;;;author:::%aN;;;sha:::%H;;;body:::%b${COMMIT_DELIMITER}`,
      from ? [from, to].join('..') : to,
    );

    if (code !== 0) {
      throw Error(stderr);
    }

    if (stdout) {
      const items = stdout.split(
        new RegExp(`${COMMIT_DELIMITER}\n?`),
      ).filter(Boolean)
        .map((commit) => {
          const parts = commit.split(';;;');
          return parts.reduce((cum, cur) => {
            const [key, value] = cur.split(':::');
            cum[key] = value?.trim();
            return cum;
          }, {} as Record<string, string>);
        });
      return items as unknown as Commit[];
    }

    return [];
  }

  /**
   * @param msg the commit message.
   * @returns true if successful, throws error otherwise
   */
  async commit(msg: string): Promise<boolean> {
    const { code, stderr } = await this.run(
      'commit',
      '-m',
      msg.replaceAll('"', '\\"'),
    );

    if (code !== 0) {
      const error = stderr;
      throw Error(error);
    }

    return true;
  }

  /**
   * @param version the version to tag.
   * @returns true if successful, throws an error otherwise.
   */
  async tag(version: string): Promise<boolean> {
    const { code, stderr } = await this.run('tag', version);

    if (code !== 0) {
      throw Error(stderr);
    }

    return true;
  }

  /**
   * @returns the latest tag on the current branch.
   */
  async getLatestTag(exact = true): Promise<string> {
    const args = [
      '--tags',
      '--abbrev=0',
      '--exact-match',
    ];

    if (!exact) {
      args.splice(-1, 1);
    }
    const { code, stderr, stdout } = await this.run(
      'describe',
      ...args,
    );
    if (code !== 0) {
      return stderr ?? '';
    }
    if (stdout) {
      return stdout;
    }

    return '';
  }

  /**
   * @param tag Tag to check for
   * @returns True if command code is 0, false otherwise.
   */
  async tagExists(tag: string): Promise<boolean> {
    const rev = await this.revParse(tag);
    return rev.code === 0;
  }

  /**
   * @param rev the revision to parse out
   * @returns the raw command output from running the command
   */
  revParse(rev: string): Promise<CommandOutput> {
    return this.run('rev-parse', rev);
  }

  remote(action = 'get-url', remote = 'origin'): Promise<CommandOutput> {
    return this.run(
      'remote',
      action,
      remote,
    );
  }

  /**
   * @param command The git command to run
   * @param args any extra arguments
   * @returns the stdout or stderr from the command output, along with the code for this run.
   */
  async run(command: string, ...args: string[]): Promise<CommandOutput> {
    const cmd = Deno.run({
      cmd: this.prefix.concat([
        'git',
        command,
        ...args,
      ]),
      cwd: this.cwd.getCwd(),
      stderr: 'piped',
      stdout: 'piped',
      stdin: 'null',
    });
    const { code } = await cmd.status();

    if (code !== 0) {
      cmd.close();
      return {
        stderr: this.#decoder.decode(await cmd.stderrOutput()),
        code,
      };
    }

    cmd.close();
    cmd.stderr.close();
    return {
      stdout: this.#decoder.decode(await cmd.output()),
      code,
    };
  }
}
