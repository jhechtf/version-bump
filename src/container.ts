import { inversify } from '../deps.ts';

export const container = new inversify.Container({
  autoBindInjectable: true,
});
