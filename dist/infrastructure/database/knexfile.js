"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.knexConfig = void 0;
exports.createConnection = createConnection;
const knex_1 = __importDefault(require("knex"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dbPath = path_1.default.join(process.cwd(), 'data', 'erp.db');
class CustomMigrationSource {
    async getMigrations() {
        const ext = path_1.default.extname(__filename); // .ts or .js
        const dir = path_1.default.join(__dirname, 'migrations');
        return fs_1.default.readdirSync(dir)
            .filter((file) => file.endsWith(ext))
            .sort();
    }
    getMigrationName(migration) {
        // Always use .ts as the name in the database for consistency
        return migration.replace(/\.js$/, '.ts');
    }
    getMigration(migration) {
        return require(path_1.default.join(__dirname, 'migrations', migration));
    }
}
exports.knexConfig = {
    client: 'better-sqlite3',
    connection: {
        filename: dbPath,
    },
    useNullAsDefault: true,
    migrations: {
        migrationSource: new CustomMigrationSource(),
    },
    seeds: {
        directory: path_1.default.join(__dirname, 'seeds'),
    },
};
function createConnection() {
    return (0, knex_1.default)(exports.knexConfig);
}
//# sourceMappingURL=knexfile.js.map