import { Entity } from '../../../shared/types';
export declare enum UserRole {
    ADMIN = "admin",
    USER = "user"
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
export declare class User extends Entity {
    private _username;
    private _passwordHash;
    private _name;
    private _role;
    private _isActive;
    private _lastLogin?;
    private constructor();
    static create(params: {
        username: string;
        password: string;
        name: string;
        role?: UserRole;
    }): Promise<User>;
    static reconstitute(props: UserProps): User;
    get username(): string;
    get name(): string;
    get role(): UserRole;
    get isActive(): boolean;
    get lastLogin(): Date | undefined;
    get isAdmin(): boolean;
    verifyPassword(password: string): boolean;
    recordLogin(): void;
    deactivate(): void;
    activate(): void;
    /**
     * Get safe user data (no password hash).
     */
    toSafeObject(): {
        id: string;
        username: string;
        name: string;
        role: UserRole;
        isActive: boolean;
        lastLogin?: Date;
    };
    /**
     * SHA-256 hash for password. In production, use bcrypt/argon2.
     */
    private static hashPassword;
}
export {};
//# sourceMappingURL=user.entity.d.ts.map