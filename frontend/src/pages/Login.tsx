import React, { useState } from 'react';
import { api } from '../services/api';
import { Shield, Key, Loader, AlertTriangle, Coffee, Users, KeyRound } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: { id: string; name: string; role: string; branch_id: string; token: string }) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in both username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await api.login(username.trim(), password.trim());
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to prefill and authenticate instantly (perfect for live presentation demos!)
  const handleQuickSelect = (userType: 'admin' | 'manager' | 'cashier') => {
    setUsername(userType);
    setPassword('1234');
    setError(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      backgroundImage: 
        'radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.15) 0px, transparent 50%), ' +
        'radial-gradient(at 100% 100%, rgba(56, 189, 248, 0.15) 0px, transparent 50%)',
      padding: '20px',
    }}>
      <div className="glass-card fade-in-up" style={{ width: '100%', maxWidth: '440px', padding: '40px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)' }}>
        
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '15px',
            color: 'var(--primary)',
            boxShadow: '0 0 15px var(--primary-glow)',
          }}>
            <Shield size={28} />
          </div>
          <h2 style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #fff 0%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '6px',
          }}>
            Smart Retail POS
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Central Gateway Sign-In
          </p>
        </div>

        {/* Error panel */}
        {error && (
          <div className="glass-card" style={{
            background: 'rgba(239, 68, 68, 0.05)',
            borderColor: 'var(--danger)',
            color: '#f87171',
            padding: '12px',
            marginBottom: '25px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label>Staff Username ID</label>
            <input
              type="text"
              placeholder="e.g. admin, cashier, manager"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label>Security Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '5px' }}
          >
            {loading ? (
              <>
                <Loader size={16} className="animate-spin-custom" />
                Authenticating...
              </>
            ) : (
              <>
                <Key size={16} />
                Access Cloud POS
              </>
            )}
          </button>
        </form>

        {/* Demo Fast selectors (Crucial for university presentation) */}
        <div style={{ marginTop: '35px', paddingTop: '25px', borderTop: '1px solid var(--card-border)' }}>
          <h4 style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '15px',
            textAlign: 'center',
            fontWeight: 700,
          }}>
            Demo Credentials Selector
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <button
              onClick={() => handleQuickSelect('cashier')}
              className="btn btn-secondary btn-sm"
              style={{ flexDirection: 'column', padding: '8px', gap: '4px', fontSize: '0.75rem' }}
              title="Role: General Sales Checkouts Only"
            >
              <Coffee size={14} />
              <span>Cashier</span>
            </button>
            <button
              onClick={() => handleQuickSelect('manager')}
              className="btn btn-secondary btn-sm"
              style={{ flexDirection: 'column', padding: '8px', gap: '4px', fontSize: '0.75rem' }}
              title="Role: Inventory / Transactions Operations"
            >
              <Users size={14} />
              <span>Manager</span>
            </button>
            <button
              onClick={() => handleQuickSelect('admin')}
              className="btn btn-secondary btn-sm"
              style={{ flexDirection: 'column', padding: '8px', gap: '4px', fontSize: '0.75rem' }}
              title="Role: Global System Administrator"
            >
              <KeyRound size={14} />
              <span>Admin</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Login;
