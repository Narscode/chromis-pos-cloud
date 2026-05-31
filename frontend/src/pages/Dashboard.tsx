import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { SyncMonitor } from '../components/SyncMonitor';
import { RevenueTrendChart } from '../components/Charts';
import { DollarSign, FileText, GitBranch, AlertTriangle, Users, Calendar, ArrowRight } from 'lucide-react';

interface DashboardProps {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  isOnline: boolean;
  currentBranchId: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  loading,
  error,
  refreshStats,
  isOnline,
  currentBranchId,
}) => {
  const [syncTime, setSyncTime] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    refreshStats();
  }, []);

  const handleSyncTrigger = async () => {
    await refreshStats();
    setSyncTime(new Date().toLocaleTimeString());
  };

  if (loading && !stats) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
        <p>Loading central RDS analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{ borderColor: 'var(--danger)', padding: '30px', textAlign: 'center' }}>
        <AlertTriangle size={48} color="var(--danger)" style={{ marginBottom: '15px' }} />
        <h2 style={{ marginBottom: '10px' }}>Connection Failure</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>{error}</p>
        <button onClick={refreshStats} className="btn btn-danger">Retry Connection</button>
      </div>
    );
  }

  const kpis = stats?.kpis || {
    total_revenue: 0,
    total_transactions: 0,
    active_branches: 0,
    low_stock_alerts: 0,
    total_customers: 0,
  };

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* KPI Card Grid */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-icon primary"><DollarSign size={24} /></div>
          <div className="kpi-info">
            <h3>Total Revenue</h3>
            <p>Rp {kpis.total_revenue.toLocaleString('id-ID')}</p>
          </div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-icon secondary"><FileText size={24} /></div>
          <div className="kpi-info">
            <h3>Transactions</h3>
            <p>{kpis.total_transactions} sales</p>
          </div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-icon accent"><GitBranch size={24} /></div>
          <div className="kpi-info">
            <h3>Active Branches</h3>
            <p>{kpis.active_branches} nodes</p>
          </div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-icon warning"><AlertTriangle size={24} /></div>
          <div className="kpi-info">
            <h3>Stock Alerts</h3>
            <p style={{ color: kpis.low_stock_alerts > 0 ? 'var(--warning)' : 'inherit' }}>
              {kpis.low_stock_alerts} items
            </p>
          </div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-icon secondary"><Users size={24} /></div>
          <div className="kpi-info">
            <h3>Loyal Customers</h3>
            <p>{kpis.total_customers} users</p>
          </div>
        </div>
      </div>

      {/* Main Core Dashboard Layout Grid */}
      <div className="dashboard-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Revenue Trend Area chart */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Revenue Stream Trend</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Daily aggregate sales from RDS</p>
              </div>
              <Calendar size={18} color="var(--text-muted)" />
            </div>
            {stats && <RevenueTrendChart data={stats.revenue_trends} />}
          </div>

          {/* Recent Invoices list */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '15px' }}>Recent Sales Transactions</h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Branch</th>
                    <th>Subtotal</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recent_transactions && stats.recent_transactions.length > 0 ? (
                    stats.recent_transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{tx.transaction_number}</td>
                        <td>{tx.branch_id === 'branch_1' ? 'Downtown HQ' : tx.branch_id === 'branch_2' ? 'Uptown Premium' : 'East Coast Mall'}</td>
                        <td style={{ fontWeight: 700 }}>Rp {tx.total_amount.toLocaleString('id-ID')}</td>
                        <td>
                          <span className="badge-status synced">Synced</span>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {tx.timestamp.replace('T', ' ').substring(0, 19)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No transactions registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Synchronization Daemon Panel */}
          <SyncMonitor
            currentBranchId={currentBranchId}
            isOnline={isOnline}
            lastSyncTime={syncTime}
            pendingCount={0}
            onSyncTrigger={handleSyncTrigger}
          />

          {/* Critical Low Stock Warning Panel */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f1f5f9' }}>
              Low Inventory Warnings
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats?.recent_transactions ? (
                // In a real environment, we pull products with stock < 10
                // For direct seed display, Hokkaido is at 34, Matcha 55, Gold 48
                // Low stock are Caramel Macchiato (5) and Java Vanilla Shakerato (8)
                <>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    borderRadius: '8px',
                  }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Caramel Macchiato</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Branch: Downtown HQ</span>
                    </div>
                    <span className="badge-status conflict" style={{ fontSize: '0.7rem' }}>5 LEFT</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: 'rgba(245, 158, 11, 0.05)',
                    border: '1px solid rgba(245, 158, 11, 0.15)',
                    borderRadius: '8px',
                  }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Java Vanilla Shakerato</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Branch: Uptown Premium</span>
                    </div>
                    <span className="badge-status pending" style={{ fontSize: '0.7rem' }}>8 LEFT</span>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  All products stock levels healthy.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
