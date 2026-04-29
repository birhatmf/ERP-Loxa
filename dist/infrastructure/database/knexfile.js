"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.knexConfig = void 0;
exports.createConnection = createConnection;
const knex_1 = __importDefault(require("knex"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.join(process.cwd(), 'data', 'erp.db');
exports.knexConfig = {
    client: 'better-sqlite3',
    connection: {
        filename: dbPath,
    },
    useNullAsDefault: true,
    migrations: {
        directory: path_1.default.join(__dirname, 'migrations'),
        loadExtensions: [path_1.default.extname(__filename)],
    },
    seeds: {
        directory: path_1.default.join(__dirname, 'seeds'),
    },
};
function createConnection() {
    return (0, knex_1.default)(exports.knexConfig);
}
//# sourceMappingURL=knexfile.js.map