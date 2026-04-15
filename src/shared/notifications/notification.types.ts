export type NotificationType = 'low_stock' | 'pending_invoice' | 'overdue_check' | 'info';

export interface NotificationRecord {
  id?: string;
  type: NotificationType;
  title: string;
  message: string;
  entityId?: string | null;
  entityType?: string | null;
  read?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

