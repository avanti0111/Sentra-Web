import { useState, useEffect } from 'react';

export default function SessionDetails({ sessionId = 'sess_9f82c1a4', onNavigate }) {
  const [session, setSession] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);
  const [isTerminated, setIsTerminated] = useState(false);

  const defaultTraceEvents = [
    { time: '14:22:01.108', verb: 'POST', path: '/api/v1/auth/login', code: '401', codeClass: 'status-401', payload: "username=admin' OR 1=1--", action: 'WAF Alert: SQLi Pattern' },
    { time: '14:22:04.421', verb: 'POST', path: '/api/v1/auth/login', code: '401', codeClass: 'status-401', payload: "username=root' UNION SELECT--", action: 'WAF Alert: SQL Union Attack' },
    { time: '14:22:09.890', verb: 'POST', path: '/api/v1/auth/login', code: '200', codeClass: 'status-200', payload: 'Auth via stolen session token (Hijack)', action: 'Session Elevation Flagged' },
    { time: '14:22:15.014', verb: 'GET', path: '/api/v1/internal/users', code: '403', codeClass: 'status-403', payload: 'Privilege escalation probe (Unauthorized scope)', action: 'RBAC Intercept Triggered' },
    { time: '14:22:20.655', verb: 'GET', path: '/api/v1/system/backup.sql', code: '403', codeClass: 'status-403', payload: 'Path traversal & data exfiltration probe', action: 'WAF Path Sanity Check Fail' },
    { time: '14:22:22.002', verb: 'KILL', verbClass: 'method-kill', path: 'ALL ACTIVE SESSIONS', code: '423', codeClass: 'status-403', payload: 'Engine Action: AUTO-BLOCK applied | Socket severed', action: 'Automated Quarantine' },
  ];

  useEffect(() => {
    let isMounted = true;
    if (!sessionId) return;
    setLoading(true);
    fetch(`http://localhost:5000/api/v1/sessions/${sessionId}`)
      .then(res => {
        if (!res.ok) throw new Error('Session not found');
        return res.json();
      })
      .then(data => {
        if (!isMounted) return;
        if (data.session) {
          setSession(data.session);
          if (data.session.state === 'TERMINATED') {
            setIsTerminated(true);
          }
        }
        if (data.events && data.events.length > 0) {
          setEvents(data.events);
        }
      })
      .catch(() => {
        // Fall back to default view
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [sessionId]);

  const handleTerminate = () => {
    setIsTerminated(true);
    setActionNotice({
      type: 'danger',
      title: 'Session Terminated & Socket Severed',
      msg: `Active TCP socket severed for ${session?.id || sessionId}. Session state permanently revoked across all edge ingress clusters.`
    });
    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleForceReauth = () => {
    setActionNotice({
      type: 'info',
      title: 'Step-Up Re-Authentication Dispatched',
      msg: `FIDO2 / TOTP push challenge sent to ${session?.identity || 'target user'}. Pending verification.`
    });
    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleIsolateIp = () => {
    setActionNotice({
      type: 'warning',
      title: 'Origin IP Quarantined',
      msg: `IP ${session?.ip || '194.26.29.112'} blacklisted in edge firewall table for 3,600s.`
    });
    setTimeout(() => setActionNotice(null), 5000);
  };

  const riskFactors = [
    { weight: '35%', pts: '+31.2 pts', label: 'SQLi & Path Traversal Signatures', desc: 'Repetitive injections detected in username authentication parameters alongside attempts to access backup.sql.', rule: 'Rule: SEC-OWASP-A03' },
    { weight: '25%', pts: '+22.5 pts', label: 'Impossible Geolocation Travel', desc: 'Previous authentic login for admin_service_test was in Washington DC, US 34 minutes earlier. Physical displacement velocity is impossible.', rule: 'Speed: 12,840 km/h' },
    { weight: '20%', pts: '+17.8 pts', label: 'Spoofed TLS/JA3 Fingerprint', desc: 'User-Agent header advertised standard Chrome browser, but TLS Client Hello ciphersuite matches automated Python library signature.', rule: 'Client: Python/Requests' },
    { weight: '20%', pts: '+17.5 pts', label: 'Rapid Request Bursting', desc: 'High-density automated scan pattern exceeding normal analyst behavior by 1,400% on security-critical administration routes.', rule: 'Trigger: Rate Burst Guard' },
  ];

  const currentId = session?.id || sessionId;
  const currentIdentity = session?.identity || 'admin_service_test';
  const currentIp = session?.ip || '194.26.29.112';
  const currentGeo = session?.geo || 'St. Petersburg, RU (AS48282)';
  const currentProtocol = session?.protocol || 'TLS_AES_256_GCM';
  const currentRisk = session?.risk ?? 89;
  const currentState = isTerminated ? 'TERMINATED' : (session?.state || 'SUSPECTED COMPROMISE');
  const currentStateClass = isTerminated ? 'badge-blocked' : (session?.state_class || 'badge-critical');

  // Build trace rows from API events or fall back to hardcoded data
  const traceRows = events.length > 0
    ? events.map(ev => ({
        time: ev.timestamp ? ev.timestamp.split(' ').pop() || ev.timestamp : '',
        verb: ev.method || 'GET',
        path: ev.endpoint || '/',
        code: ev.action,
        codeClass: ev.risk >= 70 ? 'status-403' : ev.risk >= 40 ? 'status-429' : 'status-200',
        payload: ev.raw_payload || ev.reason || '',
        action: ev.reason || ev.action,
        risk: ev.risk,
      }))
    : defaultTraceEvents;

  return (
    <div className="page-content fade-in">
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
        <button
          onClick={() => onNavigate?.('session-monitoring')}
          className="btn btn-ghost btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
          Back to Monitored Sessions
        </button>
        <span style={{ color: 'var(--outline)' }}>/</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>{currentId}</span>
      </div>

      {/* Action Toast Notice */}
      {actionNotice && (
        <div className={`card fade-in`} style={{
          padding: 'var(--space-md)',
          marginBottom: 'var(--space-md)',
          border: actionNotice.type === 'danger' ? '1px solid var(--error)' : actionNotice.type === 'warning' ? '1px solid #F59E0B' : '1px solid var(--primary)',
          background: actionNotice.type === 'danger' ? 'rgba(147,0,10,0.2)' : 'rgba(76,215,246,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{
                color: actionNotice.type === 'danger' ? 'var(--error)' : actionNotice.type === 'warning' ? '#F59E0B' : 'var(--primary)'
              }}>
                {actionNotice.type === 'danger' ? 'gpp_bad' : 'verified_user'}
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px' }}>{actionNotice.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>{actionNotice.msg}</div>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setActionNotice(null)}>✕</button>
          </div>
        </div>
      )}

      {/* Session Header Banner */}
      <div className="card" style={{ border: isTerminated ? '1px solid rgba(255,180,171,0.5)' : '1px solid rgba(255,180,171,0.3)', background: isTerminated ? 'rgba(147,0,10,0.18)' : 'rgba(147,0,10,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <span className={`badge ${currentStateClass}`} style={{ fontSize: '9px', letterSpacing: '0.1em' }}>{currentState}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--on-surface-variant)' }}>Session ID:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>{currentId}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--outline-variant)' }}>Protocol: {currentProtocol}</span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              className="btn btn-danger"
              id="terminate-session-btn"
              onClick={handleTerminate}
              disabled={isTerminated}
              style={{ opacity: isTerminated ? 0.6 : 1 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>power_off</span>
              {isTerminated ? 'Session Quarantined' : 'Terminate Session Immediately'}
            </button>
            <button className="btn btn-ghost btn-sm" id="force-reauth-btn" onClick={handleForceReauth}>
              Force Re-Auth
            </button>
            <button className="btn btn-ghost btn-sm" id="isolate-ip-btn" onClick={handleIsolateIp}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>block</span>Isolate IP
            </button>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-md)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>Target User / Identity:</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: currentRisk >= 70 ? 'var(--error)' : 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{currentIdentity}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>location_on</span>
            Origin IP: <span style={{ color: currentRisk >= 70 ? 'var(--error)' : 'var(--on-surface)' }}>{currentIp}</span>
            <span style={{ color: 'var(--outline)', marginLeft: '8px' }}>({currentGeo})</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
          {[
            { label: 'ORIGIN / ASN', val: currentGeo },
            { label: 'CLIENT PROTOCOL', val: currentProtocol },
            { label: 'TRAFFIC VOLUME', val: session?.traffic || '428 reqs' },
            { label: 'REQUEST VELOCITY', val: session?.velocity || '14.2 req/s (Spike)' },
          ].map(f => (
            <div key={f.label} style={{ background: 'var(--surface-container)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-sm)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', letterSpacing: '0.05em', marginBottom: '4px' }}>{f.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--on-surface)', fontWeight: 500 }}>{f.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Three Analysis Cards */}
      <div className="grid-3">
        {/* Composite Threat Engine */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-row">
              <div className="card-icon danger">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>analytics</span>
              </div>
              <div className="card-title">Composite Threat Engine</div>
            </div>
            <span className="badge badge-critical" style={{ fontSize: '10px' }}>SCORE 89/100</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: '140px' }}>
            <svg viewBox="0 0 120 120" width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="48" fill="none" stroke="var(--surface-highest)" strokeWidth="12"/>
              <circle cx="60" cy="60" r="48" fill="none" stroke="var(--error)" strokeWidth="12" strokeDasharray="268.2 301.6" strokeDashoffset="0" strokeLinecap="round"/>
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--on-surface)', lineHeight: 1 }}>89</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: 'var(--error)', textTransform: 'uppercase', marginTop: '2px' }}>CRITICAL</span>
            </div>
          </div>
          {[
            { label: 'Payload Anomaly', val: 92 },
            { label: 'Velocity Spike', val: 84 },
            { label: 'Geolocation Mismatch', val: 95 },
            { label: 'Behavioral Divergence', val: 86 },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              <span style={{ color: 'var(--on-surface-variant)' }}>{item.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '60px', height: '4px', background: 'var(--surface-highest)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ width: `${item.val}%`, height: '100%', background: item.val > 90 ? 'var(--error)' : '#F59E0B', borderRadius: 'var(--radius-full)' }}></div>
                </div>
                <span style={{ color: item.val > 90 ? 'var(--error)' : '#F59E0B', fontWeight: 700 }}>{item.val}%</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 'var(--space-sm)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--outline)' }}>
            Model: NeuralAnomaly-v4 · <span style={{ color: 'var(--tertiary)' }}>Calculated 14s ago</span>
          </div>
        </div>

        {/* Credential Stuffing */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-row">
              <div className="card-icon danger">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>key_off</span>
              </div>
              <div className="card-title">Credential Stuffing Cluster</div>
            </div>
            <span className="badge badge-high" style={{ fontSize: '9px' }}>BURSTS DETECTED</span>
          </div>
          <div style={{ background: 'rgba(255,180,171,0.08)', border: '1px solid rgba(255,180,171,0.2)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#F59E0B' }}>warning</span>
              <span style={{ fontWeight: 600, color: 'var(--on-surface)', fontSize: '14px' }}>8 Failed 401s in 45 Seconds</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
              Endpoints: <span style={{ color: 'var(--primary)' }}>/api/v1/auth/token</span> & <span style={{ color: 'var(--primary)' }}>/admin/login</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xs)', marginBottom: 'var(--space-sm)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <div><div style={{ color: 'var(--outline)' }}>FAIL RATE PROFILE</div><div style={{ color: 'var(--on-surface)', fontWeight: 600, marginTop: '2px' }}>ROCKYOU_TOP10K</div></div>
            <div><div style={{ color: 'var(--outline)' }}>PATTERN MATCHED</div><div style={{ color: 'var(--error)', fontWeight: 600, marginTop: '2px' }}>DICTIONARY ATTACK</div></div>
          </div>
          {/* Mini bar chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '48px', padding: 'var(--space-xs) 0' }}>
            {[8,12,6,18,24,32,28,16,22,38].map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${(h/38)*100}%`, background: h > 25 ? 'var(--error)' : 'rgba(255,180,171,0.4)', borderRadius: '2px 2px 0 0' }}></div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xs)', marginTop: 'var(--space-sm)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <div><div style={{ color: 'var(--outline)' }}>Rate Limiting</div><div style={{ color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>CIRCUIT BREAKER TRIGGERED</div></div>
            <div><div style={{ color: 'var(--outline)' }}>Adaptive Security Posture</div><div style={{ color: '#F59E0B', fontWeight: 600, marginTop: '2px' }}>Escalated to L4 Strict</div></div>
          </div>
        </div>

        {/* Adaptive Response */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-row">
              <div className="card-icon success">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>shield_check</span>
              </div>
              <div className="card-title">Adaptive Response Engine</div>
            </div>
            <span className="badge badge-success" style={{ fontSize: '9px' }}>97.4% MATCH</span>
          </div>
          <div style={{ background: 'rgba(147,0,10,0.12)', border: '1px solid rgba(255,180,171,0.3)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.08em', marginBottom: '6px' }}>AI RULE ENGINE DIRECTIVE</div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--on-surface)', lineHeight: 1.4 }}>ENFORCE IMMEDIATE BLOCK &amp; REVOKE JWT REFRESH TOKENS</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '6px' }}>
              Autonomous threat containment confirmed SQL injection attempts immediately following credential enumeration.
            </div>
          </div>
          {[
            'Edge WAF sync complete across 18 clusters',
            'Dynamic firewall rule injected to Edge Envoy proxy',
            'Session state isolated into honeypot sandbox',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--tertiary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
              <span>{item}</span>
            </div>
          ))}
          <div style={{ background: 'var(--surface-container)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-sm)', marginTop: 'var(--space-sm)', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <span style={{ color: 'var(--outline)' }}>Policy ID: #POL-AUTH-CRIT-992</span>
            <span style={{ color: 'var(--error)', fontWeight: 700 }}>STATE: ENFORCING</span>
          </div>
        </div>
      </div>

      {/* Endpoint Access Trace Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-row">
            <div className="card-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>account_tree</span>
            </div>
            <div>
              <div className="card-title">Endpoint Access Sequence & Execution Trace</div>
              <span className="badge badge-medium" style={{ marginTop: '2px' }}>{traceRows.length} Sequential Events Captured</span>
            </div>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="dot dot-green dot-pulse" style={{ width: '6px', height: '6px' }}></span>Real-time forensic stream synced
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Verb</th>
                <th>URI Path</th>
                <th>Response Code</th>
                <th>Payload / Payload Signature</th>
                <th>Action Trace</th>
              </tr>
            </thead>
            <tbody>
              {traceRows.map((ev, i) => (
                <tr key={i} style={ev.verb === 'KILL' ? { background: 'rgba(147,0,10,0.15)' } : {}}>
                  <td>{ev.time}</td>
                  <td><span className={ev.verbClass || (ev.verb === 'POST' ? 'method-post' : ev.verb === 'GET' ? 'method-get' : ev.verb === 'PUT' ? 'method-put' : 'method-kill')}>{ev.verb}</span></td>
                  <td style={{ color: 'var(--on-surface)' }}>{ev.path}</td>
                  <td><span className={ev.codeClass || (ev.risk >= 70 ? 'status-403' : ev.risk >= 40 ? 'status-429' : 'status-200')}>{ev.code || ev.action}</span></td>
                  <td style={{ color: 'var(--on-surface-variant)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.payload}</td>
                  <td style={{ color: ev.verb === 'KILL' ? 'var(--tertiary)' : 'var(--error)', fontWeight: 600 }}>{ev.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* XAI Risk Factors */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-row">
            <div className="card-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>psychology</span>
            </div>
            <div>
              <div className="card-title">Explainable Risk Factors (XAI Decomposition)</div>
              <div className="card-subtitle">Why this session was scored 89</div>
            </div>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--outline)' }}>SOC Evaluation Mode: Educational / Academic View</span>
        </div>
        <div className="grid-4" style={{ marginTop: 'var(--space-sm)' }}>
          {riskFactors.map((f, i) => (
            <div key={i} style={{ background: 'var(--surface-container)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase' }}>WEIGHT: {f.weight}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>{f.pts}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--on-surface)', marginBottom: 'var(--space-xs)', lineHeight: 1.3 }}>{f.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)', lineHeight: 1.5, marginBottom: 'var(--space-xs)' }}>{f.desc}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--tertiary)' }}>✓ {f.rule}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
