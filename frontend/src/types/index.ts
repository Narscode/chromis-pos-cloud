// TypeScript definitions mapping to FastAPI Pydantic models

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  branch_id: string;
  sync_status: 'PENDING' | 'SYNCED' | 'CONFLICT';
}

export interface Customer {
  id: number;
  name: string;
  email: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  sync_status: 'PENDING' | 'SYNCED';
  last_sync_timestamp?: string;
}

export interface TransactionItem {
  id?: number;
  transaction_id?: number;
  product_id: number;
  quantity: number;
  price: number;
  product_name?: string; // Client UI helper
}

export interface Transaction {
  id: number;
  transaction_number: string;
  customer_id?: number;
  branch_id: string;
  total_amount: number;
  sync_status: 'PENDING' | 'SYNCED' | 'CONFLICT';
  timestamp: string;
  items: TransactionItem[];
}

export interface InventoryLog {
  id: number;
  product_id: number;
  product_name?: string;
  branch_id: string;
  quantity: number;
  transaction_type: 'STOCK_IN' | 'SALE' | 'ADJUSTMENT';
  timestamp: string;
}

// Dashboard statistics response structures
export interface KPICards {
  total_revenue: number;
  total_transactions: number;
  active_branches: number;
  low_stock_alerts: number;
  total_customers: number;
}

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
}

export interface ProductPerformancePoint {
  name: string;
  units_sold: number;
  revenue: number;
}

export interface BranchComparisonPoint {
  name: string;
  revenue: number;
  transactions: number;
}

export interface ForecastPoint {
  date: string;
  actual: number | null;
  forecast: number;
}

export interface DashboardStats {
  kpis: KPICards;
  revenue_trends: RevenueTrendPoint[];
  product_performance: ProductPerformancePoint[];
  branch_comparison: BranchComparisonPoint[];
  forecast: ForecastPoint[];
  recent_transactions: Transaction[];
}
