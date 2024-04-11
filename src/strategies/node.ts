import { Git } from '../git.ts';

import { type Args, inject, injectable } from '../../deps.ts';
import JsonStrategy from './json.ts';

@injectable()
export default class NodeStrategy extends JsonStrategy {
  constructor(
    @inject(Git) public readonly git: Git,
    @inject('cwd') public readonly cwd: string,
    @inject('args') public readonly args: Args,
  ) {
    super(git, cwd, args, 'package.json');
  }
}
