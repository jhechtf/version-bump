import { container } from './container.ts';

// How to get this to be a value that we can override if necessary?
// Currently no use cases exist in my mind to do that, but still worth a thought.
container.bind('cwd').toConstantValue(Deno.cwd());
