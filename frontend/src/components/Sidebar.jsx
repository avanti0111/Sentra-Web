// SentraWeb - Full Navigation Sidebar
import ShieldLogo from './ShieldLogo';

const platformNav = [
  { path: 'dashboard',        icon: 'dashboard',         label: 'Dashboard' },
  { path: 'threat-detection', icon: 'security',          label: 'Threat Detection' },
  { path: 'sessions',         icon: 'manage_accounts',   label: 'Session Monitor' },
  { path: 'risk',             icon: 'analytics',         label: 'Risk Analysis' },
  { path: 'logs',             icon: 'receipt_long',      label: 'Response Logs' },
];

const scannerNav = [
  { path: 'scanner',   icon: 'travel_explore', label: 'Vulnerability Scanner' },
  { path: 'history',   icon: 'history',        label: 'Audit History' },
  { path: 'standards', icon: 'verified_user',  label: 'Security Standards' },
  { path: 'settings',  icon: 'tune',           label: 'Configuration' },
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {/* Logo */}
        <div className="sidebar-logo">
          <ShieldLogo size={32} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="logo-title">SentraWeb</span>
            <span className="logo-badge">Security Platform</span>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ padding: 'var(--space-sm) var(--space-md)', overflowY: 'auto', flex: 1 }}>
          {/* Platform Section */}
          <div className="nav-section-label">Security Platform</div>
          <nav className="sidebar-nav" style={{ marginTop: 'var(--space-xs)', marginBottom: 'var(--space-md)' }}>
            {platformNav.map((item) => (
              <button
                key={item.path}
                className={`nav-item ${activePage === item.path ? 'active' : ''}`}
                onClick={() => onNavigate(item.path)}
                aria-current={activePage === item.path ? 'page' : undefined}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Scanner Section */}
          <div className="nav-section-label">Vulnerability Scanner</div>
          <nav className="sidebar-nav" style={{ marginTop: 'var(--space-xs)' }}>
            {scannerNav.map((item) => (
              <button
                key={item.path}
                className={`nav-item ${activePage === item.path ? 'active' : ''}`}
                onClick={() => onNavigate(item.path)}
                aria-current={activePage === item.path ? 'page' : undefined}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Engine Status Footer */}
      <div className="engine-status">
        <div className="engine-status-row">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>Platform Engine</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--tertiary)' }}>
            <span className="dot dot-green dot-pulse" style={{ width: '6px', height: '6px' }}></span>
            Active
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>Threat Detection Online</div>
        <div className="engine-status-row" style={{ paddingTop: 'var(--space-xs)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--outline)' }}>
            <span className="dot dot-green" style={{ width: '6px', height: '6px' }}></span>
            Flask Backend
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--tertiary)' }}>ONLINE</span>
        </div>
        <div className="engine-status-row">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>DB: SQLite</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>PORT: 5000</span>
        </div>
      </div>
    </aside>
  );
}
