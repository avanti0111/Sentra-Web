// Security Dashboard Page
import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// 24h traffic data
const trafficData = [
  { time: '00:00', traffic: 85, threats: 2 },
  { time: '01:00', traffic: 72, threats: 1 },
  { time: '02:00', traffic: 60, threats: 1 },
  { time: '03:00', traffic: 55, threats: 0 },
  { time: '04:00', traffic: 140, threats: 38 },
  { time: '05:00', traffic: 95, threats: 5 },
  { time: '06:00', traffic: 110, threats: 3 },
  { time: '07:00', traffic: 130, threats: 4 },
  { time: '08:00', traffic: 165, threats: 8 },
  { time: '09:00', traffic: 180, threats: 12 },
  { time: '10:00', traffic: 175, threats: 9 },
  { time: '11:00', traffic: 195, threats: 22 },
  { time: '12:00', traffic: 210, threats: 18 },
  { time: '13:00', traffic: 200, threats: 14 },
  { time: '14:00', traffic: 215, threats: 25 },
  { time: '15:00', traffic: 190, threats: 11 },
  { time: '16:00', traffic: 185, threats: 8 },
  { time: '17:00', traffic: 175, threats: 6 },
  { time: '18:00', traffic: 230, threats: 45 },
  { time: '19:00', traffic: 195, threats: 15 },
  { time: '20:00', traffic: 160, threats: 7 },
  { time: '21:00', traffic: 140, threats: 5 },
  { time: '22:00', traffic: 115, threats: 3 },
  { time: '23:59', traffic: 90, threats: 2 },
];

const riskDistData = [
  { name: 'Low Risk', value: 82, color: '#4edea3' },
  { name: 'Medium Risk', value: 13, color: '#4cd7f6' },
  { name: 'High Risk', value: 5, color: '#ffb4ab' },
];

const recentAlerts = [
  { id: 1, type: 'SQL Injection in /api/v1/auth/login', ip: '194.26.29.112', risk: 94, status: 'Auto-Blocked', statusClass: 'badge-critical', dot: 'dot-red', time: '2m ago' },
  { id: 2, type: 'Cross-Site Scripting (XSS) payload', ip: '85.203.45.18', risk: 88, status: 'Challenge-Verify', statusClass: 'badge-medium', dot: 'dot-cyan', time: '8m ago' },
  { id: 3, type: 'Token fuzzing on /oauth/token', ip: '45.154.255.89', risk: 91, status: 'Restrict Rate', statusClass: 'badge-warning', dot: 'dot-red', time: '15m ago' },
  { id: 4, type: 'Path traversal: /static/../../etc/passwd', ip: '185.191.171.42', risk: 98, status: 'Permanent Drop', statusClass: 'badge-critical', dot: 'dot-red', time: '22m ago' },
];

const streamRows = [
  { method: 'POST', methodClass: 'method-post', endpoint: '/api/v1/auth/login', statusCode: '403', statusClass: 'status-403', latency: '1.2ms', time: '14:24:02' },
  { method: 'GET', methodClass: 'method-get', endpoint: '/api/v2/user/profile', statusCode: '200', statusClass: 'status-200', latency: '18ms', time: '14:24:01' },
  { method: 'PUT', methodClass: 'method-put', endpoint: '/api/v1/orders/7821', statusCode: '200', statusClass: 'status-200', latency: '24ms', time: '14:23:59' },
  { method: 'POST', methodClass: 'method-post', endpoint: '/oauth/token', statusCode: '429', statusClass: 'status-429', latency: '0.8ms', time: '14:23:58' },
  { method: 'GET', methodClass: 'method-get', endpoint: '/health/readiness', statusCode: '200', statusClass: 'status-200', latency: '2ms', time: '14:23:57' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--surface-high)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
        <div style={{ color: 'var(--on-surface-variant)', marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, display: 'flex', gap: 8 }}>
            <span>{p.name}:</span>
            <strong>{p.value}{p.name === 'traffic' ? 'k req/h' : ' events'}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard({ onNavigate, onSelectSession }) {
  const [activeFilter, setActiveFilter] = useState('24h');
  const [apiStats, setApiStats] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/v1/stats')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.stats) setApiStats(data.stats);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="page-content fade-in">
      {/* KPI Row */}
      <div className="kpi-grid">
        {/* Card 1: Total Ingress */}
        <div className="card">
          <div style={{ position: 'absolute', right: '-2rem', top: '-2rem', width: '6rem', height: '6rem', background: 'rgba(76,215,246,0.05)', borderRadius: '50%', filter: 'blur(2rem)', pointerEvents: 'none' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
            <span className="kpi-label">Total Ingress (24h)</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--outline)' }}>swap_calls</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)', marginTop: 'var(--space-xs)' }}>
            <span className="kpi-value">{apiStats?.total_events ? apiStats.total_events.toLocaleString() : '1,842,910'}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--tertiary)', display: 'flex', alignItems: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_upward</span>14.2%
            </span>
          </div>
          <p className="kpi-meta">Avg rate: 142 req/s · peak 410 req/s</p>
          {/* Sparkline */}
          <div style={{ marginTop: 'var(--space-md)', width: '100%', height: '36px', display: 'flex', alignItems: 'flex-end' }}>
            <svg style={{ width: '100%', height: '32px', color: 'var(--primary)', overflow: 'visible' }} viewBox="0 0 240 32">
              <path d="M0,24 Q20,18 40,20 T80,14 T120,19 T160,8 T200,12 T240,4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/>
              <path d="M0,24 Q20,18 40,20 T80,14 T120,19 T160,8 T200,12 T240,4 L240,32 L0,32 Z" fill="currentColor" fillOpacity="0.08"/>
              <circle cx="240" cy="4" r="3" fill="#4cd7f6" style={{ animation: 'pulse 2s ease-in-out infinite' }}/>
            </svg>
          </div>
        </div>

        {/* Card 2: Active Concurrency */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
            <span className="kpi-label">Active Concurrency</span>
            <span className="badge badge-live" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="dot dot-green dot-ping" style={{ width: '6px', height: '6px' }}></span>LIVE
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)', marginTop: 'var(--space-xs)' }}>
            <span className="kpi-value">{apiStats?.active_sessions ? apiStats.active_sessions.toLocaleString() : '3,412'}</span>
            <span className="kpi-meta" style={{ margin: 0 }}>tracked sessions</span>
          </div>
          <p className="kpi-meta">Fingerprinted via TLS JA3 + IP context</p>
          <div style={{ marginTop: 'var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-container)', borderRadius: 'var(--radius-lg)', padding: '6px var(--space-sm)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--secondary)' }}>devices</span>
              62% Mobile / 38% Desktop
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: 'var(--secondary)' }}>99.8% Legitimate</span>
          </div>
        </div>

        {/* Card 3: Session Health */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
            <span className="kpi-label">Session Health Index</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--tertiary)', fontWeight: 700 }}>95.2% CLEAN</span>
          </div>
          {/* Segmented Progress */}
          <div style={{ width: '100%', height: '8px', borderRadius: 'var(--radius-full)', background: 'var(--surface-highest)', display: 'flex', overflow: 'hidden', marginBottom: 'var(--space-sm)' }}>
            <div style={{ width: '95.2%', background: 'var(--tertiary)' }}></div>
            <div style={{ width: '3.6%', background: 'var(--primary)' }}></div>
            <div style={{ width: '1.2%', background: 'var(--error)' }}></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { label: 'Normal', val: apiStats ? `${Math.max(0, apiStats.active_sessions - apiStats.critical_sessions)}` : '3,248', pct: '95.2%', dotClass: 'dot-green', valColor: 'var(--tertiary)' },
              { label: 'Suspicious', val: apiStats ? '1' : '124', pct: '3.6%', dotClass: 'dot-cyan', valColor: 'var(--primary)' },
              { label: 'Critical Threats', val: apiStats ? `${apiStats.critical_sessions}` : '40', pct: '1.2%', dotClass: 'dot-red', valColor: 'var(--error)' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--on-surface)' }}>
                  <span className={`dot ${r.dotClass}`} style={{ width: '8px', height: '8px' }}></span>{r.label}
                </span>
                <span style={{ color: r.valColor, fontWeight: 600 }}>{r.val} <span style={{ color: 'var(--outline)', fontSize: '10px' }}>({r.pct})</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Mitigation Rate */}
        <div className="card">
          <div style={{ position: 'absolute', right: 0, bottom: 0, transform: 'translate(1rem,1rem)', opacity: 0.08, pointerEvents: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '80px', color: 'var(--primary)' }}>verified_user</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
            <span className="kpi-label">Mitigation Rate</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--tertiary)' }}>shield</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)', marginTop: 'var(--space-xs)' }}>
            <span className="kpi-value success">99.4%</span>
            <span className="kpi-meta" style={{ margin: 0 }}>adaptive filter</span>
          </div>
          <p className="kpi-meta">Autonomous WAF + eBPF drop rules</p>
          <div style={{ marginTop: 'var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: 'var(--space-xs)' }}>
            <div>
              <div style={{ color: 'var(--outline)' }}>Auto-Dropped</div>
              <div style={{ color: 'var(--on-surface)', fontWeight: 600, fontSize: '13px' }}>{apiStats ? `${apiStats.blocked} req` : '1,418 req'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--outline)' }}>Challenged</div>
              <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '13px' }}>382 CAPTCHA</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid-8-4">
        {/* Threat Activity Timeline */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-row">
              <div className="card-icon">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>stacked_line_chart</span>
              </div>
              <div>
                <div className="card-title">Threat Activity vs. Request Ingress</div>
                <div className="card-subtitle">Real-time packet inspection · 24-Hour Telemetry Scope</div>
              </div>
            </div>
            {/* Time filters */}
            <div className="filter-bar">
              {['1h', '6h', '24h', '7d'].map(f => (
                <button key={f} className={`filter-chip ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', marginBottom: 'var(--space-sm)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--on-surface)' }}>
              <span style={{ width: '10px', height: '4px', borderRadius: '2px', background: 'var(--primary)', display: 'inline-block' }}></span>Total HTTP Traffic (k req/h)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--on-surface)' }}>
              <span style={{ width: '10px', height: '4px', borderRadius: '2px', background: 'var(--error)', display: 'inline-block' }}></span>Flagged Malicious Spikes
            </span>
            <span style={{ marginLeft: 'auto', color: 'var(--outline)' }}>Peak Spike: 04:00 (Credential Stuffing)</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trafficData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4cd7f6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#4cd7f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="threatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffb4ab" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#ffb4ab" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,57,74,0.5)" vertical={false}/>
              <XAxis dataKey="time" tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--outline)' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--outline)' }} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Area type="monotone" dataKey="traffic" name="traffic" stroke="#4cd7f6" strokeWidth={2.5} fill="url(#trafficGrad)" dot={false} activeDot={{ r: 4, fill: '#4cd7f6' }}/>
              <Area type="monotone" dataKey="threats" name="threats" stroke="#ffb4ab" strokeWidth={2} fill="url(#threatGrad)" dot={false} activeDot={{ r: 4, fill: '#ffb4ab' }}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution Donut */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-row">
              <div className="card-icon success">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>pie_chart</span>
              </div>
              <div>
                <div className="card-title">Risk Distribution</div>
                <div className="card-subtitle">Context Anomaly Matrix</div>
              </div>
            </div>
          </div>
          {/* Donut */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 'var(--space-sm) 0' }}>
            <PieChart width={160} height={160}>
              <Pie data={riskDistData} cx={75} cy={75} innerRadius={48} outerRadius={68} paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
                {riskDistData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} strokeWidth={0}/>
                ))}
              </Pie>
            </PieChart>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AGGREGATE</span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--on-surface)', lineHeight: 1 }}>14.8</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--tertiary)' }}>SAFE POSTURE</span>
            </div>
          </div>
          {/* Risk breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', marginTop: 'var(--space-sm)' }}>
            {[
              { label: 'Low Risk (0–30)', sub: 'Normal browsing behaviors', pct: '82%', color: 'var(--tertiary)', dotClass: 'dot-green' },
              { label: 'Medium Risk (31–69)', sub: 'Rapid clicks, rare user-agents', pct: '13%', color: 'var(--primary)', dotClass: 'dot-cyan' },
              { label: 'High Risk (70–100)', sub: 'SQLi, path brute, credential dump', pct: '5%', color: 'var(--error)', dotClass: 'dot-red' },
            ].map(r => (
              <div key={r.label} style={{ background: 'var(--surface-container)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <span className={`dot ${r.dotClass}`} style={{ width: '10px', height: '10px' }}></span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--on-surface)', lineHeight: 1.2 }}>{r.label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--outline)' }}>{r.sub}</div>
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: r.color }}>{r.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Operations Grid */}
      <div className="grid-2">
        {/* High Severity Alerts */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-row">
              <div className="card-icon danger">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>gpp_maybe</span>
              </div>
              <div>
                <div className="card-title">Recent High-Severity Alerts</div>
                <div className="card-subtitle">Automated mitigation triggers & payloads</div>
              </div>
            </div>
            <span className="badge badge-critical">4 Critical Intercepts</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', marginTop: 'var(--space-xs)' }}>
            {recentAlerts.map(alert => (
              <div key={alert.id} className="alert-item">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                    <span className={`dot ${alert.dot}`} style={{ width: '8px', height: '8px' }}></span>
                    <span style={{ fontWeight: 600, color: 'var(--on-surface)', fontSize: '14px' }}>{alert.type}</span>
                  </div>
                  <span className="kpi-meta" style={{ margin: 0 }}>{alert.time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                    <span>SRC: <span style={{ color: 'var(--on-surface)' }}>{alert.ip}</span></span>
                    <span>•</span>
                    <span style={{ color: alert.risk > 90 ? 'var(--error)' : 'var(--primary)', fontWeight: 700 }}>RISK: {alert.risk}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`badge ${alert.statusClass}`}>{alert.status}</span>
                    <button style={{ padding: '2px', borderRadius: 'var(--radius)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--outline)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ paddingTop: 'var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--outline)' }}>
            <span>Displaying latest threat vectors</span>
            <button style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '12px', fontFamily: 'var(--font-body)' }}>
              View complete incident ledger <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Live Contextual Stream */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-row">
              <div className="card-icon">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>stream</span>
              </div>
              <div>
                <div className="card-title">Live Contextual Stream</div>
                <div className="card-subtitle">Ingress parser & payload telemetry</div>
              </div>
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--tertiary)' }}>
              <span className="dot dot-green dot-pulse" style={{ width: '8px', height: '8px' }}></span>STREAMING
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Endpoint URI</th>
                  <th>Status</th>
                  <th>Latency</th>
                  <th style={{ textAlign: 'right' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {streamRows.map((row, i) => (
                  <tr key={i}>
                    <td><span className={row.methodClass}>{row.method}</span></td>
                    <td style={{ color: 'var(--on-surface)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.endpoint}</td>
                    <td><span className={row.statusClass}>{row.statusCode}</span></td>
                    <td style={{ color: 'var(--outline)' }}>{row.latency}</td>
                    <td style={{ textAlign: 'right', color: 'var(--outline)' }}>{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ paddingTop: 'var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <span style={{ color: 'var(--outline)' }}>Buffer depth: 250 items</span>
            <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
              <button className="btn btn-ghost btn-sm" id="pause-stream-btn">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>pause</span> Pause Stream
              </button>
              <button className="btn btn-ghost btn-sm" id="filter-stream-btn">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>filter_alt</span> Filter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
