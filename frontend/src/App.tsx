import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { Product, Customer, Branch, InventoryLog, DashboardStats } from './types';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Products } from './pages/Products';
import { Customers } from './pages/Customers';
import { Inventory } from './pages/Inventory';
import { Branches } from './pages/Branches';
import { Analytics } from './pages/Analytics';
import { Wifi, WifiOff, RefreshCw, GitBranch } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [currentBranchId, setCurrentBranchId] = useState<string>('branch_1');
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  // Loading & Error States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    if (!isOnline) return; // Freeze loading if offline
    
    setLoading(true);
    setError(null);
    try {
      // Parallelize calls to optimize database speed
      const [prodRes, custRes, branchRes, invRes, statsRes] = await Promise.all([
        api.products.list(),
        api.customers.list(),
        api.branches.list(),
        api.inventory.list(),
        api.getDashboardStats(),
      ]);

      setProducts(prodRes);
      setCustomers(custRes);
      setBranches(branchRes);
      setInventoryLogs(invRes);
      setDashboardStats(statsRes);
    } catch (err: any) {
      setError(err.message || 'Connection lost to AWS Central Database.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger loading on startup and when connection status toggles back online
  useEffect(() => {
    fetchAllData();
  }, [isOnline]);

  const toggleConnection = () => {
    setIsOnline(prev => !prev);
    if (!isOnline) {
      // Pulling central changes when returning online
      console.log('Central sync initiated on network return.');
    }
  };

  const getHeaderSubtitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Smart Retail cloud dashboard insights';
      case 'pos': return 'Interactive Point of Sale transaction terminal';
      case 'products': return 'Inventory products list and price administration';
      case 'customers': return 'Registered loyalty program customer directory';
      case 'inventory': return 'Inventory audit logs and manual stocktake intake ledger';
      case 'branches': return 'Active store terminals and synchronisation mapping';
      case 'analytics': return 'Machine learning inspired sales forecasting';
      default: return 'Smart Retail Platform';
    }
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            stats={dashboardStats}
            loading={loading}
            error={error}
            refreshStats={fetchAllData}
            isOnline={isOnline}
            currentBranchId={currentBranchId}
          />
        );
      case 'pos':
        return (
          <Transactions
            products={products}
            customers={customers}
            isOnline={isOnline}
            currentBranchId={currentBranchId}
            refreshAll={fetchAllData}
          />
        );
      case 'products':
        return (
          <Products
            products={products}
            refreshAll={fetchAllData}
          />
        );
      case 'customers':
        return (
          <Customers
            customers={customers}
            refreshAll={fetchAllData}
          />
        );
      case 'inventory':
        return (
          <Inventory
            products={products}
            inventoryLogs={inventoryLogs}
            refreshAll={fetchAllData}
          />
        );
      case 'branches':
        return (
          <Branches
            branches={branches}
            refreshAll={fetchAllData}
          />
        );
      case 'analytics':
        return (
          <Analytics
            stats={dashboardStats}
            loading={loading}
            error={error}
            refreshStats={fetchAllData}
          />
        );
      default:
        return <div className="glass-card">Section in active development</div>;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Core View Area */}
      <main className="main-content">
        
        {/* Unified Application Header */}
        <header className="app-header">
          <div className="header-title">
            <h1 style={{ textTransform: 'capitalize' }}>
              {activeTab === 'pos' ? 'POS Checkout Terminal' : activeTab}
            </h1>
            <p>{getHeaderSubtitle()}</p>
          </div>

          <div className="header-meta">
            {/* Branch Badge indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.15)',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--primary)',
            }}>
              <GitBranch size={14} />
              <span>HQ: {currentBranchId}</span>
            </div>

            {/* Offline Failover Demo Toggler */}
            <button
              onClick={toggleConnection}
              className={`btn btn-sm ${isOnline ? 'btn-secondary' : 'btn-danger'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.85rem',
                border: isOnline ? '1px solid var(--card-border)' : 'none',
              }}
              title="Toggle connectivity to simulate branch offline SQLite failover!"
            >
              {isOnline ? (
                <>
                  <Wifi size={14} color="#10b981" />
                  <span>Cloud Connected</span>
                </>
              ) : (
                <>
                  <WifiOff size={14} color="#fff" />
                  <span>Offline Buffer Mode</span>
                </>
              )}
            </button>

            {/* Manual Reload Button */}
            {isOnline && (
              <button
                onClick={fetchAllData}
                disabled={loading}
                className="btn btn-secondary btn-sm"
                style={{ padding: '8px', borderRadius: '8px' }}
                title="Refresh RDS Tables"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin-custom' : ''} />
              </button>
            )}
          </div>
        </header>

        {/* Selected Dashboard/POS Content panel */}
        <section style={{ flex: 1 }}>
          {renderActivePage()}
        </section>
      </main>
    </div>
  );
};

export default App;
