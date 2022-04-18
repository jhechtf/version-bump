import { VersionStrategy } from 'src/versionStrategy.ts';

import { fileExists } from 'src/util.ts';

import { Git } from 'src/git.ts';

import { Args, Injectable, readLines, resolve } from 'deps';
import args from '@/args.ts';

@Injectable()
export default class NodeStrategy extends VersionStrategy {
  #cwd: string;
  #git: Git;
  #args: Args;
  static VERSION_REGEX = /"version":\s?"(?<currentVersion>.*)"\s?(?<ending>,?)/;

  constructor(
    private readonly git: Git,
  ) {
    super();
    this.#cwd = Deno.cwd();
    this.#git = git;
    this.#args = args;
  }

  async bump(newVersion: string) {
    const packageJson = resolve(this.#cwd, 'package.json');
    const packageOpen = await Deno.open(packageJson);
    const lines: string[] = [];
    for await (let line of readLines(packageOpen)) {
      if (NodeStrategy.VERSION_REGEX.test(line)) {
        line = line.replace(
          NodeStrategy.VERSION_REGEX,
          `"version": "${newVersion}"$2`,
        );
      }
      lines.push(line);
    }

    Deno.close(packageOpen.rid);

    try {
      await Deno.writeTextFile(packageJson, lines.join('\n'));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async getCurrentVersion() {
    const filePath = resolve(this.#cwd, 'package.json');

    if (await fileExists(filePath)) {
      const packageFile = await Deno.open(filePath);

      for await (const line of readLines(packageFile)) {
        if (NodeStrategy.VERSION_REGEX.test(line)) {
          const items = line.match(NodeStrategy.VERSION_REGEX);
          if (items?.groups?.currentVersion) {
            return items.groups?.currentVersion;
          }
        }
      }
    }

    // If we get here, it means we couldn't find a version in the package.json file
    // We attempt to grab the most recent tag from the repo
    const tag = await this.#git.getLatestTag(false);
    if (tag) {
      return tag.indexOf(args.versionPrefix) === 0
        ? tag.slice(args.versionPrefix.length).trim()
        : tag.trim();
    }

    throw Error(
      'Could not determine version through package.json or git tags.',
    );
  }
}
