export interface CheckFileRecord {
    id: string;
    checkId: string;
    name: string;
    originalName: string;
    mimeType: string;
    size: number;
    storagePath: string;
    uploadedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ICheckFileRepository {
    findById(id: string): Promise<CheckFileRecord | null>;
    findAll(): Promise<CheckFileRecord[]>;
    save(entity: CheckFileRecord): Promise<void>;
    delete(id: string): Promise<void>;
    findByCheckId(checkId: string): Promise<CheckFileRecord[]>;
    deleteByCheckId(checkId: string): Promise<void>;
}
//# sourceMappingURL=check-file.repository.d.ts.map