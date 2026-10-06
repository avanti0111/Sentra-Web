// SentraWeb - Core Application Shell
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import ThreatDetection from './pages/ThreatDetection';
import SessionMonitoring from './pages/SessionMonitoring';
import SessionDetails from './pages/SessionDetails';
import RiskAnalysis from './pages/RiskAnalysis';
import ResponseLogs from './pages/ResponseLogs';
import ActiveScanner from './pages/ActiveScanner';
import ScanHistory from './pages/ScanHistory';
import SecurityStandards from './pages/SecurityStandards';
import Settings from './pages/Settings';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedScan, setSelectedScan] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  const handleSelectScan = (scan) => {
    setSelectedScan(scan);
    setActivePage('scanner');
  };

  const handleSearchTarget = (targetUrl) => {
    setSelectedScan({ url: targetUrl });
    setActivePage('scanner');
  };

  const handleSelectSession = (sessionId) => {
    setSelectedSession(sessionId);
    setActivePage('session-details');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={setActivePage}
            onSelectSession={handleSelectSession}
          />
        );
      case 'threat-detection':
        return (
          <ThreatDetection
            onNavigate={setActivePage}
            onSelectSession={handleSelectSession}
          />
        );
      case 'sessions':
        return (
          <SessionMonitoring
            onNavigate={setActivePage}
            onSelectSession={handleSelectSession}
          />
        );
      case 'session-details':
        return (
          <SessionDetails
            sessionId={selectedSession}
            onNavigate={setActivePage}
          />
        );
      case 'risk':
        return (
          <RiskAnalysis
            onNavigate={setActivePage}
            onSelectSession={handleSelectSession}
          />
        );
      case 'logs':
        return (
          <ResponseLogs
            onNavigate={setActivePage}
            onSelectSession={handleSelectSession}
          />
        );
      case 'scanner':
        return (
          <ActiveScanner
            initialScan={selectedScan}
            onNavigateToHistory={() => setActivePage('history')}
          />
        );
      case 'history':
        return (
          <ScanHistory onSelectScan={handleSelectScan} />
        );
      case 'standards':
        return (
          <SecurityStandards />
        );
      case 'settings':
        return (
          <Settings onNavigate={setActivePage} />
        );
      default:
        return (
          <Dashboard
            onNavigate={setActivePage}
            onSelectSession={handleSelectSession}
          />
        );
    }
  };

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface)' }}>
      {/* Sidebar */}
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Topbar */}
        <Topbar
          activePage={activePage}
          onNavigate={setActivePage}
          onSearchTarget={handleSearchTarget}
        />

        {/* Dynamic Page View */}
        <main className="page-content" style={{ marginTop: 'var(--space-md)' }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
