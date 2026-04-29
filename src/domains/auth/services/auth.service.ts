import * as jwt from 'jsonwebtoken';
import { User } from '../entities/user.entity';
import { IUserRepository } from '../repositories/user.repository';
import { BusinessRuleViolationError } from '@shared/errors/domain.errors';

const JWT_SECRET = process.env.JWT_SECRET || 'erp-core-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';

interface TokenPayload {
  userId: string;
  username: string;
  role: string;
}

interface LoginResult {
  token: string;
  user: {
    id: string;
    username: string;
    name: string;
    role: string;
  };
}

/**
 * AuthService - Domain Service
 * Handles authentication and authorization.
 */
export class AuthService {
  constructor(private userRepo: IUserRepository) {}

  /**
   * Register a new user.
   */
  async register(params: {
    username: string;
    password: string;
    name: string;
    role?: string;
  }): Promise<LoginResult> {
    // Check if username exists
    const existing = await this.userRepo.findByUsername(params.username);
    if (existing) {
      throw new BusinessRuleViolationError('Username already exists');
    }

    const user = await User.create({
      username: params.username,
      password: params.password,
      name: params.name,
      role: params.role as any,
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

  async hasUsers(): Promise<boolean> {
    const users = await this.userRepo.findAll();
    return users.length > 0;
  }

  /**
   * Login with username and password.
   */
  async login(username: string, password: string): Promise<LoginResult> {
    const user = await this.userRepo.findByUsername(username);
    if (!user) {
      throw new BusinessRuleViolationError('Invalid username or password');
    }

    if (!user.isActive) {
      throw new BusinessRuleViolationError('Account is deactivated');
    }

    if (!user.verifyPassword(password)) {
      throw new BusinessRuleViolationError('Invalid username or password');
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
  async verifyToken(token: string): Promise<User> {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
      const user = await this.userRepo.findById(payload.userId);

      if (!user || !user.isActive) {
        throw new BusinessRuleViolationError('User not found or deactivated');
      }

      return user;
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) throw error;
      throw new BusinessRuleViolationError('Invalid or expired token');
    }
  }

  /**
   * Get user by ID.
   */
  async getUser(userId: string): Promise<User | null> {
    return this.userRepo.findById(userId);
  }

  /**
   * Generate JWT token.
   */
  private generateToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }
}
