import { BumpStrategy } from 'src/strategy.ts';

import { fileExists } from 'src/util.ts';

import Git from 'src/git.ts';

import { Args, readLines, resolve } from 'deps';

export default class NodeStrategy implements BumpStrategy {
  #cwd: string;
  #git: Git;
  #args: Args;
  static VERSION_REGEX = /"version":\s?"(?<currentVersion>.*)"\s?(?<ending>,?)/;

  constructor(cwd: string = Deno.cwd(), git: Git, args: Args) {
    this.#cwd = cwd;
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
    const tag = await this.#git.getLatestTag();
    if (tag) return tag.indexOf('v') === 0 ? tag.slice(1).trim() : tag.trim();

    throw Error(
      'Could not determine version through package.json or git tags.',
    );
  }
}
