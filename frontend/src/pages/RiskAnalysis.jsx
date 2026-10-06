import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const riskTimeData = [
  { time: '00:00 UTC', riskScore: 18, flaggedIngress: 12 },
  { time: '03:00 UTC', riskScore: 20, flaggedIngress: 18 },
  { time: '04:15 UTC', riskScore: 74, flaggedIngress: 88, label: '04:15 UTC - Distributed Credential Spraying (74.2 Score)' },
  { time: '06:00 UTC', riskScore: 32, flaggedIngress: 42 },
  { time: '09:00 UTC', riskScore: 24, flaggedIngress: 28 },
  { time: '12:00 UTC', riskScore: 22, flaggedIngress: 22 },
  { time: '14:30 UTC', riskScore: 50, flaggedIngress: 60, label: '14:30 UTC - ASN Route Hijack Heuristic (49.8 Score)' },
  { time: '15:00 UTC', riskScore: 28, flaggedIngress: 35 },
  { time: '18:00 UTC', riskScore: 22, flaggedIngress: 20 },
  { time: '21:00 UTC', riskScore: 19, flaggedIngress: 14 },
  { time: '24:00 UTC', riskScore: 17, flaggedIngress: 10 },
];

const riskFactorsTable = [
  { signal: 'SQL Injection Payload', code: 'REQ_PAYLOAD_AST_01', metric: 'UNION SELECT 1, @@version- in query param', rule: 'Tainted Abstract Syntax Tree match: score += 85.0', delta: '+85.0', impact: '+29.75 pt', session: 'sess_9f82c1a4' },
  { signal: 'Impossible Travel Velocity', code: 'GEO_SPHERICAL_ARC_04', metric: 'London (GB) → Singapore (SG) in 12 min (∆: 10,841 km)', rule: 'Spherical haversine speed = 54,205 km/h (>900 km/h cap)', delta: '+92.0', impact: '+23.00 pt', session: 'sess_34b9d02a' },
  { signal: 'Markov Funnel Skip', code: 'BEH_MARKOV_STATE_02', metric: 'Direct POST /api/v2/settle without GET /checkout', rule: 'Transition probability Pr = 0.0004 < ε threshold', delta: '+45.0', impact: '+13.50 pt', session: 'sess_aa77b102' },
  { signal: 'Cipher Anomaly', code: 'REQ_TLS_JA4_09', metric: 'TLS 1.1 handshake offered alongside Chrome 124 UA', rule: 'JA4 fingerprint mismatch with declared client stack', delta: '+30.0', impact: '+10.50 pt', session: 'sess_12f8a9e0' },
  { signal: 'Longitudinal Trust Credit', code: 'TRUST_HISTORICAL_01', metric: 'Corporate SSO SAML token active for 180+ days', rule: 'Verified resident device ID & zero historic incidents', delta: '-50.0', impact: '-5.00 pt', session: 'sess_e91142ab' },
];

export default function RiskAnalysis({ onNavigate, onSelectSession }) {
  const [apiStats, setApiStats] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/v1/stats')
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') setApiStats(d.stats);
      })
      .catch(() => {});
  }, []);

  const currentRisk = apiStats?.avg_risk ?? 24.8;
  const strokeDash = `${(Math.min(100, currentRisk) / 100 * 301.6).toFixed(1)} 301.6`;
  const riskColor = currentRisk > 70 ? 'var(--error)' : currentRisk > 45 ? '#F59E0B' : 'var(--tertiary)';

  return (
    <div className="page-content fade-in">
      {/* Hero - Platform Dynamic Risk Index */}
      <div className="page-banner">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.08em', border: '1px solid rgba(76,215,246,0.3)', padding: '2px 8px', borderRadius: 'var(--radius)' }}>REAL-TIME INFERENCE ENGINE</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--outline)' }}>• Epoch 14,892.42 · Latency 4.2ms</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
            <div style={{ flex: '1', minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: '6px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--on-surface)' }}>Platform Dynamic Risk Index</h1>
                <span className={`badge ${currentRisk > 60 ? 'badge-high' : 'badge-low'}`}>
                  {currentRisk > 60 ? 'ELEVATED THREAT VECTOR' : 'LOW TO MODERATE THREAT LEVEL'}
                </span>
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--on-surface-variant)', lineHeight: 1.6, maxWidth: '560px' }}>
                Dynamic context-aware threat scoring evaluating continuous ingress telemetry through distributed Markov behavioral models and contextual telemetry feeds.
              </p>
              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                {[
                  { label: 'INGRESS EVALUATED', val: apiStats ? `${apiStats.total_events} req` : '1,842,910 req', trend: '+14.2% vs baseline' },
                  { label: 'ACTIVE SESSIONS', val: apiStats ? `${apiStats.active_sessions} tracked` : '18,492 live req', sub: '99.1% verified' },
                  { label: 'MITIGATED BURSTS', val: apiStats ? `${apiStats.blocked} anomalies` : '418 anomalies', sub: 'Automated drop' },
                  { label: 'FALSE POSITIVE RATE', val: '0.0031%', trend: '-0.0004% ∆' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--surface-container)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-sm)' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', letterSpacing: '0.05em', marginBottom: '4px' }}>{s.label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--on-surface)' }}>{s.val}</div>
                    {(s.trend || s.sub) && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--tertiary)', marginTop: '2px' }}>{s.trend || s.sub}</div>}
                  </div>
                ))}
              </div>
            </div>
            {/* Score Dial */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                <svg viewBox="0 0 120 120" width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r="48" fill="none" stroke="var(--surface-highest)" strokeWidth="12"/>
                  <circle cx="60" cy="60" r="48" fill="none" stroke={riskColor} strokeWidth="12" strokeDasharray={strokeDash} strokeDashoffset="0" strokeLinecap="round"/>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--outline)', textTransform: 'uppercase' }}>SCORE</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--on-surface)', lineHeight: 1 }}>{currentRisk}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--outline)' }}>/ 100</span>
                </div>
              </div>
              {/* Model weights */}
              <div style={{ background: 'var(--surface-container)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-sm)', minWidth: '180px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', marginBottom: 'var(--space-xs)' }}>MODEL VECTOR WEIGHTS</div>
                {[
                  { label: 'Request Payload (W₁)', val: '35%', color: 'var(--primary)' },
                  { label: 'Behavioral Deviations (W₂)', val: '30%', color: 'var(--tertiary)' },
                  { label: 'Contextual Signals (W₃)', val: '25%', color: '#F59E0B' },
                  { label: 'Historical Trust (W₄)', val: '10%', color: 'var(--outline)' },
                ].map(w => (
                  <div key={w.label} style={{ marginBottom: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px', marginBottom: '2px' }}>
                      <span style={{ color: 'var(--on-surface-variant)' }}>{w.label}</span>
                      <span style={{ color: w.color, fontWeight: 700 }}>{w.val}</span>
                    </div>
                    <div style={{ height: '3px', background: 'var(--surface-highest)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{ width: w.val, height: '100%', background: w.color, borderRadius: 'var(--radius-full)' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Three Pillar Inspection Matrix */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-row">
            <div className="card-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>hub</span>
            </div>
            <div className="card-title">Three-Pillar Continuous Inspection Matrix</div>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--outline)' }}>Inference Mode: Async Parallel Pipelining</span>
        </div>
        <div className="grid-3" style={{ marginTop: 'var(--space-sm)' }}>
          {/* Pillar I */}
          <div style={{ background: 'var(--surface-container)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', letterSpacing: '0.05em' }}>PILLAR I</div>
                <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--on-surface)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>code</span>Request-Level Risk
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: 'var(--primary)' }}>18.2<span style={{ fontSize: '11px', color: 'var(--outline)' }}>/100</span></div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--tertiary)', fontWeight: 700 }}>LOW VECTOR</div>
              </div>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>Deterministic pattern validation, cryptographic header consistency, and thermodynamic payload entropy metrics.</p>
            {[
              { label: 'WAF Pattern Matrix', val: '0.04 DETECT', color: 'var(--tertiary)', sub: 'Regex AST evaluation for SQLi, XSS, RCE, SSRF, & JNDI syntax trees.' },
              { label: 'HTTP Sanitization & Header Audit', val: 'PASS 99.8%', color: 'var(--tertiary)', sub: 'Evaluates missing Accept-Encoding, HTTP/2 pseudo-header disorder, & cipher suite downgrades.' },
              { label: 'Payload Shannon Entropy', val: 'H = 4.21 bit', color: '#F59E0B', sub: 'Detects obfuscated binaries, base64 webshell injections, and polyglot wrappers via byte dispersal.' },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--surface-high)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--on-surface)' }}>• {item.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: item.color }}>{item.val}</span>
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Pillar II */}
          <div style={{ background: 'var(--surface-container)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', letterSpacing: '0.05em' }}>PILLAR II</div>
                <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--on-surface)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#F59E0B' }}>psychology_alt</span>Behaviour-Based Risk
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: '#F59E0B' }}>34.5<span style={{ fontSize: '11px', color: 'var(--outline)' }}>/100</span></div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#F59E0B', fontWeight: 700 }}>ELEVATED FLUCTUATIONS</div>
              </div>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>First-order Markov navigation transitions, inter-request arrival cadence, and synthetic concurrency flags.</p>
            {[
              { label: 'Markov Transition State Model', val: 'Pr(s\'|s) < 0.002', sub: 'Identifies checkout & auth pipeline skips (e.g., immediate POST /api/v1/charge without token generation).' },
              { label: 'Velocity & Burst Poisson Decay', val: '∆ = 1.48 req/s', sub: 'Leaky bucket inter-arrival variance distinguishing scripted scraper pulses from human interactions.' },
              { label: 'Rapid Multi-Tab Probing', val: '14 SESSIONS', sub: 'Concurrent HTTP pipelining probing endpoints with uniform cookies across asymmetric TCP streams.' },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--surface-high)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--on-surface)' }}>• {item.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: '#F59E0B' }}>{item.val}</span>
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Pillar III */}
          <div style={{ background: 'var(--surface-container)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', letterSpacing: '0.05em' }}>PILLAR III</div>
                <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--on-surface)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--tertiary)' }}>globe</span>Context-Based Risk
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: 'var(--tertiary)' }}>21.0<span style={{ fontSize: '11px', color: 'var(--outline)' }}>/100</span></div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--tertiary)', fontWeight: 700 }}>NORMAL ENVIRONS</div>
              </div>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>Cross-referenced IP reputation lists, canvas/WebGL fingerprint uniqueness, and spatio-temporal impossible travel.</p>
            {[
              { label: 'IP Reputation & Autonomous System', badge: 'Spamhaus Clean', sub: 'BGP route analysis, Tor Exit node identification, Datacenter (AWS/Hetzner) vs Residential ISP ASN mapping.' },
              { label: 'Hardware & Canvas Fingerprint', badge: 'FP MATCH 97.4%', sub: 'WebGL unmasked renderer (NVIDIA vs SwiftShader Emulation) mismatch against claimed Navigator User-Agent.' },
              { label: 'Impossible Travel Intercept', badge: '1 FLAG INTERCEPT', sub: 'Session migration between geo-coordinates requiring supersonic speed (>900 km/h threshold).' },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--surface-high)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--on-surface)' }}>• {item.label}</span>
                  <span className="badge badge-low" style={{ fontSize: '9px' }}>{item.badge}</span>
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 24h Composite Risk Chart */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-row">
            <div className="card-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>show_chart</span>
            </div>
            <div>
              <div className="card-title">24-Hour Composite Risk & Volume Correlation</div>
              <div className="card-subtitle">Dual-axis plotting: Composite Risk Index (0-100) vs Hourly Flagged Anomaly Ingress.</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-md)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            {[
              { color: 'var(--primary)', label: 'Composite Risk Score' },
              { color: '#F59E0B', label: 'Flagged Ingress (k req/hr)' },
              { color: 'var(--error)', label: 'Threat Anomaly Tripped' },
            ].map(l => (
              <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--on-surface-variant)' }}>
                <span style={{ width: '10px', height: '4px', background: l.color, borderRadius: '2px', display: 'inline-block' }}></span>{l.label}
              </span>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={riskTimeData} margin={{ top: 20, right: 20, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4cd7f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#4cd7f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="flagGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,57,74,0.4)" vertical={false}/>
            <XAxis dataKey="time" tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--outline)' }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--outline)' }} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{ background: 'var(--surface-high)', border: '1px solid var(--outline-variant)', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}/>
            <ReferenceLine y={50} stroke="rgba(255,180,171,0.3)" strokeDasharray="4 4"/>
            <Area type="monotone" dataKey="riskScore" name="Risk Score" stroke="#4cd7f6" strokeWidth={2.5} fill="url(#riskGrad)" dot={false}/>
            <Area type="monotone" dataKey="flaggedIngress" name="Flagged Ingress" stroke="#F59E0B" strokeWidth={2} fill="url(#flagGrad)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Explainable Risk Factors Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-row">
            <div className="card-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>grid_view</span>
            </div>
            <div>
              <div className="card-title">Explainable Risk Factors Formulation Matrix</div>
              <div className="card-subtitle" style={{ marginTop: '2px' }}>
                Model formula: <span style={{ color: 'var(--primary)' }}>Composite Score = Σ (Wᵢ × PillarScoreᵢ) + BaselineOffset - HistoricalCredit</span>
              </div>
            </div>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--outline)' }}>SOC Evaluation Mode: Educational / Academic View</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Signal Key / Factor</th>
                <th>Observed Telemetry Metric</th>
                <th>Engine Calculation Rule</th>
                <th>Dynamic Delta</th>
                <th>Weighted Impact</th>
                <th>Target Session</th>
              </tr>
            </thead>
            <tbody>
              {riskFactorsTable.map((row, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ color: 'var(--on-surface)', fontWeight: 600 }}>{row.signal}</div>
                    <div style={{ color: 'var(--outline)', fontSize: '10px', marginTop: '2px' }}>{row.code}</div>
                  </td>
                  <td style={{ color: 'var(--on-surface-variant)', maxWidth: '180px', lineHeight: 1.4 }}>{row.metric}</td>
                  <td style={{ color: 'var(--on-surface-variant)', maxWidth: '180px', lineHeight: 1.4 }}>{row.rule}</td>
                  <td style={{ color: parseFloat(row.delta) > 0 ? 'var(--error)' : 'var(--tertiary)', fontWeight: 700 }}>{row.delta}</td>
                  <td style={{ color: parseFloat(row.impact) > 0 ? 'var(--error)' : 'var(--tertiary)', fontWeight: 700 }}>{row.impact}</td>
                  <td>
                    <span
                      style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => {
                        if (onSelectSession) onSelectSession(row.session);
                        if (onNavigate) onNavigate('session-details');
                      }}
                      title="Inspect session"
                    >
                      {row.session}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 'var(--space-sm)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)', padding: 'var(--space-xs)', background: 'rgba(76,215,246,0.04)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(76,215,246,0.1)' }}>
          Project Architecture Evaluation: Normalized score bounded [0.0 - 100.0]. Action triggers: &gt;50 Step-up MFA, &gt;75 Captcha, &gt;85 Terminate Session.
          <span style={{ marginLeft: 'var(--space-md)', color: 'var(--tertiary)' }}>Model Version: 2.4.1b (Inference Time: 3.4ms)</span>
        </div>
      </div>
    </div>
  );
}
