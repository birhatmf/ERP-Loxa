export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Transaction {
  id: string;
  amount: number;
  vatAmount: number;
  type: 'income' | 'expense';
  paymentMethod: 'nakit' | 'havale' | 'kart';
  status?: 'active' | 'cancelled';
  isInvoiced: boolean;
  description: string;
  createdBy: string;
  relatedProjectId?: string;
  createdAt: string;
}

export interface CashBalance {
  balance: number;
  currency: string;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  isLowStock: boolean;
  manualPrice?: number | null;
  currentPrice?: number;
  totalValue?: number;
  lastPurchasedAt?: string;
}

export interface StockHistory {
  id: string;
  materialId: string;
  quantity: number;
  description: string;
  createdAt: string;
  type?: 'IN' | 'OUT';
  isCorrection?: boolean;
  correctionReason?: string | null;
}

export interface Project {
  id: string;
  name: string;
  customerName: string;
  description?: string;
  status: 'draft' | 'active' | 'in_progress' | 'completed' | 'cancelled';
  totalPrice: number;
  itemCount: number;
  totalCost: number;
  profitMargin: number;
  profitMarginPercentage?: number;
  items?: ProjectItem[];
}

export interface ProjectItem {
  id: string;
  projectId: string;
  materialId: string;
  materialName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  projectId?: string;
  customerId?: string;
  invoiceNumber: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  totalAmount: number;
  vatAmount: number;
  grandTotal: number;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  totalPrice: number;
}

export interface CheckFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface Check {
  id: string;
  type: 'received' | 'given';
  amount: number;
  dueDate: string;
  ownerName: string;
  checkNumber: string;
  bankName: string;
  description: string;
  status: 'pending' | 'paid' | 'bounced' | 'cancelled';
  paidDate: string | null;
  relatedProjectId?: string | null;
  createdAt: string;
  updatedAt?: string;
  fileCount?: number;
}
