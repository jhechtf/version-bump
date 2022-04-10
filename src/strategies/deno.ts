import { BumpStrategy } from 'src/strategy.ts';
import { readLines, resolve } from 'deps';
import { Args } from 'deps';
import { fileExists } from 'src/util.ts';
import Git from 'src/git.ts';
export default class DenoTsStrategy implements BumpStrategy {
  #cwd: string;
  FIND = /VERSION\s?(:|=)\s?('|")(?<currentVersion>.*?)\2(,|;)?/;
  #git: Git;
  #args: Args;
  constructor(readonly cwd: string = Deno.cwd(), git: Git, args: Args) {
    this.#cwd = cwd;
    this.#git = git;
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
            return matches.groups.currentVersion;
          }
        }
      }
    } catch (e) {
      console.info(e);
    }

    const tag = await this.#git.getLatestTag();
    if (tag) return tag.indexOf('v') === 0 ? tag.slice(1).trim() : tag.trim();

    throw new Deno.errors.NotFound('Cannot find version export in ' + file);
  }
}
