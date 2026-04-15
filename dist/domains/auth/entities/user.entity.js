"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserRole = void 0;
const types_1 = require("@shared/types");
const crypto = __importStar(require("crypto"));
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["USER"] = "user";
})(UserRole || (exports.UserRole = UserRole = {}));
/**
 * User Entity.
 * Authentication and authorization.
 */
class User extends types_1.Entity {
    _username;
    _passwordHash;
    _name;
    _role;
    _isActive;
    _lastLogin;
    constructor(props) {
        super(props.id, props.createdAt, props.updatedAt);
        this._username = props.username;
        this._passwordHash = props.passwordHash;
        this._name = props.name;
        this._role = props.role;
        this._isActive = props.isActive;
        this._lastLogin = props.lastLogin;
    }
    static async create(params) {
        if (!params.username || params.username.trim().length < 3) {
            throw new types_1.BusinessRuleViolationError('Username must be at least 3 characters');
        }
        if (!params.password || params.password.length < 6) {
            throw new types_1.BusinessRuleViolationError('Password must be at least 6 characters');
        }
        const passwordHash = User.hashPassword(params.password);
        const now = new Date();
        return new User({
            id: (0, types_1.generateId)(),
            username: params.username.trim().toLowerCase(),
            passwordHash,
            name: params.name.trim(),
            role: params.role ?? UserRole.USER,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });
    }
    static reconstitute(props) {
        return new User(props);
    }
    // --- Getters ---
    get username() { return this._username; }
    get name() { return this._name; }
    get role() { return this._role; }
    get isActive() { return this._isActive; }
    get lastLogin() { return this._lastLogin; }
    get isAdmin() { return this._role === UserRole.ADMIN; }
    // --- Domain behavior ---
    verifyPassword(password) {
        const hash = User.hashPassword(password);
        return hash === this._passwordHash;
    }
    recordLogin() {
        this._lastLogin = new Date();
        this.updatedAt = new Date();
    }
    deactivate() {
        this._isActive = false;
        this.updatedAt = new Date();
    }
    activate() {
        this._isActive = true;
        this.updatedAt = new Date();
    }
    /**
     * Get safe user data (no password hash).
     */
    toSafeObject() {
        return {
            id: this.id,
            username: this._username,
            name: this._name,
            role: this._role,
            isActive: this._isActive,
            lastLogin: this._lastLogin,
        };
    }
    /**
     * SHA-256 hash for password. In production, use bcrypt/argon2.
     */
    static hashPassword(password) {
        return crypto.createHash('sha256').update(password + 'erp-salt-2024').digest('hex');
    }
}
exports.User = User;
//# sourceMappingURL=user.entity.js.map