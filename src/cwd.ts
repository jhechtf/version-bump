import { Injectable } from '../deps.ts';

@Injectable({ isSingleton: true })
export class Cwd {
  cwd: string = Deno.cwd();

  getCwd(): string {
    return this.cwd;
  }

  setCwd(cwd: string): typeof this {
    this.cwd = cwd;
    return this;
  }
}
