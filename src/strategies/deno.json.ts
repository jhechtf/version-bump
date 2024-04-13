import { VersionStrategy } from '../versionStrategy.ts';
import {
  type Args,
  inject,
  injectable,
  readLines,
  resolve,
} from '../../deps.ts';
import args from '../../args.ts';
import { Git } from '../git.ts';
import { fileExists } from '../util.ts';

@injectable()
export default class DenoJsonStrategy extends VersionStrategy {
  static VERSION_REGEX = /"version":\s?"(?<currentVersion>.*)"\s?(?<ending>,?)/;

  constructor(
    @inject(Git) public readonly git: Git,
    @inject('cwd') public readonly cwd: string,
    @inject('args') public readonly args: Args,
  ) {
    super();
  }

  async bump(newVersion: string): Promise<boolean> {
    const filePath: string = await this.getFilePath();

    const denoOpen = await Deno.open(filePath, {
      create: true,
      read: true,
      write: true,
    });
    const lines: string[] = [];

    for await (let line of readLines(denoOpen)) {
      if (DenoJsonStrategy.VERSION_REGEX.test(line)) {
        line = line.replace(
          DenoJsonStrategy.VERSION_REGEX,
          `"version": "${newVersion}"$2`,
        );
      }
      lines.push(line);
    }

    if (lines.length === 0) {
      lines.push(`"version": "${newVersion}"`);
    }

    denoOpen.close();

    try {
      await Deno.writeTextFile(filePath, lines.join('\n'));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async getCurrentVersion(): Promise<string> {
    const filePath = await this.getFilePath();

    if (await fileExists(filePath)) {
      const denoJson = await Deno.open(filePath);

      for await (const line of readLines(denoJson)) {
        if (DenoJsonStrategy.VERSION_REGEX.test(line)) {
          const items = line.match(DenoJsonStrategy.VERSION_REGEX);
          if (items?.groups?.currentVersion) {
            denoJson.close();
            return items.groups.currentVersion;
          }
        }
      }
    }

    const tag = await this.git.getLatestTag(false);
    if (tag) {
      return tag.startsWith(args.versionPrefix)
        ? tag.slice(args.versionPrefix.length).trim()
        : tag.trim();
    }

    throw new Error(
      'Could not determine version through deno.json(c) or git tags',
    );
  }

  async getFilePath() {
    if (await fileExists(resolve(this.cwd, 'deno.jsonc'))) {
      return resolve(this.cwd, 'deno.jsonc');
    } else {
      return resolve(this.cwd, 'deno.json');
    }
  }
}
