import React, { useState } from 'react';
import { api } from '../services/api';
import { Branch } from '../types';
import { GitBranch, Plus, Search, Edit3, Trash2, MapPin, X, Check, Loader } from 'lucide-react';

interface BranchesProps {
  branches: Branch[];
  refreshAll: () => Promise<void>;
}

export const Branches: React.FC<BranchesProps> = ({ branches, refreshAll }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingBranch(null);
    setId('');
    setName('');
    setLocation('');
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (b: Branch) => {
    setEditingBranch(b);
    setId(b.id);
    setName(b.name);
    setLocation(b.location);
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !name.trim() || !location.trim()) {
      setFormError('Please fill out all fields.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload = {
      id: id.trim(),
      name: name.trim(),
      location: location.trim(),
      sync_status: 'SYNCED' as const,
    };

    try {
      if (editingBranch) {
        await api.branches.update(editingBranch.id, payload);
      } else {
        await api.branches.create(payload);
      }
      await refreshAll();
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save branch to RDS.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (branchId: string) => {
    if (!window.confirm(`Are you sure you want to delete branch node ${branchId}? All associated inventory and transactions will be pruned.`)) return;
    
    try {
      await api.branches.delete(branchId);
      await refreshAll();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="glass-card fade-in-up" style={{ minHeight: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
      {/* Search and Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search branches by ID, name..."
            className="form-control"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '40px', width: '100%' }}
          />
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={16} />
          Register Branch
        </button>
      </div>

      {/* Branches Table */}
      <div className="table-container" style={{ flex: 1 }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>ID Code</th>
              <th>Branch Name</th>
              <th>Physical Location</th>
              <th>Sync State</th>
              <th>Last Handshake</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBranches.length > 0 ? (
              filteredBranches.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{b.id}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.name}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                      <MapPin size={12} color="var(--text-secondary)" />
                      {b.location}
                    </span>
                  </td>
                  <td>
                    <span className="badge-status synced">Active</span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {b.last_sync_timestamp ? b.last_sync_timestamp.replace('T', ' ').substring(0, 19) : 'No handshake logs'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="btn btn-secondary btn-sm"
                        title="Edit Info"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="btn btn-danger btn-sm"
                        disabled={b.id === 'branch_1'} // Lock main default branch
                        title="Prune Branch Node"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                  <GitBranch size={40} style={{ marginBottom: '10px', opacity: 0.3 }} />
                  <p>No retail branch terminals registered.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal Dialogue */}
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
                {editingBranch ? 'Modify Branch Settings' : 'Register Branch Terminal'}
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
                <label>Branch ID Code</label>
                <input
                  type="text"
                  placeholder="e.g. branch_4"
                  className="form-control"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  disabled={!!editingBranch} // Can't change ID code after register
                  required
                />
              </div>

              <div className="form-group">
                <label>Branch Shop Name</label>
                <input
                  type="text"
                  placeholder="e.g. West Coast Premium Boutique"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Physical Address / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Hartono Mall Lt 1, Yogyakarta"
                  className="form-control"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
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
                      {editingBranch ? 'Save Settings' : 'Register Terminal'}
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
