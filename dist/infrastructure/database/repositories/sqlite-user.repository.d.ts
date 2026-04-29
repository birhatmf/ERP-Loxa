import { Knex } from 'knex';
import { User } from '../../../domains/auth/entities/user.entity';
import { IUserRepository } from '../../../domains/auth/repositories/user.repository';
export declare class SqliteUserRepository implements IUserRepository {
    private knex;
    constructor(knex: Knex);
    findById(id: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    save(entity: User): Promise<void>;
    delete(id: string): Promise<void>;
    private toDomain;
    private toPersistence;
}
//# sourceMappingURL=sqlite-user.repository.d.ts.map