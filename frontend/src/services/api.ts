// Centralized API Service Layer with Fetch Abstraction, Retry Engine, and Auto-environment Resolution

// Resolves base API URL dynamically. If running in Vite dev server (port 5173),
// fall back to localhost:8000. If served directly by FastAPI in production, use the host origin.
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.port === '5173' ? 'http://127.0.0.1:8000' : window.location.origin);

/**
 * Executes a fetch request with automatic transient error retries and exponential backoff
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}, retries = 3, delay = 800): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Enforce standard headers
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // If response is successful, parse and return JSON
    if (response.ok) {
      return await response.json() as T;
    }

    // Handle transient server errors (500, 502, 503, 504) with automated retries
    if (retries > 0 && [500, 502, 503, 504].includes(response.status)) {
      console.warn(`[API] Transient error ${response.status} detected. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiRequest<T>(endpoint, options, retries - 1, delay * 2);
    }

    // Capture precise backend validation errors (e.g. FastAPI 422 or custom 400s)
    const errData = await response.json().catch(() => ({}));
    const errorMessage = errData.detail || `HTTP Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);

  } catch (error: any) {
    // Retry on physical network failure / connection timed out
    if (retries > 0 && (error.message.includes('Failed to fetch') || error.name === 'TypeError')) {
      console.warn(`[API] Network failure. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiRequest<T>(endpoint, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

// REST API Service Endpoints
export const api = {
  // Health
  getHealth: () => 
    apiRequest<{ status: string; database: string; environment: string }>('/health'),

  // Dashboard Stats
  getDashboardStats: () => 
    apiRequest<import('../types').DashboardStats>('/dashboard/stats'),

  // Products CRUD
  products: {
    list: () => apiRequest<import('../types').Product[]>('/products'),
    get: (id: number) => apiRequest<import('../types').Product>(`/products/${id}`),
    create: (p: Omit<import('../types').Product, 'id'>) => 
      apiRequest<import('../types').Product>('/products', { method: 'POST', body: JSON.stringify(p) }),
    update: (id: number, p: Partial<Omit<import('../types').Product, 'id'>>) => 
      apiRequest<import('../types').Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
    delete: (id: number) => apiRequest<{ deleted: number }>(`/products/${id}`, { method: 'DELETE' }),
  },

  // Customers CRUD
  customers: {
    list: () => apiRequest<import('../types').Customer[]>('/customers'),
    get: (id: number) => apiRequest<import('../types').Customer>(`/customers/${id}`),
    create: (c: Omit<import('../types').Customer, 'id'>) => 
      apiRequest<import('../types').Customer>('/customers', { method: 'POST', body: JSON.stringify(c) }),
    update: (id: number, c: Partial<Omit<import('../types').Customer, 'id'>>) => 
      apiRequest<import('../types').Customer>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(c) }),
    delete: (id: number) => apiRequest<{ deleted: number }>(`/customers/${id}`, { method: 'DELETE' }),
  },

  // Branches CRUD
  branches: {
    list: () => apiRequest<import('../types').Branch[]>('/branches'),
    get: (id: string) => apiRequest<import('../types').Branch>(`/branches/${id}`),
    create: (b: import('../types').Branch) => 
      apiRequest<import('../types').Branch>('/branches', { method: 'POST', body: JSON.stringify(b) }),
    update: (id: string, b: Partial<Omit<import('../types').Branch, 'id'>>) => 
      apiRequest<import('../types').Branch>(`/branches/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    delete: (id: string) => apiRequest<{ deleted: string }>(`/branches/${id}`, { method: 'DELETE' }),
  },

  // Inventory Audit logs
  inventory: {
    list: () => apiRequest<import('../types').InventoryLog[]>('/inventory'),
    create: (log: Omit<import('../types').InventoryLog, 'id' | 'timestamp'>) => 
      apiRequest<import('../types').InventoryLog>('/inventory', { method: 'POST', body: JSON.stringify(log) }),
  },

  // Sales Transactions CRUD
  transactions: {
    list: () => apiRequest<import('../types').Transaction[]>('/transactions'),
    get: (id: number) => apiRequest<import('../types').Transaction>(`/transactions/${id}`),
    create: (tx: Omit<import('../types').Transaction, 'id' | 'transaction_number' | 'timestamp'> & { items: Omit<import('../types').TransactionItem, 'id' | 'transaction_id'>[] }) => 
      apiRequest<import('../types').Transaction>('/transactions', { method: 'POST', body: JSON.stringify(tx) }),
  },

  // Authentication
  login: (username: string, password: string) => 
    apiRequest<{ id: string; name: string; role: string; branch_id: string; token: string }>('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
};
