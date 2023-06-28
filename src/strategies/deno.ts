import { VersionStrategy } from '../versionStrategy.ts';
import {
  type Args,
  inject,
  injectable,
  inversify,
  readLines,
  resolve,
} from '../../deps.ts';
import args from '../../args.ts';
import { Git } from '../git.ts';

@injectable()
export default class DenoTsStrategy extends VersionStrategy {
  FIND = /VERSION\s?(:|=)\s?('|")(?<currentVersion>.*?)\2(,|;)?/;

  constructor(
    @inject(Git) public readonly git: Git,
    @inject('cwd') public readonly cwd: string,
    @inject('args') public readonly args: Args,
  ) {
    super();
  }

  async bump(newVersion: string) {
    const content = await Deno.readTextFile(
      resolve(
        this.cwd,
        'deps.ts',
      ),
    ).catch((e) => {
      if (e instanceof Deno.errors.NotFound) {
        return '';
      } else throw e;
    });

    let replaced: string;
    if (this.FIND.test(content)) {
      // Replace the version
      replaced = content.replace(
        this.FIND,
        `VERSION $1 $2${newVersion}$2$4`,
      );
    } else {
      replaced = content.concat(`\nexport const VERSION = "${newVersion}"`);
    }

    // Try to write the file
    try {
      await Deno.writeTextFile(resolve(this.cwd, 'deps.ts'), replaced);
      return true;
    } catch (e) {
      // Output the error and return false;
      console.error(e);
      return false;
    }
  }

  async getCurrentVersion(): Promise<string> {
    const file = resolve(this.cwd, 'deps.ts');
    try {
      const fileRef = await Deno.open(file);

      for await (const line of readLines(fileRef)) {
        if (this.FIND.test(line)) {
          const matches = this.FIND.exec(line);
          if (matches?.groups?.currentVersion) {
            Deno.close(fileRef.rid);
            return matches.groups.currentVersion;
          }
        }
      }
      Deno.close(fileRef.rid);
    } catch (e) {
      console.info(e);
    }

    const tag = await this.git.getLatestTag(false);
    if (tag) {
      return tag.indexOf(args.versionPrefix) === 0
        ? tag.slice(args.versionPrefix.length).trim()
        : tag.trim();
    }
    return '';
  }
}
