import { VersionStrategy } from 'src/versionStrategy.ts';
import { Args, Injectable, readLines, resolve } from 'deps';
import args from '@/args.ts';
import { Git } from 'src/git.ts';

@Injectable()
export default class DenoTsStrategy extends VersionStrategy {
  #cwd: string;
  FIND = /VERSION\s?(:|=)\s?('|")(?<currentVersion>.*?)\2(,|;)?/;
  #args: Args;

  constructor(private readonly git: Git) {
    super();
    this.#cwd = Deno.cwd();
    this.#args = args;
  }

  async bump(newVersion: string) {
    const content = await Deno.readTextFile(
      resolve(
        this.#cwd,
        'deps.ts',
      ),
    );

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
      await Deno.writeTextFile(resolve(this.#cwd, 'deps.ts'), replaced);
      return true;
    } catch (e) {
      // Output the error and return false;
      console.error(e);
      return false;
    }
  }

  async getCurrentVersion(): Promise<string> {
    const file = resolve(this.#cwd, 'deps.ts');
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
    throw new Deno.errors.NotFound(
      'Cannot find version export in ' + file + 'or fallback git tags',
    );
  }
}
