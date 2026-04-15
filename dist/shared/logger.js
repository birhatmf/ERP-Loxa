"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logDir = path_1.default.join(process.cwd(), 'data', 'logs');
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir, { recursive: true });
}
const { combine, timestamp, printf, colorize, json } = winston_1.default.format;
function summarizeMeta(meta) {
    const entries = [];
    for (const [key, value] of Object.entries(meta)) {
        if (key === 'error' && value instanceof Error) {
            entries.push([key, value.message]);
            continue;
        }
        if (key === 'body' || key === 'query' || key === 'headers') {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                entries.push([`${key}Keys`, Object.keys(value)]);
            }
            else {
                entries.push([key, value]);
            }
            continue;
        }
        if (typeof value === 'string' && value.length > 180) {
            entries.push([key, `${value.slice(0, 177)}...`]);
            continue;
        }
        entries.push([key, value]);
    }
    return Object.fromEntries(entries);
}
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
    const safeMeta = summarizeMeta(meta);
    const metaStr = Object.keys(safeMeta).length ? ` ${JSON.stringify(safeMeta)}` : '';
    return `${timestamp} [${level}] ${message}${metaStr}`;
});
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'http',
    levels: winston_1.default.config.npm.levels,
    transports: [
        new winston_1.default.transports.Console({
            format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), consoleFormat),
        }),
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'app.log'),
            level: process.env.LOG_LEVEL || 'http',
            format: combine(timestamp(), json()),
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
        }),
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'error.log'),
            level: 'error',
            format: combine(timestamp(), json()),
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
        }),
    ],
});
//# sourceMappingURL=logger.js.map