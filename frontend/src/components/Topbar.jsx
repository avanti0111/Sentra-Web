// SentraWeb - Top Navigation Bar
import { useState } from 'react';

const pageTitles = {
  'dashboard':        'Security Dashboard',
  'threat-detection': 'Threat Detection Engine',
  'sessions':         'Session Monitoring',
  'session-details':  'Session Deep Dive',
  'risk':             'Platform Risk Analysis',
  'logs':             'Response & Security Logs',
  'scanner':          'Website Vulnerability Scanner',
  'history':          'Audit History & Logs',
  'standards':        'Security Standards & Scoring Guide',
  'settings':         'Configuration & Policy Engine',
};

export default function Topbar({ activePage, onNavigate, onSearchTarget }) {
  const pageTitle = pageTitles[activePage] || 'SentraWeb';
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (!searchTerm.trim()) return;
      if (onSearchTarget) {
        onSearchTarget(searchTerm.trim());
      }
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      window.location.reload();
    }, 400);
  };

  // Determine if we are in the platform section or scanner section
  const platformPages = ['dashboard', 'threat-detection', 'sessions', 'session-details', 'risk', 'logs'];
  const isScanner = !platformPages.includes(activePage);

  return (
    <header className="topbar" style={{ position: 'relative' }}>
      <div className="topbar-left">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <span style={{ cursor: 'pointer' }} onClick={() => onNavigate && onNavigate('dashboard')}>SentraWeb</span>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
          <span className="current">{pageTitle}</span>
        </nav>

        {/* Search */}
        <div className="search-bar">
          <span className="material-symbols-outlined" style={{ cursor: 'pointer' }} onClick={handleSearchSubmit}>search</span>
          <input
            type="text"
            className="search-input"
            placeholder={isScanner ? 'Quick scan URL (e.g. example.com)...' : 'Search sessions, IPs, events...'}
            id="global-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchSubmit}
          />
        </div>
      </div>

      <div className="topbar-right">
        {/* Live Engine Indicator */}
        <div className="live-badge">
          <span className="dot dot-green dot-ping" style={{ width: '8px', height: '8px' }}></span>
          <span className="dot dot-green" style={{ width: '8px', height: '8px', marginLeft: '-12px' }}></span>
          {isScanner ? 'SCANNER ENGINE READY' : 'THREAT ENGINE LIVE'}
        </div>

        {/* Refresh Button */}
        <button className="topbar-btn" id="refresh-btn" onClick={handleRefresh}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '16px', transition: 'transform 0.4s ease', transform: isRefreshing ? 'rotate(360deg)' : 'none' }}
          >
            refresh
          </span>
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>

        {/* Dashboard Shortcut */}
        <button
          className="topbar-btn"
          onClick={() => onNavigate && onNavigate('dashboard')}
          style={{ background: activePage === 'dashboard' ? 'var(--surface-high)' : undefined }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>dashboard</span>
          <span>Dashboard</span>
        </button>

        {/* Scanner Shortcut */}
        <button
          className="topbar-btn"
          onClick={() => onNavigate && onNavigate('scanner')}
          style={{ background: activePage === 'scanner' ? 'var(--surface-high)' : undefined }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>travel_explore</span>
          <span>Scanner</span>
        </button>
      </div>
    </header>
  );
}
