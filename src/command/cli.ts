import args from '../../args.ts';

type Args = typeof args;

export default class Cli {
  constructor(public readonly args: Args) {
  }

  registerCommand(path: string | string[]): typeof this {
    let pathObj: string[] = [];

    if (typeof path === 'string') {
      pathObj = [path];
    } else {
      pathObj = path;
    }

    console.log(pathObj);

    return this;
  }
}
