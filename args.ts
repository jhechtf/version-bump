import { parse } from './deps.ts';
import {
  argDefaults
} from './defaults.ts';
/**
 * @description returns a parsed deno argument
 */
export default parse(Deno.args, {
  alias: {
    releaseAs: 'release-as',
    allowEmpty: 'allow-empty',
  },
  string: ['release-as'],
  default: argDefaults
});
