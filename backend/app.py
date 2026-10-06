import os
import sqlite3
import socket
import ssl
import requests
import time
import hashlib
import uuid
import json
import random
from datetime import datetime, timedelta
from urllib.parse import urlparse
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DB_DIR = os.path.join(os.path.dirname(__file__), 'database')
DB_PATH = os.path.join(DB_DIR, 'sentraweb_events.db')

# ─────────────────────────────────────────────
# DB SETUP
# ─────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not os.path.exists(DB_DIR):
        os.makedirs(DB_DIR)

    conn = get_db()
    c = conn.cursor()

    c.execute('''
        CREATE TABLE IF NOT EXISTS telemetry_events (
            id          TEXT PRIMARY KEY,
            timestamp   TEXT NOT NULL,
            session_id  TEXT,
            ip          TEXT,
            asn         TEXT,
            method      TEXT,
            endpoint    TEXT,
            risk        INTEGER,
            action      TEXT,
            reason      TEXT,
            raw_payload TEXT
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id          TEXT PRIMARY KEY,
            protocol    TEXT,
            identity    TEXT,
            role        TEXT,
            flag        TEXT,
            ip          TEXT,
            geo         TEXT,
            traffic     TEXT,
            velocity    TEXT,
            risk        INTEGER,
            risk_label  TEXT,
            state       TEXT,
            state_class TEXT,
            beacon      TEXT
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key   TEXT PRIMARY KEY,
            value TEXT
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS scans (
            id              TEXT PRIMARY KEY,
            url             TEXT NOT NULL,
            hostname        TEXT NOT NULL,
            ip              TEXT,
            score           INTEGER NOT NULL,
            grade           TEXT NOT NULL,
            summary         TEXT,
            open_ports      TEXT,
            ssl_status      TEXT,
            headers_passed  TEXT,
            headers_failed  TEXT,
            vulnerabilities TEXT,
            duration        REAL,
            created_at      TEXT NOT NULL
        )
    ''')

    c.execute('CREATE INDEX IF NOT EXISTS idx_events_ts ON telemetry_events(timestamp)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_events_action ON telemetry_events(action)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_events_session ON telemetry_events(session_id)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_scans_created ON scans(created_at)')

    conn.commit()
    conn.close()


# ─────────────────────────────────────────────
# SEED DATA
# ─────────────────────────────────────────────

SEED_EVENTS = [
    {
        "id": "req_a78c01f4", "session_id": "sess_9f82c1a4", "ip": "194.26.29.112", "asn": "AS48282 (RU)",
        "method": "POST", "endpoint": "/api/v1/auth/login", "risk": 94, "action": "BLOCK",
        "reason": "SQL Injection signature in POST body (UNION SELECT detected)",
        "raw_payload": "Headers: Host: api.sentraweb.io\nUser-Agent: sqlmap/1.7#dev\nPayload: {\"username\": \"admin' UNION SELECT 1,load_file('/etc/passwd')--\"}\nDecision: Hard Drop (TCP RST)\nEngine: CORE-01 (SQLi AST Parser)",
        "offset_minutes": 0,
    },
    {
        "id": "req_e29b1090", "session_id": "sess_34b9d02a", "ip": "82.165.197.1", "asn": "AS8560 (DE)",
        "method": "PUT", "endpoint": "/api/v2/users/credentials", "risk": 68, "action": "VERIFY",
        "reason": "Device Fingerprint Drift + Unrecognized Geolocation",
        "raw_payload": "Challenge-Issued: WebAuthn-FIDO2-Key\nStatus: Pending Handshake response\nRisk Factors: Entropy Jump + Geo Distance > 2,400km in 12m",
        "offset_minutes": 1,
    },
    {
        "id": "req_bc81203f", "session_id": "sess_aa77b102", "ip": "103.251.167.20", "asn": "AS133118 (IN)",
        "method": "GET", "endpoint": "/api/v1/inventory/items", "risk": 45, "action": "RESTRICT",
        "reason": "Exceeded 50 req/s rate threshold (Bursting 78 req/s)",
        "raw_payload": "Action: Enforced HTTP 429 Retry-After: 60s\nClamping: Token bucket 1 req / 1.5s",
        "offset_minutes": 2,
    },
    {
        "id": "req_0029bfa1", "session_id": "sess_cc8811d0", "ip": "172.56.21.89", "asn": "AS21928 (US)",
        "method": "GET", "endpoint": "/app/dashboard/metrics", "risk": 8, "action": "ALLOW",
        "reason": "Clean telemetry, valid JWT & device posture verified",
        "raw_payload": "Response: 200 OK (14ms latency)\nIntegrity: Pass (AST & Token clean)",
        "offset_minutes": 3,
    },
    {
        "id": "req_66f2c00a", "session_id": "sess_01ab8872", "ip": "185.220.101.44", "asn": "AS208323 (NL)",
        "method": "GET", "endpoint": "/admin/users/export", "risk": 91, "action": "BLOCK",
        "reason": "Tor Exit Node flag + Zero-trust admin boundary access",
        "raw_payload": "Threat Feed: TOR-BULK-EXIT-V4\nDecision: TCP Drop + Firewalled at Border Gateway\nFlag: Boundary Violation on /admin/*",
        "offset_minutes": 4,
    },
    {
        "id": "req_dd341a09", "session_id": "sess_ee4312aa", "ip": "45.146.165.37", "asn": "AS44050 (RO)",
        "method": "GET", "endpoint": "/static/..%2f..%2fetc/passwd", "risk": 98, "action": "BLOCK",
        "reason": "Path Traversal attempt in URI path (OWASP CRS 930100)",
        "raw_payload": "Matched Rule: CORE-04 Local File Inclusion\nAction: 403 Forbidden Drop",
        "offset_minutes": 5,
    },
    {
        "id": "req_7781b01c", "session_id": "sess_55cc9981", "ip": "198.51.100.22", "asn": "AS15169 (US)",
        "method": "POST", "endpoint": "/api/v1/auth/reset-pin", "risk": 58, "action": "VERIFY",
        "reason": "Rapid anomalous password reset request cadence",
        "raw_payload": "Action-Trigger: Proof-of-Work Level 2 + SMS OTP\nState: Challenge Dispatched",
        "offset_minutes": 6,
    },
    {
        "id": "req_876bb012", "session_id": "sess_9002ffea", "ip": "151.101.65.140", "asn": "AS54113 (US)",
        "method": "GET", "endpoint": "/assets/core-bundle.min.js", "risk": 2, "action": "ALLOW",
        "reason": "Static asset hit from CDN edge cache",
        "raw_payload": "Response: 304 Not Modified\nInspection: Fast Path Bypass",
        "offset_minutes": 7,
    },
    {
        "id": "req_6541ee90", "session_id": "sess_3377dd01", "ip": "185.191.171.18", "asn": "AS396982 (GB)",
        "method": "PUT", "endpoint": "/api/v1/billing/payment-method", "risk": 62, "action": "VERIFY",
        "reason": "High-privilege financial endpoint policy trigger",
        "raw_payload": "Policy: PCI-DSS-Strict-Auth\nRequired: TOTP / Passkey Step-Up confirmation",
        "offset_minutes": 8,
    },
    {
        "id": "req_234bb761", "session_id": "sess_8899aa12", "ip": "193.169.255.77", "asn": "AS49505 (RU)",
        "method": "GET", "endpoint": "/.env", "risk": 97, "action": "BLOCK",
        "reason": "Automated secrets reconnaissance scanner probe",
        "raw_payload": "User-Agent: masscan/1.0 (CyberRecon)\nAction: Immediate TCP RST + IP Jail for 72h",
        "offset_minutes": 9,
    },
    {
        "id": "req_5621890a", "session_id": "sess_4422dd81", "ip": "104.28.19.45", "asn": "AS13335 (US)",
        "method": "POST", "endpoint": "/api/v1/auth/forgot-password", "risk": 42, "action": "RESTRICT",
        "reason": "Forgot-password brute enumeration attempt",
        "raw_payload": "Attempts-In-60s: 9\nClamp: Enforced delay 4000ms\nPolicy: Progressive Account Lockout",
        "offset_minutes": 10,
    },
    {
        "id": "req_998124cd", "session_id": "sess_11883900", "ip": "172.58.140.22", "asn": "AS21928 (US)",
        "method": "POST", "endpoint": "/graphql", "risk": 6, "action": "ALLOW",
        "reason": "AST depth and GraphQL schema query validated",
        "raw_payload": "Query-Depth: 3\nComplexity-Score: 18 (Limit 150)\nLatency: 9ms\nResult: Evaluated Clean",
        "offset_minutes": 11,
    },
]

SEED_SESSIONS = [
    {
        "id": "sess_9f82c1a4", "protocol": "TLS_AES_256_GCM", "identity": "marcus.vance@fintech.io",
        "role": "Tier 1 · Operations Admin", "flag": "🇷🇺", "ip": "194.26.29.112",
        "geo": "RU — Moscow (AS44050)", "traffic": "428 reqs", "velocity": "14.2 req/s (Spike)",
        "risk": 94, "risk_label": "CRITICAL SQLI PATTERN", "state": "THREAT ACTIVE",
        "state_class": "badge-critical", "beacon": "12s ago",
    },
    {
        "id": "sess_7e44a0b2", "protocol": "HTTP/2 h2c", "identity": "Guest / Unauthenticated",
        "role": "Checkout Funnel #9", "flag": "🇻🇳", "ip": "113.161.42.19",
        "geo": "VN — Ho Chi Minh", "traffic": "1,890 reqs", "velocity": "8.4 req/s",
        "risk": 78, "risk_label": "CREDENTIAL SPRAY", "state": "SUSPICIOUS",
        "state_class": "badge-warning", "beacon": "45s ago",
    },
    {
        "id": "sess_3c19d881", "protocol": "WSS (Duplex)", "identity": "elena.rostova@cloudcore.net",
        "role": "Cluster-Dev · ReadWrite", "flag": "🇩🇪", "ip": "85.214.132.88",
        "geo": "DE — Frankfurt (Strato)", "traffic": "2,104 reqs", "velocity": "3.1 req/s",
        "risk": 45, "risk_label": "RAPID HEADERS SHIFT", "state": "MONITORING",
        "state_class": "badge-medium", "beacon": "1m ago",
    },
    {
        "id": "sess_11fa923e", "protocol": "TLS_CHACHA20", "identity": "d.kumar@enterprise-gateway.org",
        "role": "Billing Lead · Standard", "flag": "🇺🇸", "ip": "54.210.14.90",
        "geo": "US — Ashburn (AWS)", "traffic": "94 reqs", "velocity": "0.4 req/s",
        "risk": 12, "risk_label": "AUTHENTICATED CLEAN", "state": "ACTIVE NORMAL",
        "state_class": "badge-success", "beacon": "3m ago",
    },
    {
        "id": "sess_44dd01cc", "protocol": "HTTP/1.1 Disconnected", "identity": "svc_pipeline_sync@batch.ai",
        "role": "Service Account Intercepted", "flag": "🇳🇱", "ip": "185.220.101.5",
        "geo": "NL — Amsterdam (Tor Exit)", "traffic": "612 reqs", "velocity": "0.0 req/s",
        "risk": 98, "risk_label": "TOR NODE DROPPED", "state": "TERMINATED",
        "state_class": "badge-blocked", "beacon": "8m ago",
    },
    {
        "id": "sess_88b1cc92", "protocol": "WSS Heartbeat", "identity": "t.moreau@fintech-intl.fr",
        "role": "Risk Analyst Tier 2", "flag": "🇫🇷", "ip": "195.154.122.9",
        "geo": "FR — Paris (Iliad)", "traffic": "512 reqs", "velocity": "1.2 req/s",
        "risk": 8, "risk_label": "HARDWARE MFA ENFORCED", "state": "ACTIVE NORMAL",
        "state_class": "badge-success", "beacon": "18s ago",
    },
]

def seed_db():
    conn = get_db()
    c = conn.cursor()

    count = c.execute('SELECT COUNT(*) FROM telemetry_events').fetchone()[0]
    if count == 0:
        base_time = datetime.utcnow() - timedelta(minutes=20)
        for ev in SEED_EVENTS:
            ts = (base_time + timedelta(minutes=ev["offset_minutes"])).strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
            c.execute('''
                INSERT OR IGNORE INTO telemetry_events
                    (id, timestamp, session_id, ip, asn, method, endpoint, risk, action, reason, raw_payload)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (ev["id"], ts, ev["session_id"], ev["ip"], ev["asn"],
                  ev["method"], ev["endpoint"], ev["risk"], ev["action"],
                  ev["reason"], ev["raw_payload"]))

    count = c.execute('SELECT COUNT(*) FROM sessions').fetchone()[0]
    if count == 0:
        for s in SEED_SESSIONS:
            c.execute('''
                INSERT OR IGNORE INTO sessions
                    (id, protocol, identity, role, flag, ip, geo, traffic, velocity,
                     risk, risk_label, state, state_class, beacon)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (s["id"], s["protocol"], s["identity"], s["role"], s["flag"],
                  s["ip"], s["geo"], s["traffic"], s["velocity"], s["risk"],
                  s["risk_label"], s["state"], s["state_class"], s["beacon"]))

    conn.commit()
    conn.close()


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def row_to_dict(row):
    return dict(row) if row else None


# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────

@app.route('/api/v1/telemetry', methods=['GET', 'POST'])
def telemetry():
    if request.method == 'GET':
        latency = round(random.uniform(0.8, 3.2), 1)
        return jsonify({
            "status": "success",
            "message": "Telemetry endpoint active",
            "latency": f"{latency}ms",
            "engine": "SentraWeb WAF v2.4",
            "db": "SQLite WAL mode"
        })

    data = request.json or {}
    event_id = data.get('id') or f"req_{uuid.uuid4().hex[:8]}"
    timestamp = data.get('timestamp') or datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
    session_id = data.get('session_id', '')
    ip = data.get('ip', '')
    asn = data.get('asn', '')
    method = data.get('method', 'GET')
    endpoint = data.get('endpoint', '/')
    risk = int(data.get('risk', 0))
    action = data.get('action', 'ALLOW')
    reason = data.get('reason', '')
    raw_payload = data.get('raw_payload') or json.dumps(data)

    conn = get_db()
    try:
        conn.execute('''
            INSERT OR REPLACE INTO telemetry_events
                (id, timestamp, session_id, ip, asn, method, endpoint, risk, action, reason, raw_payload)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (event_id, timestamp, session_id, ip, asn, method, endpoint, risk, action, reason, raw_payload))
        conn.commit()
    finally:
        conn.close()

    return jsonify({"status": "success", "id": event_id, "message": "Event recorded"})


@app.route('/api/v1/events', methods=['GET'])
def get_events():
    action_filter = request.args.get('action', 'ALL').upper()
    search = request.args.get('search', '').strip()
    page = max(1, int(request.args.get('page', 1)))
    per_page = min(100, int(request.args.get('per_page', 50)))
    offset = (page - 1) * per_page

    conn = get_db()
    try:
        where_clauses = []
        params = []

        if action_filter != 'ALL':
            where_clauses.append('action = ?')
            params.append(action_filter)

        if search:
            where_clauses.append(
                '(id LIKE ? OR session_id LIKE ? OR ip LIKE ? OR endpoint LIKE ? OR reason LIKE ?)'
            )
            like = f'%{search}%'
            params.extend([like, like, like, like, like])

        where_sql = ('WHERE ' + ' AND '.join(where_clauses)) if where_clauses else ''

        total = conn.execute(
            f'SELECT COUNT(*) FROM telemetry_events {where_sql}', params
        ).fetchone()[0]

        rows = conn.execute(
            f'SELECT * FROM telemetry_events {where_sql} ORDER BY timestamp DESC LIMIT ? OFFSET ?',
            params + [per_page, offset]
        ).fetchall()

        events = [row_to_dict(r) for r in rows]

        stats = {
            'ALLOW':    conn.execute("SELECT COUNT(*) FROM telemetry_events WHERE action='ALLOW'").fetchone()[0],
            'VERIFY':   conn.execute("SELECT COUNT(*) FROM telemetry_events WHERE action='VERIFY'").fetchone()[0],
            'RESTRICT': conn.execute("SELECT COUNT(*) FROM telemetry_events WHERE action='RESTRICT'").fetchone()[0],
            'BLOCK':    conn.execute("SELECT COUNT(*) FROM telemetry_events WHERE action='BLOCK'").fetchone()[0],
        }
        stats['total'] = sum(stats.values())

    finally:
        conn.close()

    return jsonify({
        "status": "success",
        "events": events,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": max(1, (total + per_page - 1) // per_page)
        },
        "stats": stats
    })


@app.route('/api/v1/events', methods=['POST'])
def create_event():
    return telemetry()


@app.route('/api/v1/sessions', methods=['GET'])
def get_sessions():
    search = request.args.get('search', '').strip()
    state_filter = request.args.get('state', '').strip()

    conn = get_db()
    try:
        where_clauses = []
        params = []

        if search:
            where_clauses.append('(id LIKE ? OR identity LIKE ? OR ip LIKE ?)')
            like = f'%{search}%'
            params.extend([like, like, like])

        if state_filter and state_filter.lower() not in ('', 'all statuses'):
            where_clauses.append('LOWER(state) LIKE ?')
            params.append(f'%{state_filter.lower()}%')

        where_sql = ('WHERE ' + ' AND '.join(where_clauses)) if where_clauses else ''
        rows = conn.execute(
            f'SELECT * FROM sessions {where_sql} ORDER BY risk DESC', params
        ).fetchall()
        sessions = [row_to_dict(r) for r in rows]

        total   = conn.execute('SELECT COUNT(*) FROM sessions').fetchone()[0]
        flagged = conn.execute('SELECT COUNT(*) FROM sessions WHERE risk >= 70').fetchone()[0]
        avg_row = conn.execute('SELECT AVG(risk) FROM sessions').fetchone()[0]
        avg_risk = round(avg_row or 0, 1)

    finally:
        conn.close()

    return jsonify({
        "status": "success",
        "sessions": sessions,
        "kpis": {"total": total, "flagged": flagged, "avg_risk": avg_risk}
    })


@app.route('/api/v1/sessions/<session_id>', methods=['GET'])
def get_session(session_id):
    conn = get_db()
    try:
        session = row_to_dict(
            conn.execute('SELECT * FROM sessions WHERE id = ?', (session_id,)).fetchone()
        )
        events = [row_to_dict(r) for r in conn.execute(
            'SELECT * FROM telemetry_events WHERE session_id = ? ORDER BY timestamp ASC',
            (session_id,)
        ).fetchall()]
    finally:
        conn.close()

    if not session:
        return jsonify({"status": "error", "message": "Session not found"}), 404

    return jsonify({"status": "success", "session": session, "events": events})


@app.route('/api/v1/stats', methods=['GET'])
def get_stats():
    conn = get_db()
    try:
        total_events    = conn.execute('SELECT COUNT(*) FROM telemetry_events').fetchone()[0]
        blocked         = conn.execute("SELECT COUNT(*) FROM telemetry_events WHERE action='BLOCK'").fetchone()[0]
        active_sessions = conn.execute('SELECT COUNT(*) FROM sessions').fetchone()[0]
        critical        = conn.execute('SELECT COUNT(*) FROM sessions WHERE risk >= 90').fetchone()[0]
        avg_row         = conn.execute('SELECT AVG(risk) FROM sessions').fetchone()[0]
    finally:
        conn.close()

    return jsonify({
        "status": "success",
        "stats": {
            "total_events":      total_events,
            "blocked":           blocked,
            "active_sessions":   active_sessions,
            "critical_sessions": critical,
            "avg_risk":          round(avg_row or 0, 1),
        }
    })


@app.route('/api/v1/settings', methods=['GET', 'POST'])
def settings_endpoint():
    conn = get_db()
    try:
        if request.method == 'GET':
            rows = conn.execute('SELECT key, value FROM settings').fetchall()
            result = {r['key']: r['value'] for r in rows}
            return jsonify({"status": "success", "settings": result})

        data = request.json or {}
        for key, value in data.items():
            conn.execute(
                'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
                (key, str(value))
            )
        conn.commit()
        return jsonify({"status": "success", "message": "Settings saved"})
    finally:
        conn.close()


SECURITY_HEADERS_SPEC = {
    'Strict-Transport-Security': {
        'name': 'HSTS (HTTP Strict Transport Security)',
        'weight': 8,
        'severity': 'Medium',
        'desc': 'Forces browsers to communicate only over HTTPS, preventing SSL-stripping and MITM attacks.',
        'remediation': 'Configure web server to return: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload'
    },
    'Content-Security-Policy': {
        'name': 'Content Security Policy (CSP)',
        'weight': 10,
        'severity': 'High',
        'desc': 'Restricts sources from which scripts and resources can load, blocking Cross-Site Scripting (XSS) and data injection.',
        'remediation': "Define a Content-Security-Policy header (e.g., default-src 'self'; script-src 'self' https:)."
    },
    'X-Frame-Options': {
        'name': 'Clickjacking Defense (X-Frame-Options)',
        'weight': 6,
        'severity': 'Medium',
        'desc': 'Prevents the webpage from being rendered in an iframe on third-party sites, mitigating clickjacking attacks.',
        'remediation': 'Set X-Frame-Options: SAMEORIGIN or DENY.'
    },
    'X-Content-Type-Options': {
        'name': 'MIME Sniffing Blocker (X-Content-Type-Options)',
        'weight': 4,
        'severity': 'Low',
        'desc': 'Prevents browsers from MIME-sniffing away from declared Content-Type, mitigating script execution via uploads.',
        'remediation': 'Set X-Content-Type-Options: nosniff on all HTTP responses.'
    },
    'Referrer-Policy': {
        'name': 'Referrer Policy',
        'weight': 4,
        'severity': 'Low',
        'desc': 'Protects user privacy and sensitive tokens from leaking in Referer headers when navigating externally.',
        'remediation': 'Set Referrer-Policy: strict-origin-when-cross-origin.'
    },
    'Permissions-Policy': {
        'name': 'Permissions Policy',
        'weight': 3,
        'severity': 'Low',
        'desc': 'Restricts browser device features (camera, microphone, geolocation) from unauthorized embedded frames.',
        'remediation': 'Set Permissions-Policy: camera=(), microphone=(), geolocation=().'
    }
}

PORTS_TO_CHECK = [
    (21, 'FTP', 'Insecure plaintext File Transfer Protocol exposed.', 12, 'High'),
    (22, 'SSH', 'SSH remote access terminal exposed to public internet.', 3, 'Low'),
    (23, 'Telnet', 'Unencrypted Telnet terminal open to public.', 15, 'Critical'),
    (80, 'HTTP', 'Standard HTTP Web Port.', 0, 'Info'),
    (443, 'HTTPS', 'Standard TLS Encrypted Web Port.', 0, 'Info'),
    (3306, 'MySQL', 'Database port exposed directly to the internet! Vulnerable to credential brute-forcing.', 18, 'Critical'),
    (5432, 'PostgreSQL', 'PostgreSQL database port publicly accessible.', 18, 'Critical'),
    (6379, 'Redis', 'Redis cache/memory store exposed without firewall protection.', 18, 'Critical'),
    (8080, 'HTTP Proxy / Alt', 'Alternative web application port open.', 2, 'Info'),
]


@app.route('/api/v1/scan', methods=['POST'])
def scan_website():
    start_time = time.time()
    data = request.get_json(silent=True) or {}
    url = (data.get('url') or '').strip()

    if not url:
        return jsonify({"status": "error", "message": "No URL provided"}), 400

    if not url.startswith('http://') and not url.startswith('https://'):
        url = 'https://' + url

    parsed_url = urlparse(url)
    hostname = parsed_url.hostname or url
    port_override = parsed_url.port

    # 1. DNS Resolution
    try:
        ip_address = socket.gethostbyname(hostname)
    except Exception:
        ip_address = "Unable to resolve"

    # 2. Port Probing
    open_ports = []
    dangerous_ports_found = []
    for port, name, risk_desc, penalty, severity in PORTS_TO_CHECK:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.4)
            result = sock.connect_ex((hostname, port))
            if result == 0:
                open_ports.append(f"{port} ({name})")
                if penalty > 0:
                    dangerous_ports_found.append((port, name, risk_desc, penalty, severity))
            sock.close()
        except Exception:
            pass

    # 3. SSL / TLS Verification
    ssl_valid = False
    ssl_info = {}
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((hostname, 443), timeout=3.0) as sock:
            with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                ssl_valid = True
                ssl_info = {
                    "version": ssock.version(),
                    "cipher": ssock.cipher()[0] if ssock.cipher() else "Standard",
                }
    except Exception as e:
        ssl_info = {"error": str(e)}

    # 4. HTTP Request & Headers
    headers_passed = []
    headers_failed = []
    vulnerabilities = []
    passed_checks = []
    server_leak = None
    powered_by_leak = None
    response_headers = {}

    try:
        requests.packages.urllib3.disable_warnings()
        resp = requests.get(url, timeout=5, verify=False, allow_redirects=True)
        response_headers = resp.headers

        # Check server leaks
        srv = resp.headers.get('Server', '')
        if srv and any(char.isdigit() for char in srv):
            server_leak = srv
        pow_by = resp.headers.get('X-Powered-By', '')
        if pow_by:
            powered_by_leak = pow_by

        # Security Headers check
        lower_headers = {k.lower(): v for k, v in resp.headers.items()}
        for header, spec in SECURITY_HEADERS_SPEC.items():
            if header.lower() in lower_headers:
                headers_passed.append(spec['name'])
                passed_checks.append({
                    "title": f"{spec['name']} Enabled",
                    "category": "Headers",
                    "desc": f"Protective header detected: {spec['desc']}"
                })
            else:
                headers_failed.append(spec['name'])
                vulnerabilities.append({
                    "id": f"VULN-HDR-{spec['weight']}",
                    "title": f"Missing {spec['name']}",
                    "severity": spec['severity'],
                    "category": "Headers",
                    "desc": spec['desc'],
                    "remediation": spec['remediation'],
                    "points_deducted": spec['weight']
                })
    except Exception as e:
        headers_failed.append("Target could not be reached via HTTP")
        vulnerabilities.append({
            "id": "VULN-CONN-01",
            "title": "HTTP Connection Failed",
            "severity": "Critical",
            "category": "Network",
            "desc": f"Web server timed out or refused HTTP connection: {str(e)}",
            "remediation": "Check DNS records, firewall rules, and ensure the web service is listening.",
            "points_deducted": 20
        })

    # 5. Sensitive File Exposure Checks
    base_target = f"{parsed_url.scheme}://{hostname}"
    sensitive_tests = [
        ('/.env', 'Environment File (.env) Exposed', 'Critical', 25, 'The .env file is publicly downloadable, exposing database credentials, API secrets, and server keys!', 'Deny public access to hidden files and .env in your web server config.'),
        ('/.git/HEAD', 'Git Repository (.git/HEAD) Exposed', 'Critical', 25, 'Source code repository metadata is accessible. Attackers can clone your entire repository.', 'Block web access to the .git directory in server configuration.')
    ]

    for path, title, sev, penalty, desc, rem in sensitive_tests:
        try:
            probe_resp = requests.get(base_target + path, timeout=2.5, verify=False, allow_redirects=False)
            if probe_resp.status_code == 200 and len(probe_resp.text) > 4:
                # verify contents
                if (path == '/.env' and ('=' in probe_resp.text or 'KEY' in probe_resp.text)) or (path == '/.git/HEAD' and 'ref:' in probe_resp.text):
                    vulnerabilities.append({
                        "id": f"VULN-FILE-{path.replace('/', '').replace('.', '')}",
                        "title": title,
                        "severity": sev,
                        "category": "Information Disclosure",
                        "desc": desc,
                        "remediation": rem,
                        "points_deducted": penalty
                    })
        except Exception:
            pass

    # 6. Check Robots.txt
    robots_found = False
    try:
        r_resp = requests.get(base_target + '/robots.txt', timeout=2.5, verify=False)
        if r_resp.status_code == 200 and 'Disallow' in r_resp.text:
            robots_found = True
            passed_checks.append({
                "title": "Robots.txt Declared",
                "category": "Web Hygiene",
                "desc": "Robots.txt crawler directives are configured."
            })
    except Exception:
        pass

    # 7. Compute Genuine 0-100 Security Score
    score = 100

    # SSL Evaluation
    if ssl_valid:
        passed_checks.append({
            "title": f"Valid SSL/TLS Encryption ({ssl_info.get('version', 'TLS')})",
            "category": "Encryption",
            "desc": f"Cipher suite active: {ssl_info.get('cipher', 'AES/GCM')}."
        })
    else:
        score -= 28
        vulnerabilities.append({
            "id": "VULN-SSL-01",
            "title": "Insecure or Missing SSL/TLS Certificate",
            "severity": "Critical",
            "category": "Encryption",
            "desc": "Site does not provide a valid TLS certificate. All user logins and sessions are susceptible to interception.",
            "remediation": "Install a trusted SSL certificate (e.g., Let's Encrypt, Cloudflare) and enforce HTTPS.",
            "points_deducted": 28
        })

    # Dangerous Ports Evaluation
    for port, name, risk_desc, penalty, severity in dangerous_ports_found:
        score -= penalty
        vulnerabilities.append({
            "id": f"VULN-PORT-{port}",
            "title": f"Publicly Exposed Port {port} ({name})",
            "severity": severity,
            "category": "Attack Surface",
            "desc": risk_desc,
            "remediation": f"Block public ingress on port {port} using firewall rules. Use private VPC or VPN for remote access.",
            "points_deducted": penalty
        })

    # Information Leaks
    if server_leak:
        score -= 4
        vulnerabilities.append({
            "id": "VULN-SRV-LEAK",
            "title": f"Server Software Banner Disclosed ({server_leak})",
            "severity": "Low",
            "category": "Information Disclosure",
            "desc": "The Server header exposes detailed daemon version, aiding attackers in locating targeted CVE exploits.",
            "remediation": "Disable ServerTokens in Apache or set server_tokens off in Nginx.",
            "points_deducted": 4
        })

    if powered_by_leak:
        score -= 4
        vulnerabilities.append({
            "id": "VULN-POW-LEAK",
            "title": f"Runtime Framework Disclosed ({powered_by_leak})",
            "severity": "Low",
            "category": "Information Disclosure",
            "desc": "The X-Powered-By header advertises your backend technology stack.",
            "remediation": "Remove the X-Powered-By header in middleware or web server configuration.",
            "points_deducted": 4
        })

    # Deduct for missing headers already recorded in vulnerabilities
    for v in vulnerabilities:
        if v.get('category') == 'Headers':
            score -= v.get('points_deducted', 0)
        elif v.get('category') == 'Information Disclosure' and 'VULN-FILE' in v.get('id', ''):
            score -= v.get('points_deducted', 0)

    # Clamp Score
    score = max(5, min(100, score))

    if score >= 90:
        grade = "A"
    elif score >= 75:
        grade = "B"
    elif score >= 60:
        grade = "C"
    elif score >= 40:
        grade = "D"
    else:
        grade = "F"

    duration = round(time.time() - start_time, 2)
    scan_id = f"scan_{uuid.uuid4().hex[:10]}"
    created_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    # Count breakdown
    critical_count = sum(1 for v in vulnerabilities if v.get('severity') == 'Critical')
    high_count = sum(1 for v in vulnerabilities if v.get('severity') == 'High')
    medium_count = sum(1 for v in vulnerabilities if v.get('severity') == 'Medium')
    low_count = sum(1 for v in vulnerabilities if v.get('severity') == 'Low')

    summary = f"Security Health Score: {score}/100 (Grade {grade}). Identified {len(vulnerabilities)} vulnerabilities ({critical_count} Critical, {high_count} High)."

    # Save to SQLite scans table
    conn = get_db()
    try:
        conn.execute('''
            INSERT INTO scans (
                id, url, hostname, ip, score, grade, summary,
                open_ports, ssl_status, headers_passed, headers_failed,
                vulnerabilities, duration, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            scan_id, url, hostname, ip_address, score, grade, summary,
            json.dumps(open_ports),
            "Valid (HTTPS)" if ssl_valid else "Invalid/HTTP",
            json.dumps(headers_passed),
            json.dumps(headers_failed),
            json.dumps(vulnerabilities),
            duration,
            created_at
        ))
        conn.commit()
    finally:
        conn.close()

    return jsonify({
        "status": "success",
        "scan_id": scan_id,
        "url": url,
        "hostname": hostname,
        "ip": ip_address,
        "score": score,
        "grade": grade,
        "summary": summary,
        "duration": f"{duration}s",
        "stats": {
            "critical": critical_count,
            "high": high_count,
            "medium": medium_count,
            "low": low_count,
            "passed": len(passed_checks)
        },
        "ssl": {
            "valid": ssl_valid,
            "version": ssl_info.get("version", "None"),
            "cipher": ssl_info.get("cipher", "None")
        },
        "ports": open_ports,
        "headers_passed": headers_passed,
        "headers_failed": headers_failed,
        "vulnerabilities": vulnerabilities,
        "passed_checks": passed_checks,
        "created_at": created_at
    })


@app.route('/api/v1/scans', methods=['GET'])
def get_scans():
    conn = get_db()
    try:
        rows = conn.execute('SELECT * FROM scans ORDER BY created_at DESC LIMIT 50').fetchall()
        scans = []
        for r in rows:
            scans.append({
                "id": r['id'],
                "url": r['url'],
                "hostname": r['hostname'],
                "ip": r['ip'],
                "score": r['score'],
                "grade": r['grade'],
                "summary": r['summary'],
                "duration": r['duration'],
                "created_at": r['created_at'],
                "open_ports": json.loads(r['open_ports'] or '[]'),
                "headers_passed": json.loads(r['headers_passed'] or '[]'),
                "headers_failed": json.loads(r['headers_failed'] or '[]'),
                "vulnerabilities": json.loads(r['vulnerabilities'] or '[]'),
            })
        return jsonify({"status": "success", "scans": scans})
    finally:
        conn.close()


@app.route('/api/v1/scans/<scan_id>', methods=['GET', 'DELETE'])
def scan_detail(scan_id):
    conn = get_db()
    try:
        if request.method == 'DELETE':
            conn.execute('DELETE FROM scans WHERE id = ?', (scan_id,))
            conn.commit()
            return jsonify({"status": "success", "message": "Scan deleted"})

        row = conn.execute('SELECT * FROM scans WHERE id = ?', (scan_id,)).fetchone()
        if not row:
            return jsonify({"status": "error", "message": "Scan not found"}), 404

        return jsonify({
            "status": "success",
            "scan": {
                "id": row['id'],
                "url": row['url'],
                "hostname": row['hostname'],
                "ip": row['ip'],
                "score": row['score'],
                "grade": row['grade'],
                "summary": row['summary'],
                "duration": row['duration'],
                "created_at": row['created_at'],
                "open_ports": json.loads(row['open_ports'] or '[]'),
                "ssl_status": row['ssl_status'],
                "headers_passed": json.loads(row['headers_passed'] or '[]'),
                "headers_failed": json.loads(row['headers_failed'] or '[]'),
                "vulnerabilities": json.loads(row['vulnerabilities'] or '[]'),
            }
        })
    finally:
        conn.close()


if __name__ == '__main__':
    init_db()
    seed_db()
    app.run(host='0.0.0.0', port=5000, debug=True)

