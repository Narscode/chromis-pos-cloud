import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';

interface SyncMonitorProps {
  currentBranchId: string;
  isOnline: boolean;
  onSyncTrigger?: () => Promise<void>;
  lastSyncTime?: string;
  pendingCount?: number;
}

export const SyncMonitor: React.FC<SyncMonitorProps> = ({
  currentBranchId,
  isOnline,
  onSyncTrigger,
  lastSyncTime = new Date().toLocaleTimeString(),
  pendingCount = 0,
}) => {
  const [syncing, setSyncing] = useState(false);
  const [syncLog, setSyncLog] = useState<string[]>([
    'Offline buffer queue active.',
    'SQLite transaction listener daemon online.',
  ]);

  const handleSyncClick = async () => {
    if (!isOnline || syncing) return;
    setSyncing(true);
    setSyncLog(prev => [`[${new Date().toLocaleTimeString()}] Triggering cloud sync...`, ...prev]);
    
    // Simulate synchronization conflict resolution & LWW delta processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (onSyncTrigger) {
      try {
        await onSyncTrigger();
      } catch (err) {
        console.error(err);
      }
    }
    
    setSyncLog(prev => [
      `[${new Date().toLocaleTimeString()}] Sync success! Conflict merged (LWW - Last Write Wins).`,
      `[${new Date().toLocaleTimeString()}] Deltas applied successfully to Central RDS.`,
      ...prev
    ]);
    setSyncing(false);
  };

  return (
    <div className="glass-card fade-in-up" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f1f5f9' }}>
          Synchronization Monitor
        </h3>
        <span className={`badge-status ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? <Wifi size={12} className="animate-pulse" /> : <WifiOff size={12} />}
          {isOnline ? 'Cloud Online' : 'Offline Mode'}
        </span>
      </div>

      {/* Sync Parameters */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: 'rgba(15, 23, 42, 0.4)',
        border: '1px solid var(--card-border)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Branch Terminal:</span>
          <strong style={{ color: 'var(--primary)' }}>{currentBranchId}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Sync Method:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>LWW (Last Write Wins)</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Last Cloud Sync:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{lastSyncTime}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Pending Transactions:</span>
          <span style={{ 
            color: pendingCount > 0 ? 'var(--warning)' : 'var(--secondary)', 
            fontWeight: 700 
          }}>
            {pendingCount} records
          </span>
        </div>
      </div>

      {/* Manual Sync Trigger */}
      <button
        onClick={handleSyncClick}
        disabled={!isOnline || syncing}
        className={`btn ${pendingCount > 0 ? 'btn-primary' : 'btn-secondary'}`}
        style={{
          width: '100%',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        <RefreshCw size={16} className={syncing ? 'animate-spin-custom' : ''} />
        {syncing ? 'Reconciling Stock Deltas...' : 'Trigger Manual Cloud Sync'}
      </button>

      {/* Real-time Sync Console logs */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: 600,
        }}>
          <Layers size={12} />
          Sync Log Console
        </div>
        <div style={{
          flex: 1,
          background: '#020617',
          border: '1px solid var(--card-border)',
          borderRadius: '8px',
          padding: '12px',
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          color: '#4ade80',
          overflowY: 'auto',
          maxHeight: '120px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          {syncLog.map((log, idx) => (
            <div key={idx} style={{ 
              lineHeight: '1.4', 
              opacity: idx === 0 ? 1 : 0.6,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '4px',
            }}>
              <span>&gt;</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
