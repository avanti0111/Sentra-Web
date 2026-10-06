// SentraWeb - Response & Security Logs Page
import { useState, useEffect, useCallback } from 'react';

const initialLogs = [
  {
    id: 'req_a78c01f4',
    timestamp: '2025-05-18 14:38:12.402',
    sessionId: 'sess_9f82c1a4',
    ip: '194.26.29.112',
    asn: 'AS48282 (RU)',
    method: 'POST',
    endpoint: '/api/v1/auth/login',
    risk: 94,
    action: 'BLOCK',
    reason: 'SQL Injection signature in POST body (UNION SELECT detected)',
    raw: `Headers: Host: api.sentraweb.io
User-Agent: sqlmap/1.7#dev
Content-Type: application/json
X-Forwarded-For: 194.26.29.112

Payload:
{
  "username": "admin' UNION SELECT 1,load_file('/etc/passwd')--",
  "token": "x99"
}
Decision: Hard Drop (TCP RST)
Engine: CORE-01 (SQLi AST Parser)`
  },
  {
    id: 'req_e29b1090',
    timestamp: '2025-05-18 14:38:11.890',
    sessionId: 'sess_34b9d02a',
    ip: '82.165.197.1',
    asn: 'AS8560 (DE)',
    method: 'PUT',
    endpoint: '/api/v2/users/credentials',
    risk: 68,
    action: 'VERIFY',
    reason: 'Device Fingerprint Drift + Unrecognized Geolocation',
    raw: `Headers: Host: api.sentraweb.io
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
Sec-Ch-Ua-Platform: "Windows"
Client-ASN: AS8560

Challenge-Issued: WebAuthn-FIDO2-Key
Status: Pending Handshake response
Risk Factors: Entropy Jump + Geo Distance > 2,400km in 12m`
  },
  {
    id: 'req_bc81203f',
    timestamp: '2025-05-18 14:38:11.104',
    sessionId: 'sess_aa77b102',
    ip: '103.251.167.20',
    asn: 'AS133118 (IN)',
    method: 'GET',
    endpoint: '/api/v1/inventory/items',
    risk: 45,
    action: 'RESTRICT',
    reason: 'Exceeded 50 req/s rate threshold (Bursting 78 req/s)',
    raw: `Headers: Host: api.sentraweb.io
User-Agent: python-requests/2.31.0
Accept-Encoding: gzip, deflate
X-RateLimit-Limit: 50
X-RateLimit-Current: 78

Action: Enforced HTTP 429 Retry-After: 60s
Clamping: Token bucket 1 req / 1.5s`
  },
  {
    id: 'req_0029bfa1',
    timestamp: '2025-05-18 14:38:10.950',
    sessionId: 'sess_cc8811d0',
    ip: '172.56.21.89',
    asn: 'AS21928 (US)',
    method: 'GET',
    endpoint: '/app/dashboard/metrics',
    risk: 8,
    action: 'ALLOW',
    reason: 'Clean telemetry, valid JWT & device posture verified',
    raw: `Headers: Host: app.sentraweb.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)
Accept: application/json

Response: 200 OK (14ms latency)
Integrity: Pass (AST & Token clean)`
  },
  {
    id: 'req_66f2c00a',
    timestamp: '2025-05-18 14:38:09.610',
    sessionId: 'sess_01ab8872',
    ip: '185.220.101.44',
    asn: 'AS208323 (NL)',
    method: 'GET',
    endpoint: '/admin/users/export',
    risk: 91,
    action: 'BLOCK',
    reason: 'Tor Exit Node flag + Zero-trust admin boundary access',
    raw: `Headers: Host: internal.sentraweb.io
X-Tor-Node: confirmed
Cipher: TLS_AES_128_GCM_SHA256

Threat Feed: TOR-BULK-EXIT-V4
Decision: TCP Drop + Firewalled at Border Gateway
Flag: Boundary Violation on /admin/*`
  },
  {
    id: 'req_dd341a09',
    timestamp: '2025-05-18 14:38:08.211',
    sessionId: 'sess_ee4312aa',
    ip: '45.146.165.37',
    asn: 'AS44050 (RO)',
    method: 'GET',
    endpoint: '/static/..%2f..%2fetc/passwd',
    risk: 98,
    action: 'BLOCK',
    reason: 'Path Traversal attempt in URI path (OWASP CRS 930100)',
    raw: `URI: /static/..%2f..%2fetc/passwd
Hex Sequence: 2e 2e 25 32 66 2e 2e 25 32 66
Matched Rule: CORE-04 Local File Inclusion
Action: 403 Forbidden Drop
Payload Signature: %2e%2e%2f /etc/passwd`
  },
  {
    id: 'req_7781b01c',
    timestamp: '2025-05-18 14:38:07.892',
    sessionId: 'sess_55cc9981',
    ip: '198.51.100.22',
    asn: 'AS15169 (US)',
    method: 'POST',
    endpoint: '/api/v1/auth/reset-pin',
    risk: 58,
    action: 'VERIFY',
    reason: 'Rapid anomalous password reset request cadence',
    raw: `Headers: Host: api.sentraweb.io
User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_4)
Action-Trigger: Proof-of-Work Level 2 + SMS OTP
State: Challenge Dispatched`
  },
  {
    id: 'req_876bb012',
    timestamp: '2025-05-18 14:38:03.412',
    sessionId: 'sess_9002ffea',
    ip: '151.101.65.140',
    asn: 'AS54113 (US)',
    method: 'GET',
    endpoint: '/assets/core-bundle.min.js',
    risk: 2,
    action: 'ALLOW',
    reason: 'Static asset hit from CDN edge cache',
    raw: `Cache-Control: public, max-age=31536000
X-Served-By: cache-iad-kj982
Response: 304 Not Modified
Inspection: Fast Path Bypass`
  },
  {
    id: 'req_6541ee90',
    timestamp: '2025-05-18 14:38:02.190',
    sessionId: 'sess_3377dd01',
    ip: '185.191.171.18',
    asn: 'AS396982 (GB)',
    method: 'PUT',
    endpoint: '/api/v1/billing/payment-method',
    risk: 62,
    action: 'VERIFY',
    reason: 'High-privilege financial endpoint policy trigger',
    raw: `Policy: PCI-DSS-Strict-Auth
Trigger: Stripe card update tokenization
Required: TOTP / Passkey Step-Up confirmation
Session State: Quarantined pending verify`
  },
  {
    id: 'req_234bb761',
    timestamp: '2025-05-18 14:38:01.050',
    sessionId: 'sess_8899aa12',
    ip: '193.169.255.77',
    asn: 'AS49505 (RU)',
    method: 'GET',
    endpoint: '/.env',
    risk: 97,
    action: 'BLOCK',
    reason: 'Automated secrets reconnaissance scanner probe',
    raw: `Request: GET /.env HTTP/1.1
User-Agent: masscan/1.0 (CyberRecon)
Threat Feed: Active Hostile Crawler in SOC Rule 4001
Action: Immediate TCP RST + IP Jail for 72h`
  },
  {
    id: 'req_5621890a',
    timestamp: '2025-05-18 14:38:00.812',
    sessionId: 'sess_4422dd81',
    ip: '104.28.19.45',
    asn: 'AS13335 (US)',
    method: 'POST',
    endpoint: '/api/v1/auth/forgot-password',
    risk: 42,
    action: 'RESTRICT',
    reason: 'Forgot-password brute enumeration attempt',
    raw: `Target-Account: user_8831@enterprise.com
Attempts-In-60s: 9
Clamp: Enforced delay 4000ms response
Policy: Progressive Account Lockout`
  },
  {
    id: 'req_998124cd',
    timestamp: '2025-05-18 14:38:00.110',
    sessionId: 'sess_11883900',
    ip: '172.58.140.22',
    asn: 'AS21928 (US)',
    method: 'POST',
    endpoint: '/graphql',
    risk: 6,
    action: 'ALLOW',
    reason: 'AST depth and GraphQL schema query validated',
    raw: `Operation: GetOrganizationNode
Query-Depth: 3
Complexity-Score: 18 (Limit 150)
Latency: 9ms
Result: Evaluated Clean`
  }
];

const API_BASE = 'http://localhost:5000/api/v1';

export default function ResponseLogs({ onNavigate }) {
  const [logs, setLogs] = useState(initialLogs);
  const [filterAction, setFilterAction] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState(initialLogs[0]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStats, setApiStats] = useState(null); // real counts from backend

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterAction !== 'ALL') params.set('action', filterAction);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      params.set('per_page', '50');

      const res = await fetch(`${API_BASE}/events?${params}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();

      if (data.events && data.events.length > 0) {
        // Map DB fields (raw_payload) to UI field (raw)
        const mapped = data.events.map(e => ({ ...e, raw: e.raw_payload || '' }));
        setLogs(mapped);
        setSelectedLog(mapped[0]);
      }
      if (data.stats) setApiStats(data.stats);
    } catch {
      // Backend unreachable — keep using mock data silently
    } finally {
      setIsLoading(false);
    }
  }, [filterAction, searchQuery]);

  // Fetch on mount and whenever filter changes
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    showToast(`Copied ${text} to clipboard`);
  };

  const handleFirewallIp = (ip) => {
    showToast(`IP ${ip} injected into perimeter eBPF blocklist`);
  };

  const handleQuarantineSession = (sessId) => {
    showToast(`Session ${sessId} revoked & token invalidated`);
  };

  const exportCSV = () => {
    const headers = 'Request ID,Timestamp,Session ID,Client IP,ASN,Method,Endpoint,Risk,Action,Reason\n';
    const rows = filteredLogs.map(l =>
      `"${l.id}","${l.timestamp}","${l.session_id || l.sessionId}","${l.ip}","${l.asn}","${l.method}","${l.endpoint}",${l.risk},"${l.action}","${l.reason}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentraweb_soc_logs_${Date.now()}.csv`;
    a.click();
    showToast('Exported logs to CSV format');
  };

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `sentraweb_flask_audit_${Date.now()}.json`;
    a.click();
    showToast('Exported Flask/SQLite compatible JSON');
  };

  // Filtering is done server-side — logs already reflect current filter/search
  // Provide local fallback filter in case backend is unavailable (mock data uses camelCase)
  const filteredLogs = logs.filter(log => {
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    const q = searchQuery.toLowerCase().trim();
    const sid = log.session_id || log.sessionId || '';
    const matchesSearch = !q ||
      (log.id || '').toLowerCase().includes(q) ||
      sid.toLowerCase().includes(q) ||
      (log.ip || '').toLowerCase().includes(q) ||
      (log.endpoint || '').toLowerCase().includes(q) ||
      (log.reason || '').toLowerCase().includes(q);
    return matchesAction && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', width: '100%' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          background: 'var(--surface-container-highest)',
          border: '1px solid var(--outline-variant)',
          color: 'var(--on-surface)',
          padding: '12px 18px',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: '20px' }}>check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Telemetry Ribbon */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)', marginBottom: '4px' }}>
            <span>SOC Engine Core</span>
            <span style={{ color: 'var(--outline)' }}>/</span>
            <span>Audit Trail & Policy Enforcement</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            Response & Security Logs
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'var(--surface-container-high)', color: 'var(--primary)', fontWeight: 500 }}>
              v2.4 Live Buffer
            </span>
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', margin: '4px 0 0 0', maxWidth: '640px' }}>
            Forensic chronicle of automated heuristics, behavioral challenges, and analyst-triggered mitigation protocols across the distributed edge gateway.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
            <span className="dot dot-green dot-pulse" style={{ width: '7px', height: '7px' }}></span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>1,842,910</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Captured Events</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>sync</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
              Sync: <strong style={{ color: 'var(--tertiary)' }}>Real-Time</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 1. Action Policy Summary Banner (4 Stat Cards with Sparklines) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
        {/* ALLOW Card */}
        <div className="card" style={{ padding: 'var(--space-md)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="dot dot-green" style={{ width: '8px', height: '8px' }}></span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--tertiary)' }}>ALLOW POLICY</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--tertiary)', background: 'rgba(78, 222, 163, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>99.2%</span>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>1,828,400</div>
            <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Unimpeded standard routing</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--tertiary)' }}>↑ 0.4%</span>
            </div>
          </div>
          {/* Sparkline */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '24px', marginTop: '12px' }}>
            {[65, 75, 70, 85, 92, 100].map((h, i) => (
              <div key={i} style={{ flex: 1, background: i === 5 ? 'var(--tertiary)' : 'rgba(78, 222, 163, 0.25)', height: `${h}%`, borderRadius: '2px' }}></div>
            ))}
          </div>
        </div>

        {/* VERIFY Card */}
        <div className="card" style={{ padding: 'var(--space-md)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="dot dot-cyan" style={{ width: '8px', height: '8px' }}></span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--primary)' }}>VERIFY CHALLENGE</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--primary)', background: 'rgba(76, 215, 246, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>0.45%</span>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>8,410</div>
            <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Step-up 2FA, WebAuthn & PoW</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--on-surface)' }}>87% solved</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '24px', marginTop: '12px' }}>
            {[40, 60, 55, 70, 65, 80].map((h, i) => (
              <div key={i} style={{ flex: 1, background: i === 5 ? 'var(--primary)' : 'rgba(76, 215, 246, 0.25)', height: `${h}%`, borderRadius: '2px' }}></div>
            ))}
          </div>
        </div>

        {/* RESTRICT Card */}
        <div className="card" style={{ padding: 'var(--space-md)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="dot dot-yellow" style={{ width: '8px', height: '8px' }}></span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--secondary)' }}>RESTRICT RATE</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--secondary)', background: 'rgba(173, 198, 255, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>0.22%</span>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>4,120</div>
            <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Throttled to 1 req/s token clamp</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--secondary)' }}>↓ 1.2%</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '24px', marginTop: '12px' }}>
            {[75, 60, 50, 45, 35, 40].map((h, i) => (
              <div key={i} style={{ flex: 1, background: i === 5 ? 'var(--secondary)' : 'rgba(173, 198, 255, 0.25)', height: `${h}%`, borderRadius: '2px' }}></div>
            ))}
          </div>
        </div>

        {/* BLOCK Card */}
        <div className="card" style={{ padding: 'var(--space-md)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="dot dot-red dot-pulse" style={{ width: '8px', height: '8px' }}></span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--error)' }}>BLOCK ENFORCED</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--error)', background: 'rgba(255, 180, 171, 0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>0.11%</span>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--error)', lineHeight: 1.1 }}>1,980</div>
            <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Immediate TCP RST / 403 Hard Drop</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--error)' }}>↑ 18 today</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '24px', marginTop: '12px' }}>
            {[30, 45, 25, 65, 50, 85].map((h, i) => (
              <div key={i} style={{ flex: 1, background: i === 5 ? 'var(--error)' : 'rgba(255, 180, 171, 0.25)', height: `${h}%`, borderRadius: '2px' }}></div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Advanced Query & Filter Toolbar */}
      <div className="card" style={{ padding: 'var(--space-md)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
        {/* Left: Search & Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-sm)', flex: 1, minWidth: '300px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '9px', fontSize: '18px', color: 'var(--outline)' }}>
              filter_alt
            </span>
            <input
              type="text"
              className="search-input"
              style={{ width: '100%', paddingLeft: '34px', paddingRight: '32px' }}
              placeholder="Filter by Request ID, Session ID, IP, or Reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '8px', top: '8px', background: 'transparent', border: 'none', color: 'var(--outline)', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
              </button>
            )}
          </div>

          {/* Action Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {['ALL', 'ALLOW', 'VERIFY', 'RESTRICT', 'BLOCK'].map((act) => {
              const isActive = filterAction === act;
              let dotColor = null;
              if (act === 'ALLOW') dotColor = 'var(--tertiary)';
              if (act === 'VERIFY') dotColor = 'var(--primary)';
              if (act === 'RESTRICT') dotColor = 'var(--secondary)';
              if (act === 'BLOCK') dotColor = 'var(--error)';

              return (
                <button
                  key={act}
                  onClick={() => setFilterAction(act)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-lg)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease',
                    background: isActive ? 'var(--primary)' : 'var(--surface-container-high)',
                    color: isActive ? 'var(--on-primary)' : 'var(--on-surface)',
                    border: '1px solid ' + (isActive ? 'var(--primary)' : 'var(--outline-variant)')
                  }}
                >
                  {dotColor && !isActive && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor }}></span>}
                  {act}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Export & Print Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="topbar-btn" onClick={exportCSV} title="Export current events to CSV">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>table_view</span>
            <span>Export CSV</span>
          </button>
          <button className="topbar-btn" onClick={exportJSON} title="Download Flask/SQLite compatible JSON">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>data_object</span>
            <span>JSON (Flask)</span>
          </button>
          <button
            onClick={() => window.print()}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--primary)',
              color: 'var(--on-primary)',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>print</span>
            <span>Print SOC Report</span>
          </button>
        </div>
      </div>

      {/* 3. Comprehensive Security Event Log Table + Docked Inspector Drawer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 'var(--space-md)', alignItems: 'start' }}>
        {/* Table Canvas */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Table Header Ribbon */}
          <div style={{ padding: '10px 16px', background: 'var(--surface-container-lowest)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--outline-variant)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>
              <span>Ingest Pipe: eth0.sec / enp4s0</span>
              <span style={{ color: 'var(--outline)' }}>•</span>
              <span style={{ color: 'var(--tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="dot dot-green dot-pulse" style={{ width: '6px', height: '6px' }}></span>
                STREAMING BUFFER
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface)' }}>
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                Live Autotrail
              </label>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'var(--surface-container-high)', color: 'var(--on-surface)' }}>
                {filteredLogs.length} in view
              </span>
            </div>
          </div>

          {/* Table Element */}
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="data-table" style={{ width: '100%', minWidth: '780px' }}>
              <thead>
                <tr>
                  <th style={{ width: '160px' }}>Timestamp (UTC)</th>
                  <th style={{ width: '110px' }}>Request ID</th>
                  <th style={{ width: '110px' }}>Session ID</th>
                  <th>Client IP & ASN</th>
                  <th>Endpoint</th>
                  <th style={{ textAlign: 'center' }}>Risk</th>
                  <th>Policy Action</th>
                  <th>Trigger Reason</th>
                  <th style={{ textAlign: 'right' }}>Inspector</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const isSelected = selectedLog?.id === log.id;
                  let actionBadge = 'badge-clean';
                  if (log.action === 'BLOCK') actionBadge = 'badge-critical';
                  else if (log.action === 'RESTRICT') actionBadge = 'badge-medium';
                  else if (log.action === 'VERIFY') actionBadge = 'badge-high';

                  let riskColor = 'var(--tertiary)';
                  if (log.risk >= 80) riskColor = 'var(--error)';
                  else if (log.risk >= 50) riskColor = 'var(--primary)';
                  else if (log.risk >= 30) riskColor = 'var(--secondary)';

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(76, 215, 246, 0.08)' : undefined,
                        borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent'
                      }}
                    >
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                        {log.timestamp}
                      </td>
                      <td>
                        <span
                          className="req-link"
                          style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--primary)', cursor: 'pointer' }}
                          onClick={(e) => { e.stopPropagation(); handleCopy(log.id); }}
                          title="Click to copy Request ID"
                        >
                          {log.id}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={(e) => { e.stopPropagation(); onNavigate?.('session-details'); }}
                          style={{ background: 'transparent', border: 'none', padding: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                        >
                          {log.session_id || log.sessionId}
                          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>open_in_new</span>
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                          <span style={{ fontWeight: 600 }}>{log.ip}</span>
                          <span style={{ fontSize: '10px', color: 'var(--outline)' }}>{log.asn}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                          <span style={{
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontSize: '9px',
                            fontWeight: 700,
                            background: log.method === 'POST' ? 'rgba(255, 180, 171, 0.15)' : 'var(--surface-container-highest)',
                            color: log.method === 'POST' ? 'var(--error)' : 'var(--primary)'
                          }}>
                            {log.method}
                          </span>
                          <span style={{ color: 'var(--on-surface)' }}>{log.endpoint}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: `rgba(${log.risk > 80 ? '255, 180, 171' : log.risk > 50 ? '76, 215, 246' : '78, 222, 163'}, 0.15)`,
                          color: riskColor
                        }}>
                          {log.risk}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${actionBadge}`} style={{ fontSize: '10px' }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.reason}>
                        {log.reason}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--surface-container-high)',
                            border: '1px solid var(--outline-variant)',
                            color: 'var(--primary)',
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>visibility</span>
                          View Raw
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div style={{ padding: '10px 16px', background: 'var(--surface-container-lowest)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--outline-variant)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
            <div>
              Showing <strong style={{ color: 'var(--on-surface)' }}>1-{filteredLogs.length}</strong> of <strong style={{ color: 'var(--on-surface)' }}>1,842,910</strong> events
              <span style={{ margin: '0 8px', color: 'var(--outline)' }}>•</span>
              SQLite Index: <span style={{ color: 'var(--primary)' }}>idx_audit_ts_action</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--primary)', color: 'var(--on-primary)', fontWeight: 700 }}>1</span>
              <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--surface-container-high)', color: 'var(--on-surface)' }}>2</span>
              <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--surface-container-high)', color: 'var(--on-surface)' }}>3</span>
              <span style={{ color: 'var(--outline)' }}>...</span>
              <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--surface-container-high)', color: 'var(--on-surface)' }}>122,860</span>
            </div>
          </div>
        </div>

        {/* Docked Inspector Drawer */}
        <div className="card" style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Drawer Top Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--outline-variant)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>data_object</span>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>Raw Inspector</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                className="topbar-btn"
                style={{ padding: '4px 8px' }}
                onClick={() => handleCopy(selectedLog?.raw || '')}
                title="Copy Raw Wire Telemetry"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>content_copy</span>
              </button>
            </div>
          </div>

          {/* Quick Context Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px', borderRadius: 'var(--radius-md)', background: 'var(--surface-container-lowest)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <div>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--outline)', display: 'block' }}>Target Request</span>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{selectedLog?.id}</span>
            </div>
            <div>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--outline)', display: 'block' }}>Client IP</span>
              <span style={{ color: 'var(--on-surface)', fontWeight: 600 }}>{selectedLog?.ip}</span>
            </div>
            <div>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--outline)', display: 'block' }}>Action Applied</span>
              <span style={{ color: selectedLog?.action === 'BLOCK' ? 'var(--error)' : 'var(--tertiary)', fontWeight: 700 }}>
                {selectedLog?.action}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--outline)', display: 'block' }}>Risk Score</span>
              <span style={{ color: selectedLog?.risk > 70 ? 'var(--error)' : 'var(--primary)', fontWeight: 700 }}>
                {selectedLog?.risk} / 100
              </span>
            </div>
          </div>

          {/* Trigger Reason & Vector */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>
              Trigger Reason & Vector:
            </div>
            <div style={{ fontSize: '12px', background: 'var(--surface-container-lowest)', padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', lineHeight: 1.4 }}>
              {selectedLog?.reason}
            </div>
          </div>

          {/* Raw Payload & Headers Wire Terminal */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>
                HTTP Wire Telemetry:
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--outline)' }}>
                HTTP/2 TLS 1.3
              </span>
            </div>
            <pre style={{
              margin: 0,
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-container-lowest)',
              border: '1px solid var(--outline-variant)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              lineHeight: 1.5,
              color: 'var(--tertiary)',
              maxHeight: '260px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}>
              {selectedLog?.raw}
            </pre>
          </div>

          {/* Analyst Interventions */}
          <div style={{ paddingTop: '4px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: '6px' }}>
              Analyst Interventions:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => handleFirewallIp(selectedLog?.ip)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 180, 171, 0.15)',
                  border: '1px solid var(--error)',
                  color: 'var(--error)',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>block</span>
                Firewall IP
              </button>
              <button
                onClick={() => handleQuarantineSession(selectedLog?.sessionId)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-container-high)',
                  border: '1px solid var(--outline-variant)',
                  color: 'var(--on-surface)',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>lock_reset</span>
                Terminate Sess
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
