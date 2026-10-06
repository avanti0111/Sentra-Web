// Session Monitoring Page
import { useState, useEffect, useCallback } from 'react';

const mockSessions = [
  {
    id: 'sess_9f82c1a4', protocol: 'TLS_AES_256_GCM', identity: 'marcus.vance@fintech.io', role: 'Tier 1 · Operations Admin',
    flag: '🇷🇺', ip: '194.26.29.112', geo: 'RU — Moscow (AS44050)', traffic: '428 reqs', velocity: '14.2 req/s (Spike)',
    risk: 94, riskLabel: 'CRITICAL SQLI PATTERN', state: 'THREAT ACTIVE', stateClass: 'badge-critical', beacon: '12s ago',
  },
  {
    id: 'sess_7e44a0b2', protocol: 'HTTP/2 h2c', identity: 'Guest / Unauthenticated', role: 'Checkout Funnel #9',
    flag: '🇻🇳', ip: '113.161.42.19', geo: 'VN — Ho Chi Minh', traffic: '1,890 reqs', velocity: '8.4 req/s',
    risk: 78, riskLabel: 'CREDENTIAL SPRAY', state: 'SUSPICIOUS', stateClass: 'badge-warning', beacon: '45s ago',
  },
  {
    id: 'sess_3c19d881', protocol: 'WSS (Duplex)', identity: 'elena.rostova@cloudcore.net', role: 'Cluster-Dev · ReadWrite',
    flag: '🇩🇪', ip: '85.214.132.88', geo: 'DE — Frankfurt (Strato)', traffic: '2,104 reqs', velocity: '3.1 req/s',
    risk: 45, riskLabel: 'RAPID HEADERS SHIFT', state: 'MONITORING', stateClass: 'badge-medium', beacon: '1m ago',
  },
  {
    id: 'sess_11fa923e', protocol: 'TLS_CHACHA20', identity: 'd.kumar@enterprise-gateway.org', role: 'Billing Lead · Standard',
    flag: '🇺🇸', ip: '54.210.14.90', geo: 'US — Ashburn (AWS)', traffic: '94 reqs', velocity: '0.4 req/s',
    risk: 12, riskLabel: 'AUTHENTICATED CLEAN', state: 'ACTIVE NORMAL', stateClass: 'badge-success', beacon: '3m ago',
  },
  {
    id: 'sess_44dd01cc', protocol: 'HTTP/1.1 Disconnected', identity: 'svc_pipeline_sync@batch.ai', role: 'Service Account Intercepted',
    flag: '🇳🇱', ip: '185.220.101.5', geo: 'NL — Amsterdam (Tor Exit)', traffic: '612 reqs', velocity: '0.0 req/s',
    risk: 98, riskLabel: 'TOR NODE DROPPED', state: 'TERMINATED', stateClass: 'badge-blocked', beacon: '8m ago',
  },
  {
    id: 'sess_88b1cc92', protocol: 'WSS Heartbeat', identity: 't.moreau@fintech-intl.fr', role: 'Risk Analyst Tier 2',
    flag: '🇫🇷', ip: '195.154.122.9', geo: 'FR — Paris (Iliad)', traffic: '512 reqs', velocity: '1.2 req/s',
    risk: 8, riskLabel: 'HARDWARE MFA ENFORCED', state: 'ACTIVE NORMAL', stateClass: 'badge-success', beacon: '18s ago',
  },
];

function getRiskColor(risk) {
  if (risk >= 70) return 'var(--error)';
  if (risk >= 40) return '#F59E0B';
  return 'var(--tertiary)';
}

function getRiskBarColor(risk) {
  if (risk >= 70) return 'var(--error)';
  if (risk >= 40) return '#F59E0B';
  return 'var(--tertiary)';
}

export default function SessionMonitoring({ onNavigate, onSelectSession }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [riskFilter, setRiskFilter] = useState('All Risk Levels');
  const [sessionsData, setSessionsData] = useState(mockSessions);
  const [kpis, setKpis] = useState({ total: 3412, flagged: 164, avg_risk: 18.4 });
  const [loading, setLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/v1/sessions?search=${encodeURIComponent(search)}&state=${encodeURIComponent(statusFilter === 'All Statuses' ? '' : statusFilter)}`);
      if (!res.ok) throw new Error('API offline');
      const data = await res.json();
      if (data.sessions && data.sessions.length > 0) {
        setSessionsData(data.sessions);
      }
      if (data.kpis) {
        setKpis(data.kpis);
      }
    } catch {
      // Fallback to local filtering of mock data
      const q = search.toLowerCase();
      const filteredMocks = mockSessions.filter(s => {
        return (
          s.id.toLowerCase().includes(q) ||
          s.identity.toLowerCase().includes(q) ||
          s.ip.includes(q) ||
          q === ''
        );
      });
      setSessionsData(filteredMocks);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const filtered = sessionsData.filter(s => {
    if (riskFilter === 'High Risk (70+)') return s.risk >= 70;
    if (riskFilter === 'Medium (40-69)') return s.risk >= 40 && s.risk < 70;
    if (riskFilter === 'Low (<40)') return s.risk < 40;
    return true;
  });

  return (
    <div className="page-content fade-in">
      {/* KPI Row */}
      <div className="kpi-grid">
        <div className="card">
          <div style={{ position: 'absolute', right: '-1.5rem', bottom: '-1.5rem', width: '6rem', height: '6rem', background: 'rgba(76,215,246,0.1)', borderRadius: '50%', filter: 'blur(2rem)', pointerEvents: 'none' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2xs)' }}>
            <span className="kpi-label">Active Sessions</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="dot dot-green dot-ping" style={{ width: '6px', height: '6px' }}></span>REALTIME
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)' }}>
            <span className="kpi-value">{kpis.total?.toLocaleString() || '3,412'}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--tertiary)', display: 'flex', alignItems: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span>+4.2%
            </span>
          </div>
          <div className="progress-bar" style={{ marginTop: 'var(--space-xs)' }}>
            <div className="progress-fill cyan" style={{ width: '78%' }}></div>
          </div>
        </div>

        <div className="card">
          <div style={{ position: 'absolute', right: '-1.5rem', bottom: '-1.5rem', width: '6rem', height: '6rem', background: 'rgba(255,180,171,0.1)', borderRadius: '50%', filter: 'blur(2rem)', pointerEvents: 'none' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2xs)' }}>
            <span className="kpi-label">Flagged & Anomalous</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--error)', fontWeight: 600 }}>ACTION REQ</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)' }}>
            <span className="kpi-value danger">{kpis.flagged?.toLocaleString() || '164'}</span>
            <span className="badge badge-critical" style={{ fontSize: '9px' }}>4.8% of pool</span>
          </div>
          <div className="progress-bar" style={{ marginTop: 'var(--space-xs)' }}>
            <div className="progress-fill red" style={{ width: '24%' }}></div>
          </div>
        </div>

        <div className="card">
          <div style={{ position: 'absolute', right: '-1.5rem', bottom: '-1.5rem', width: '6rem', height: '6rem', background: 'rgba(78,222,163,0.1)', borderRadius: '50%', filter: 'blur(2rem)', pointerEvents: 'none' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2xs)' }}>
            <span className="kpi-label">Mean Risk Index</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>BASELINE: 22.0</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)' }}>
            <span className="kpi-value">{kpis.avg_risk ?? '18.4'}</span>
            <span className="badge badge-low" style={{ fontSize: '9px' }}>Nominal Grade A</span>
          </div>
          <div className="progress-bar" style={{ marginTop: 'var(--space-xs)' }}>
            <div className="progress-fill green" style={{ width: '18.4%' }}></div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="kpi-label">Egress Edge Throughput</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--outline)' }}>hub</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'var(--space-xs)' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--on-surface)' }}>142.8 req/s</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--outline)' }}>Peak: 310 req/s</div>
            </div>
            <div className="mini-bars">
              {[3, 5, 4, 7, 6, 8, 5].map((h, i) => (
                <div key={i} className="mini-bar" style={{ height: `${h * 4}px`, opacity: i === 5 ? 1 : 0.6, background: i === 5 ? 'var(--tertiary)' : 'var(--primary)' }}></div>
              ))}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--outline-variant)', marginTop: 'var(--space-2xs)' }}>Global Ingress WAF Proxy cluster active</div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '20px', pointerEvents: 'none' }}>filter_alt</span>
              <input
                className="form-input"
                style={{ paddingLeft: '40px', paddingRight: '80px' }}
                id="session-search"
                placeholder="Filter by Session ID, Username, or Client IP (e.g. sess_, marcus, 194.26)..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--outline)', background: 'var(--surface-container)', padding: '2px 6px', borderRadius: 'var(--radius)' }}>CTRL+K</span>
            </div>
            <button className="btn btn-ghost" id="reset-filters-btn" onClick={() => { setSearch(''); setStatusFilter('All Statuses'); setRiskFilter('All Risk Levels'); }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>restart_alt</span> Reset
            </button>
            <button className="btn btn-primary" id="apply-preset-btn">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>tune</span> Apply Preset
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-sm)' }}>
            <div>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--on-surface-variant)', display: 'block', marginBottom: '4px' }}>Session Status</label>
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option>All Statuses</option>
                <option>Active Normal</option>
                <option>Suspicious</option>
                <option>Threat Active</option>
                <option>Terminated</option>
              </select>
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--on-surface-variant)', display: 'block', marginBottom: '4px' }}>Risk Index Range</label>
              <select className="form-select" value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
                <option>All Risk Levels</option>
                <option>Low (0–30)</option>
                <option>Medium (31–69)</option>
                <option>High (70–100)</option>
              </select>
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--on-surface-variant)', display: 'block', marginBottom: '4px' }}>Protocol</label>
              <select className="form-select">
                <option>All Protocols</option>
                <option>TLS</option>
                <option>HTTP/2</option>
                <option>WSS</option>
                <option>HTTP/1.1</option>
              </select>
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--on-surface-variant)', display: 'block', marginBottom: '4px' }}>Time Horizon</label>
              <select className="form-select">
                <option>Last 1 hour</option>
                <option>Last 6 hours</option>
                <option>Last 24 hours</option>
                <option>Last 7 days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Session Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-row">
            <div className="card-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>radar</span>
            </div>
            <div>
              <div className="card-title">Active Ingress Telemetry Pipeline</div>
              <span className="badge badge-medium" style={{ marginTop: '2px' }}>CLUSTER: US-EAST-ALPHA</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--tertiary)' }}>
              <span className="dot dot-green dot-pulse" style={{ width: '6px', height: '6px' }}></span>WAF Rulepack v2.9
            </span>
            <span style={{ color: 'var(--outline)' }}>Sync in 1s</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Identity & Tenant</th>
                <th>Client IP & Origin</th>
                <th>Traffic Velocity</th>
                <th>Risk Index</th>
                <th>State</th>
                <th>Last Beacon</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr
                  key={s.id}
                  onClick={() => onSelectSession?.(s.id)}
                  style={{ cursor: 'pointer' }}
                  title="Click to view session telemetry details"
                >
                  <td>
                    <div style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {s.id}
                      <span className="material-symbols-outlined" style={{ fontSize: '13px', opacity: 0.7 }}>open_in_new</span>
                    </div>
                    <div style={{ color: 'var(--outline)', fontSize: '11px' }}>{s.protocol}</div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--on-surface)', fontFamily: 'var(--font-body)' }}>{s.identity}</div>
                    <div style={{ color: 'var(--on-surface-variant)', fontSize: '11px', fontFamily: 'var(--font-body)' }}>{s.role}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{s.flag}</span>
                      <span style={{ color: 'var(--on-surface)' }}>{s.ip}</span>
                    </div>
                    <div style={{ color: 'var(--outline)', fontSize: '11px' }}>{s.geo}</div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--on-surface)' }}>{s.traffic}</div>
                    <div style={{ color: (s.velocity || '').includes('Spike') ? 'var(--error)' : 'var(--outline)', fontSize: '11px' }}>{s.velocity}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: '2px' }}>
                      <span style={{ color: getRiskColor(s.risk), fontWeight: 700, minWidth: '24px' }}>{s.risk}</span>
                      <div style={{ flex: 1, height: '4px', background: 'var(--surface-highest)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${s.risk}%`, background: getRiskBarColor(s.risk), borderRadius: 'var(--radius-full)' }}></div>
                      </div>
                    </div>
                    <div style={{ color: getRiskColor(s.risk), fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>{s.risk_label || s.riskLabel}</div>
                  </td>
                  <td>
                    <span className={`badge ${s.state_class || s.stateClass || 'badge-medium'}`}>{s.state}</span>
                  </td>
                  <td style={{ color: 'var(--outline)' }}>{s.beacon}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div style={{ marginTop: 'var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--on-surface-variant)' }}>
            Showing <strong>1 to {filtered.length}</strong> of <strong>{kpis.total?.toLocaleString() || '3,412'}</strong> monitored sessions
          </span>
          <div className="pagination">
            <button className="page-btn" disabled>&#8676;</button>
            <button className="page-btn" disabled>&#8592;</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <span style={{ color: 'var(--outline)' }}>...</span>
            <button className="page-btn">342</button>
            <button className="page-btn">&#8594;</button>
            <button className="page-btn">&#8677;</button>
          </div>
        </div>
      </div>

      {/* Auto-mitigation Banner */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(76,215,246,0.2)', background: 'rgba(76,215,246,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--primary)' }}>verified_user</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: '2px' }}>
              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--on-surface)' }}>Automated Session Isolation</span>
              <span className="badge badge-success">AUTO-MITIGATE ENFORCED</span>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
              Sessions exceeding a Risk Score of 90 are quarantined dynamically. 1 threat intercepted in the last 15 minutes.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexShrink: 0 }}>
          <button className="btn btn-ghost">Configure Thresholds</button>
          <button className="btn btn-danger" id="enforce-lockdown-btn">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>lock</span>Enforce Global Lockdown
          </button>
        </div>
      </div>
    </div>
  );
}
