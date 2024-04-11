import { type Args, inject, injectable } from '../../deps.ts';
import { Git } from '../git.ts';
import JsonStrategy from './json.ts';

@injectable()
export default class JsrStrategy extends JsonStrategy {
  constructor(
    @inject(Git) public readonly git: Git,
    @inject('cwd') public readonly cwd: string,
    @inject('args') public readonly args: Args,
  ) {
    super(git, cwd, args, 'jsr.json');
  }
}
