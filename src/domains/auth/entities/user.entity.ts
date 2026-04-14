import { Entity, generateId, BusinessRuleViolationError } from '@shared/types';
import * as crypto from 'crypto';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

interface UserProps {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Entity.
 * Authentication and authorization.
 */
export class User extends Entity {
  private _username: string;
  private _passwordHash: string;
  private _name: string;
  private _role: UserRole;
  private _isActive: boolean;
  private _lastLogin?: Date;

  private constructor(props: UserProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._username = props.username;
    this._passwordHash = props.passwordHash;
    this._name = props.name;
    this._role = props.role;
    this._isActive = props.isActive;
    this._lastLogin = props.lastLogin;
  }

  static async create(params: {
    username: string;
    password: string;
    name: string;
    role?: UserRole;
  }): Promise<User> {
    if (!params.username || params.username.trim().length < 3) {
      throw new BusinessRuleViolationError('Username must be at least 3 characters');
    }
    if (!params.password || params.password.length < 6) {
      throw new BusinessRuleViolationError('Password must be at least 6 characters');
    }

    const passwordHash = User.hashPassword(params.password);

    const now = new Date();
    return new User({
      id: generateId(),
      username: params.username.trim().toLowerCase(),
      passwordHash,
      name: params.name.trim(),
      role: params.role ?? UserRole.USER,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  // --- Getters ---
  get username(): string { return this._username; }
  get name(): string { return this._name; }
  get role(): UserRole { return this._role; }
  get isActive(): boolean { return this._isActive; }
  get lastLogin(): Date | undefined { return this._lastLogin; }
  get isAdmin(): boolean { return this._role === UserRole.ADMIN; }

  // --- Domain behavior ---

  verifyPassword(password: string): boolean {
    const hash = User.hashPassword(password);
    return hash === this._passwordHash;
  }

  recordLogin(): void {
    this._lastLogin = new Date();
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this._isActive = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this._isActive = true;
    this.updatedAt = new Date();
  }

  /**
   * Get safe user data (no password hash).
   */
  toSafeObject(): { id: string; username: string; name: string; role: UserRole; isActive: boolean; lastLogin?: Date } {
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
  private static hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password + 'erp-salt-2024').digest('hex');
  }
}
