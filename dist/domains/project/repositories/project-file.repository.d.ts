export interface ProjectFileRecord {
    id: string;
    projectId: string;
    name: string;
    originalName: string;
    mimeType: string;
    size: number;
    storagePath: string;
    uploadedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface IProjectFileRepository {
    findById(id: string): Promise<ProjectFileRecord | null>;
    findAll(): Promise<ProjectFileRecord[]>;
    save(entity: ProjectFileRecord): Promise<void>;
    delete(id: string): Promise<void>;
    findByProjectId(projectId: string): Promise<ProjectFileRecord[]>;
    deleteByProjectId(projectId: string): Promise<void>;
}
//# sourceMappingURL=project-file.repository.d.ts.map