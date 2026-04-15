import { User } from '../entities/user.entity';
import { IUserRepository } from '../repositories/user.repository';
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
export declare class AuthService {
    private userRepo;
    constructor(userRepo: IUserRepository);
    /**
     * Register a new user.
     */
    register(params: {
        username: string;
        password: string;
        name: string;
        role?: string;
    }): Promise<LoginResult>;
    /**
     * Login with username and password.
     */
    login(username: string, password: string): Promise<LoginResult>;
    /**
     * Verify a JWT token and return the user.
     */
    verifyToken(token: string): Promise<User>;
    /**
     * Get user by ID.
     */
    getUser(userId: string): Promise<User | null>;
    /**
     * Generate JWT token.
     */
    private generateToken;
}
export {};
//# sourceMappingURL=auth.service.d.ts.map