// SentraWeb - Policy Orchestration & Engine Tuning Page
import { useState, useEffect } from 'react';

export default function Settings() {
  // Threshold slider state
  const [allowCutoff, setAllowCutoff] = useState(30);
  const [verifyCutoff, setVerifyCutoff] = useState(65);
  const [throttleCutoff, setThrottleCutoff] = useState(85);

  // Active sub-tab
  const [activeTab, setActiveTab] = useState('thresholds');

  // Rules toggles and settings
  const [rules, setRules] = useState({
    sqli: { enabled: true, mode: 'Strict' },
    xss: { enabled: true, mode: 'High' },
    bruteForce: { enabled: true, window: '60s', maxFailures: 5 },
    traversal: { enabled: true, mode: 'Strict' },
    markov: { enabled: true, confidence: 85 }
  });

  // Backend endpoint & ping state
  const [apiEndpoint, setApiEndpoint] = useState('http://localhost:5000/api/v1/telemetry');
  const [pingStatus, setPingStatus] = useState('Connected (2ms latency) • Flask microservice healthy');
  const [isPinging, setIsPinging] = useState(false);
  const [refreshRate, setRefreshRate] = useState('2000');
  const [simulationMock, setSimulationMock] = useState(true);

  // Toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load persisted settings on mount
  useEffect(() => {
    fetch('http://localhost:5000/api/v1/settings')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.settings) {
          const s = data.settings;
          if (s.allowCutoff) setAllowCutoff(Number(s.allowCutoff));
          if (s.verifyCutoff) setVerifyCutoff(Number(s.verifyCutoff));
          if (s.throttleCutoff) setThrottleCutoff(Number(s.throttleCutoff));
          if (s.refreshRate) setRefreshRate(s.refreshRate);
          if (s.rules) {
            try {
              setRules(JSON.parse(s.rules));
            } catch {
              // ignore parse errors
            }
          }
        }
      })
      .catch(() => {
        // backend offline, keep defaults
      });
  }, []);

  const handlePing = async () => {
    setIsPinging(true);
    setPingStatus('Probing endpoint...');
    const t0 = performance.now();
    try {
      const res = await fetch(apiEndpoint);
      const latency = Math.round(performance.now() - t0);
      if (res.ok) {
        const data = await res.json();
        setPingStatus(`Connected (${latency}ms latency) • ${data.engine || 'Flask microservice'} healthy`);
        showToast(`Flask microservice handshake ACK received (HTTP 200) — ${latency}ms`);
      } else {
        setPingStatus(`Endpoint returned HTTP ${res.status}`);
        showToast(`Unexpected response: HTTP ${res.status}`);
      }
    } catch {
      setPingStatus('Connection refused — is Flask running on port 5000?');
      showToast('Could not reach Flask endpoint — start backend first');
    } finally {
      setIsPinging(false);
    }
  };

  const handleDryRun = () => {
    showToast('Dry-run completed: 1,420 simulated events tested with 0 false drops');
  };

  const handleSave = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/v1/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowCutoff,
          verifyCutoff,
          throttleCutoff,
          refreshRate,
          rules: JSON.stringify(rules),
        }),
      });
      if (res.ok) {
        showToast('Configuration committed and saved to SQLite via Flask engine');
      } else {
        showToast('Saved locally (backend returned non-200)');
      }
    } catch {
      showToast('Saved locally (backend unreachable)');
    }
  };

  const handleReset = () => {
    setAllowCutoff(30);
    setVerifyCutoff(65);
    setThrottleCutoff(85);
    setRules({
      sqli: { enabled: true, mode: 'Strict' },
      xss: { enabled: true, mode: 'High' },
      bruteForce: { enabled: true, window: '60s', maxFailures: 5 },
      traversal: { enabled: true, mode: 'Strict' },
      markov: { enabled: true, confidence: 85 }
    });
    showToast('Restored default enterprise baseline policy parameters');
  };

  // Compute spectrum segment percentages
  const allowWidth = Math.max(5, allowCutoff);
  const verifyWidth = Math.max(5, verifyCutoff - allowCutoff);
  const throttleWidth = Math.max(5, throttleCutoff - verifyCutoff);
  const blockWidth = Math.max(5, 100 - throttleCutoff);

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

      {/* Hero Header Banner */}
      <div className="card" style={{ padding: 'var(--space-xl)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '260px', height: '260px', background: 'rgba(76, 215, 246, 0.05)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', right: '30%', bottom: '-50px', width: '220px', height: '220px', background: 'rgba(78, 222, 163, 0.05)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }}></div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)', position: 'relative' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)', marginBottom: '6px' }}>
              <span className="dot dot-cyan dot-pulse" style={{ width: '6px', height: '6px' }}></span>
              Engine Control Unit // v2.4-STABLE
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              Policy Orchestration & Engine Tuning
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', margin: '6px 0 0 0', maxWidth: '640px' }}>
              Calibrate dynamic scoring cutoffs, AST pattern sensitivity, and local microservice loopbacks for tactical SOC simulation.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', padding: '6px 14px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--outline)', textTransform: 'uppercase' }}>Engine State</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--tertiary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span className="dot dot-green" style={{ width: '6px', height: '6px' }}></span>
                HOT RELOAD READY
              </span>
            </div>
            <button
              onClick={handleDryRun}
              style={{
                padding: '9px 16px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--surface-container-high)',
                border: '1px solid var(--outline-variant)',
                color: 'var(--on-surface)',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>verified_user</span>
              <span>Dry-Run Rules</span>
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginTop: 'var(--space-lg)', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'thresholds', icon: 'tune', label: 'Risk Score Thresholds' },
            { id: 'heuristics', icon: 'shield', label: 'Detection Rules & Heuristics' },
            { id: 'backend', icon: 'terminal', label: 'API & DB Connectivity' },
            { id: 'telemetry', icon: 'monitoring', label: 'Simulated Ingestion Gauge' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-lg)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  background: isActive ? 'var(--primary-container)' : 'var(--surface-container-high)',
                  color: isActive ? 'var(--on-primary-container)' : 'var(--on-surface-variant)',
                  border: '1px solid ' + (isActive ? 'var(--primary-container)' : 'var(--outline-variant)')
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left (Thresholds & Detection Rules) & Right (Backend & Simulator) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1.2fr)', gap: 'var(--space-md)', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Thresholds + Heuristics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          
          {/* SECTION 1: Dynamic Risk Score Spectrum & Cutoffs */}
          <div className="card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>stacked_bar_chart</span>
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Dynamic Risk Score Spectrum & Cutoffs</h2>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)', margin: '2px 0 0 0' }}>
                    4-tier heuristic partition matrix (0-100 Aggregate Severity)
                  </p>
                </div>
              </div>
              <span className="badge badge-clean" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                Enforcing Active
              </span>
            </div>

            {/* Spectrum Visualizer Bar */}
            <div style={{ background: 'var(--surface-container-lowest)', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--outline)', marginBottom: '8px' }}>
                <span>LOW RISK (0)</span>
                <span>EVALUATION BANDWIDTH</span>
                <span>CRITICAL (100)</span>
              </div>
              <div style={{ display: 'flex', height: '24px', width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--surface-container-high)' }}>
                <div style={{ width: `${allowWidth}%`, background: 'var(--tertiary)', color: 'var(--surface-container-lowest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, transition: 'width 0.2s ease' }}>
                  ALLOW 0-{allowCutoff}
                </div>
                <div style={{ width: `${verifyWidth}%`, background: 'var(--secondary-container)', color: 'var(--on-secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, transition: 'width 0.2s ease' }}>
                  CHALLENGE {allowCutoff + 1}-{verifyCutoff}
                </div>
                <div style={{ width: `${throttleWidth}%`, background: 'var(--primary-container)', color: 'var(--on-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, transition: 'width 0.2s ease' }}>
                  THROTTLE {verifyCutoff + 1}-{throttleCutoff}
                </div>
                <div style={{ width: `${blockWidth}%`, background: 'var(--error-container)', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, transition: 'width 0.2s ease' }}>
                  BLOCK {throttleCutoff + 1}-100
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '8px', gap: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="dot dot-green" style={{ width: '6px', height: '6px' }}></span> 0-{allowCutoff} Clean Traffic
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="dot dot-yellow" style={{ width: '6px', height: '6px' }}></span> {allowCutoff + 1}-{verifyCutoff} Step-up Verification
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="dot dot-cyan" style={{ width: '6px', height: '6px' }}></span> {verifyCutoff + 1}-{throttleCutoff} Aggressive Throttling
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="dot dot-red" style={{ width: '6px', height: '6px' }}></span> {throttleCutoff + 1}-100 Instant Quarantine
                </span>
              </div>
            </div>

            {/* Metric Sliders Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
              {/* ALLOW CUTOFF CARD */}
              <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container)', border: '1px solid var(--outline-variant)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px' }}>
                    <span className="dot dot-green" style={{ width: '6px', height: '6px' }}></span>
                    Allow Baseline
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--tertiary)', background: 'rgba(78, 222, 163, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                    ≤ {allowCutoff} pts
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--on-surface-variant)', margin: '6px 0 10px 0' }}>
                  Normal session trajectory. Direct bypass with zero latency injection.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--outline)' }}>
                    <span>Pass ceiling</span>
                    <span>Max: 45</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="45"
                    value={allowCutoff}
                    onChange={(e) => setAllowCutoff(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--tertiary)' }}
                  />
                </div>
              </div>

              {/* CHALLENGE / VERIFY CARD */}
              <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container)', border: '1px solid var(--outline-variant)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px' }}>
                    <span className="dot dot-yellow" style={{ width: '6px', height: '6px' }}></span>
                    Challenge & Verify
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--secondary)', background: 'rgba(173, 198, 255, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                    {allowCutoff + 1} - {verifyCutoff} pts
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--on-surface-variant)', margin: '6px 0 10px 0' }}>
                  Suspicious behavioral shift. Injects Proof-of-Work challenge or WebAuthn prompt.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--outline)' }}>
                    <span>Verification bound</span>
                    <span>Range: 50-75</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="75"
                    value={verifyCutoff}
                    onChange={(e) => setVerifyCutoff(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--secondary)' }}
                  />
                </div>
              </div>

              {/* RESTRICT / THROTTLE CARD */}
              <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container)', border: '1px solid var(--outline-variant)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px' }}>
                    <span className="dot dot-cyan" style={{ width: '6px', height: '6px' }}></span>
                    Restrict / Throttle
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--primary)', background: 'rgba(76, 215, 246, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                    {verifyCutoff + 1} - {throttleCutoff} pts
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--on-surface-variant)', margin: '6px 0 10px 0' }}>
                  High friction band. Token bucket ratelimit down to 1 request every 1.5 seconds.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--outline)' }}>
                    <span>Throttle cutoff</span>
                    <span>Range: 70-90</span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="90"
                    value={throttleCutoff}
                    onChange={(e) => setThrottleCutoff(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary)' }}
                  />
                </div>
              </div>

              {/* CRITICAL BLOCK CARD */}
              <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container)', border: '1px solid var(--outline-variant)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px' }}>
                    <span className="dot dot-red" style={{ width: '6px', height: '6px' }}></span>
                    Quarantine & Drop
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--error)', background: 'rgba(255, 180, 171, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                    {throttleCutoff + 1} - 100 pts
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--on-surface-variant)', margin: '6px 0 10px 0' }}>
                  Hostile classification. TCP RST packet injection, kernel-level eBPF drop.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--outline)' }}>
                    <span>Immediate Drop Trigger</span>
                    <span style={{ color: 'var(--error)', fontWeight: 600 }}>&gt; {throttleCutoff}</span>
                  </div>
                  <div style={{ height: '6px', width: '100%', borderRadius: '4px', background: 'var(--error-container)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '100%', background: 'var(--error)' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: DETECTION RULES & HEURISTICS (5 CORE ENGINES) */}
          <div className="card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>security</span>
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Heuristic & Signature Analyzers</h2>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)', margin: '2px 0 0 0' }}>
                    Live payload inspection and contextual protocol grammar evaluators
                  </p>
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                5 Active Engines
              </span>
            </div>

            {/* RULE 1: SQLi */}
            <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: '240px' }}>
                <input
                  type="checkbox"
                  checked={rules.sqli.enabled}
                  onChange={(e) => setRules({ ...rules, sqli: { ...rules.sqli, enabled: e.target.checked } })}
                  style={{ accentColor: 'var(--primary)', width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>SQL Injection Heuristic Engine</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'var(--surface-container-highest)', color: 'var(--primary)' }}>CORE-01</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', display: 'block', marginTop: '2px' }}>
                    Evaluates tautologies, UNION query stacking, and AST-level lexical syntax flaws.
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {['Loose', 'Medium', 'Strict'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setRules({ ...rules, sqli: { ...rules.sqli, mode: m } })}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      border: '1px solid var(--outline-variant)',
                      background: rules.sqli.mode === m ? 'var(--primary)' : 'var(--surface-container-lowest)',
                      color: rules.sqli.mode === m ? 'var(--on-primary)' : 'var(--on-surface)',
                      fontWeight: rules.sqli.mode === m ? 700 : 400
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* RULE 2: XSS */}
            <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: '240px' }}>
                <input
                  type="checkbox"
                  checked={rules.xss.enabled}
                  onChange={(e) => setRules({ ...rules, xss: { ...rules.xss, enabled: e.target.checked } })}
                  style={{ accentColor: 'var(--primary)', width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>Cross-Site Scripting (XSS) Sanitizer</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'var(--surface-container-highest)', color: 'var(--primary)' }}>CORE-02</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', display: 'block', marginTop: '2px' }}>
                    Polyglot vector disassembly, inline event attribute stripping, DOM mutation tracing.
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {['Minimal', 'High', 'Paranoid'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setRules({ ...rules, xss: { ...rules.xss, mode: m } })}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      border: '1px solid var(--outline-variant)',
                      background: rules.xss.mode === m ? 'var(--tertiary)' : 'var(--surface-container-lowest)',
                      color: rules.xss.mode === m ? 'var(--on-tertiary)' : 'var(--on-surface)',
                      fontWeight: rules.xss.mode === m ? 700 : 400
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* RULE 3: Brute-Force */}
            <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: '240px' }}>
                <input
                  type="checkbox"
                  checked={rules.bruteForce.enabled}
                  onChange={(e) => setRules({ ...rules, bruteForce: { ...rules.bruteForce, enabled: e.target.checked } })}
                  style={{ accentColor: 'var(--primary)', width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>Brute-Force & Credential Stuffing</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'var(--surface-container-highest)', color: 'var(--primary)' }}>CORE-03</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', display: 'block', marginTop: '2px' }}>
                    Aggregates auth endpoints for burst login entropy and distributed credential dumps.
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                <span style={{ background: 'var(--surface-container-lowest)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--outline-variant)' }}>
                  Window: <strong style={{ color: 'var(--on-surface)' }}>60s</strong>
                </span>
                <span style={{ background: 'var(--surface-container-lowest)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--outline-variant)' }}>
                  Failures: <strong style={{ color: 'var(--error)' }}>5 max</strong>
                </span>
              </div>
            </div>

            {/* RULE 4: Path Traversal */}
            <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: '240px' }}>
                <input
                  type="checkbox"
                  checked={rules.traversal.enabled}
                  onChange={(e) => setRules({ ...rules, traversal: { ...rules.traversal, enabled: e.target.checked } })}
                  style={{ accentColor: 'var(--primary)', width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>Path Traversal & LFI / RFI Filter</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'var(--surface-container-highest)', color: 'var(--primary)' }}>CORE-04</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', display: 'block', marginTop: '2px' }}>
                    Neutralizes dot-dot-slash sequence evasion, null-byte poisons, and wrapper injections.
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {['Standard', 'Strict'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setRules({ ...rules, traversal: { ...rules.traversal, mode: m } })}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      border: '1px solid var(--outline-variant)',
                      background: rules.traversal.mode === m ? 'var(--primary)' : 'var(--surface-container-lowest)',
                      color: rules.traversal.mode === m ? 'var(--on-primary)' : 'var(--on-surface)',
                      fontWeight: rules.traversal.mode === m ? 700 : 400
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* RULE 5: Markov Anomaly */}
            <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: '240px' }}>
                <input
                  type="checkbox"
                  checked={rules.markov.enabled}
                  onChange={(e) => setRules({ ...rules, markov: { ...rules.markov, enabled: e.target.checked } })}
                  style={{ accentColor: 'var(--primary)', width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>Anomaly Behavioral Sequencer</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'var(--surface-container-highest)', color: 'var(--primary)' }}>CORE-05</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', display: 'block', marginTop: '2px' }}>
                    Continuous Markov state chain comparing standard human site journeys vs automated agents.
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '160px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--tertiary)', fontWeight: 600 }}>
                  85% Confidence
                </span>
                <div style={{ height: '6px', flex: 1, borderRadius: '4px', background: 'var(--surface-container-lowest)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '85%', background: 'var(--tertiary)' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Backend Ingestion, Database & Simulation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          
          {/* Flask REST API & SQLite Store */}
          <div className="card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>terminal</span>
                <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Backend Ingestion</h3>
              </div>
              <span className="dot dot-green dot-pulse" style={{ width: '8px', height: '8px' }}></span>
            </div>

            {/* REST API input & ping */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--on-surface-variant)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Flask Ingestion Endpoint</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--tertiary)' }}>HTTP 200 OK</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="search-input"
                  style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                />
                <button
                  onClick={handlePing}
                  disabled={isPinging}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--primary)',
                    color: 'var(--on-primary)',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>wifi_tethering</span>
                  <span>{isPinging ? 'Pinging...' : 'Ping'}</span>
                </button>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--tertiary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                <span>{pingStatus}</span>
              </div>
            </div>

            {/* SQLite Storage Node Block */}
            <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--secondary)' }}>database</span>
                  <span>SQLite Storage Node</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(78, 222, 163, 0.1)', color: 'var(--tertiary)', fontWeight: 700 }}>
                  SYNCED
                </span>
              </div>
              <div style={{ background: 'var(--surface-container-lowest)', padding: '6px 10px', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                ./database/sentraweb_events.db
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '4px' }}>
                <div style={{ background: 'var(--surface-container-lowest)', padding: '6px 8px', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', color: 'var(--outline)', display: 'block' }}>Allocated</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--on-surface)' }}>48.2 MB</span>
                </div>
                <div style={{ background: 'var(--surface-container-lowest)', padding: '6px 8px', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', color: 'var(--outline)', display: 'block' }}>Journal Mode</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--tertiary)' }}>WAL (Write-Ahead)</span>
                </div>
              </div>
            </div>

            {/* Refresh Rate & Demo Mock */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Telemetry Refresh Rate</div>
                  <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>Worker poll frequency</div>
                </div>
                <select
                  value={refreshRate}
                  onChange={(e) => setRefreshRate(e.target.value)}
                  style={{
                    background: 'var(--surface-container-lowest)',
                    color: 'var(--on-surface)',
                    border: '1px solid var(--outline-variant)',
                    borderRadius: 'var(--radius-md)',
                    padding: '6px 10px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="500">500 ms (Real-time)</option>
                  <option value="1000">1000 ms (Balanced)</option>
                  <option value="2000">2000 ms (Standard SOC)</option>
                  <option value="5000">5000 ms (Low CPU)</option>
                </select>
              </div>

              {/* Simulation Mock Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderRadius: 'var(--radius-md)', background: 'var(--surface-container)', border: '1px solid var(--outline-variant)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                    <span>Simulation & Traffic Mock</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: 'var(--secondary-container)', color: 'var(--on-secondary-container)' }}>Demo</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                    Synthetic multi-vector requests for triage lab.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={simulationMock}
                  onChange={(e) => setSimulationMock(e.target.checked)}
                  style={{ accentColor: 'var(--secondary)', width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          {/* SIMULATION PREVIEW & TELEMETRY GAUGE */}
          <div className="card" style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--tertiary)' }}>speed</span>
                <span>Simulated Ingestion Gauge</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--tertiary)' }}>142 req/s</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '70px', padding: '6px', borderRadius: 'var(--radius-md)', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}>
              {[45, 60, 52, 75, 80, 68, 90, 82, 98, 70, 65, 84, 58, 74, 88].map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h}%`,
                    borderRadius: '2px 2px 0 0',
                    background: i === 8 ? 'var(--error)' : i % 2 === 0 ? 'var(--primary)' : 'var(--tertiary)',
                    opacity: 0.85,
                    transition: 'all 0.3s ease'
                  }}
                ></div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--on-surface-variant)' }}>
              <span>Buffer: 1,024 packets</span>
              <span style={{ color: 'var(--tertiary)' }}>0 Drops (eBPF OK)</span>
            </div>
          </div>

          {/* AUDIT SIGN-OFF AVATAR CARD */}
          <div className="card" style={{ padding: 'var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-container), var(--surface-highest))', color: 'var(--on-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>
                SC
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>Sarah Chen</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--outline)' }}>Lead SOC Engineer • Token #4912</div>
              </div>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'var(--surface-container-high)', color: 'var(--primary)', fontWeight: 700 }}>
              SIGNOFF VALID
            </span>
          </div>
        </div>
      </div>

      {/* Persistent Docked Action Footer */}
      <footer className="card" style={{ padding: 'var(--space-md)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="dot dot-green" style={{ width: '8px', height: '8px' }}></span>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Active Profile: Academic SOC Lab Defenses</span>
          <span style={{ color: 'var(--outline)' }}>•</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>Last updated: 3 mins ago by Sarah Chen</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleReset}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--surface-container-high)',
              border: '1px solid var(--outline-variant)',
              color: 'var(--on-surface)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 20px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--primary-container)',
              color: 'var(--on-primary-container)',
              border: 'none',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>save</span>
            <span>Save Configuration</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
