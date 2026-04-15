import { Knex } from 'knex';
export interface PurchaseOrderItemRecord {
    id: string;
    materialId: string;
    materialName: string;
    quantity: number;
    unitPrice: number;
    receivedQty: number;
}
export interface PurchaseOrderRecord {
    id: string;
    supplierId: string;
    supplierName: string;
    items: PurchaseOrderItemRecord[];
    totalAmount: number;
    status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
    expectedDate: string;
    receivedDate: string;
    description: string;
    stockPosted: boolean;
    stockPostedAt: string;
    createdAt: string;
    updatedAt: string;
}
type PurchaseOrderStatus = PurchaseOrderRecord['status'];
export declare class SqlitePurchaseOrderRepository {
    private knex;
    constructor(knex: Knex);
    findById(id: string): Promise<PurchaseOrderRecord | null>;
    findAll(): Promise<PurchaseOrderRecord[]>;
    save(entity: PurchaseOrderRecord): Promise<void>;
    delete(id: string): Promise<void>;
    updateSupplierName(supplierId: string, supplierName: string): Promise<void>;
    updateStatus(id: string, status: PurchaseOrderStatus): Promise<PurchaseOrderRecord | null>;
    private toDomain;
    private toPersistence;
}
export declare function buildPurchaseOrderRecord(params: {
    id?: string;
    supplierId: string;
    supplierName: string;
    items: Array<{
        materialId: string;
        materialName: string;
        quantity: number;
        unitPrice: number;
        receivedQty?: number;
    }>;
    status?: PurchaseOrderStatus;
    expectedDate?: string;
    receivedDate?: string;
    description?: string;
    stockPosted?: boolean;
    stockPostedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}): PurchaseOrderRecord;
export {};
//# sourceMappingURL=sqlite-purchase-order.repository.d.ts.map