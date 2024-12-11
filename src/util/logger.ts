import winston from 'winston'

const { combine, timestamp, printf } = winston.format

// Define a custom log format
const customFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`
})

export const log = winston.createLogger({
  level: 'silly',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Custom timestamp format
    customFormat,
  ),
  transports: [new winston.transports.Console()],
})
