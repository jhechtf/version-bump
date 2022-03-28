export { green, red } from 'https://deno.land/std@0.132.0/fmt/colors.ts';

export * as semver from 'https://deno.land/x/semver@v1.4.0/mod.ts';

export { type Args, parse } from 'https://deno.land/std@0.132.0/flags/mod.ts';

export {
  dirname,
  fromFileUrl,
  resolve,
  toFileUrl,
} from 'https://deno.land/std@0.132.0/path/mod.ts';

export { readLines } from 'https://deno.land/std@0.132.0/io/buffer.ts';

export {
  assertEquals,
  assertObjectMatch,
} from 'https://deno.land/std@0.132.0/testing/asserts.ts';

export const VERSION = '0.1.0';
