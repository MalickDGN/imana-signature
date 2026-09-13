import pino from 'pino';

// Logger structuré et lisible pour le développement
export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      singleLine: true,
    },
  },
});