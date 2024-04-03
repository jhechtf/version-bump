import * as logger from 'https://deno.land/std@0.132.0/log/mod.ts';
import { container } from './src/container.ts';

import args from './args.ts';

await logger.setup({
  handlers: {
    console: new logger.handlers.ConsoleHandler('DEBUG', {
      formatter: (logRecord) => {
        let m = `[${logRecord.levelName}]  ${logRecord.msg}\n`;
        logRecord.args.forEach((arg, i) => {
          m += `[${i + 1}/${logRecord.args.length}] ${
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
          }\n`;
        });

        return m;
      },
    }),
  },
  loggers: {
    // configure default logger available via short-hand methods above.
    default: {
      handlers: ['console'],
      level: args.logLevel,
    },
  },
});

container.bind<LoggerInstance>('logger').toConstantValue(logger);

export type LoggerInstance = typeof logger;

export default logger;
