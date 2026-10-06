// SentraWeb - Security Standards & Scoring Formulation Guide
export default function SecurityStandards() {
  const categories = [
    {
      name: 'SSL / TLS & Transport Security',
      maxPoints: 28,
      desc: 'Ensures data in transit is encrypted with modern cryptography, protecting user credentials, cookies, and tokens from interception or eavesdropping.',
      checks: [
        { item: 'HTTPS Enforcement', weight: '15 pts', desc: 'Valid SSL/TLS certificate installed and HTTP strictly redirects to HTTPS.' },
        { item: 'Modern Protocol Version', weight: '8 pts', desc: 'TLS 1.2 or TLS 1.3 negotiated without deprecated SSLv3 / TLS 1.0.' },
        { item: 'Strong Cipher Suite', weight: '5 pts', desc: 'Authenticated encryption ciphers (e.g., AES-GCM, CHACHA20-POLY1305) without NULL or export ciphers.' }
      ]
    },
    {
      name: 'HTTP Security Headers (OWASP Recommended)',
      maxPoints: 35,
      desc: 'HTTP response headers sent by the web server to activate native browser security controls against XSS, clickjacking, and content sniffing.',
      checks: [
        { item: 'Content-Security-Policy (CSP)', weight: '10 pts', desc: 'Prevents Cross-Site Scripting (XSS), script injection, and unauthorized data exfiltration.' },
        { item: 'Strict-Transport-Security (HSTS)', weight: '8 pts', desc: 'Forces browsers to only connect over HTTPS for max-age=31536000 seconds, stopping SSL-stripping.' },
        { item: 'X-Frame-Options', weight: '6 pts', desc: 'Prevents hostile sites from framing the website inside hidden iframes (Clickjacking mitigation).' },
        { item: 'X-Content-Type-Options', weight: '4 pts', desc: 'Blocks MIME-type sniffing (nosniff) so browser treats files strictly as declared.' },
        { item: 'Referrer-Policy', weight: '4 pts', desc: 'Controls referrer data leakage when visitors click outbound external links.' },
        { item: 'Permissions-Policy', weight: '3 pts', desc: 'Restricts browser device APIs (camera, geolocation, mic) from third-party iframes.' }
      ]
    },
    {
      name: 'Attack Surface & Open Port Exposure',
      maxPoints: 25,
      desc: 'Probes network ports to detect unnecessary or dangerous services exposed directly to the public internet.',
      checks: [
        { item: 'Exposed Database Ports (3306, 5432)', weight: '-18 pts', desc: 'MySQL or PostgreSQL directly reachable from public IP, exposing DB to brute-force.' },
        { item: 'Exposed In-Memory Cache (6379 Redis)', weight: '-18 pts', desc: 'Redis open without network isolation, vulnerable to unauthenticated data dumps.' },
        { item: 'Insecure Plaintext Ports (21 FTP, 23 Telnet)', weight: '-15 pts', desc: 'Credentials and payloads transmitted over unencrypted protocol streams.' },
        { item: 'Public SSH Port (22)', weight: '-3 pts', desc: 'SSH remote terminal directly exposed without firewall restriction or bastion host.' }
      ]
    },
    {
      name: 'Information Disclosure & Web Hygiene',
      maxPoints: 12,
      desc: 'Checks for server banner fingerprinting and accidental exposure of sensitive repository or environment files.',
      checks: [
        { item: 'Exposed .env / .git Repositories', weight: '-25 pts', desc: 'Critical flaw! Source code or database passwords publicly downloadable.' },
        { item: 'Server Daemon Version Disclosure', weight: '-4 pts', desc: 'Server header reveals exact software version (e.g., Apache/2.4.41), aiding targeted exploit matching.' },
        { item: 'X-Powered-By Framework Banner', weight: '-4 pts', desc: 'Reveals backend language or framework (e.g., PHP/7.4, Express), reducing attacker reconnaissance effort.' }
      ]
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)', marginBottom: '4px' }}>
          <span className="dot dot-cyan" style={{ width: '6px', height: '6px' }}></span>
          Specification Reference
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
          Security Scoring Model &amp; Standards
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', margin: '4px 0 0 0' }}>
          How the SentraWeb engine calculates the 0–100 security health score based on OWASP and CIS benchmarks.
        </p>
      </div>

      {/* Grade Scale Card */}
      <div className="card" style={{ padding: 'var(--space-lg)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--on-surface)', marginBottom: 'var(--space-md)' }}>
          Score Range &amp; Security Grade Scale
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-sm)' }}>
          {[
            { grade: 'A', score: '90 - 100', status: 'Excellent', color: 'var(--tertiary)', desc: 'Robust defense-in-depth, all key headers & TLS active' },
            { grade: 'B', score: '75 - 89', status: 'Good / Moderate', color: 'var(--primary)', desc: 'Secure connection with minor missing optional headers' },
            { grade: 'C', score: '60 - 74', status: 'Fair / At Risk', color: '#F59E0B', desc: 'Missing critical defenses like CSP, HSTS, or clickjacking' },
            { grade: 'D', score: '40 - 59', status: 'Poor Posture', color: '#F97316', desc: 'Severe weaknesses, vulnerable headers, or sensitive ports' },
            { grade: 'F', score: '0 - 39', status: 'Critical Threat', color: 'var(--error)', desc: 'Missing HTTPS, exposed databases, or credential leak' },
          ].map(g => (
            <div key={g.grade} style={{ background: 'var(--surface-container)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-sm)', borderTop: `3px solid ${g.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: g.color }}>{g.grade}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: 'var(--on-surface)' }}>{g.score}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--on-surface)', marginTop: '4px' }}>{g.status}</div>
              <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '4px', lineHeight: 1.4 }}>{g.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Deep Dives */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {categories.map(cat => (
          <div key={cat.name} className="card" style={{ padding: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--on-surface)' }}>{cat.name}</h3>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>Weight: {cat.maxPoints} pts</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-md)', lineHeight: 1.5 }}>
              {cat.desc}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {cat.checks.map(c => (
                <div key={c.item} style={{ background: 'var(--surface-container)', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-md)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--on-surface)' }}>{c.item}</div>
                    <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>{c.desc}</div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: c.weight.includes('-') ? 'var(--error)' : 'var(--tertiary)', whiteSpace: 'nowrap' }}>
                    {c.weight}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
