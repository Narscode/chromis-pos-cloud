import React, { useState } from 'react';
import { api } from '../services/api';
import { Product, InventoryLog } from '../types';
import { Warehouse, Plus, ArrowUpRight, ArrowDownRight, RefreshCw, AlertTriangle, X, Check, Loader } from 'lucide-react';

interface InventoryProps {
  products: Product[];
  inventoryLogs: InventoryLog[];
  refreshAll: () => Promise<void>;
}

export const Inventory: React.FC<InventoryProps> = ({ products, inventoryLogs, refreshAll }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('branch_1');
  const [transactionType, setTransactionType] = useState<'STOCK_IN' | 'ADJUSTMENT'>('STOCK_IN');
  const [quantity, setQuantity] = useState<number>(0);
  
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenModal = () => {
    setSelectedProductId('');
    setSelectedBranchId('branch_1');
    setTransactionType('STOCK_IN');
    setQuantity(0);
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProductId === '' || quantity <= 0) {
      setFormError('Please select a valid product and enter quantity > 0.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload = {
      product_id: Number(selectedProductId),
      branch_id: selectedBranchId,
      quantity: Number(quantity),
      transaction_type: transactionType,
    };

    try {
      await api.inventory.create(payload);
      await refreshAll();
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit inventory movement to RDS.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-card fade-in-up" style={{ minHeight: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
      {/* Search and Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Stock Control &amp; Audit Logs</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Centralized inventory movements history</p>
        </div>

        <button onClick={handleOpenModal} className="btn btn-primary">
          <Plus size={16} />
          Adjust Stock
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="table-container" style={{ flex: 1 }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product Name</th>
              <th>Branch</th>
              <th>Quantity Delta</th>
              <th>Movement Type</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {inventoryLogs.length > 0 ? (
              inventoryLogs.map((log) => {
                const isPositive = log.quantity > 0;
                const typeLabel = log.transaction_type;
                
                return (
                  <tr key={log.id}>
                    <td style={{ color: 'var(--text-muted)' }}>#{log.id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {log.product_name || `Product ID ${log.product_id}`}
                    </td>
                    <td>
                      {log.branch_id === 'branch_1' ? 'Downtown HQ' : log.branch_id === 'branch_2' ? 'Uptown Premium' : 'East Coast Mall'}
                    </td>
                    <td>
                      <span style={{ 
                        fontWeight: 700, 
                        color: isPositive ? 'var(--secondary)' : 'var(--danger)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {isPositive ? `+${log.quantity}` : log.quantity}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-status ${
                        typeLabel === 'STOCK_IN' ? 'synced' : typeLabel === 'ADJUSTMENT' ? 'pending' : 'conflict'
                      }`} style={{ fontSize: '0.7rem' }}>
                        {typeLabel}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {log.timestamp.replace('T', ' ').substring(0, 19)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                  <Warehouse size={40} style={{ marginBottom: '10px', opacity: 0.3 }} />
                  <p>No inventory movements logged yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Adjust Stock Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="glass-card fade-in-up" style={{ width: '400px', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                Inventory Adjustment
              </h3>
              <button 
                onClick={handleCloseModal}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="glass-card" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'var(--danger)', color: '#f87171', padding: '12px', marginBottom: '20px', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group">
                <label>Select Product</label>
                <select
                  className="form-control"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                >
                  <option value="">Select menu item...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stock} | {p.branch_id === 'branch_1' ? 'Downtown' : 'Uptown'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Target Branch Location</label>
                <select
                  className="form-control"
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                >
                  <option value="branch_1">Downtown HQ</option>
                  <option value="branch_2">Uptown Premium Store</option>
                  <option value="branch_3">East Coast Mall Terminal</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Adjustment Action</label>
                  <select
                    className="form-control"
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value as 'STOCK_IN' | 'ADJUSTMENT')}
                  >
                    <option value="STOCK_IN">STOCK IN (+ Intake)</option>
                    <option value="ADJUSTMENT">SET LEVEL (Correct)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Quantity Count</label>
                  <input
                    type="number"
                    placeholder="e.g. 20"
                    className="form-control"
                    value={quantity === 0 ? '' : quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {submitting ? (
                    <>
                      <Loader size={14} className="animate-spin-custom" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      Log Adjustment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
