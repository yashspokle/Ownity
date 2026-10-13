import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

async function extractPropertyData(fileData, submitted) {
  const response = await fetch(`${API_BASE}/api/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileData, submitted }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "AI extraction failed.");
  return payload;
}

// ─── MOCK DATA ──────────────────────────────────────────────────────────────
const MOCK_USERS = [
  { id: 1, name: "Arjun Sharma", email: "user@ownity.in", password: "user123", role: "user", walletAddress: "0x71C7...3E4F" },
  { id: 2, name: "Priya Mehra", email: "gov@ownity.in", password: "gov123", role: "government", walletAddress: "0xA3B2...7D1C" },
];

const MOCK_DOCS = []; // Start with no fabricated property records.

// ─── STATUS CONFIG ──────────────────────────────────────────────────────────
const STATUS = {
  pending:        { label: "Pending",           color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  icon: "⏳" },
  verified:       { label: "Gov. Verified",      color: "#10B981", bg: "rgba(16,185,129,0.12)", icon: "✅" },
  tehsilRequired: { label: "Tehsil Required",    color: "#6366F1", bg: "rgba(99,102,241,0.12)", icon: "🏛️" },
  rejected:       { label: "Rejected",           color: "#EF4444", bg: "rgba(239,68,68,0.12)",  icon: "❌" },
};

// ─── GLOBAL STYLES ──────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: 'Inter', sans-serif; background: #F5F7FA; color: #172B3A; }
    html, body, #root { width: 100%; min-height: 100%; }
    body { min-height: 100vh; overflow-x: hidden; }
    h1, h2, h3, h4, h5, h6 { font-family: 'Inter', sans-serif !important; color: #172B3A; letter-spacing: -0.025em; }
    p { color: #64748B; }
    input, select, textarea { background: #FFFFFF !important; color: #172B3A !important; border-color: #CBD5E1 !important; }
    .card { background: #FFFFFF !important; color: #172B3A !important; border: 1px solid #E2E8F0 !important; border-radius: 12px; box-shadow: 0 2px 8px rgba(37,43,51,0.04); backdrop-filter: none !important; }
    .card-hover:hover { border-color: #CBD5E1 !important; box-shadow: 0 8px 24px rgba(37,43,51,0.07); }
    .gradient-text { background: none !important; color: #17324D !important; -webkit-text-fill-color: #17324D !important; }
    .gradient-text-gold { background: none !important; color: #8A6A2F !important; -webkit-text-fill-color: #8A6A2F !important; }
    .grid-bg { background-image: none !important; }
    .btn { font-family: 'Inter', sans-serif !important; }
    ::-webkit-scrollbar-track { background: #F5F7FA; } ::-webkit-scrollbar-thumb { background: #94A3B8; border-radius: 4px; }
    ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: #EEF2F6; }
    ::-webkit-scrollbar-thumb { background: #94A3B8; border-radius: 4px; }

    @keyframes fadeUp   { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn   { from { opacity:0; }                             to { opacity:1; } }
    @keyframes pulse    { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
    @keyframes spin     { to { transform:rotate(360deg); } }
    @keyframes shimmer  { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
    @keyframes float    { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-8px); } }
    @keyframes gradFlow { 0%,100% { background-position:0% 50%; } 50% { background-position:100% 50%; } }
    @keyframes glow     { 0%,100% { box-shadow:0 0 20px rgba(52,75,99,0.18); } 50% { box-shadow:0 0 40px rgba(52,75,99,0.25); } }
    @keyframes scanline { 0% { top:-10%; } 100% { top:110%; } }

    .fade-up    { animation: fadeUp 0.5s ease forwards; }
    .fade-in    { animation: fadeIn 0.4s ease forwards; }
    .float-anim { animation: float 4s ease-in-out infinite; }
    .spin-anim  { animation: spin  1s linear infinite; }
    .glow-anim  { animation: glow  2s ease-in-out infinite; }

    .btn { cursor:pointer; border:none; outline:none; font-family:'Inter',sans-serif; transition:background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease, transform 0.16s ease; }
    .btn:active { transform:translateY(1px); }
    .btn:focus-visible { outline: 3px solid rgba(15,118,110,0.28); outline-offset: 2px; }
    button { letter-spacing: 0; }
    @media (max-width: 900px) { aside { width: 76px !important; } aside nav button { justify-content: center !important; font-size: 0 !important; } aside nav button span { font-size: 18px !important; } main { margin-left: 76px !important; padding: 24px 18px !important; } }
    @media (max-width: 620px) { main { padding: 18px 12px !important; } table { min-width: 720px; } .card { overflow-x: auto; } }
    input,select,textarea { font-family:'Inter',sans-serif; }
    input:focus,select:focus,textarea:focus { outline:none; }

    .card { background:#FFFFFF; border:1px solid #E2E8F0; border-radius:16px; backdrop-filter:blur(12px); }
    .card-hover { transition:all 0.25s; }
    .card-hover:hover { border-color:rgba(52,75,99,0.25); transform:translateY(-2px); box-shadow:0 8px 32px rgba(52,75,99,0.08); }

    .grid-bg { background-image:linear-gradient(rgba(56,189,248,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,0.05) 1px,transparent 1px); background-size:48px 48px; }

    .status-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:100px; font-size:12px; font-weight:500; white-space:nowrap; }
    .gradient-text { background:#17324D; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
    .gradient-text-gold { background:linear-gradient(135deg,#F59E0B,#FCD34D); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  `}</style>
);


const BrandMark = ({ size = 38 }) => (
  <span aria-hidden="true" style={{ width: size, height: size, flex: `0 0 ${size}px`, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: Math.max(8, size * 0.22), background: "#17324D", border: "1px solid #254762" }}>
    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 14.5 16 5l12 9.5" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.5 13.5V27h17V13.5" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 27v-7h6v7" stroke="#5EEAD4" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 8.2h3.2v4.2" stroke="#5EEAD4" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </span>
);

// ─── MINI COMPONENTS ────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span className="status-badge" style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}33` }}>
      {s.icon} {s.label}
    </span>
  );
};

const Loader = () => (
  <div style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#17324D", borderRadius: "50%" }} className="spin-anim" />
);

const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  const colors = { success: "#10B981", error: "#EF4444", info: "#17324D" };
  return (
    <div style={{ position: "fixed", bottom: 32, right: 32, zIndex: 9999, background: "#FFFFFF", border: `1px solid ${colors[type] || colors.info}44`, borderLeft: `3px solid ${colors[type] || colors.info}`, borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", animation: "fadeUp 0.3s ease", minWidth: 280 }}>
      <span style={{ fontSize: 18 }}>{type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"}</span>
      <span style={{ fontSize: 14, color: "#172B3A" }}>{msg}</span>
      <button onClick={onClose} className="btn" style={{ marginLeft: "auto", color: "#64748B", fontSize: 18, lineHeight: 1 }}>×</button>
    </div>
  );
};

// ─── NAV / SIDEBAR ──────────────────────────────────────────────────────────
const Sidebar = ({ page, setPage, user, onLogout }) => {
  const navItems = user?.role === "government"
    ? [
        { id: "gov-dashboard", icon: "🏛️", label: "Gov Dashboard" },
        { id: "all-documents", icon: "📋", label: "All Documents" },
        { id: "about",         icon: "ℹ️",  label: "About" },
      ]
    : [
        { id: "dashboard",  icon: "📊", label: "Dashboard"    },
        { id: "upload",     icon: "⬆️", label: "Upload Doc"   },
        { id: "documents",  icon: "📄", label: "My Documents" },
        { id: "status",     icon: "🔍", label: "Track Status" },
        { id: "about",      icon: "ℹ️", label: "About"        },
      ];

  return (
    <aside style={{ width: 240, background: "#FFFFFF", borderRight: "1px solid #E2E8F0", display: "flex", flexDirection: "column", height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 100, backdropFilter: "blur(20px)" }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px", borderBottom: "1px solid #E2E8F0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BrandMark size={38} />
          <div>
            <div style={{ fontFamily: "Inter", fontWeight: 800, fontSize: 20, color: "#17324D" }}>OWNITY</div>
            <div style={{ fontSize: 10, color: "#64748B", letterSpacing: "0.1em" }}>PROPERTY VERIFY</div>
          </div>
        </div>
      </div>

      {/* User */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#17324D", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter", fontWeight: 700, fontSize: 14 }}>
            {user?.name?.[0] || "U"}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: user?.role === "government" ? "#0F766E" : "#17324D" }}>
              {user?.role === "government" ? "🏛️ Gov Official" : "👤 Citizen"}
            </div>
          </div>
        </div>
        {user?.walletAddress && (
          <div style={{ marginTop: 10, background: "rgba(52,75,99,0.04)", border: "1px solid rgba(52,75,99,0.08)", borderRadius: 8, padding: "6px 10px", fontSize: 10, color: "#17324D", fontFamily: "monospace" }}>
            🔗 {user.walletAddress}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 12px", overflowY: "auto" }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)} className="btn"
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 10, marginBottom: 4, textAlign: "left", fontSize: 14, fontWeight: 500,
              background: page === item.id ? "linear-gradient(135deg,rgba(52,75,99,0.08),rgba(82,107,131,0.08))" : "transparent",
              color: page === item.id ? "#17324D" : "#64748B",
              border: page === item.id ? "1px solid rgba(52,75,99,0.18)" : "1px solid transparent",
              transition: "all 0.2s" }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: "16px 12px", borderTop: "1px solid #E2E8F0" }}>
        <button onClick={onLogout} className="btn" style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
          Sign out
        </button>
      </div>
    </aside>
  );
};

// ─── LANDING PAGE ────────────────────────────────────────────────────────────
const LandingPage = ({ onLogin, onConnect, walletAddress }) => {
  const features = [
    { icon: "🔐", title: "Blockchain-Secured", desc: "Designed to support document integrity checks and traceable records." },
    { icon: "⚡", title: "Structured Verification", desc: "A clear review workflow helps citizens follow document status." },
    { icon: "🏛️", title: "Review Workflow", desc: "Organize documents that may require additional administrative review." },
    { icon: "📱", title: "Digital Workspace", desc: "Keep document details and review progress together in one interface." },
    { icon: "🔒", title: "Separate Workspaces", desc: "Citizen and government demo views provide different workflow screens." },
    { icon: "📊", title: "Status Overview", desc: "A simple view of documents and their current review status." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F5F7FA", position: "relative", overflow: "hidden" }}>
      {/* BG */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(52,75,99,0.08), transparent)", pointerEvents: "none" }} />
      <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.4, pointerEvents: "none" }} />

      {/* Navbar */}
      <nav style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 60px", borderBottom: "1px solid #E2E8F0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BrandMark size={42} />
          <span style={{ fontFamily: "Inter", fontWeight: 800, fontSize: 24, color: "#17324D" }}>OWNITY</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {walletAddress
            ? <div style={{ padding: "8px 16px", background: "rgba(52,75,99,0.08)", border: "1px solid rgba(52,75,99,0.25)", borderRadius: 10, fontSize: 13, color: "#17324D", fontFamily: "monospace" }}>🔗 {walletAddress}</div>
            : <button onClick={onConnect} className="btn" style={{ padding: "8px 18px", background: "rgba(52,75,99,0.08)", border: "1px solid rgba(52,75,99,0.25)", borderRadius: 10, color: "#17324D", fontSize: 13, fontWeight: 500 }}>Connect wallet</button>
          }
          <button onClick={() => onLogin("modal")} className="btn" style={{ padding: "8px 18px", background: "#17324D", borderRadius: 10, color: "#F5F7FA", fontWeight: 600, fontSize: 13 }}>Sign in</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: "relative", zIndex: 5, textAlign: "center", padding: "100px 60px 80px" }}>
        <div className="fade-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", background: "rgba(52,75,99,0.06)", border: "1px solid rgba(52,75,99,0.18)", borderRadius: 100, fontSize: 13, color: "#17324D", marginBottom: 32 }}>
          A PROPERTY DOCUMENT WORKFLOW PROTOTYPE
        </div>
        <h1 className="fade-up" style={{ fontFamily: "Inter", fontWeight: 800, fontSize: 72, lineHeight: 1.05, marginBottom: 24, animationDelay: "0.1s" }}>
          Property Documents,<br />
          <span className="gradient-text">Property Records, Made Clear.</span>
        </h1>
        <p style={{ color: "#64748B", fontSize: 20, maxWidth: 560, margin: "0 auto 48px", lineHeight: 1.6, animation: "fadeUp 0.5s 0.2s ease both" }}>
          Organize property documents and follow their review status through a clear, role-based workflow.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", animation: "fadeUp 0.5s 0.3s ease both" }}>
          <button onClick={() => onLogin("user")} className="btn" style={{ padding: "14px 32px", background: "#17324D", borderRadius: 12, color: "#F5F7FA", fontWeight: 700, fontSize: 16 }}>
            Get started
          </button>
          <button onClick={() => onLogin("gov")} className="btn" style={{ padding: "14px 32px", background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 12, color: "#172B3A", fontWeight: 600, fontSize: 16 }}>
            Government portal
          </button>
        </div>
      </section>

      {/* Features */}
      <section style={{ position: "relative", zIndex: 5, padding: "80px 60px" }}>
        <h2 style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 40, textAlign: "center", marginBottom: 60 }}>
          Why <span className="gradient-text">OWNITY?</span>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, maxWidth: 1000, margin: "0 auto" }}>
          {features.map((f, i) => (
            <div key={i} className="card card-hover" style={{ padding: "28px 24px", animationDelay: `${i * 0.08}s` }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
              <div style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 18, marginBottom: 10 }}>{f.title}</div>
              <div style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ position: "relative", zIndex: 5, padding: "40px 60px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "Inter", fontWeight: 700, color: "#17324D" }}>OWNITY</div>
        <div style={{ color: "#64748B", fontSize: 13 }}>© 2026 OWNITY. Property document workflow prototype.</div>
      </footer>
    </div>
  );
};

// ─── LOGIN MODAL ─────────────────────────────────────────────────────────────
const LoginModal = ({ onClose, onLogin, prefill }) => {
  const [email, setEmail] = useState(prefill === "gov" ? "gov@ownity.in" : prefill === "user" ? "user@ownity.in" : "");
  const [password, setPassword] = useState(prefill === "gov" ? "gov123" : prefill === "user" ? "user123" : "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handle = async () => {
    setLoading(true); setErr("");
    await new Promise(r => setTimeout(r, 900));
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (found) onLogin(found);
    else { setErr("Invalid credentials. Try user@ownity.in / user123"); setLoading(false); }
  };

  const inp = { width: "100%", padding: "12px 14px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 10, color: "#172B3A", fontSize: 14 };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
      <div onClick={e => e.stopPropagation()} className="card fade-up" style={{ width: 420, padding: 40, position: "relative" }}>
        <button onClick={onClose} className="btn" style={{ position: "absolute", top: 16, right: 16, color: "#64748B", fontSize: 20 }}>×</button>
        <div style={{ fontFamily: "Inter", fontWeight: 800, fontSize: 28, marginBottom: 8 }}>Welcome Back</div>
        <div style={{ color: "#64748B", fontSize: 14, marginBottom: 32 }}>Sign in to your OWNITY account</div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[["👤 Citizen", "user@ownity.in", "user123"], ["🏛️ Gov Official", "gov@ownity.in", "gov123"]].map(([lbl, e, p]) => (
            <button key={lbl} onClick={() => { setEmail(e); setPassword(p); }} className="btn" style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: email === e ? "rgba(52,75,99,0.08)" : "#FFFFFF", border: `1px solid ${email === e ? "rgba(15,118,110,0.28)" : "#E2E8F0"}`, color: email === e ? "#17324D" : "#64748B", fontSize: 13, fontWeight: 500 }}>{lbl}</button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
          <input style={inp} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} type="email" />
          <input style={inp} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} type="password" />
        </div>

        {err && <div style={{ color: "#EF4444", fontSize: 13, marginBottom: 16, padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 8 }}>{err}</div>}

        <button onClick={handle} disabled={loading} className="btn" style={{ width: "100%", padding: "13px", background: "#17324D", borderRadius: 10, color: "#F5F7FA", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          {loading ? <Loader /> : "Sign In →"}
        </button>
      </div>
    </div>
  );
};

// ─── STAT CARD ───────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, delay = 0 }) => (
  <div className="card card-hover fade-up" style={{ padding: "24px", animationDelay: `${delay}s` }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ color: "#64748B", fontSize: 13, marginBottom: 8 }}>{label}</div>
        <div style={{ fontFamily: "Inter", fontWeight: 800, fontSize: 36, color }}>{value}</div>
      </div>
      <div style={{ width: 48, height: 48, background: `${color}18`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: `1px solid ${color}30` }}>{icon}</div>
    </div>
  </div>
);

// ─── USER DASHBOARD ───────────────────────────────────────────────────────────
const UserDashboard = ({ docs, setPage }) => {
  const myDocs = docs;
  const counts = { pending: myDocs.filter(d => d.status === "pending").length, verified: myDocs.filter(d => d.status === "verified").length, tehsilRequired: myDocs.filter(d => d.status === "tehsilRequired").length, rejected: myDocs.filter(d => d.status === "rejected").length };

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "Inter", fontWeight: 800, fontSize: 32 }}>My Dashboard</h1>
        <p style={{ color: "#64748B", marginTop: 6 }}>Track your property documents and verification status.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 32 }}>
        <StatCard icon="📄" label="Total Documents" value={myDocs.length} color="#17324D" delay={0} />
        <StatCard icon="⏳" label="Pending"         value={counts.pending}  color="#F59E0B" delay={0.08} />
        <StatCard icon="✅" label="Verified"        value={counts.verified} color="#10B981" delay={0.16} />
        <StatCard icon="❌" label="Rejected"        value={counts.rejected} color="#EF4444" delay={0.24} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
        {/* Recent docs */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 18, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Recent Documents
            <button onClick={() => setPage("documents")} className="btn" style={{ fontSize: 12, color: "#17324D", background: "transparent", padding: 0 }}>View all</button>
          </div>
          {myDocs.slice(0, 4).map((doc, i) => (
            <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < 3 ? "1px solid #F8FAFC" : "none" }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{doc.documentName}</div>
                <div style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>{doc.propertyId} • {doc.createdAt}</div>
              </div>
              <StatusBadge status={doc.status} />
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ padding: 28, background: "linear-gradient(135deg,rgba(52,75,99,0.06),rgba(82,107,131,0.05))", border: "1px solid rgba(52,75,99,0.18)" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }} className="float-anim">📤</div>
            <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Upload Document</div>
            <div style={{ color: "#64748B", fontSize: 13, marginBottom: 20 }}>Submit your property documents for verification.</div>
            <button onClick={() => setPage("upload")} className="btn" style={{ padding: "10px 20px", background: "#17324D", borderRadius: 10, color: "#F5F7FA", fontWeight: 600, fontSize: 14 }}>Upload document</button>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 15, marginBottom: 14 }}>Verification Pipeline</div>
            {Object.entries(counts).map(([key, val]) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, alignItems: "center" }}>
                <div style={{ fontSize: 13, color: "#64748B" }}>{STATUS[key]?.label}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 80, height: 6, background: "#F8FAFC", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${myDocs.length ? (val / myDocs.length) * 100 : 0}%`, background: STATUS[key]?.color, borderRadius: 3, transition: "width 0.8s ease" }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: STATUS[key]?.color }}>{val}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── UPLOAD PAGE ──────────────────────────────────────────────────────────────
const UploadPage = ({ user, onUpload, showToast }) => {
  const [form, setForm] = useState({ propertyId: "", ownerName: "", address: "", type: "Sale Deed", fileName: "", fileData: "" });
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [extraction, setExtraction] = useState(null);
  const [mismatches, setMismatches] = useState([]);
  const [aiError, setAiError] = useState("");

  const types = ["Sale Deed", "Registry Document", "Land Record", "Ownership Transfer", "Mutation Record", "Survey Settlement"];

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      showToast("Please select a PDF file.", "error");
      e.target.value = "";
      return;
    }
    // This prototype stores the PDF in localStorage, so keep the file small enough for browser storage.
    if (file.size > 2 * 1024 * 1024) {
      showToast("For this browser-only demo, choose a PDF under 2 MB.", "error");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, fileName: file.name, fileData: String(reader.result || "") }));
    reader.onerror = () => showToast("Could not read this PDF. Please try another file.", "error");
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.propertyId || !form.ownerName || !form.address || !form.fileName || !form.fileData) { showToast("Please fill all fields and select a file.", "error"); return; }
    setUploading(true); setProgress(10); setDone(false); setAiError(""); setExtraction(null); setMismatches([]);
    try {
      setProgress(25);
      // AI extraction is advisory only; the government review status remains pending.
      const aiResult = await extractPropertyData(form.fileData, {
        propertyId: form.propertyId,
        ownerName: form.ownerName,
        address: form.address,
        documentType: form.type,
      });
      setProgress(75);
      const extractedData = aiResult.extractedData || {};
      const meaningfulFields = [
        extractedData.documentType,
        extractedData.propertyId,
        extractedData.ownerName,
        extractedData.propertyAddress,
        extractedData.surveyNumber,
        extractedData.plotNumber,
        extractedData.registrationNumber,
      ].filter((value) => String(value || "").trim() !== "");

      if (aiResult.isPropertyDocument === false || meaningfulFields.length === 0) {
        throw new Error(
          "This PDF does not appear to contain identifiable property information. No document was submitted. Please upload a relevant property record."
        );
      }

      const mismatchList = Array.isArray(aiResult.mismatches) ? aiResult.mismatches : [];
      onUpload({
        ...form,
        documentName: form.fileName || `${form.type}.pdf`,
        uploadedBy: user.id,
        status: "pending",
        createdAt: new Date().toISOString().split("T")[0],
        extractedData,
        mismatches: mismatchList,
        extractionStatus: "completed",
      });
      setExtraction(extractedData);
      setMismatches(mismatchList);
      setProgress(100);
      setUploading(false); setDone(true);
      showToast("PDF uploaded and AI extraction completed. Government review is still pending.", "success");
      setTimeout(() => {
        setDone(false);
        setForm({ propertyId: "", ownerName: "", address: "", type: "Sale Deed", fileName: "", fileData: "" });
        setProgress(0); setExtraction(null); setMismatches([]);
      }, 6000);
    } catch (error) {
      setUploading(false);
      setAiError(error.message || "Could not extract fields.");
      showToast(error.message || "AI extraction failed. Check that the backend and API key are configured.", "error");
    }
  };

  const inp = { width: "100%", padding: "13px 14px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 10, color: "#172B3A", fontSize: 14 };

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "Inter", fontWeight: 800, fontSize: 32 }}>Upload Document</h1>
        <p style={{ color: "#64748B", marginTop: 6 }}>Submit property documents for government verification.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 28, maxWidth: 900 }}>
        <div className="card" style={{ padding: 36 }}>
          <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 20, marginBottom: 28 }}>Document Details</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ fontSize: 13, color: "#64748B", marginBottom: 8, display: "block" }}>Property ID *</label>
              <input style={inp} placeholder="e.g. MH-2025-001" value={form.propertyId} onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "#64748B", marginBottom: 8, display: "block" }}>Owner Name *</label>
              <input style={inp} placeholder="Full legal name" value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "#64748B", marginBottom: 8, display: "block" }}>Property Address *</label>
              <textarea style={{ ...inp, resize: "vertical", minHeight: 80 }} placeholder="Complete property address with survey/plot number" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "#64748B", marginBottom: 8, display: "block" }}>Document Type</label>
              <select style={{ ...inp, cursor: "pointer" }} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {types.map(t => <option key={t} value={t} style={{ background: "#FFFFFF" }}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, color: "#64748B", marginBottom: 8, display: "block" }}>Upload PDF *</label>
              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px", border: "2px dashed rgba(52,75,99,0.22)", borderRadius: 12, cursor: "pointer", background: "rgba(52,75,99,0.03)", transition: "all 0.2s" }}>
                <input type="file" accept=".pdf" onChange={handleFile} style={{ display: "none" }} />
                <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#17324D" }}>{form.fileName || "Click to select PDF"}</div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>PDF only · Up to 2MB for this demo</div>
              </label>
            </div>

            {uploading && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: "#64748B" }}>Uploading…</span>
                  <span style={{ color: "#17324D" }}>{progress}%</span>
                </div>
                <div style={{ height: 8, background: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#17324D,#0F766E)", borderRadius: 4, transition: "width 0.1s" }} />
                </div>
              </div>
            )}

            <button onClick={handleSubmit} disabled={uploading || done} className="btn" style={{ padding: "14px", background: done ? "rgba(16,185,129,0.2)" : "#17324D", border: done ? "1px solid #10B981" : "none", borderRadius: 12, color: done ? "#10B981" : "#F5F7FA", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {done ? "✅ Uploaded!" : uploading ? <><Loader /> Uploading…</> : "⬆️ Submit Document"}
            </button>
          </div>
        </div>

        {/* Info panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ padding: 24, background: "rgba(52,75,99,0.04)", border: "1px solid rgba(52,75,99,0.08)" }}>
            <div style={{ fontFamily: "Inter", fontWeight: 700, marginBottom: 16, color: "#17324D" }}>📋 Process Flow</div>
            {["Upload PDF", "Gemini field extraction", "Form/document comparison", "Officer review", "Government decision"].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: i < 4 ? 16 : 0 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#17324D", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#F5F7FA", flexShrink: 0 }}>{i + 1}</div>
                <div style={{ fontSize: 13, color: "#64748B", paddingTop: 3 }}>{step}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontFamily: "Inter", fontWeight: 700, marginBottom: 16 }}>🔐 Security</div>
            {["API key stays on the backend", "Extracted fields are reviewable", "Possible mismatches are flagged", "AI does not approve ownership"].map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10, fontSize: 13, color: "#64748B" }}>
                <span style={{ color: "#10B981", marginTop: 1 }}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {aiError && <div className="card" style={{ marginTop: 20, padding: 18, border: "1px solid #F59E0B" }}>
        <strong style={{ color: "#B45309" }}>AI extraction unavailable</strong>
        <p style={{ marginTop: 6 }}>{aiError}</p>
        <p style={{ marginTop: 4, fontSize: 13 }}>The document was not submitted. Start the backend and configure GEMINI_API_KEY, then try again.</p>
      </div>}
      {done && extraction && <div className="card" style={{ marginTop: 20, padding: 24 }}>
        <h3 style={{ marginBottom: 12 }}>Property information comparison</h3>
        <p style={{ marginBottom: 14, fontSize: 13, color: "#64748B" }}>Compare the values you entered with text Gemini found in the PDF. AI extraction is advisory; government status remains Pending.</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F1F5F9", textAlign: "left" }}>
                {["Field", "Entered information", "Extracted from PDF"].map((heading) => <th key={heading} style={{ padding: "11px 10px", borderBottom: "1px solid #CBD5E1" }}>{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ["Document type", form.type, extraction.documentType],
                ["Property ID", form.propertyId, extraction.propertyId],
                ["Owner name", form.ownerName, extraction.ownerName],
                ["Property address", form.address, extraction.propertyAddress],
                ["Survey number", "—", extraction.surveyNumber],
                ["Plot number", "—", extraction.plotNumber],
                ["Village", "—", extraction.village],
                ["Taluka", "—", extraction.taluka],
                ["District", "—", extraction.district],
                ["State", "—", extraction.state],
                ["Registration number", "—", extraction.registrationNumber],
                ["Registration date", "—", extraction.registrationDate],
                ["Land area", "—", extraction.landArea],
              ].map(([label, entered, extracted]) => {
                const missing = !String(extracted || "").trim();
                const mismatch = mismatches.some((item) => item.field === label);
                return <tr key={label}>
                  <td style={{ padding: "10px", borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>{label}</td>
                  <td style={{ padding: "10px", borderBottom: "1px solid #E2E8F0", overflowWrap: "anywhere" }}>{entered || "—"}</td>
                  <td style={{ padding: "10px", borderBottom: "1px solid #E2E8F0", overflowWrap: "anywhere", color: missing ? "#B45309" : mismatch ? "#B91C1C" : "#172B3A" }}>{missing ? "Could not extract" : extracted}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 16, padding: 14, borderRadius: 8, background: mismatches.length ? "#FFF7ED" : "#FFFBEB", border: `1px solid ${mismatches.length ? "#FDBA74" : "#FCD34D"}` }}>
          <strong style={{ color: mismatches.length ? "#9A3412" : "#92400E" }}>
            {mismatches.length
              ? `${mismatches.length} possible mismatch(es) detected`
              : "No confirmed mismatch — missing fields still need review"}
          </strong>
          {mismatches.map((item, index) => <div key={index} style={{ fontSize: 13, marginTop: 8, color: "#172B3A" }}>{item.field}: entered “{item.submitted || "Not provided"}”; PDF says “{item.extracted || "Could not extract"}”</div>)}
        </div>
      </div>}
    </div>
  );
};

// ─── MY DOCUMENTS ─────────────────────────────────────────────────────────────
const DocumentsPage = ({ docs, onDelete, showToast }) => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (selected && !docs.some(doc => doc.id === selected.id)) setSelected(null);
  }, [docs, selected]);

  const filtered = docs.filter(d => {
    const matchSearch = String(d.propertyId || "").toLowerCase().includes(search.toLowerCase()) || String(d.documentName || "").toLowerCase().includes(search.toLowerCase()) || String(d.owner || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontFamily: "Inter", fontWeight: 800, fontSize: 32 }}>My Documents</h1>
          <p style={{ color: "#64748B", marginTop: 6 }}>{filtered.length} document{filtered.length !== 1 ? "s" : ""} found</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents…" style={{ flex: 1, minWidth: 220, padding: "10px 14px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 10, color: "#172B3A", fontSize: 14 }} />
        {["all", ...Object.keys(STATUS)].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className="btn" style={{ padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500, background: filterStatus === s ? (s === "all" ? "rgba(52,75,99,0.08)" : `${STATUS[s]?.color}18`) : "#FFFFFF", border: `1px solid ${filterStatus === s ? (s === "all" ? "rgba(15,118,110,0.28)" : `${STATUS[s]?.color}44`) : "#E2E8F0"}`, color: filterStatus === s ? (s === "all" ? "#17324D" : STATUS[s]?.color) : "#64748B" }}>
            {s === "all" ? "All" : STATUS[s]?.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
              {["Property ID", "Owner", "Document", "Upload Date", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748B", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={6} style={{ padding: 48, textAlign: "center", color: "#64748B" }}>No documents yet. Upload a document to get started.</td></tr>
              : filtered.map((doc, i) => (
                <tr key={doc.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #FFFFFF" : "none", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#FAF9F6"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "16px 20px", fontFamily: "monospace", fontSize: 13, color: "#17324D" }}>{doc.propertyId}</td>
                  <td style={{ padding: "16px 20px", fontSize: 14 }}>{doc.owner}</td>
                  <td style={{ padding: "16px 20px", fontSize: 14 }}>
                    <div>📄 {doc.documentName}</div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{String(doc.address || "Address not provided").slice(0, 30)}{String(doc.address || "").length > 30 ? "…" : ""}</div>
                  </td>
                  <td style={{ padding: "16px 20px", fontSize: 13, color: "#64748B" }}>{doc.createdAt}</td>
                  <td style={{ padding: "16px 20px" }}><StatusBadge status={doc.status} /></td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button onClick={() => setSelected(doc)} className="btn" style={{ padding: "8px 13px", background: "#17324D", border: "1px solid #17324D", borderRadius: 7, color: "#FFFFFF", fontSize: 12, fontWeight: 600 }}>View details</button>
                      <button onClick={() => onDelete(doc.id)} className="btn" style={{ padding: "8px 12px", background: "#FFFFFF", border: "1px solid #F0B7B7", borderRadius: 7, color: "#B42318", fontSize: 12, fontWeight: 600 }} aria-label={`Delete ${doc.documentName}`}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Document Modal */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px", overflowY: "auto", boxSizing: "border-box", backdropFilter: "blur(8px)" }}>
          <div onClick={e => e.stopPropagation()} className="card fade-up" style={{ width: "100%", maxWidth: 500, maxHeight: "calc(100vh - 48px)", overflowY: "auto", boxSizing: "border-box", padding: 28, position: "relative", margin: "auto 0" }}>
            <button onClick={() => setSelected(null)} className="btn" style={{ position: "absolute", top: 16, right: 16, color: "#64748B", fontSize: 20 }}>×</button>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📄</div>
            <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 22, marginBottom: 6 }}>{selected.documentName}</div>
            <StatusBadge status={selected.status} />
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
              {[["Property ID", selected.propertyId], ["Owner", selected.owner], ["Address", selected.address], ["Uploaded", selected.createdAt]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #FFFFFF" }}>
                  <span style={{ color: "#64748B", fontSize: 13 }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, maxWidth: 260, textAlign: "right" }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
              {selected.fileData ? <a href={selected.fileData} target="_blank" rel="noreferrer" className="btn" style={{ flex: 1, textAlign: "center", padding: "11px 14px", background: "#17324D", border: "1px solid #17324D", borderRadius: 8, color: "#FFFFFF", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Preview PDF</a> : <div style={{ flex: 1, color: "#B45309", fontSize: 13 }}>No PDF was saved for this record. Upload it again to enable viewing.</div>}
              <button onClick={() => onDelete(selected.id)} className="btn" style={{ padding: "11px 14px", background: "#FFFFFF", border: "1px solid #F0B7B7", borderRadius: 8, color: "#B42318", fontSize: 13, fontWeight: 600 }}>Delete document</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── STATUS PAGE ──────────────────────────────────────────────────────────────
const StatusPage = ({ docs }) => (
  <div style={{ animation: "fadeIn 0.4s ease" }}>
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontFamily: "Inter", fontWeight: 800, fontSize: 32 }}>Track Status</h1>
      <p style={{ color: "#64748B", marginTop: 6 }}>Follow your document verification journey.</p>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {docs.map((doc, i) => (
        <div key={doc.id} className="card card-hover" style={{ padding: 28, animation: `fadeUp 0.4s ${i * 0.06}s ease both` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 18 }}>{doc.documentName}</div>
              <div style={{ color: "#64748B", fontSize: 13, marginTop: 4 }}>{doc.propertyId} • {doc.address}</div>
            </div>
            <StatusBadge status={doc.status} />
          </div>
          {/* Timeline */}
          <div style={{ display: "flex", gap: 0, alignItems: "center" }}>
            {[{ key: "uploaded", label: "Uploaded", always: true }, { key: "pending", label: "Gov. Review" }, { key: "tehsilRequired", label: "Tehsil Review" }, { key: "verified", label: "Approved" }].map((step, si, arr) => {
              const order = ["uploaded", "pending", "tehsilRequired", "verified", "rejected"];
              const docIdx = order.indexOf(doc.status === "rejected" ? "rejected" : doc.status);
              const stepIdx = order.indexOf(step.key);
              const isActive = stepIdx <= docIdx || step.key === "uploaded";
              const isRejected = doc.status === "rejected" && step.key === "verified";
              return (
                <div key={step.key} style={{ display: "flex", alignItems: "center", flex: si < arr.length - 1 ? 1 : "unset" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: isRejected ? "rgba(239,68,68,0.2)" : isActive ? "#17324D" : "#E2E8F0", border: isActive && !isRejected ? "none" : "1px solid #CBD5E1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, margin: "0 auto 8px", color: isActive && !isRejected ? "#F5F7FA" : "#64748B" }}>
                      {isRejected ? "✕" : isActive ? "✓" : si + 1}
                    </div>
                    <div style={{ fontSize: 11, color: isActive && !isRejected ? "#17324D" : "#64748B", fontWeight: isActive ? 600 : 400, whiteSpace: "nowrap" }}>{step.label}</div>
                  </div>
                  {si < arr.length - 1 && <div style={{ flex: 1, height: 2, background: isActive && stepIdx < docIdx ? "linear-gradient(90deg,#17324D,#0F766E)" : "#E2E8F0", margin: "0 8px 20px" }} />}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── GOVERNMENT DASHBOARD ─────────────────────────────────────────────────────
const GovDashboard = ({ docs, onVerify, onReject, showToast }) => {
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const counts = { total: docs.length, pending: docs.filter(d => d.status === "pending").length, verified: docs.filter(d => d.status === "verified").length, rejected: docs.filter(d => d.status === "rejected").length };

  const handleAction = async (type) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    if (type === "verify") { onVerify(selected.id); showToast("Document verified successfully!", "success"); }
    else if (type === "tehsil") { onVerify(selected.id, "tehsilRequired"); showToast("Sent for Tehsil verification.", "info"); }
    else if (type === "return") { onVerify(selected.id, "pending"); showToast("Document returned to Government Review.", "success"); }
    else { onReject(selected.id); showToast("Document rejected.", "error"); }
    setSelected(null); setAction(null); setMsg(""); setLoading(false);
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontFamily: "Inter", fontWeight: 800, fontSize: 32 }}>Government Portal</h1>
          <p style={{ color: "#0F766E", marginTop: 6 }}>🏛️ Official document verification panel</p>
        </div>
        <div style={{ padding: "8px 20px", background: "rgba(129,140,248,0.1)", border: "1px solid rgba(82,107,131,0.22)", borderRadius: 100, fontSize: 13, color: "#0F766E", fontWeight: 500 }}>🔒 Restricted Access</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 32 }}>
        <StatCard icon="📋" label="Total Submitted" value={counts.total}    color="#17324D" delay={0}    />
        <StatCard icon="⏳" label="Awaiting Review"  value={counts.pending}  color="#F59E0B" delay={0.08} />
        <StatCard icon="✅" label="Verified"         value={counts.verified} color="#10B981" delay={0.16} />
        <StatCard icon="❌" label="Rejected"         value={counts.rejected} color="#EF4444" delay={0.24} />
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0", fontFamily: "Inter", fontWeight: 700, fontSize: 18 }}>Pending Review Queue</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
              {["Property ID", "Owner", "Document", "Submitted", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748B", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {docs.map((doc, i) => (
              <tr key={doc.id} style={{ borderBottom: i < docs.length - 1 ? "1px solid #FFFFFF" : "none" }}
                onMouseEnter={e => e.currentTarget.style.background = "#FAF9F6"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "16px 20px", fontFamily: "monospace", fontSize: 13, color: "#0F766E" }}>{doc.propertyId}</td>
                <td style={{ padding: "16px 20px", fontSize: 14 }}>{doc.owner}</td>
                <td style={{ padding: "16px 20px", fontSize: 13 }}>📄 {doc.documentName}</td>
                <td style={{ padding: "16px 20px", fontSize: 13, color: "#64748B" }}>{doc.createdAt}</td>
                <td style={{ padding: "16px 20px" }}><StatusBadge status={doc.status} /></td>
                <td style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setSelected(doc)} className="btn" style={{ padding: "6px 12px", background: "rgba(52,75,99,0.08)", border: "1px solid rgba(52,75,99,0.22)", borderRadius: 7, color: "#17324D", fontSize: 12 }}>Review</button>
                    {doc.status === "pending" && <>
                      <button onClick={() => { setSelected(doc); setAction("verify"); }} className="btn" style={{ padding: "6px 12px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 7, color: "#10B981", fontSize: 12 }}>Approve</button>
                      <button onClick={() => { setSelected(doc); setAction("reject"); }} className="btn" style={{ padding: "6px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 7, color: "#EF4444", fontSize: 12 }}>Reject</button>
                    </>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {selected && (
        <div onClick={() => { setSelected(null); setAction(null); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px", overflowY: "auto", boxSizing: "border-box", backdropFilter: "blur(8px)" }}>
          <div onClick={e => e.stopPropagation()} className="card fade-up" style={{ width: "100%", maxWidth: 720, maxHeight: "calc(100vh - 48px)", overflowY: "auto", boxSizing: "border-box", padding: 28, position: "relative", margin: "auto 0" }}>
            <button onClick={() => { setSelected(null); setAction(null); }} className="btn" style={{ position: "absolute", top: 16, right: 16, color: "#64748B", fontSize: 20 }}>×</button>
            <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 22, marginBottom: 20 }}>Document Review</div>
            <div style={{ marginBottom: 10, padding: 14, background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: 10 }}>
              <div style={{ fontWeight: 700, color: "#17324D", marginBottom: 8 }}>Information entered by citizen</div>
              {[["Property ID", selected.propertyId], ["Owner name", selected.owner ?? selected.ownerName], ["Property address", selected.address], ["Document type", selected.type ?? selected.documentType ?? "Not provided"], ["File name", selected.documentName], ["Submitted", selected.createdAt]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0", borderBottom: "1px solid #D8E1EA", fontSize: 13 }}>
                  <span style={{ color: "#64748B", flexShrink: 0 }}>{k}</span>
                  <span style={{ fontWeight: 600, textAlign: "right", overflowWrap: "anywhere" }}>{v || "Not provided"}</span>
                </div>
              ))}
            </div>
            {selected.extractedData && (
              <div style={{ marginTop: 20, padding: 16, background: "#FAF9F6", border: "1px solid #E2E8F0", borderRadius: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>Gemini extracted fields</div>
                {Object.entries(selected.extractedData).filter(([key]) => key !== "notes").map(([key, value]) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0", borderBottom: "1px solid #E2E8F0", fontSize: 13 }}>
                    <span style={{ color: "#64748B", textTransform: "capitalize" }}>{key.replace(/([A-Z])/g, " $1")}</span>
                    <span style={{ textAlign: "right", maxWidth: "60%", overflowWrap: "anywhere" }}>{value || "Not found"}</span>
                  </div>
                ))}
                <div style={{ marginTop: 12, fontWeight: 700, color: selected.mismatches?.length ? "#9A3412" : "#166534" }}>
                  {selected.mismatches?.length ? `${selected.mismatches.length} possible mismatch(es)` : "No confirmed mismatch — missing fields still need review"}
                </div>
                {(selected.mismatches || []).map((item, index) => <div key={index} style={{ fontSize: 12, marginTop: 7, color: "#9A3412" }}>
                  {item.field}: form “{item.submitted || "Not provided"}” vs PDF “{item.extracted || "Not found"}”
                </div>)}
                <p style={{ marginTop: 10, fontSize: 12 }}>AI extraction is advisory. Confirm details against the original document and official records before deciding.</p>
              </div>
            )}
            {action === "reject" && (
              <div style={{ marginTop: 20 }}>
                <label style={{ fontSize: 13, color: "#64748B", display: "block", marginBottom: 8 }}>Rejection Reason</label>
                <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Explain why this document is being rejected…" style={{ width: "100%", padding: "12px 14px", background: "#FFFFFF", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "#172B3A", fontSize: 14, resize: "vertical", minHeight: 80 }} />
              </div>
            )}
            {selected.fileData ? <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 13, color: "#64748B", marginBottom: 8 }}>Uploaded PDF</div>
              <iframe title={`Preview ${selected.documentName}`} src={`${selected.fileData}#toolbar=0&navpanes=0`} style={{ width: "100%", height: 320, border: "1px solid #CBD5E1", borderRadius: 8, background: "#FFFFFF", display: "block" }} />
            </div> : <p style={{ marginTop: 16, fontSize: 13, color: "#B45309" }}>The original PDF is not available for this older record. New uploads will include the PDF.</p>}
            {selected.status === "pending" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 24 }}>
                <button onClick={() => handleAction("verify")} disabled={loading} className="btn" style={{ padding: "11px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, color: "#10B981", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {loading && action !== "tehsil" && action !== "reject" ? <Loader /> : "✅ Approve"}
                </button>
                <button onClick={() => handleAction("tehsil")} disabled={loading} className="btn" style={{ padding: "11px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 10, color: "#0F766E", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {loading && action === "tehsil" ? <Loader /> : "🏛️ Tehsil"}
                </button>
                <button onClick={() => handleAction("reject")} disabled={loading} className="btn" style={{ padding: "11px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "#EF4444", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {loading && action === "reject" ? <Loader /> : "❌ Reject"}
                </button>
              </div>
            )}
            {selected.status === "tehsilRequired" && (
              <div style={{ display: "flex", gap: 10, marginTop: 20, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 160, padding: "12px 16px", borderRadius: 10, background: `${STATUS[selected.status]?.bg}`, border: `1px solid ${STATUS[selected.status]?.color}33`, color: STATUS[selected.status]?.color, fontSize: 14, fontWeight: 500 }}>🏛️ Assigned for Tehsil review</div>
                <button onClick={() => handleAction("return")} disabled={loading} className="btn" style={{ padding: "11px 14px", background: "rgba(52,75,99,0.08)", border: "1px solid rgba(52,75,99,0.22)", borderRadius: 10, color: "#17324D", fontWeight: 600, fontSize: 13 }}>Return to government review</button>
              </div>
            )}
            {selected.status !== "pending" && selected.status !== "tehsilRequired" && (
              <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: 10, background: `${STATUS[selected.status]?.bg}`, border: `1px solid ${STATUS[selected.status]?.color}33`, color: STATUS[selected.status]?.color, fontSize: 14, fontWeight: 500 }}>
                {STATUS[selected.status]?.icon} Already {STATUS[selected.status]?.label}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── ALL DOCS (GOV VIEW) ──────────────────────────────────────────────────────
const AllDocumentsPage = ({ docs, onVerify, onReject, showToast }) => (
  <GovDashboard docs={docs} onVerify={onVerify} onReject={onReject} showToast={showToast} />
);

// ─── ABOUT PAGE ───────────────────────────────────────────────────────────────
const AboutPage = () => (
  <div style={{ animation: "fadeIn 0.4s ease", maxWidth: 800 }}>
    <div style={{ marginBottom: 40 }}>
      <h1 style={{ fontFamily: "Inter", fontWeight: 800, fontSize: 40 }}>About <span className="gradient-text">OWNITY</span></h1>
      <p style={{ color: "#64748B", marginTop: 10, fontSize: 18, lineHeight: 1.7 }}>A digital workspace for property document submission and review.</p>
    </div>

    {[
      { icon: "🎯", title: "Our Mission", body: "OWNITY is a prototype for organizing property documents and coordinating a review workflow. Production verification, official integrations, and tamper-evident storage require validated backend services and government participation." },
      { icon: "⛓️", title: "Blockchain Architecture", body: "A production implementation could calculate document hashes and anchor them to a ledger. This demo does not currently perform on-chain storage or cryptographic verification." },
      { icon: "🏛️", title: "Government Integration", body: "This prototype demonstrates separate citizen and government-facing screens. It is not connected to live land registry, sub-registrar, or Tehsil systems." },
      { icon: "🔮", title: "Roadmap", body: "Potential future work: secure file storage, auditable verification records, official integrations, and validated document-integrity checks." },
    ].map((s, i) => (
      <div key={i} className="card" style={{ padding: 32, marginBottom: 20, animation: `fadeUp 0.5s ${i * 0.1}s ease both` }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>{s.icon}</div>
        <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 22, marginBottom: 12 }}>{s.title}</div>
        <div style={{ color: "#64748B", lineHeight: 1.75, fontSize: 15 }}>{s.body}</div>
      </div>
    ))}

    <div className="card" style={{ padding: 32, background: "linear-gradient(135deg,rgba(52,75,99,0.04),rgba(82,107,131,0.04))", border: "1px solid rgba(52,75,99,0.08)" }}>
      <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 20, marginBottom: 16 }}>🛠️ Tech Stack</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {["React.js", "Node.js", "Express.js", "MongoDB", "JWT Auth", "Ethers.js", "MetaMask", "IPFS (roadmap)", "Solidity (roadmap)", "TailwindCSS", "Framer Motion", "Multer"].map(t => (
          <span key={t} style={{ padding: "6px 14px", background: "rgba(52,75,99,0.06)", border: "1px solid rgba(52,75,99,0.18)", borderRadius: 100, fontSize: 13, color: "#17324D" }}>{t}</span>
        ))}
      </div>
    </div>
  </div>
);

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const readSavedState = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

export default function App() {
  // Persist prototype data in this browser so refreshes do not reset the session.
  const [user, setUser] = useState(() => readSavedState("ownity_user", null));
  const [page, setPage] = useState(() => readSavedState("ownity_page", "dashboard"));
  const [docs, setDocs] = useState(() => readSavedState("ownity_docs", MOCK_DOCS));
  const [showLogin, setShowLogin] = useState(false);
  const [loginPrefill, setLoginPrefill] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "info") => setToast({ msg, type });

  useEffect(() => {
    try {
      if (user) localStorage.setItem("ownity_user", JSON.stringify(user));
      else localStorage.removeItem("ownity_user");
    } catch (error) {
      console.warn("Could not save OWNITY session:", error);
    }
  }, [user]);

  useEffect(() => {
    try { localStorage.setItem("ownity_page", JSON.stringify(page)); }
    catch (error) { console.warn("Could not save OWNITY page:", error); }
  }, [page]);

  useEffect(() => {
    try { localStorage.setItem("ownity_docs", JSON.stringify(docs)); }
    catch (error) { console.warn("Could not save OWNITY documents:", error); }
  }, [docs]);

  const handleLogin = (userOrAction) => {
    if (typeof userOrAction === "object") {
      setUser(userOrAction);
      setShowLogin(false);
      setPage(userOrAction.role === "government" ? "gov-dashboard" : "dashboard");
      showToast(`Welcome, ${userOrAction.name}!`, "success");
    } else if (userOrAction === "modal" || userOrAction === "user" || userOrAction === "gov") {
      setLoginPrefill(userOrAction === "modal" ? null : userOrAction);
      setShowLogin(true);
    }
  };

  const handleConnect = () => {
    showToast("Wallet connection is not configured in this prototype.", "info");
  };

  const handleLogout = () => { setUser(null); setPage("dashboard"); showToast("Logged out.", "info"); };

  const handleUpload = (data) => {
    const newDoc = { id: Date.now(), propertyId: data.propertyId, owner: data.ownerName, address: data.address, documentName: data.documentName, documentType: data.type || data.documentType || "", fileData: data.fileData, extractedData: data.extractedData || null, mismatches: data.mismatches || [], extractionStatus: data.extractionStatus || "not-run", status: "pending", uploadedBy: user.id, verifiedBy: null, createdAt: data.createdAt };
    setDocs(d => [newDoc, ...d]);
  };

  const handleDelete = (id) => {
    const target = docs.find(doc => doc.id === id);
    if (!target) return;
    const confirmed = window.confirm(`Delete "${target.documentName}"? This removes it from this browser's OWNITY prototype.`);
    if (!confirmed) return;
    setDocs(current => current.filter(doc => doc.id !== id));
    showToast("Document deleted from this browser.", "success");
  };

  const handleVerify = (id, status = "verified") => {
    setDocs(d => d.map(doc => doc.id === id ? { ...doc, status, verifiedBy: user.id } : doc));
  };
  const handleReject = (id) => {
    setDocs(d => d.map(doc => doc.id === id ? { ...doc, status: "rejected", verifiedBy: user.id } : doc));
  };

  // Not logged in → landing
  if (!user) {
    return (
      <>
        <GlobalStyle />
        <LandingPage onLogin={handleLogin} onConnect={handleConnect} walletAddress={walletAddress} />
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLogin} prefill={loginPrefill} />}
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  const myDocs = user.role === "government" ? docs : docs.filter(d => d.uploadedBy === user.id);

  const renderPage = () => {
    switch (page) {
      case "dashboard":     return <UserDashboard docs={myDocs} setPage={setPage} />;
      case "upload":        return <UploadPage user={user} onUpload={handleUpload} showToast={showToast} />;
      case "documents":     return <DocumentsPage docs={myDocs} onDelete={handleDelete} showToast={showToast} />;
      case "status":        return <StatusPage docs={myDocs} />;
      case "gov-dashboard": return <GovDashboard docs={docs} onVerify={handleVerify} onReject={handleReject} showToast={showToast} />;
      case "all-documents": return <AllDocumentsPage docs={docs} onVerify={handleVerify} onReject={handleReject} showToast={showToast} />;
      case "about":         return <AboutPage />;
      default:              return <UserDashboard docs={myDocs} setPage={setPage} />;
    }
  };

  return (
    <>
      <GlobalStyle />
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar page={page} setPage={setPage} user={user} onLogout={handleLogout} />
        <main style={{ flex: 1, marginLeft: 240, padding: "40px 48px", minHeight: "100vh", background: "#F5F7FA", position: "relative" }}>
          <div className="grid-bg" style={{ position: "fixed", inset: 0, opacity: 0.25, pointerEvents: "none", zIndex: 0, marginLeft: 240 }} />
          <div style={{ position: "fixed", top: 0, right: 0, width: "60%", height: "50%", background: "radial-gradient(ellipse at 80% 0%, rgba(52,75,99,0.04), transparent)", pointerEvents: "none", zIndex: 0 }} />
          <div style={{ position: "relative", zIndex: 1 }}>{renderPage()}</div>
        </main>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
