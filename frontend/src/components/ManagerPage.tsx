import React, { useEffect, useMemo, useState } from 'react';
import './ManagerPage.css';

interface PaidParticipant {
  participantId: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  college?: string;
  department?: string;
  event?: string;
  paymentAmount?: number;
  paidAmount?: number;
  paymentDate?: string;
  paymentMethod?: string;
  paymentNotes?: string;
}

const ManagerPage: React.FC = () => {
  const [username, setUsername] = useState('Akash');
  const [password, setPassword] = useState('Akash');
  const [authHeader, setAuthHeader] = useState<string>('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [paidList, setPaidList] = useState<PaidParticipant[]>([]);

  const headerValue = useMemo(() => {
    try {
      return `Basic ${btoa(`${username}:${password}`)}`;
    } catch (err) {
      return '';
    }
  }, [username, password]);

  const fetchWithAuth = async (path: string, options: RequestInit = {}) => {
    const headers: HeadersInit = {
      ...(options.headers || {}),
      Authorization: authHeader || headerValue,
      'Content-Type': 'application/json'
    };
    const response = await fetch(path, { ...options, headers });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed (${response.status})`);
    }
    return response.json();
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setStatus('');
    setChecking(true);
    try {
      const res = await fetch('/manager', {
        headers: { Authorization: headerValue }
      });
      if (!res.ok) {
        throw new Error('Invalid credentials');
      }
      setAuthHeader(headerValue);
      setIsAuthed(true);
      setStatus('Authenticated');
      await loadPaid();
    } catch (err: any) {
      setIsAuthed(false);
      setPaidList([]);
      setStatus('');
      setError(err.message || 'Login failed');
    } finally {
      setChecking(false);
    }
  };

  const loadPaid = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchWithAuth('/manager/paid');
      setPaidList(data.participants || []);
      if (!isAuthed) setIsAuthed(true);
      setStatus(`Loaded ${data.count || data.participants?.length || 0} paid participants`);
    } catch (err: any) {
      setError(err.message || 'Failed to load paid list');
    } finally {
      setLoading(false);
    }
  };

  const unpay = async (participantId: string) => {
    setLoading(true);
    setError('');
    try {
      await fetchWithAuth(`/manager/unpay/${participantId}`, { method: 'PATCH' });
      setStatus(`Reverted ${participantId} to unpaid`);
      await loadPaid();
    } catch (err: any) {
      setError(err.message || 'Failed to revert payment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Preload attempt using defaults so managers see data faster
    handleLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="manager-page">
      <div className="manager-card">
        <div className="manager-header">
          <div>
            <p className="eyebrow">Manager Access</p>
            <h1>Paid Participants</h1>
            <p className="sub">Authenticate with Akash / Akash to manage payments.</p>
          </div>
          <button className="ghost" onClick={loadPaid} disabled={loading || !isAuthed}>
            {loading ? 'Loading…' : 'Refresh list'}
          </button>
        </div>

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="field">
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="Akash"
              disabled={checking}
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Akash"
              disabled={checking}
            />
          </div>
          <button type="submit" className="primary" disabled={checking}>
            {checking ? 'Checking…' : 'Login as Manager'}
          </button>
        </form>

        {status && <div className="status success">{status}</div>}
        {error && <div className="status error">{error}</div>}

        <div className="list-header">
          <h2>Paid List</h2>
          <span className="pill">{paidList.length} records</span>
        </div>

        <div className="table">
          <div className="table-head">
            <span>ID</span>
            <span>Name</span>
            <span>Event</span>
            <span>Paid</span>
            <span>Date</span>
            <span>Action</span>
          </div>
          {loading && <div className="table-row muted">Loading…</div>}
          {!loading && paidList.length === 0 && (
            <div className="table-row muted">No paid participants</div>
          )}
          {!loading && paidList.map((p) => (
            <div className="table-row" key={p.participantId}>
              <span className="mono">{p.participantId}</span>
              <span>
                <div className="strong">{p.name}</div>
                <div className="muted small">{p.email || p.phoneNumber || 'N/A'}</div>
              </span>
              <span>{p.event || '—'}</span>
              <span>
                ₹{p.paidAmount ?? 0}
                <div className="muted small">of ₹{p.paymentAmount ?? 0}</div>
              </span>
              <span className="muted small">{p.paymentDate ? new Date(p.paymentDate).toLocaleString() : '—'}</span>
              <span>
                <button className="danger" onClick={() => unpay(p.participantId)} disabled={loading}>
                  Mark Unpaid
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManagerPage;
