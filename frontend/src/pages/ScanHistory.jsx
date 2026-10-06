// SentraWeb - Scan History & Audit Logs
import { useState, useEffect } from 'react';

export default function ScanHistory({ onSelectScan }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchScans = () => {
    setLoading(true);
    fetch('http://localhost:5000/api/v1/scans')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setScans(data.scans || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:5000/api/v1/scans/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setScans(prev => prev.filter(s => s.id !== id));
        setDeleteConfirm(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredScans = scans.filter(s => 
    s.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.ip && s.ip.includes(searchTerm))
  );

  const getScoreColor = (score) => {
    if (score >= 90) return 'var(--tertiary)';
    if (score >= 75) return 'var(--primary)';
    if (score >= 55) return '#F59E0B';
    return 'var(--error)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)', marginBottom: '4px' }}>
            <span className="dot dot-cyan dot-ping" style={{ width: '6px', height: '6px' }}></span>
            SQLite Audit Archive
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
            Website Security Audit History
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', margin: '4px 0 0 0' }}>
            Review historical vulnerability posture assessments and trace security score improvements over time.
          </p>
        </div>
        <button
          onClick={fetchScans}
          className="btn btn-ghost"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
          Refresh History
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="card" style={{ padding: 'var(--space-md)', display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--outline)', fontSize: '20px' }}>
            search
          </span>
          <input
            type="text"
            placeholder="Filter past audits by hostname, URL, or IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 42px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--surface-container-lowest)',
              border: '1px solid var(--outline-variant)',
              color: 'var(--on-surface)',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--on-surface-variant)', whiteSpace: 'nowrap' }}>
          Total Scans: <strong style={{ color: 'var(--primary)' }}>{scans.length}</strong>
        </div>
      </div>

      {/* Scans Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--outline)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', animation: 'spin 1s linear infinite' }}>progress_activity</span>
            <div style={{ marginTop: '8px' }}>Loading historical scan records from SQLite...</div>
          </div>
        ) : filteredScans.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--outline-variant)', marginBottom: '8px' }}>find_in_page</span>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--on-surface)' }}>No Scan History Found</h3>
            <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', maxWidth: '400px', margin: '6px auto 16px' }}>
              Run your first target vulnerability scan in the Vulnerability Scanner to generate an audit report.
            </p>
          </div>
        ) : (
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Target Website</th>
                <th>Security Score</th>
                <th>Grade</th>
                <th>Vulnerabilities</th>
                <th>Duration</th>
                <th>Date &amp; Time</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredScans.map((s) => {
                const scoreColor = getScoreColor(s.score);
                const vulnCount = s.vulnerabilities ? s.vulnerabilities.length : 0;
                return (
                  <tr
                    key={s.id}
                    style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                    onClick={() => onSelectScan && onSelectScan(s)}
                  >
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>language</span>
                        {s.hostname}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--outline)', marginTop: '2px' }}>
                        {s.url} • IP: {s.ip}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: scoreColor }}>
                          {s.score}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--outline)' }}>/ 100</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${s.score >= 80 ? 'badge-success' : s.score >= 60 ? 'badge-medium' : 'badge-critical'}`}>
                        GRADE {s.grade}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: vulnCount > 0 ? (s.score < 60 ? 'var(--error)' : '#F59E0B') : 'var(--tertiary)' }}>
                        {vulnCount} findings
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--outline)' }}>
                      {s.duration}s
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                      {s.created_at}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectScan) onSelectScan(s);
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>visibility</span>
                          View Report
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--error)' }}
                          onClick={(e) => handleDelete(s.id, e)}
                          title="Delete from database"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
