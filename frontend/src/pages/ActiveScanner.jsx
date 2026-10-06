// SentraWeb - Complete Website Vulnerability & Security Scanner
import { useState, useEffect } from 'react';

export default function ActiveScanner({ initialScan, onNavigateToHistory }) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle'); // idle, scanning, complete, error
  const [scanProgress, setScanProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [activeTab, setActiveTab] = useState('vulnerabilities'); // vulnerabilities, attack-surface, passed, remediation
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);

  // If a scan was passed in (e.g. from history click), show it immediately
  useEffect(() => {
    if (initialScan) {
      setScanResult(initialScan);
      setUrl(initialScan.url || '');
      setStatus('complete');
    }
  }, [initialScan]);

  const handleScan = async (e, targetUrl = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const target = targetUrl || url;
    if (!target) return;

    setStatus('scanning');
    setScanProgress(5);
    setScanResult(null);

    const steps = [
      'Resolving DNS & Host...',
      'Verifying SSL/TLS Certificate & Cipher Suite...',
      'Auditing Port Exposure (HTTP, HTTPS, SSH, DBs)...',
      'Inspecting OWASP Security Headers (CSP, HSTS, XFO)...',
      'Checking for Sensitive File & Information Leaks...',
      'Calculating 0-100 Algorithmic Security Score...'
    ];

    let currentStepIdx = 0;
    setCurrentStep(steps[0]);

    const progressTimer = setInterval(() => {
      setScanProgress((prev) => {
        if (prev < 90) {
          const next = prev + 15;
          currentStepIdx = Math.min(steps.length - 1, Math.floor((next / 90) * steps.length));
          setCurrentStep(steps[currentStepIdx]);
          return next;
        }
        return prev;
      });
    }, 450);

    try {
      const res = await fetch('http://localhost:5000/api/v1/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target })
      });
      const data = await res.json();
      clearInterval(progressTimer);
      setScanProgress(100);
      setCurrentStep('Scan Complete!');

      setTimeout(() => {
        if (data.status === 'success') {
          setScanResult(data);
          setStatus('complete');
        } else {
          setStatus('error');
          setScanResult({ error: data.message || 'Scan failed to complete' });
        }
      }, 400);
    } catch (err) {
      clearInterval(progressTimer);
      setStatus('error');
      setScanResult({ error: 'Backend server unreachable. Make sure Flask is running on port 5000.' });
    }
  };

  const handleQuickTest = (sampleUrl) => {
    setUrl(sampleUrl);
    handleScan(null, sampleUrl);
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJSON = () => {
    if (!scanResult) return;
    const blob = new Blob([JSON.stringify(scanResult, null, 2)], { type: 'application/json' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `sentraweb-audit-${scanResult.hostname || 'report'}.json`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'var(--tertiary)';
    if (score >= 75) return 'var(--primary)';
    if (score >= 55) return '#F59E0B';
    return 'var(--error)';
  };

  const score = scanResult?.score ?? 0;
  const scoreColor = getScoreColor(score);
  const strokeDash = `${((Math.min(100, Math.max(0, score)) / 100) * 301.6).toFixed(1)} 301.6`;

  const vulnerabilities = scanResult?.vulnerabilities || [];
  const passedChecks = scanResult?.passed_checks || [];
  const openPorts = scanResult?.ports || scanResult?.open_ports || [];

  const filteredVulns = filterSeverity === 'ALL'
    ? vulnerabilities
    : vulnerabilities.filter(v => v.severity?.toUpperCase() === filterSeverity);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)', marginBottom: '4px' }}>
            <span className="dot dot-cyan dot-ping" style={{ width: '6px', height: '6px' }}></span>
            Real-Time Vulnerability Audit Engine
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
            Website Security &amp; Vulnerability Scanner
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', margin: '4px 0 0 0' }}>
            Enter any website or IP to perform an automated security evaluation with real 0–100 health scoring and remediation guidance.
          </p>
        </div>

        {scanResult && status === 'complete' && (
          <button
            onClick={handleExportJSON}
            className="btn btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
            Export Audit Report
          </button>
        )}
      </div>

      {/* Target URL Input Card */}
      <div className="card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <form onSubmit={handleScan} style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--outline)', fontSize: '20px' }}>
              language
            </span>
            <input
              type="text"
              required
              placeholder="Enter target website URL (e.g. example.com, google.com, http://testphp.vulnweb.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={status === 'scanning'}
              style={{
                width: '100%',
                padding: '12px 16px 12px 46px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--surface-container-lowest)',
                border: '1px solid var(--outline-variant)',
                color: 'var(--on-surface)',
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                outline: 'none',
                transition: 'border 0.2s'
              }}
            />
          </div>
          <button
            type="submit"
            disabled={status === 'scanning' || !url}
            className="btn btn-primary"
            style={{
              padding: '12px 28px',
              fontSize: '14px',
              cursor: (status === 'scanning' || !url) ? 'not-allowed' : 'pointer',
              opacity: (status === 'scanning' || !url) ? 0.7 : 1,
              whiteSpace: 'nowrap'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {status === 'scanning' ? 'hourglass_empty' : 'travel_explore'}
            </span>
            {status === 'scanning' ? 'Auditing Target...' : 'Scan Website'}
          </button>
        </form>

        {/* Preset Sample Targets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--outline)' }}>Quick Samples:</span>
          {['https://example.com', 'https://google.com', 'https://github.com', 'http://testphp.vulnweb.com'].map(sample => (
            <button
              key={sample}
              type="button"
              onClick={() => handleQuickTest(sample)}
              disabled={status === 'scanning'}
              style={{
                background: 'var(--surface-container)',
                border: '1px solid var(--outline-variant)',
                color: 'var(--primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer'
              }}
            >
              {sample.replace('https://', '').replace('http://', '')}
            </button>
          ))}
        </div>

        {/* Live Progress Bar during Scan */}
        {status === 'scanning' && (
          <div style={{ marginTop: 'var(--space-xs)', background: 'var(--surface-container)', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="dot dot-cyan dot-ping" style={{ width: '8px', height: '8px' }}></span>
                {currentStep}
              </span>
              <span style={{ color: 'var(--on-surface)', fontWeight: 700 }}>{Math.round(scanProgress)}%</span>
            </div>
            <div style={{ height: '6px', background: 'var(--surface-lowest)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ width: `${scanProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--tertiary))', transition: 'width 0.3s ease' }}></div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div style={{ padding: 'var(--space-md)', background: 'rgba(255,180,171,0.1)', border: '1px solid var(--error)', borderRadius: 'var(--radius-lg)', color: 'var(--error)', fontFamily: 'var(--font-mono)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
            {scanResult?.error || 'Target scan failed.'}
          </div>
        )}
      </div>

      {/* Results View */}
      {status === 'complete' && scanResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Hero Audit Card: Radial Score Dial + Quick Stats */}
          <div className="card" style={{ padding: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-xl)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xl)', flexWrap: 'wrap' }}>
              {/* Radial Score Gauge */}
              <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0 }}>
                <svg viewBox="0 0 120 120" width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r="48" fill="none" stroke="var(--surface-highest)" strokeWidth="12" />
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="12"
                    strokeDasharray={strokeDash}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: scoreColor, lineHeight: 1 }}>
                    {score}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--outline)', marginTop: '2px' }}>
                    OUT OF 100
                  </span>
                </div>
              </div>

              {/* Score Assessment & Target Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge ${score >= 80 ? 'badge-success' : score >= 60 ? 'badge-medium' : 'badge-critical'}`} style={{ fontSize: '12px', padding: '4px 10px' }}>
                    SECURITY GRADE {scanResult.grade}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--outline)' }}>
                    Scan Time: {scanResult.duration}
                  </span>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--on-surface)', margin: '4px 0' }}>
                  {scanResult.hostname}
                </h2>
                <div style={{ display: 'flex', gap: 'var(--space-md)', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--on-surface-variant)', flexWrap: 'wrap' }}>
                  <span>IP: <strong style={{ color: 'var(--on-surface)' }}>{scanResult.ip}</strong></span>
                  <span>•</span>
                  <span>SSL: <strong style={{ color: scanResult.ssl?.valid ? 'var(--tertiary)' : 'var(--error)' }}>{scanResult.ssl?.valid ? `${scanResult.ssl.version} Active` : 'Insecure / No HTTPS'}</strong></span>
                  <span>•</span>
                  <span>Ports Open: <strong style={{ color: 'var(--primary)' }}>{openPorts.length}</strong></span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', maxWidth: '500px', lineHeight: 1.5, margin: '4px 0 0 0' }}>
                  {scanResult.summary}
                </p>
              </div>
            </div>

            {/* Severity Pill Counts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)', minWidth: '240px' }}>
              <div style={{ background: 'var(--surface-container)', padding: '10px 14px', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--error)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--outline)', textTransform: 'uppercase' }}>Critical Risks</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--error)', fontFamily: 'var(--font-mono)' }}>{scanResult.stats?.critical ?? 0}</div>
              </div>
              <div style={{ background: 'var(--surface-container)', padding: '10px 14px', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid #F59E0B' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--outline)', textTransform: 'uppercase' }}>High Risks</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#F59E0B', fontFamily: 'var(--font-mono)' }}>{scanResult.stats?.high ?? 0}</div>
              </div>
              <div style={{ background: 'var(--surface-container)', padding: '10px 14px', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--outline)', textTransform: 'uppercase' }}>Medium / Low</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{(scanResult.stats?.medium ?? 0) + (scanResult.stats?.low ?? 0)}</div>
              </div>
              <div style={{ background: 'var(--surface-container)', padding: '10px 14px', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--tertiary)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--outline)', textTransform: 'uppercase' }}>Passed Controls</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--tertiary)', fontFamily: 'var(--font-mono)' }}>{passedChecks.length}</div>
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div style={{ display: 'flex', gap: 'var(--space-xs)', borderBottom: '1px solid var(--outline-variant)', paddingBottom: 'var(--space-xs)' }}>
            {[
              { id: 'vulnerabilities', label: `Identified Vulnerabilities (${vulnerabilities.length})`, icon: 'security_update_warning' },
              { id: 'attack-surface', label: `Open Ports & Surface (${openPorts.length})`, icon: 'lan' },
              { id: 'passed', label: `Passed Security Checks (${passedChecks.length})`, icon: 'verified' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`filter-chip ${activeTab === tab.id ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Vulnerabilities with Remediation Guide */}
          {activeTab === 'vulnerabilities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {/* Severity filter row */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--outline)', marginRight: '4px' }}>Filter Severity:</span>
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
                  <button
                    key={sev}
                    onClick={() => setFilterSeverity(sev)}
                    style={{
                      background: filterSeverity === sev ? 'var(--primary)' : 'var(--surface-container)',
                      color: filterSeverity === sev ? 'var(--on-primary)' : 'var(--on-surface)',
                      border: '1px solid var(--outline-variant)',
                      borderRadius: 'var(--radius)',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {sev}
                  </button>
                ))}
              </div>

              {filteredVulns.length === 0 ? (
                <div className="card" style={{ padding: '36px', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--tertiary)' }}>check_circle</span>
                  <h3 style={{ fontSize: '15px', color: 'var(--on-surface)', marginTop: '8px' }}>No Vulnerabilities in this Category</h3>
                  <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Target passed all security baseline checks for the selected filter.</p>
                </div>
              ) : (
                filteredVulns.map(v => {
                  const isCrit = v.severity === 'Critical';
                  const isHigh = v.severity === 'High';
                  const badgeClass = isCrit ? 'badge-critical' : isHigh ? 'badge-high' : 'badge-medium';
                  const borderColor = isCrit ? 'rgba(255,180,171,0.4)' : isHigh ? 'rgba(245,158,11,0.4)' : 'var(--outline-variant)';

                  return (
                    <div key={v.id || v.title} className="card" style={{ padding: 'var(--space-lg)', borderLeft: `4px solid ${isCrit ? 'var(--error)' : isHigh ? '#F59E0B' : 'var(--primary)'}`, border: `1px solid ${borderColor}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`badge ${badgeClass}`}>{v.severity}</span>
                          <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--on-surface)' }}>{v.title}</span>
                        </div>
                        {v.points_deducted && (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--error)', fontWeight: 700 }}>
                            -{v.points_deducted} pts
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', lineHeight: 1.5, marginBottom: 'var(--space-md)' }}>
                        {v.desc}
                      </p>

                      {v.remediation && (
                        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-md)', padding: '10px 14px', border: '1px solid var(--outline-variant)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: 'var(--tertiary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>build</span>
                              Recommended Fix / Remediation
                            </span>
                            <button
                              onClick={() => handleCopy(v.id, v.remediation)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '2px' }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                                {copiedId === v.id ? 'check' : 'content_copy'}
                              </span>
                              {copiedId === v.id ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface)', wordBreak: 'break-all' }}>
                            {v.remediation}
                          </code>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 2: Attack Surface & Ports */}
          {activeTab === 'attack-surface' && (
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--on-surface)' }}>Network Port Scan Diagnostic</h3>
                  <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', margin: '2px 0 0 0' }}>
                    Evaluated common entrypoints for open services and unwanted exposure.
                  </p>
                </div>
                <span className="badge badge-medium">{openPorts.length} Open Ports</span>
              </div>

              {openPorts.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--tertiary)', fontFamily: 'var(--font-mono)' }}>
                  No open standard ports detected from public internet.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
                  {openPorts.map((p, idx) => {
                    const isDangerous = p.includes('3306') || p.includes('5432') || p.includes('6379') || p.includes('21') || p.includes('23');
                    return (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--surface-container)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '12px',
                          border: `1px solid ${isDangerous ? 'var(--error)' : 'var(--outline-variant)'}`
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: isDangerous ? 'var(--error)' : 'var(--primary)' }}>
                            {p}
                          </span>
                          <span className={`badge ${isDangerous ? 'badge-critical' : 'badge-low'}`}>
                            {isDangerous ? 'RISK' : 'ACTIVE'}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
                          {isDangerous
                            ? 'Warning: Database or plaintext service exposed to WAN.'
                            : 'Standard application ingress gateway.'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Passed Security Checks */}
          {activeTab === 'passed' && (
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--on-surface)', marginBottom: 'var(--space-sm)' }}>
                Verified Security Defenses ({passedChecks.length})
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-md)' }}>
                Security mechanisms and protective headers correctly implemented by the web application.
              </p>

              {passedChecks.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--outline)' }}>
                  No passed security checks found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {passedChecks.map((check, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--surface-container)',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--tertiary)' }}>verified</span>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--on-surface)' }}>{check.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>{check.desc}</div>
                        </div>
                      </div>
                      <span className="badge badge-success" style={{ fontSize: '10px' }}>PASSED</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
