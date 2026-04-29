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
exports.AuthService = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const user_entity_1 = require("../entities/user.entity");
const domain_errors_1 = require("../../../shared/errors/domain.errors");
const JWT_SECRET = process.env.JWT_SECRET || 'erp-core-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';
/**
 * AuthService - Domain Service
 * Handles authentication and authorization.
 */
class AuthService {
    userRepo;
    constructor(userRepo) {
        this.userRepo = userRepo;
    }
    /**
     * Register a new user.
     */
    async register(params) {
        // Check if username exists
        const existing = await this.userRepo.findByUsername(params.username);
        if (existing) {
            throw new domain_errors_1.BusinessRuleViolationError('Username already exists');
        }
        const user = await user_entity_1.User.create({
            username: params.username,
            password: params.password,
            name: params.name,
            role: params.role,
        });
        await this.userRepo.save(user);
        const token = this.generateToken(user);
        user.recordLogin();
        await this.userRepo.save(user);
        return {
            token,
            user: user.toSafeObject(),
        };
    }
    async hasUsers() {
        const users = await this.userRepo.findAll();
        return users.length > 0;
    }
    /**
     * Login with username and password.
     */
    async login(username, password) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) {
            throw new domain_errors_1.BusinessRuleViolationError('Invalid username or password');
        }
        if (!user.isActive) {
            throw new domain_errors_1.BusinessRuleViolationError('Account is deactivated');
        }
        if (!user.verifyPassword(password)) {
            throw new domain_errors_1.BusinessRuleViolationError('Invalid username or password');
        }
        const token = this.generateToken(user);
        user.recordLogin();
        await this.userRepo.save(user);
        return {
            token,
            user: user.toSafeObject(),
        };
    }
    /**
     * Verify a JWT token and return the user.
     */
    async verifyToken(token) {
        try {
            const payload = jwt.verify(token, JWT_SECRET);
            const user = await this.userRepo.findById(payload.userId);
            if (!user || !user.isActive) {
                throw new domain_errors_1.BusinessRuleViolationError('User not found or deactivated');
            }
            return user;
        }
        catch (error) {
            if (error instanceof domain_errors_1.BusinessRuleViolationError)
                throw error;
            throw new domain_errors_1.BusinessRuleViolationError('Invalid or expired token');
        }
    }
    /**
     * Get user by ID.
     */
    async getUser(userId) {
        return this.userRepo.findById(userId);
    }
    /**
     * Generate JWT token.
     */
    generateToken(user) {
        const payload = {
            userId: user.id,
            username: user.username,
            role: user.role,
        };
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map