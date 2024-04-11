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
import { fileExists } from 'util';

@injectable()
export default class JsonStrategy extends VersionStrategy {
  static VERSION_REGEX = /"version":\s?"(?<currentVersion>.*)"\s?(?<ending>,?)/;

  constructor(
    @inject(Git) public readonly git: Git,
    @inject('cwd') public readonly cwd: string,
    @inject('args') public readonly args: Args,
    public fileName = args.jsonFile,
  ) {
    super();
  }

  async bump(newVersion: string): Promise<boolean> {
    const jsrJson = resolve(this.cwd, this.fileName);
    const jsrFile = await Deno.open(jsrJson, {
      create: true,
      write: true,
      read: true,
    });

    const lines: string[] = [];
    for await (let line of readLines(jsrFile)) {
      if (JsonStrategy.VERSION_REGEX.test(line)) {
        line = line.replace(
          JsonStrategy.VERSION_REGEX,
          `"version": "${newVersion}"$2`,
        );
      }
      lines.push(line);
    }

    if (lines.length === 0) {
      lines.push(`"version": "${newVersion}"`);
    }

    try {
      await Deno.writeTextFile(jsrJson, lines.join('\n'));
      jsrFile.close();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async getCurrentVersion(): Promise<string> {
    const filePath = resolve(this.cwd, this.fileName);

    // we either find the value from this file
    if (await fileExists(filePath)) {
      const packageFile = await Deno.open(filePath);

      for await (const line of readLines(packageFile)) {
        if (JsonStrategy.VERSION_REGEX.test(line)) {
          const items = line.match(JsonStrategy.VERSION_REGEX);
          if (items?.groups?.currentVersion) {
            packageFile.close();
            return items.groups?.currentVersion;
          }
        }
      }
    }

    // Or we check tags

    const tag = await this.git.getLatestTag(false);
    if (tag) {
      return tag.indexOf(args.versionPrefix) === 0
        ? tag.slice(args.versionPrefix.length).trim()
        : tag.trim();
    }

    throw new Error('Could not determine version through jsr.json or git tags');
  }
}
