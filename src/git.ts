import { type Args, inject, injectable } from '../deps.ts';
import { Commit } from './commit.ts';

export const COMMIT_DELIMITER = '------';

interface CommandOutput {
  code: number;
  stderr?: string;
  stdout?: string;
}

const WHOLE =
  /^(?:(?<proto>\w+):\/\/)?(?:(?<username>\w+)(?::(?<pass>.+))?@)?(?<host>.+?)(?::(?<port>\d+))?(:|\/)(?<path>.*?)(\.git)?$/m;

@injectable()
export class Git {
  prefix: string[] = [];
  #decoder = new TextDecoder();

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
    @inject('args') public readonly vargs: Args,
    @inject('cwd') public readonly cwd: string,
  ) {
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
      `--format=subject:::%s;;;author:::%aN;;;sha:::%H;;;tag:::%D;;;body:::%b${COMMIT_DELIMITER}`,
      from ? [from, to].join('..') : to,
    );

    if (code !== 0) {
      throw new Error(stderr);
    }

    if (stdout) {
      const items = stdout.split(
        new RegExp(`${COMMIT_DELIMITER}\n?`),
      ).filter(Boolean)
        .map((commit) => {
          const parts = commit.split(';;;');
          return parts.reduce((cum, cur) => {
            const [key, value] = cur.split(':::');
            if (key === 'tag') {
              cum[key] = '';
              // Todo: clean this up because like.. YIKES
              if (/tag:/.test(value)) {
                const tag = value.split(', ').find((tValue) =>
                  tValue.startsWith('tag: ')
                );

                cum[key] = tag!.replace('tag: ', '');
                return cum;
              } else {
                return cum;
              }
            }

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
  async commit(msg: string, allowEmpty = false): Promise<boolean> {
    const args = ['-m', msg.replace('"', '\\"')];
    if (allowEmpty) args.push('--allow-empty');
    const { code, stderr } = await this.run(
      'commit',
      ...args,
    );

    if (code !== 0) {
      const error = stderr;
      throw new Error(error);
    }

    return true;
  }

  /**
   * @param version the version to tag.
   * @returns true if successful, throws an error otherwise.
   */
  async tag(version: string, commit?: string): Promise<boolean> {
    const args = [version];

    if (commit) {
      args.push(commit);
    }

    const { code, stderr } = await this.run(
      'tag',
      ...args,
    );

    if (code !== 0) {
      throw new Error(stderr);
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
      return stdout.trim();
    }

    return '';
  }

  /**
   * @param tag Tag to check for
   * @returns True if command code is 0, false otherwise.
   */
  async tagExists(tag: string): Promise<boolean> {
    try {
      const rev = await this.revParse(tag);
      return rev.code === 0;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  /**
   * @param rev the revision to parse out
   * @returns the raw command output from running the command
   */
  revParse(rev: string): Promise<CommandOutput> {
    return this.run('rev-parse', rev);
  }

  remote(
    action = 'get-url',
    remote = 'origin',
    ...args: string[]
  ): Promise<CommandOutput> {
    return this.run(
      'remote',
      action,
      remote,
      ...args,
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
      cwd: this.cwd,
      stderr: 'piped',
      stdout: 'piped',
      stdin: 'null',
    });
    const { code } = await cmd.status();

    const output = await cmd.output();
    const errout = await cmd.stderrOutput();
    cmd.close();
    if (code !== 0) {
      return {
        stderr: this.#decoder.decode(errout),
        code,
      };
    }

    return {
      stdout: this.#decoder.decode(output),
      code,
    };
  }
}
