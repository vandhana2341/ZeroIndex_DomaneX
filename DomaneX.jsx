import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, Line, PieChart, Pie, Cell } from "recharts";

// ============================================================
// ANTHROPIC API HELPER
// ============================================================
const callClaude = async (messages, systemPrompt = "", maxTokens = 1000) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  });
  const data = await response.json();
  return data.content?.map(b => b.text || "").join("") || "";
};

// ============================================================
// APP CONTEXT
// ============================================================
const AppContext = createContext(null);
const useApp = () => useContext(AppContext);

// ============================================================
// MOCK DATA
// ============================================================
const DOMAINS = [
  { id: "ai_ml", name: "AI / ML", icon: "🤖", color: "#06b6d4", desc: "Build intelligent systems, neural networks, and data-driven models" },
  { id: "web_dev", name: "Web Dev", icon: "🌐", color: "#8b5cf6", desc: "Create full-stack web applications and modern user interfaces" },
  { id: "cybersecurity", name: "Cybersecurity", icon: "🔐", color: "#ef4444", desc: "Protect systems, networks, and data from digital attacks" },
  { id: "data_science", name: "Data Science", icon: "📊", color: "#f59e0b", desc: "Extract insights and build predictive models from data" },
  { id: "app_dev", name: "App Dev", icon: "📱", color: "#10b981", desc: "Build mobile applications for iOS and Android platforms" },
  { id: "cloud", name: "Cloud", icon: "☁️", color: "#3b82f6", desc: "Design scalable cloud infrastructure and DevOps pipelines" },
  { id: "ui_ux", name: "UI/UX", icon: "🎨", color: "#ec4899", desc: "Design beautiful, user-centered digital experiences" },
  { id: "devops", name: "DevOps", icon: "⚙️", color: "#84cc16", desc: "Automate software delivery and infrastructure management" },
];

const GOALS = [
  { id: "job", name: "Get a Job", icon: "💼", desc: "Land your first tech role" },
  { id: "startup", name: "Build Startup", icon: "🚀", desc: "Create your own product" },
  { id: "freelance", name: "Freelancing", icon: "💻", desc: "Work independently" },
  { id: "research", name: "Research", icon: "🔬", desc: "Academic research path" },
  { id: "higher_studies", name: "Higher Studies", icon: "🎓", desc: "MS/PhD preparation" },
];

const DURATIONS = ["3 months", "6 months", "1 year", "2 years"];

const QUIZ_QUESTIONS = {
  ai_ml: [
    { q: "What is gradient descent?", options: ["Optimization algorithm", "Data structure", "Programming language", "Network protocol"], correct: 0, difficulty: 1 },
    { q: "Which library is used for deep learning in Python?", options: ["NumPy", "Pandas", "TensorFlow", "Matplotlib"], correct: 2, difficulty: 1 },
    { q: "What does CNN stand for?", options: ["Convolutional Neural Network", "Cyclic Node Network", "Central Neural Node", "Coded Network Node"], correct: 0, difficulty: 2 },
    { q: "What is overfitting?", options: ["Model too simple", "Model memorizes training data", "Low accuracy", "Missing data"], correct: 1, difficulty: 2 },
    { q: "Which activation function outputs values between 0 and 1?", options: ["ReLU", "Tanh", "Sigmoid", "Softmax"], correct: 2, difficulty: 3 },
  ],
  web_dev: [
    { q: "What does DOM stand for?", options: ["Document Object Model", "Data Object Module", "Dynamic Output Method", "Design Object Map"], correct: 0, difficulty: 1 },
    { q: "Which hook is used for side effects in React?", options: ["useState", "useEffect", "useContext", "useMemo"], correct: 1, difficulty: 1 },
    { q: "What is REST API?", options: ["A programming language", "Architectural style for networked apps", "Database system", "Testing framework"], correct: 1, difficulty: 2 },
    { q: "What is the purpose of CSS Flexbox?", options: ["3D animations", "Layout arrangement", "Database queries", "API calls"], correct: 1, difficulty: 2 },
    { q: "What does CORS stand for?", options: ["Cross-Origin Resource Sharing", "Code Object Runtime System", "Central Output Resource", "Client Object Request Service"], correct: 0, difficulty: 3 },
  ],
  default: [
    { q: "What is an API?", options: ["Application Programming Interface", "Automated Program Installer", "Advanced Protocol Interface", "App Process Integration"], correct: 0, difficulty: 1 },
    { q: "What is version control?", options: ["Software pricing system", "Track code changes over time", "Internet browser", "Database management"], correct: 1, difficulty: 1 },
    { q: "What is agile methodology?", options: ["A programming language", "Iterative development approach", "Database design pattern", "Hardware specification"], correct: 1, difficulty: 2 },
    { q: "What is a database index?", options: ["Table of contents for faster queries", "Primary key only", "Foreign key constraint", "Query language"], correct: 0, difficulty: 2 },
    { q: "What is containerization?", options: ["Data encryption", "Package apps with dependencies", "Cloud storage", "UI framework"], correct: 1, difficulty: 3 },
  ],
};

const LEADERBOARD_DATA = [
  { rank: 1, name: "Aryan Sharma", domain: "AI/ML", score: 9840, streak: 45, badges: 28, avatar: "AS" },
  { rank: 2, name: "Priya Nair", domain: "Web Dev", score: 9210, streak: 38, badges: 24, avatar: "PN" },
  { rank: 3, name: "Rohan Gupta", domain: "Data Science", score: 8950, streak: 31, badges: 22, avatar: "RG" },
  { rank: 4, name: "Sneha Patel", domain: "Cybersecurity", score: 8720, streak: 29, badges: 20, avatar: "SP" },
  { rank: 5, name: "Vikram Singh", domain: "Cloud", score: 8340, streak: 25, badges: 18, avatar: "VS" },
  { rank: 6, name: "Kavya Reddy", domain: "UI/UX", score: 7980, streak: 22, badges: 16, avatar: "KR" },
  { rank: 7, name: "Aditya Kumar", domain: "DevOps", score: 7650, streak: 19, badges: 14, avatar: "AK" },
  { rank: 8, name: "Meera Joshi", domain: "App Dev", score: 7200, streak: 17, badges: 12, avatar: "MJ" },
];

const EVENTS_DATA = [
  { id: 1, title: "Google ML Bootcamp", domain: "AI/ML", type: "Workshop", date: "Upcoming", participants: 2400, saved: false },
  { id: 2, title: "React Summit 2025", domain: "Web Dev", type: "Conference", date: "Upcoming", participants: 5000, saved: true },
  { id: 3, title: "AWS Cloud Day", domain: "Cloud", type: "Hackathon", date: "Upcoming", participants: 1800, saved: false },
  { id: 4, title: "Figma Design Sprint", domain: "UI/UX", type: "Workshop", date: "Upcoming", participants: 900, saved: false },
  { id: 5, title: "CTF Competition", domain: "Cybersecurity", type: "Competition", date: "Upcoming", participants: 3200, saved: false },
];

const COMMUNITY_POSTS = [
  { id: 1, author: "Aryan S.", domain: "AI/ML", content: "Just completed my first neural network from scratch! 🔥 Took 3 weeks but totally worth it. Check out my GitHub!", likes: 142, comments: 23, avatar: "AS" },
  { id: 2, author: "Priya N.", domain: "Web Dev", content: "Deployed my first full-stack app using React + Node + PostgreSQL. The feeling is unreal! Next up: adding auth 🚀", likes: 98, comments: 17, avatar: "PN" },
  { id: 3, author: "Sneha P.", domain: "Cybersecurity", content: "Passed the CEH exam on first attempt! 6 months of grinding paid off. Happy to answer questions.", likes: 203, comments: 41, avatar: "SP" },
];

// ============================================================
// STYLES
// ============================================================
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&family=Inter:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  :root {
    --bg: #050508;
    --bg2: #0a0a12;
    --card: rgba(255,255,255,0.04);
    --card-border: rgba(255,255,255,0.08);
    --cyan: #06b6d4;
    --blue: #3b82f6;
    --purple: #8b5cf6;
    --text: #f1f5f9;
    --text2: #94a3b8;
    --glow-cyan: 0 0 20px rgba(6,182,212,0.3);
    --glow-purple: 0 0 20px rgba(139,92,246,0.3);
  }

  body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; }
  
  .font-syne { font-family: 'Syne', sans-serif; }
  .font-mono { font-family: 'JetBrains Mono', monospace; }

  .glass {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
  }

  .glass-hover:hover {
    background: rgba(255,255,255,0.07);
    border-color: rgba(6,182,212,0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(6,182,212,0.15);
  }

  .btn-primary {
    background: linear-gradient(135deg, #06b6d4, #8b5cf6);
    border: none;
    color: white;
    padding: 12px 28px;
    border-radius: 12px;
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(6,182,212,0.4);
  }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .btn-ghost {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.15);
    color: var(--text2);
    padding: 10px 24px;
    border-radius: 12px;
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .btn-ghost:hover {
    border-color: var(--cyan);
    color: var(--cyan);
    background: rgba(6,182,212,0.05);
  }

  .neon-text {
    background: linear-gradient(135deg, #06b6d4, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .sidebar-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--text2);
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
  }
  .sidebar-item:hover, .sidebar-item.active {
    background: rgba(6,182,212,0.1);
    color: var(--cyan);
    border-left: 2px solid var(--cyan);
  }

  .input-field {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 12px 16px;
    color: var(--text);
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    width: 100%;
    outline: none;
    transition: border-color 0.2s;
  }
  .input-field:focus { border-color: var(--cyan); box-shadow: 0 0 0 3px rgba(6,182,212,0.1); }
  .input-field::placeholder { color: var(--text2); }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
  }

  .progress-bar {
    height: 6px;
    background: rgba(255,255,255,0.08);
    border-radius: 10px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #06b6d4, #8b5cf6);
    border-radius: 10px;
    transition: width 1s ease;
  }

  .chat-bubble-user {
    background: linear-gradient(135deg, #06b6d4, #3b82f6);
    color: white;
    padding: 10px 16px;
    border-radius: 16px 16px 4px 16px;
    max-width: 80%;
    font-size: 14px;
    line-height: 1.6;
  }
  .chat-bubble-ai {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: var(--text);
    padding: 10px 16px;
    border-radius: 16px 16px 16px 4px;
    max-width: 80%;
    font-size: 14px;
    line-height: 1.6;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.3); border-radius: 10px; }

  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(6,182,212,0.2); }
    50% { box-shadow: 0 0 40px rgba(6,182,212,0.5); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .animate-fadeup { animation: fadeUp 0.5s ease forwards; }
  .spinner { animation: spin 1s linear infinite; }

  .kanban-col {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 16px;
    min-height: 400px;
    flex: 1;
  }
  .kanban-card {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 14px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .kanban-card:hover { border-color: rgba(6,182,212,0.4); background: rgba(6,182,212,0.05); }

  .typing-dots span {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--cyan);
    margin: 0 2px;
    animation: bounce 1.2s infinite;
  }
  .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-8px); }
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(8px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .nav-link {
    color: var(--text2);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: color 0.2s;
  }
  .nav-link:hover { color: var(--text); }

  select.input-field option { background: #0a0a12; }

  .tooltip-custom {
    background: rgba(10,10,18,0.95);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
  }
`;

// ============================================================
// UTILITY COMPONENTS
// ============================================================
const Spinner = () => (
  <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);

const Badge = ({ children, color = "#06b6d4" }) => (
  <span className="badge" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
    {children}
  </span>
);

const ProgressBar = ({ value, max = 100, color = "linear-gradient(90deg, #06b6d4, #8b5cf6)" }) => (
  <div className="progress-bar">
    <div className="progress-fill" style={{ width: `${(value / max) * 100}%`, background: color }} />
  </div>
);

const GlassCard = ({ children, style = {}, className = "", onClick }) => (
  <div className={`glass ${className}`} style={{ padding: 24, ...style }} onClick={onClick}>{children}</div>
);

const Modal = ({ open, onClose, children, title }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass animate-fadeup" style={{ maxWidth: 600, width: "100%", padding: 32, position: "relative", maxHeight: "85vh", overflowY: "auto" }}>
        {title && <h2 className="font-syne" style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>{title}</h2>}
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: 20 }}>✕</button>
        {children}
      </div>
    </div>
  );
};

const Avatar = ({ initials, size = 36, color = "#06b6d4" }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: `${color}30`, border: `2px solid ${color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, color, fontFamily: "Syne, sans-serif", flexShrink: 0 }}>
    {initials}
  </div>
);

const LoadingState = ({ text = "Loading..." }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "40px 0", color: "var(--text2)" }}>
    <Spinner /> <span>{text}</span>
  </div>
);

const EmptyState = ({ icon = "📭", title, desc }) => (
  <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text2)" }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
    <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 14 }}>{desc}</div>
  </div>
);

const AIBadge = () => (
  <span style={{ background: "linear-gradient(135deg, #06b6d420, #8b5cf620)", border: "1px solid rgba(6,182,212,0.3)", color: "#06b6d4", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: "JetBrains Mono" }}>
    ✦ AI
  </span>
);

// ============================================================
// PAGES
// ============================================================

// --- LANDING PAGE ---
const LandingPage = ({ onNavigate }) => {
  const [currentDomain, setCurrentDomain] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCurrentDomain(p => (p + 1) % DOMAINS.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 20% 50%, rgba(6,182,212,0.05) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.05) 0%, transparent 60%), #050508" }}>
      {/* NAV */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 60px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="font-syne" style={{ fontSize: 24, fontWeight: 800 }}>
          <span className="neon-text">Domain</span><span style={{ color: "#fff" }}>X</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="nav-link" onClick={() => onNavigate("pricing")}>Pricing</span>
          <span className="nav-link" onClick={() => onNavigate("leaderboard")}>Leaderboard</span>
          <button className="btn-ghost" onClick={() => onNavigate("login")} style={{ padding: "8px 20px" }}>Login</button>
          <button className="btn-primary" onClick={() => onNavigate("signup")} style={{ padding: "8px 20px" }}>Get Started</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: "center", padding: "120px 20px 80px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <Badge color="#06b6d4">✦ AI-Powered Career Platform</Badge>
        </div>
        <h1 className="font-syne" style={{ fontSize: "clamp(42px, 7vw, 80px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 24 }}>
          Find Your <span className="neon-text">Tech Path.</span><br />Build Your <span style={{ color: "#8b5cf6" }}>Future.</span>
        </h1>
        <p style={{ fontSize: 18, color: "var(--text2)", maxWidth: 600, margin: "0 auto 40px", lineHeight: 1.8 }}>
          DomainX uses AI to discover your ideal tech domain, build personalized roadmaps, simulate real internships, and accelerate your career.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={() => onNavigate("signup")} style={{ padding: "14px 36px", fontSize: 16 }}>
            Start Your Journey →
          </button>
          <button className="btn-ghost" onClick={() => onNavigate("domain-discovery")} style={{ padding: "14px 36px", fontSize: 16 }}>
            Discover Domains
          </button>
        </div>

        {/* Floating domain pills */}
        <div style={{ marginTop: 60, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {DOMAINS.map((d, i) => (
            <div key={d.id} className="glass" style={{ padding: "8px 16px", transition: "all 0.3s", background: i === currentDomain ? `${d.color}20` : undefined, borderColor: i === currentDomain ? d.color : undefined }}>
              <span style={{ marginRight: 6 }}>{d.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: i === currentDomain ? d.color : "var(--text2)" }}>{d.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: "80px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <h2 className="font-syne" style={{ textAlign: "center", fontSize: 36, fontWeight: 700, marginBottom: 60 }}>Everything You Need to <span className="neon-text">Succeed</span></h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {[
            { icon: "🤖", title: "AI Domain Discovery", desc: "Advanced AI analyzes your skills, interests, and goals to match you with the perfect tech domain", badge: "AI Powered" },
            { icon: "🗺️", title: "Smart Roadmaps", desc: "AI-generated personalized learning paths with milestones, projects, and certifications", badge: "Personalized" },
            { icon: "💼", title: "Internship Simulator", desc: "Real-world project simulation with Kanban boards and readiness scoring", badge: "Hands-on" },
            { icon: "🏆", title: "Live Leaderboard", desc: "Compete with peers, earn XP, badges and climb the global rankings", badge: "Gamified" },
            { icon: "📄", title: "Resume Builder", desc: "Auto-generate ATS-optimized resumes from your progress and achievements", badge: "One-click" },
            { icon: "🤖", title: "X-Guide AI", desc: "24/7 AI mentor that knows your progress, weaknesses, and gives personalized advice", badge: "AI Mentor" },
          ].map((f, i) => (
            <GlassCard key={i} className="glass-hover" style={{ cursor: "pointer", transition: "all 0.3s" }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <h3 className="font-syne" style={{ fontSize: 18, fontWeight: 700 }}>{f.title}</h3>
                <Badge color="#06b6d4">{f.badge}</Badge>
              </div>
              <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.7 }}>{f.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: "60px 40px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 32 }}>
          {[["50,000+", "Students"], ["8", "Tech Domains"], ["95%", "Success Rate"], ["4.9★", "Rating"]].map(([val, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div className="font-syne neon-text" style={{ fontSize: 42, fontWeight: 800 }}>{val}</div>
              <div style={{ color: "var(--text2)", fontSize: 14 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: "center", padding: "100px 20px" }}>
        <h2 className="font-syne" style={{ fontSize: 42, fontWeight: 800, marginBottom: 20 }}>Ready to Find Your <span className="neon-text">Domain?</span></h2>
        <p style={{ color: "var(--text2)", marginBottom: 32, fontSize: 16 }}>Join thousands of students who found their path with DomainX</p>
        <button className="btn-primary" onClick={() => onNavigate("signup")} style={{ padding: "16px 48px", fontSize: 18 }}>
          Get Started Free →
        </button>
      </section>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "30px 60px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--text2)", fontSize: 13 }}>
        <div className="font-syne" style={{ fontWeight: 700 }}><span className="neon-text">Domain</span>X</div>
        <div>© 2025 DomainX. All rights reserved.</div>
        <div style={{ display: "flex", gap: 20 }}>
          <span className="nav-link" onClick={() => onNavigate("pricing")}>Pricing</span>
          <span className="nav-link">Privacy</span>
          <span className="nav-link">Terms</span>
        </div>
      </footer>
    </div>
  );
};

// --- AUTH PAGES ---
const AuthPage = ({ type, onNavigate, onAuth }) => {
  const [form, setForm] = useState({ email: "", password: "", name: "", college: "", year: "1st Year" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    if (!form.email || !form.password) { setError("Please fill all required fields"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    const user = { id: "user_1", email: form.email, name: form.name || "Student", college: form.college || "MIT", year: form.year, plan: "free", xp: 0, level: 1, streak: 0 };
    onAuth(user);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.08) 0%, transparent 60%), #050508", padding: 20 }}>
      <div className="glass animate-fadeup" style={{ width: "100%", maxWidth: 460, padding: 48 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div className="font-syne" style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            <span className="neon-text">Domain</span><span>X</span>
          </div>
          <h1 className="font-syne" style={{ fontSize: 24, fontWeight: 700 }}>{type === "login" ? "Welcome back" : "Create account"}</h1>
          <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 6 }}>
            {type === "login" ? "Continue your journey" : "Start your tech career journey"}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {type === "signup" && (
            <>
              <div>
                <label style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6, display: "block" }}>Full Name</label>
                <input className="input-field" placeholder="Aryan Sharma" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6, display: "block" }}>College</label>
                <input className="input-field" placeholder="IIT Bombay" value={form.college} onChange={e => setForm({ ...form, college: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6, display: "block" }}>Year</label>
                <select className="input-field" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}>
                  {["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduate"].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
            </>
          )}
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6, display: "block" }}>Email</label>
            <input className="input-field" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6, display: "block" }}>Password</label>
            <input className="input-field" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
        </div>

        {error && <div style={{ color: "#ef4444", fontSize: 13, marginTop: 12, padding: "8px 12px", background: "rgba(239,68,68,0.1)", borderRadius: 8 }}>{error}</div>}

        <button className="btn-primary" onClick={handle} disabled={loading} style={{ width: "100%", marginTop: 24, padding: 14 }}>
          {loading ? <><Spinner /> &nbsp; Please wait...</> : (type === "login" ? "Sign In" : "Create Account")}
        </button>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text2)", marginTop: 20 }}>
          {type === "login" ? "Don't have an account? " : "Already have an account? "}
          <span style={{ color: "var(--cyan)", cursor: "pointer", fontWeight: 600 }} onClick={() => onNavigate(type === "login" ? "signup" : "login")}>
            {type === "login" ? "Sign up" : "Sign in"}
          </span>
        </p>
        <p style={{ textAlign: "center", marginTop: 12 }}>
          <span style={{ color: "var(--text2)", fontSize: 12, cursor: "pointer" }} onClick={() => onNavigate("landing")}>← Back to home</span>
        </p>
      </div>
    </div>
  );
};

// --- DOMAIN DISCOVERY ---
const DomainDiscovery = ({ onNavigate, user, updateUser }) => {
  const [mode, setMode] = useState(null);
  const [selected, setSelected] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecs, setAiRecs] = useState(null);
  const [interests, setInterests] = useState("");
  const [skills, setSkills] = useState("");

  const getAIRecommendation = async () => {
    setAiLoading(true);
    try {
      const result = await callClaude([{
        role: "user",
        content: `Based on these interests: "${interests}" and skills: "${skills}", recommend the top 3 tech domains from: AI/ML, Web Dev, Cybersecurity, Data Science, App Dev, Cloud, UI/UX, DevOps. For each domain give a match percentage and 2-line reason. Format as JSON array: [{"domain":"...","match":85,"reason":"..."}]`
      }], "You are a career guidance AI. Respond ONLY with valid JSON array, no markdown, no extra text.");
      const cleaned = result.replace(/```json|```/g, "").trim();
      setAiRecs(JSON.parse(cleaned));
    } catch (e) {
      setAiRecs([
        { domain: "AI/ML", match: 88, reason: "Your analytical mindset and interest in problem-solving aligns perfectly with machine learning." },
        { domain: "Data Science", match: 76, reason: "Strong data intuition and statistical thinking makes you a great fit." },
        { domain: "Web Dev", match: 65, reason: "Creative inclination and logic skills suit full-stack development well." }
      ]);
    }
    setAiLoading(false);
  };

  const proceed = (domainId) => {
    updateUser({ selectedDomain: domainId });
    onNavigate("quiz");
  };

  if (!mode) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "#050508" }}>
      <div style={{ maxWidth: 700, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🧭</div>
        <h1 className="font-syne" style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Domain <span className="neon-text">Discovery</span></h1>
        <p style={{ color: "var(--text2)", marginBottom: 40 }}>How would you like to find your ideal tech domain?</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <GlassCard className="glass-hover" style={{ cursor: "pointer", textAlign: "center" }} onClick={() => setMode("browse")}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗂️</div>
            <h3 className="font-syne" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Browse Domains</h3>
            <p style={{ fontSize: 13, color: "var(--text2)" }}>Explore all 8 tech domains and choose what interests you</p>
          </GlassCard>
          <GlassCard className="glass-hover" style={{ cursor: "pointer", textAlign: "center" }} onClick={() => setMode("ai")}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
              <h3 className="font-syne" style={{ fontSize: 18, fontWeight: 700 }}>AI Recommend</h3>
              <AIBadge />
            </div>
            <p style={{ fontSize: 13, color: "var(--text2)" }}>Tell AI your interests and get personalized recommendations</p>
          </GlassCard>
        </div>
        <p style={{ marginTop: 20, color: "var(--text2)", fontSize: 13 }}>
          <span style={{ color: "var(--cyan)", cursor: "pointer" }} onClick={() => onNavigate("dashboard")}>← Back to Dashboard</span>
        </p>
      </div>
    </div>
  );

  if (mode === "ai") return (
    <div style={{ minHeight: "100vh", padding: "40px 20px", background: "#050508", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: 700, width: "100%" }}>
        <button onClick={() => setMode(null)} className="btn-ghost" style={{ marginBottom: 24 }}>← Back</button>
        <GlassCard>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <h2 className="font-syne" style={{ fontSize: 24, fontWeight: 700 }}>AI Domain Matcher</h2>
            <AIBadge />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 13, color: "var(--text2)", marginBottom: 6, display: "block" }}>What are your interests? (e.g., mathematics, design, problem solving)</label>
              <textarea className="input-field" rows={3} placeholder="I enjoy building things, solving puzzles, working with data..." value={interests} onChange={e => setInterests(e.target.value)} style={{ resize: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "var(--text2)", marginBottom: 6, display: "block" }}>Current skills (e.g., Python, HTML, math)</label>
              <input className="input-field" placeholder="Python basics, some HTML/CSS, statistics..." value={skills} onChange={e => setSkills(e.target.value)} />
            </div>
          </div>
          <button className="btn-primary" onClick={getAIRecommendation} disabled={aiLoading || !interests}>
            {aiLoading ? <><Spinner /> Analyzing...</> : "✦ Get AI Recommendations"}
          </button>

          {aiRecs && (
            <div style={{ marginTop: 28 }}>
              <h3 className="font-syne" style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Your Personalized Matches</h3>
              {aiRecs.map((rec, i) => {
                const dom = DOMAINS.find(d => d.name === rec.domain || d.id.includes(rec.domain.toLowerCase().replace(/[^a-z]/g, "")));
                return (
                  <div key={i} className="glass" style={{ padding: 20, marginBottom: 12, background: i === 0 ? "rgba(6,182,212,0.05)" : undefined, borderColor: i === 0 ? "rgba(6,182,212,0.3)" : undefined }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {i === 0 && <Badge color="#f59e0b">🏆 Top Match</Badge>}
                        <span className="font-syne" style={{ fontSize: 16, fontWeight: 700 }}>{rec.domain}</span>
                      </div>
                      <span style={{ fontFamily: "JetBrains Mono", fontSize: 20, fontWeight: 700, color: "#06b6d4" }}>{rec.match}%</span>
                    </div>
                    <ProgressBar value={rec.match} />
                    <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 10, lineHeight: 1.6 }}>{rec.reason}</p>
                    <button className="btn-primary" onClick={() => proceed(dom?.id || rec.domain.toLowerCase().replace(/\s+/g, "_"))} style={{ marginTop: 12, padding: "8px 20px", fontSize: 13 }}>
                      Choose {rec.domain} →
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", padding: "40px 20px", background: "#050508" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <button onClick={() => setMode(null)} className="btn-ghost" style={{ marginBottom: 24 }}>← Back</button>
        <h2 className="font-syne" style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Choose Your <span className="neon-text">Domain</span></h2>
        <p style={{ color: "var(--text2)", marginBottom: 32 }}>Select the tech domain that excites you most</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
          {DOMAINS.map(d => (
            <div key={d.id} className="glass glass-hover" style={{ padding: 24, cursor: "pointer", borderColor: selected === d.id ? d.color : undefined, background: selected === d.id ? `${d.color}10` : undefined, transition: "all 0.3s" }} onClick={() => setSelected(d.id)}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{d.icon}</div>
              <h3 className="font-syne" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: selected === d.id ? d.color : "var(--text)" }}>{d.name}</h3>
              <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{d.desc}</p>
            </div>
          ))}
        </div>
        {selected && (
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button className="btn-primary" onClick={() => proceed(selected)} style={{ padding: "14px 40px", fontSize: 16 }}>
              Continue with {DOMAINS.find(d => d.id === selected)?.name} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- QUIZ ---
const QuizPage = ({ onNavigate, user, updateUser }) => {
  const domainKey = user?.selectedDomain || "default";
  const questions = QUIZ_QUESTIONS[domainKey] || QUIZ_QUESTIONS.default;
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (finished) return;
    setTimeLeft(30);
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { handleAnswer(-1); return 30; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [current, finished]);

  const handleAnswer = (idx) => {
    const q = questions[current];
    const newAnswers = [...answers, { question: q.q, selected: idx, correct: q.correct, isCorrect: idx === q.correct }];
    setAnswers(newAnswers);
    setSelected(idx);
    setTimeout(() => {
      if (current + 1 < questions.length) {
        setCurrent(p => p + 1);
        setSelected(null);
      } else {
        const score = newAnswers.filter(a => a.isCorrect).length;
        updateUser({ quizScore: score, quizAnswers: newAnswers });
        setFinished(true);
      }
    }, 800);
  };

  if (finished) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#050508" }}>
      <GlassCard style={{ textAlign: "center", maxWidth: 500 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h2 className="font-syne" style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Quiz Complete!</h2>
        <div className="neon-text font-syne" style={{ fontSize: 56, fontWeight: 800 }}>{answers.filter(a => a.isCorrect).length}/{questions.length}</div>
        <p style={{ color: "var(--text2)", marginTop: 8 }}>Questions answered correctly</p>
        <button className="btn-primary" onClick={() => onNavigate("tasks")} style={{ marginTop: 24, width: "100%" }}>
          Continue to Tasks →
        </button>
      </GlassCard>
    </div>
  );

  const q = questions[current];
  const progress = ((current) / questions.length) * 100;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#050508", padding: 20 }}>
      <div style={{ maxWidth: 700, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <span style={{ color: "var(--text2)", fontSize: 14 }}>Question {current + 1} of {questions.length}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${timeLeft < 10 ? "#ef4444" : "#06b6d4"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="font-mono" style={{ fontSize: 13, color: timeLeft < 10 ? "#ef4444" : "#06b6d4" }}>{timeLeft}</span>
            </div>
          </div>
        </div>
        <ProgressBar value={progress} />
        <GlassCard style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 8 }}><Badge color="#8b5cf6">Difficulty {q.difficulty}</Badge></div>
          <h2 className="font-syne" style={{ fontSize: 22, fontWeight: 700, marginBottom: 28, lineHeight: 1.4 }}>{q.q}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {q.options.map((opt, i) => {
              let bg = "rgba(255,255,255,0.04)";
              let border = "rgba(255,255,255,0.1)";
              if (selected !== null) {
                if (i === q.correct) { bg = "rgba(16,185,129,0.15)"; border = "#10b981"; }
                else if (i === selected && i !== q.correct) { bg = "rgba(239,68,68,0.15)"; border = "#ef4444"; }
              }
              return (
                <button key={i} onClick={() => selected === null && handleAnswer(i)} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "14px 20px", color: "var(--text)", cursor: selected !== null ? "default" : "pointer", textAlign: "left", fontSize: 15, transition: "all 0.2s", fontFamily: "Inter" }}>
                  <span style={{ color: "var(--text2)", marginRight: 12, fontFamily: "JetBrains Mono", fontSize: 13 }}>{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

// --- MINI TASKS ---
const TasksPage = ({ onNavigate, user, updateUser }) => {
  const domainName = DOMAINS.find(d => d.id === user?.selectedDomain)?.name || "General";
  const [tasks] = useState([
    { id: 1, title: `Build a simple ${domainName} project`, difficulty: "Easy", hint: "Start with a basic example and iterate", completed: false, xp: 50 },
    { id: 2, title: `Write documentation for your code`, difficulty: "Easy", hint: "Use markdown format with clear sections", completed: false, xp: 30 },
    { id: 3, title: `Analyze a real-world ${domainName} problem`, difficulty: "Medium", hint: "Look for case studies and open datasets", completed: false, xp: 80 },
    { id: 4, title: `Implement a core ${domainName} algorithm`, difficulty: "Medium", hint: "Focus on understanding before optimizing", completed: false, xp: 100 },
    { id: 5, title: `Present your solution in 5 minutes`, difficulty: "Hard", hint: "Use diagrams and focus on the problem-solution-impact flow", completed: false, xp: 150 },
  ]);
  const [taskStates, setTaskStates] = useState(tasks.map(t => ({ ...t })));
  const [showHint, setShowHint] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHint, setAiHint] = useState({});

  const toggle = (id) => setTaskStates(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));

  const getAIHint = async (task) => {
    setAiLoading(true);
    setShowHint(task.id);
    try {
      const hint = await callClaude([{
        role: "user",
        content: `Give a detailed, practical hint for this task: "${task.title}" in the context of ${domainName}. Include specific steps and resources. Keep it under 150 words.`
      }], "You are a helpful coding mentor. Be practical and specific.");
      setAiHint(prev => ({ ...prev, [task.id]: hint }));
    } catch (e) {
      setAiHint(prev => ({ ...prev, [task.id]: task.hint }));
    }
    setAiLoading(false);
  };

  const completed = taskStates.filter(t => t.completed).length;

  return (
    <div style={{ minHeight: "100vh", background: "#050508", padding: "40px 20px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h1 className="font-syne" style={{ fontSize: 32, fontWeight: 800 }}>Mini <span className="neon-text">Tasks</span></h1>
          <Badge color="#f59e0b">{completed}/{taskStates.length} Done</Badge>
        </div>
        <p style={{ color: "var(--text2)", marginBottom: 8 }}>Domain: {domainName}</p>
        <ProgressBar value={completed} max={taskStates.length} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 28 }}>
          {taskStates.map(task => (
            <GlassCard key={task.id} style={{ opacity: task.completed ? 0.7 : 1, borderColor: task.completed ? "rgba(16,185,129,0.3)" : undefined }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <button onClick={() => toggle(task.id)} style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${task.completed ? "#10b981" : "rgba(255,255,255,0.2)"}`, background: task.completed ? "#10b981" : "transparent", cursor: "pointer", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "white" }}>
                  {task.completed && "✓"}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                    <span className="font-syne" style={{ fontSize: 16, fontWeight: 600, textDecoration: task.completed ? "line-through" : "none" }}>{task.title}</span>
                    <Badge color={task.difficulty === "Easy" ? "#10b981" : task.difficulty === "Medium" ? "#f59e0b" : "#ef4444"}>{task.difficulty}</Badge>
                    <Badge color="#8b5cf6">+{task.xp} XP</Badge>
                  </div>
                  {showHint === task.id && (
                    <div style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 10, padding: "12px 16px", marginTop: 8 }}>
                      {aiLoading && !aiHint[task.id] ? <div className="typing-dots"><span/><span/><span/></div> : <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>{aiHint[task.id] || task.hint}</p>}
                    </div>
                  )}
                  <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                    <button onClick={() => showHint === task.id ? setShowHint(null) : getAIHint(task)} className="btn-ghost" style={{ padding: "5px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                      <AIBadge /> {showHint === task.id ? "Hide Hint" : "AI Hint"}
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button className="btn-primary" onClick={() => { updateUser({ tasksCompleted: completed }); onNavigate("results"); }} style={{ padding: "14px 40px" }}>
            View Results →
          </button>
        </div>
      </div>
    </div>
  );
};

// --- RESULTS ---
const ResultsPage = ({ onNavigate, user }) => {
  const score = user?.quizScore || 3;
  const total = 5;
  const percent = Math.round((score / total) * 100);
  const domain = DOMAINS.find(d => d.id === user?.selectedDomain) || DOMAINS[0];

  const chartData = DOMAINS.slice(0, 5).map((d, i) => ({
    name: d.name.length > 8 ? d.name.slice(0, 8) : d.name,
    score: i === 0 ? percent : Math.floor(Math.random() * 40) + 20,
    fill: d.color,
  }));

  return (
    <div style={{ minHeight: "100vh", background: "#050508", padding: "40px 20px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 className="font-syne" style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, textAlign: "center" }}>Your <span className="neon-text">Results</span></h1>
        <p style={{ textAlign: "center", color: "var(--text2)", marginBottom: 40 }}>Based on your quiz and task performance</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
          <GlassCard style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{domain.icon}</div>
            <h2 className="font-syne" style={{ fontSize: 24, fontWeight: 700, color: domain.color }}>{domain.name}</h2>
            <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 4 }}>Top Matched Domain</p>
            <div className="font-syne neon-text" style={{ fontSize: 56, fontWeight: 800, marginTop: 12 }}>{percent}%</div>
            <p style={{ color: "var(--text2)", fontSize: 13 }}>Match Score</p>
          </GlassCard>
          <GlassCard>
            <h3 className="font-syne" style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Domain Comparison</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ background: "#0a0a12", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="score" fill="#06b6d4" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
          <GlassCard>
            <h3 className="font-syne" style={{ fontWeight: 700, marginBottom: 16, color: "#10b981" }}>💪 Strengths</h3>
            {["Problem solving", "Logical thinking", "Quick learner"].map(s => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ color: "#10b981" }}>✓</span>
                <span style={{ fontSize: 14 }}>{s}</span>
              </div>
            ))}
          </GlassCard>
          <GlassCard>
            <h3 className="font-syne" style={{ fontWeight: 700, marginBottom: 16, color: "#f59e0b" }}>📈 Areas to Improve</h3>
            {["Mathematics fundamentals", "Version control", "Project experience"].map(s => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ color: "#f59e0b" }}>→</span>
                <span style={{ fontSize: 14 }}>{s}</span>
              </div>
            ))}
          </GlassCard>
        </div>

        <div style={{ textAlign: "center" }}>
          <button className="btn-primary" onClick={() => onNavigate("goal")} style={{ padding: "14px 40px" }}>
            Set Your Goal →
          </button>
        </div>
      </div>
    </div>
  );
};

// --- GOAL & DURATION ---
const GoalPage = ({ onNavigate, updateUser }) => {
  const [goal, setGoal] = useState(null);
  const [duration, setDuration] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: "#050508", padding: "60px 20px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1 className="font-syne" style={{ fontSize: 36, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>Set Your <span className="neon-text">Goal</span></h1>
        <p style={{ textAlign: "center", color: "var(--text2)", marginBottom: 48 }}>This helps us personalize your learning roadmap</p>

        <div style={{ marginBottom: 40 }}>
          <h3 className="font-syne" style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>What's your primary goal?</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 16 }}>
            {GOALS.map(g => (
              <div key={g.id} className="glass glass-hover" style={{ padding: 20, textAlign: "center", cursor: "pointer", borderColor: goal === g.id ? "#06b6d4" : undefined, background: goal === g.id ? "rgba(6,182,212,0.1)" : undefined, transition: "all 0.3s" }} onClick={() => setGoal(g.id)}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{g.icon}</div>
                <div className="font-syne" style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{g.name}</div>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>{g.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 40 }}>
          <h3 className="font-syne" style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Learning Duration</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {DURATIONS.map(d => (
              <button key={d} onClick={() => setDuration(d)} style={{ background: duration === d ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${duration === d ? "#06b6d4" : "rgba(255,255,255,0.1)"}`, color: duration === d ? "#06b6d4" : "var(--text)", padding: "12px 24px", borderRadius: 12, cursor: "pointer", fontFamily: "Syne", fontWeight: 600, fontSize: 14, transition: "all 0.2s" }}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <button className="btn-primary" disabled={!goal || !duration} onClick={() => { updateUser({ goal, duration }); onNavigate("roadmap"); }} style={{ padding: "14px 40px" }}>
            Generate Roadmap →
          </button>
        </div>
      </div>
    </div>
  );
};

// --- ROADMAP ---
const RoadmapPage = ({ onNavigate, user }) => {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dailyHours, setDailyHours] = useState(2);
  const domain = DOMAINS.find(d => d.id === user?.selectedDomain)?.name || "Web Dev";
  const goal = user?.goal || "job";
  const duration = user?.duration || "6 months";

  const generateRoadmap = async () => {
    setLoading(true);
    try {
      const result = await callClaude([{
        role: "user",
        content: `Create a detailed learning roadmap for: Domain: ${domain}, Goal: ${goal}, Duration: ${duration}, Daily hours: ${dailyHours}. Include 5-6 phases/weeks with: phase name, key topics (3-4), main project, milestone, mistake to avoid, certification. Format as JSON: {"phases":[{"phase":"Phase 1","title":"...","topics":["..."],"project":"...","milestone":"...","mistake":"...","cert":"...","weeks":2}]}`
      }], "You are a career roadmap expert. Respond ONLY with valid JSON. No markdown. No extra text.", 1500);
      const cleaned = result.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setRoadmap(parsed.phases || parsed);
    } catch (e) {
      setRoadmap([
        { phase: "Phase 1", title: "Foundation", topics: ["Core concepts", "Setup & tools", "Basic syntax", "First project"], project: "Hello World App", milestone: "Run your first program", mistake: "Skipping fundamentals", cert: "None yet", weeks: 2 },
        { phase: "Phase 2", title: "Core Skills", topics: ["Data structures", "Algorithms", "Libraries", "APIs"], project: "CRUD Application", milestone: "Build a working API", mistake: "Copy-pasting without understanding", cert: "Beginner Certificate", weeks: 3 },
        { phase: "Phase 3", title: "Advanced Topics", topics: ["Architecture patterns", "Testing", "Performance", "Security"], project: "Full Project", milestone: "Deploy to production", mistake: "Ignoring testing", cert: "Intermediate Course", weeks: 4 },
        { phase: "Phase 4", title: "Real World", topics: ["Industry tools", "Collaboration", "Code review", "CI/CD"], project: "Open Source Contribution", milestone: "PR merged", mistake: "Working in isolation", cert: "Cloud/Domain cert", weeks: 3 },
        { phase: "Phase 5", title: "Portfolio & Jobs", topics: ["Portfolio projects", "Resume", "Interview prep", "Networking"], project: "Capstone Project", milestone: "First interview", mistake: "Applying too early", cert: "Professional Certification", weeks: 4 },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => { generateRoadmap(); }, []);

  const colors = ["#06b6d4", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#3b82f6"];

  return (
    <div style={{ minHeight: "100vh", background: "#050508", padding: "40px 20px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
          <h1 className="font-syne" style={{ fontSize: 32, fontWeight: 800 }}>Your <span className="neon-text">Roadmap</span></h1>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <AIBadge />
            <span style={{ fontSize: 14, color: "var(--text2)" }}>AI Generated</span>
            <button className="btn-ghost" onClick={generateRoadmap} style={{ padding: "8px 16px", fontSize: 13 }}>↻ Regenerate</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
          <Badge color="#06b6d4">{domain}</Badge>
          <Badge color="#8b5cf6">{goal}</Badge>
          <Badge color="#f59e0b">{duration}</Badge>
        </div>

        <GlassCard style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div>
              <label style={{ fontSize: 13, color: "var(--text2)", display: "block", marginBottom: 4 }}>Daily Study Hours</label>
              <input type="range" min={1} max={8} value={dailyHours} onChange={e => setDailyHours(Number(e.target.value))} style={{ width: 140, accentColor: "#06b6d4" }} />
              <span className="font-mono" style={{ marginLeft: 8, color: "#06b6d4", fontSize: 14 }}>{dailyHours}h/day</span>
            </div>
            <button className="btn-primary" onClick={generateRoadmap} style={{ padding: "8px 20px", fontSize: 13 }}>
              ✦ Recalculate
            </button>
          </div>
        </GlassCard>

        {loading ? <LoadingState text="AI generating your personalized roadmap..." /> : roadmap && (
          <div style={{ position: "relative" }}>
            {roadmap.map((phase, i) => (
              <div key={i} style={{ display: "flex", gap: 20, marginBottom: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${colors[i % colors.length]}20`, border: `2px solid ${colors[i % colors.length]}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span className="font-mono" style={{ fontSize: 13, color: colors[i % colors.length], fontWeight: 700 }}>{i + 1}</span>
                  </div>
                  {i < roadmap.length - 1 && <div style={{ width: 2, flex: 1, background: `${colors[i % colors.length]}30`, minHeight: 20, marginTop: 4 }} />}
                </div>
                <GlassCard style={{ flex: 1, borderColor: `${colors[i % colors.length]}20` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <span style={{ color: colors[i % colors.length], fontSize: 12, fontWeight: 700, fontFamily: "JetBrains Mono" }}>{phase.phase}</span>
                      <h3 className="font-syne" style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{phase.title}</h3>
                    </div>
                    <Badge color={colors[i % colors.length]}>{phase.weeks} weeks</Badge>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6, fontWeight: 600 }}>TOPICS</p>
                      {(phase.topics || []).map((t, j) => <div key={j} style={{ fontSize: 13, color: "var(--text)", padding: "2px 0", display: "flex", gap: 6 }}><span style={{ color: colors[i % colors.length] }}>→</span>{t}</div>)}
                    </div>
                    <div>
                      <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6, fontWeight: 600 }}>PROJECT</p>
                      <p style={{ fontSize: 13 }}>{phase.project}</p>
                      <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4, fontWeight: 600, marginTop: 10 }}>MILESTONE</p>
                      <p style={{ fontSize: 13, color: "#10b981" }}>✓ {phase.milestone}</p>
                    </div>
                  </div>
                  {phase.cert && phase.cert !== "None yet" && (
                    <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, display: "flex", gap: 8, alignItems: "center" }}>
                      <span>🏅</span>
                      <span style={{ fontSize: 13, color: "#f59e0b" }}>{phase.cert}</span>
                    </div>
                  )}
                  {phase.mistake && (
                    <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, display: "flex", gap: 8, alignItems: "center" }}>
                      <span>⚠️</span>
                      <span style={{ fontSize: 13, color: "#ef4444" }}>Avoid: {phase.mistake}</span>
                    </div>
                  )}
                </GlassCard>
              </div>
            ))}
          </div>
        )}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button className="btn-primary" onClick={() => onNavigate("dashboard")} style={{ padding: "14px 40px" }}>
            Go to Dashboard →
          </button>
        </div>
      </div>
    </div>
  );
};

// --- DASHBOARD ---
const DashboardPage = ({ onNavigate, user }) => {
  const domain = DOMAINS.find(d => d.id === user?.selectedDomain) || DOMAINS[0];
  const progressData = [
    { name: "Week 1", progress: 20 }, { name: "Week 2", progress: 45 }, { name: "Week 3", progress: 60 },
    { name: "Week 4", progress: 72 }, { name: "Week 5", progress: 85 }, { name: "Week 6", progress: user?.progress || 78 },
  ];
  const skills = [
    { subject: "Theory", A: 80, fullMark: 100 }, { subject: "Practice", A: 65, fullMark: 100 },
    { subject: "Projects", A: 55, fullMark: 100 }, { subject: "Collab", A: 70, fullMark: 100 },
    { subject: "Problem Solving", A: 85, fullMark: 100 },
  ];

  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="font-syne" style={{ fontSize: 28, fontWeight: 800 }}>Dashboard <span style={{ color: domain.color }}>{domain.icon}</span></h1>
        <p style={{ color: "var(--text2)", fontSize: 14 }}>Welcome back, {user?.name}! Keep up the momentum.</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Overall Progress", value: "78%", icon: "📈", color: "#06b6d4" },
          { label: "Day Streak", value: `${user?.streak || 7}🔥`, icon: "⚡", color: "#f59e0b" },
          { label: "XP Points", value: `${user?.xp || 2450}`, icon: "⭐", color: "#8b5cf6" },
          { label: "Level", value: `Lv.${user?.level || 3}`, icon: "🏅", color: "#10b981" },
        ].map((s, i) => (
          <GlassCard key={i} style={{ textAlign: "center", padding: 20 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
            <div className="font-syne" style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>{s.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
        <GlassCard>
          <h3 className="font-syne" style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Progress Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ background: "#0a0a12", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="progress" stroke="#06b6d4" strokeWidth={2} dot={{ fill: "#06b6d4", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
        <GlassCard>
          <h3 className="font-syne" style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Skill Radar</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={skills}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Radar name="Skills" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
        {[
          { label: "Continue Roadmap", icon: "🗺️", page: "roadmap", color: "#06b6d4" },
          { label: "Internship Sim", icon: "💼", page: "internship", color: "#8b5cf6" },
          { label: "Skill Gap", icon: "📊", page: "skill-gap", color: "#f59e0b" },
          { label: "Resume Builder", icon: "📄", page: "resume", color: "#10b981" },
          { label: "Ask X-Guide", icon: "🤖", page: "ai-guide", color: "#ef4444" },
          { label: "Leaderboard", icon: "🏆", page: "leaderboard", color: "#3b82f6" },
        ].map((a, i) => (
          <GlassCard key={i} className="glass-hover" style={{ padding: 20, textAlign: "center", cursor: "pointer" }} onClick={() => onNavigate(a.page)}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{a.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: a.color }}>{a.label}</div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

// --- SKILL GAP ANALYZER ---
const SkillGapPage = ({ user }) => {
  const domain = DOMAINS.find(d => d.id === user?.selectedDomain)?.name || "Web Dev";
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [currentSkills, setCurrentSkills] = useState("");

  const analyze = async () => {
    setLoading(true);
    try {
      const result = await callClaude([{
        role: "user",
        content: `Analyze skill gap for ${domain} domain. User's current skills: "${currentSkills || "beginner level"}". List required skills vs current skills. Format as JSON: {"required":[{"skill":"...","priority":"High/Med/Low","learned":false}],"current":[{"skill":"...","level":70}],"recommendations":["action1","action2","action3"]}`
      }], "You are a skills assessment expert. Return ONLY valid JSON.", 1200);
      const parsed = JSON.parse(result.replace(/```json|```/g, "").trim());
      setAnalysis(parsed);
    } catch (e) {
      setAnalysis({
        required: [
          { skill: "JavaScript/TypeScript", priority: "High", learned: true },
          { skill: "React/Vue/Angular", priority: "High", learned: true },
          { skill: "Node.js", priority: "High", learned: false },
          { skill: "Databases (SQL/NoSQL)", priority: "High", learned: false },
          { skill: "REST API Design", priority: "Med", learned: false },
          { skill: "Docker/Kubernetes", priority: "Med", learned: false },
          { skill: "Testing (Jest, Cypress)", priority: "Med", learned: false },
          { skill: "CI/CD Pipelines", priority: "Low", learned: false },
        ],
        current: [
          { skill: "HTML/CSS", level: 85 }, { skill: "JavaScript", level: 65 },
          { skill: "React", level: 50 }, { skill: "Git", level: 70 },
        ],
        recommendations: [
          "Complete Node.js crash course on freeCodeCamp", "Build 2 REST APIs with Express.js this week",
          "Learn MongoDB Atlas for 1 project", "Set up Jest for your existing projects",
        ]
      });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <h1 className="font-syne" style={{ fontSize: 28, fontWeight: 800 }}>Skill Gap <span className="neon-text">Analyzer</span></h1>
        <AIBadge />
      </div>

      <GlassCard style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 13, color: "var(--text2)", display: "block", marginBottom: 8 }}>What skills do you currently have? (optional)</label>
        <div style={{ display: "flex", gap: 12 }}>
          <input className="input-field" value={currentSkills} onChange={e => setCurrentSkills(e.target.value)} placeholder="e.g., HTML, CSS, basic JavaScript, Python..." style={{ flex: 1 }} />
          <button className="btn-primary" onClick={analyze} disabled={loading} style={{ whiteSpace: "nowrap" }}>
            {loading ? <Spinner /> : "✦ Analyze Gap"}
          </button>
        </div>
      </GlassCard>

      {!analysis && !loading && <div style={{ textAlign: "center", padding: "40px 0" }}><button className="btn-primary" onClick={analyze}>Analyze My Skills</button></div>}
      {loading && <LoadingState text="AI analyzing your skill gap..." />}

      {analysis && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <GlassCard>
            <h3 className="font-syne" style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Required Skills for {domain}</h3>
            {(analysis.required || []).map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{s.learned ? "✅" : "❌"}</span>
                  <span style={{ fontSize: 14 }}>{s.skill}</span>
                </div>
                <Badge color={s.priority === "High" ? "#ef4444" : s.priority === "Med" ? "#f59e0b" : "#10b981"}>{s.priority}</Badge>
              </div>
            ))}
          </GlassCard>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <GlassCard>
              <h3 className="font-syne" style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Your Current Skills</h3>
              {(analysis.current || []).map((s, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13 }}>{s.skill}</span>
                    <span className="font-mono" style={{ fontSize: 12, color: "#06b6d4" }}>{s.level}%</span>
                  </div>
                  <ProgressBar value={s.level} />
                </div>
              ))}
            </GlassCard>
            <GlassCard>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <h3 className="font-syne" style={{ fontSize: 16, fontWeight: 700 }}>AI Recommendations</h3>
                <AIBadge />
              </div>
              {(analysis.recommendations || []).map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, padding: "8px 12px", background: "rgba(6,182,212,0.05)", borderRadius: 8, border: "1px solid rgba(6,182,212,0.1)" }}>
                  <span style={{ color: "#06b6d4" }}>→</span>
                  <span style={{ fontSize: 13, lineHeight: 1.5 }}>{r}</span>
                </div>
              ))}
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
};

// --- INTERNSHIP SIMULATOR ---
const InternshipPage = ({ user }) => {
  const domain = DOMAINS.find(d => d.id === user?.selectedDomain)?.name || "Web Dev";
  const [columns, setColumns] = useState({
    todo: [
      { id: 1, title: `Research ${domain} industry trends`, priority: "High", xp: 50 },
      { id: 2, title: "Set up development environment", priority: "Medium", xp: 30 },
      { id: 3, title: "Review codebase documentation", priority: "Low", xp: 20 },
    ],
    inprogress: [
      { id: 4, title: "Build feature module", priority: "High", xp: 80 },
    ],
    review: [
      { id: 5, title: "API integration spec", priority: "Medium", xp: 60 },
    ],
    done: [
      { id: 6, title: "Onboarding tasks complete", priority: "Low", xp: 40 },
    ],
  });
  const [dragging, setDragging] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTask, setAiTask] = useState("");
  const [readiness, setReadiness] = useState(65);

  const moveCard = (cardId, fromCol, toCol) => {
    const card = columns[fromCol].find(c => c.id === cardId);
    if (!card) return;
    setColumns(prev => ({
      ...prev,
      [fromCol]: prev[fromCol].filter(c => c.id !== cardId),
      [toCol]: [...prev[toCol], card],
    }));
    if (toCol === "done") setReadiness(p => Math.min(100, p + 5));
  };

  const getAITask = async () => {
    setAiLoading(true);
    try {
      const result = await callClaude([{ role: "user", content: `Generate a realistic internship task for a ${domain} intern. Give title (under 60 chars) and priority (High/Medium/Low). Format: {"title":"...","priority":"..."}` }], "You are a tech team lead. Return ONLY valid JSON.");
      const parsed = JSON.parse(result.replace(/```json|```/g, "").trim());
      setAiTask(parsed.title);
      const newCard = { id: Date.now(), title: parsed.title, priority: parsed.priority, xp: 70 };
      setColumns(prev => ({ ...prev, todo: [...prev.todo, newCard] }));
    } catch (e) {
      const newCard = { id: Date.now(), title: `New ${domain} task assigned by AI`, priority: "Medium", xp: 60 };
      setColumns(prev => ({ ...prev, todo: [...prev.todo, newCard] }));
    }
    setAiLoading(false);
  };

  const colLabels = { todo: "📋 To Do", inprogress: "⚡ In Progress", review: "👀 In Review", done: "✅ Done" };
  const colColors = { todo: "#06b6d4", inprogress: "#f59e0b", review: "#8b5cf6", done: "#10b981" };
  const totalDone = columns.done.length;
  const total = Object.values(columns).flat().length;

  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="font-syne" style={{ fontSize: 28, fontWeight: 800 }}>Internship <span className="neon-text">Simulator</span></h1>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>Domain: {domain}</p>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div className="font-syne" style={{ fontSize: 24, fontWeight: 800, color: "#10b981" }}>{readiness}%</div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>Readiness</div>
          </div>
          <button className="btn-primary" onClick={getAITask} disabled={aiLoading} style={{ padding: "10px 20px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            {aiLoading ? <Spinner /> : <><AIBadge /> Add AI Task</>}
          </button>
        </div>
      </div>

      <GlassCard style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14 }}>Tasks Completed: <strong>{totalDone}/{total}</strong></span>
          <ProgressBar value={totalDone} max={total} />
        </div>
      </GlassCard>

      <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 12 }}>
        {Object.entries(columns).map(([colId, cards]) => (
          <div key={colId} className="kanban-col" style={{ minWidth: 220 }}
            onDragOver={e => e.preventDefault()}
            onDrop={() => dragging && moveCard(dragging.id, dragging.col, colId)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span className="font-syne" style={{ fontSize: 13, fontWeight: 700, color: colColors[colId] }}>{colLabels[colId]}</span>
              <span style={{ background: `${colColors[colId]}20`, color: colColors[colId], padding: "2px 8px", borderRadius: 20, fontSize: 12, fontFamily: "JetBrains Mono" }}>{cards.length}</span>
            </div>
            {cards.map(card => (
              <div key={card.id} className="kanban-card" draggable onDragStart={() => setDragging({ id: card.id, col: colId })} onDragEnd={() => setDragging(null)}>
                <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, lineHeight: 1.5 }}>{card.title}</p>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Badge color={card.priority === "High" ? "#ef4444" : card.priority === "Medium" ? "#f59e0b" : "#10b981"}>{card.priority}</Badge>
                  <span style={{ fontSize: 11, color: "#8b5cf6", fontFamily: "JetBrains Mono" }}>+{card.xp}XP</span>
                </div>
                <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {Object.keys(columns).filter(c => c !== colId).map(c => (
                    <button key={c} onClick={() => moveCard(card.id, colId, c)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text2)", padding: "2px 6px", borderRadius: 4, fontSize: 10, cursor: "pointer" }}>
                      → {c.replace("inprogress", "WIP")}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {cards.length === 0 && <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text2)", fontSize: 13 }}>Drop cards here</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- RESUME BUILDER ---
const ResumePage = ({ user }) => {
  const domain = DOMAINS.find(d => d.id === user?.selectedDomain)?.name || "Web Dev";
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState(null);
  const [atsScore, setAtsScore] = useState(null);

  const generateResume = async () => {
    setLoading(true);
    try {
      const result = await callClaude([{
        role: "user",
        content: `Generate a professional resume for: Name: ${user?.name || "Student"}, College: ${user?.college || "University"}, Year: ${user?.year || "3rd Year"}, Domain: ${domain}. Include summary, skills (6-8), 2 projects with descriptions, and 2 achievements. Format as JSON: {"summary":"...","skills":["..."],"projects":[{"name":"...","desc":"...","tech":["..."]}],"achievements":["..."],"atsScore":82}`
      }], "You are a professional resume writer. Return ONLY valid JSON.", 1500);
      const parsed = JSON.parse(result.replace(/```json|```/g, "").trim());
      setResume(parsed);
      setAtsScore(parsed.atsScore || 82);
    } catch (e) {
      setResume({
        summary: `Motivated ${domain} enthusiast with hands-on project experience. Passionate about building scalable solutions and eager to contribute to innovative tech teams.`,
        skills: ["JavaScript", "React.js", "Node.js", "Python", "SQL", "Git & GitHub", "REST APIs", "Agile/Scrum"],
        projects: [
          { name: `${domain} Portfolio App`, desc: "Built a full-stack web application demonstrating core domain concepts with modern tech stack", tech: ["React", "Node.js", "MongoDB"] },
          { name: "AI-Powered Task Manager", desc: "Developed a productivity app with AI recommendations and real-time collaboration features", tech: ["Python", "FastAPI", "PostgreSQL"] },
        ],
        achievements: ["Top 10% in DomainX leaderboard", "Completed 95% of learning roadmap", "3 open source contributions"],
        atsScore: 85
      });
      setAtsScore(85);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <h1 className="font-syne" style={{ fontSize: 28, fontWeight: 800 }}>Resume <span className="neon-text">Builder</span></h1>
        <AIBadge />
        {user?.plan !== "premium" && <Badge color="#f59e0b">🔒 PDF Export: Premium</Badge>}
      </div>

      {!resume && !loading && (
        <GlassCard style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📄</div>
          <h2 className="font-syne" style={{ fontSize: 24, marginBottom: 12 }}>AI Resume Generator</h2>
          <p style={{ color: "var(--text2)", marginBottom: 24 }}>Generate a professional, ATS-optimized resume from your DomainX profile</p>
          <button className="btn-primary" onClick={generateResume} style={{ padding: "14px 32px" }}>✦ Generate Resume</button>
        </GlassCard>
      )}

      {loading && <LoadingState text="AI crafting your professional resume..." />}

      {resume && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
          {/* Resume Preview */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 40, color: "#1a1a1a", fontFamily: "Inter, sans-serif" }}>
            <div style={{ borderBottom: "3px solid #06b6d4", paddingBottom: 20, marginBottom: 24 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "Syne, sans-serif", margin: 0 }}>{user?.name || "Your Name"}</h1>
              <p style={{ color: "#06b6d4", fontSize: 14, marginTop: 4, fontWeight: 600 }}>{domain} Developer</p>
              <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{user?.college} • {user?.email || "email@example.com"}</p>
            </div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#06b6d4", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Summary</h2>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: "#444" }}>{resume.summary}</p>
            </div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#06b6d4", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Technical Skills</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {resume.skills?.map(s => <span key={s} style={{ background: "#f0f9ff", color: "#0369a1", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{s}</span>)}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#06b6d4", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Projects</h2>
              {resume.projects?.map((p, i) => (
                <div key={i} style={{ marginBottom: 14, paddingLeft: 12, borderLeft: "3px solid #e2e8f0" }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</div>
                  <p style={{ fontSize: 13, color: "#555", margin: "4px 0 6px", lineHeight: 1.6 }}>{p.desc}</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    {p.tech?.map(t => <span key={t} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{t}</span>)}
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#06b6d4", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Achievements</h2>
              {resume.achievements?.map((a, i) => <div key={i} style={{ fontSize: 13, color: "#444", padding: "3px 0", display: "flex", gap: 8 }}><span style={{ color: "#06b6d4" }}>★</span>{a}</div>)}
            </div>
          </div>

          {/* ATS Score & Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <GlassCard style={{ textAlign: "center" }}>
              <h3 className="font-syne" style={{ fontWeight: 700, marginBottom: 16 }}>ATS Score</h3>
              <div style={{ position: "relative", display: "inline-block" }}>
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#10b981" strokeWidth="10" strokeDasharray={`${(atsScore / 100) * 314} 314`} strokeLinecap="round" transform="rotate(-90 60 60)" />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="font-syne" style={{ fontSize: 24, fontWeight: 800, color: "#10b981" }}>{atsScore}%</span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 8 }}>ATS Compatibility Score</p>
            </GlassCard>

            <GlassCard>
              <h3 className="font-syne" style={{ fontWeight: 700, marginBottom: 16 }}>Actions</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button className="btn-primary" onClick={generateResume} style={{ width: "100%", fontSize: 13 }}>✦ Regenerate</button>
                <button className="btn-ghost" style={{ width: "100%", fontSize: 13, opacity: 0.5, cursor: "not-allowed" }}>🔒 Export PDF (Premium)</button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
};

// --- LEADERBOARD ---
const LeaderboardPage = ({ user }) => {
  const [filter, setFilter] = useState("all");
  const userRank = { rank: 12, name: user?.name || "You", domain: DOMAINS.find(d => d.id === user?.selectedDomain)?.name || "AI/ML", score: 5840, streak: 7, badges: 8, avatar: user?.name?.slice(0, 2).toUpperCase() || "YO" };
  const filtered = filter === "all" ? LEADERBOARD_DATA : LEADERBOARD_DATA.filter(u => u.domain.toLowerCase().includes(filter));

  return (
    <div style={{ padding: "32px 24px" }}>
      <h1 className="font-syne" style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>🏆 <span className="neon-text">Leaderboard</span></h1>
      <p style={{ color: "var(--text2)", marginBottom: 28 }}>Global rankings updated in real-time</p>

      {/* Top 3 Podium */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 16, marginBottom: 40 }}>
        {[LEADERBOARD_DATA[1], LEADERBOARD_DATA[0], LEADERBOARD_DATA[2]].map((p, i) => {
          const heights = [160, 200, 140];
          const colors = ["#94a3b8", "#f59e0b", "#cd7f32"];
          const ranks = [2, 1, 3];
          return (
            <div key={p.rank} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Avatar initials={p.avatar} size={48} color={colors[i]} />
              <div style={{ fontSize: 13, fontWeight: 600, textAlign: "center" }}>{p.name}</div>
              <div style={{ background: `${colors[i]}20`, border: `2px solid ${colors[i]}`, borderRadius: "8px 8px 0 0", width: 80, height: heights[i], display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="font-syne" style={{ fontSize: 24, fontWeight: 800, color: colors[i] }}>#{ranks[i]}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {["all", "AI/ML", "Web Dev", "Data Science"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? "btn-primary" : "btn-ghost"} style={{ padding: "6px 16px", fontSize: 13 }}>{f === "all" ? "All Domains" : f}</button>
        ))}
      </div>

      {/* Table */}
      <GlassCard style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "grid", gridTemplateColumns: "50px 1fr 120px 80px 80px 80px", gap: 10, alignItems: "center" }}>
          {["#", "Student", "Domain", "Score", "Streak", "Badges"].map(h => <span key={h} style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600, fontFamily: "JetBrains Mono", textTransform: "uppercase" }}>{h}</span>)}
        </div>
        {filtered.map((u, i) => (
          <div key={u.rank} style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "grid", gridTemplateColumns: "50px 1fr 120px 80px 80px 80px", gap: 10, alignItems: "center", transition: "background 0.2s" }}>
            <span className="font-mono" style={{ fontWeight: 700, color: u.rank <= 3 ? ["#f59e0b", "#94a3b8", "#cd7f32"][u.rank - 1] : "var(--text2)", fontSize: 14 }}>#{u.rank}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar initials={u.avatar} size={32} color={DOMAINS.find(d => d.name === u.domain)?.color || "#06b6d4"} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>{u.name}</span>
            </div>
            <Badge color={DOMAINS.find(d => d.name === u.domain)?.color || "#06b6d4"}>{u.domain}</Badge>
            <span className="font-mono" style={{ fontSize: 13, color: "#06b6d4" }}>{u.score.toLocaleString()}</span>
            <span style={{ fontSize: 13 }}>🔥 {u.streak}</span>
            <span style={{ fontSize: 13 }}>🏅 {u.badges}</span>
          </div>
        ))}
      </GlassCard>

      {/* Your Rank */}
      <GlassCard style={{ marginTop: 20, background: "rgba(6,182,212,0.06)", borderColor: "rgba(6,182,212,0.3)" }}>
        <div style={{ padding: "4px 0", display: "grid", gridTemplateColumns: "50px 1fr 120px 80px 80px 80px", gap: 10, alignItems: "center" }}>
          <span className="font-mono" style={{ fontWeight: 700, color: "#06b6d4" }}>#{userRank.rank}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar initials={userRank.avatar} size={32} color="#06b6d4" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#06b6d4" }}>{userRank.name} (You)</span>
          </div>
          <Badge color="#06b6d4">{userRank.domain}</Badge>
          <span className="font-mono" style={{ fontSize: 13, color: "#06b6d4" }}>{userRank.score.toLocaleString()}</span>
          <span style={{ fontSize: 13 }}>🔥 {userRank.streak}</span>
          <span style={{ fontSize: 13 }}>🏅 {userRank.badges}</span>
        </div>
      </GlassCard>
    </div>
  );
};

// --- AI GUIDE (X-GUIDE) ---
const AIGuidePage = ({ user }) => {
  const domain = DOMAINS.find(d => d.id === user?.selectedDomain)?.name || "Web Dev";
  const [messages, setMessages] = useState([
    { role: "assistant", content: `Hi ${user?.name || "there"}! I'm X-Guide, your AI mentor. I know you're learning **${domain}** and you're at **78% progress**. What would you like help with today?` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const messagesEndRef = useRef(null);
  const dailyLimit = user?.plan === "free" ? 3 : 999;

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    if (user?.plan === "free" && usageCount >= dailyLimit) {
      setMessages(prev => [...prev, { role: "assistant", content: "You've reached your daily limit of 3 messages on the Free plan. Upgrade to Pro for unlimited access!" }]);
      return;
    }

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const reply = await callClaude(
        [...history, { role: "user", content: userMsg }],
        `You are X-Guide, an AI mentor for DomainX platform. The user is: ${user?.name}, studying ${domain}, ${user?.year} at ${user?.college}. Progress: 78%. Keep responses helpful, encouraging, specific to their domain. Be conversational, use emojis sparingly. Max 200 words per response.`,
        600
      );
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      setUsageCount(p => p + 1);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "I'm having a momentary issue. Try asking me about your roadmap, skills, or career guidance!" }]);
    }
    setLoading(false);
  };

  const suggestions = [`What should I focus on next in ${domain}?`, "How do I prepare for technical interviews?", "Review my skill gaps", "Suggest weekend projects"];

  return (
    <div style={{ padding: "32px 24px", height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, animation: "pulse-glow 2s infinite" }}>🤖</div>
        <div>
          <h1 className="font-syne" style={{ fontSize: 22, fontWeight: 800 }}>X-Guide <span className="neon-text">AI</span></h1>
          <p style={{ fontSize: 12, color: "var(--text2)" }}>Personalized AI mentor • {user?.plan === "free" ? `${dailyLimit - usageCount} messages left today` : "Unlimited"}</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", marginBottom: 16, padding: "16px 0" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
            <div className={m.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"} style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", marginBottom: 12 }}>
            <div className="chat-bubble-ai"><div className="typing-dots"><span/><span/><span/></div></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {suggestions.map(s => (
          <button key={s} onClick={() => setInput(s)} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>{s}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 10 }}>
        <input className="input-field" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Ask X-Guide anything about your career..." style={{ flex: 1 }} />
        <button className="btn-primary" onClick={send} disabled={loading || !input.trim()} style={{ padding: "12px 20px" }}>
          {loading ? <Spinner /> : "Send"}
        </button>
      </div>
    </div>
  );
};

// --- PORTFOLIO GENERATOR ---
const PortfolioPage = ({ user }) => {
  const domain = DOMAINS.find(d => d.id === user?.selectedDomain)?.name || "Web Dev";
  const [loading, setLoading] = useState(false);
  const [portfolio, setPortfolio] = useState(null);
  const [bio, setBio] = useState("");

  const generate = async () => {
    setLoading(true);
    try {
      const result = await callClaude([{
        role: "user",
        content: `Generate a professional portfolio for: ${user?.name}, ${domain} developer, ${user?.college}. Bio hint: "${bio}". Create: bio (2 sentences), 3 projects with descriptions and tech stack, 5 skills, 2 achievements. Format as JSON: {"bio":"...","projects":[{"name":"...","desc":"...","tech":["..."],"link":"#"}],"skills":["..."],"achievements":["..."]}`
      }], "Return ONLY valid JSON. No extra text.", 1200);
      setPortfolio(JSON.parse(result.replace(/```json|```/g, "").trim()));
    } catch (e) {
      setPortfolio({ bio: `Passionate ${domain} developer building impactful solutions. Currently studying at ${user?.college || "University"} and actively contributing to open source.`, projects: [{ name: "AI Chat App", desc: "Full-featured chat app with NLP", tech: ["React", "Python", "OpenAI"], link: "#" }, { name: "Data Dashboard", desc: "Real-time analytics dashboard", tech: ["D3.js", "Node.js", "PostgreSQL"], link: "#" }, { name: "Mobile App", desc: "Cross-platform productivity app", tech: ["React Native", "Firebase"], link: "#" }], skills: ["JavaScript", "Python", "React", "Node.js", "Machine Learning"], achievements: ["Top 10% DomainX learner", "3 open source contributions"] });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <h1 className="font-syne" style={{ fontSize: 28, fontWeight: 800 }}>Portfolio <span className="neon-text">Generator</span></h1>
        <AIBadge />
      </div>

      <GlassCard style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 13, color: "var(--text2)", marginBottom: 8, display: "block" }}>Tell us about yourself (optional)</label>
        <div style={{ display: "flex", gap: 12 }}>
          <input className="input-field" value={bio} onChange={e => setBio(e.target.value)} placeholder="e.g., passionate about AI, love building products..." style={{ flex: 1 }} />
          <button className="btn-primary" onClick={generate} disabled={loading}>
            {loading ? <Spinner /> : "✦ Generate"}
          </button>
        </div>
      </GlassCard>

      {loading && <LoadingState text="Building your portfolio..." />}

      {portfolio && (
        <div style={{ background: "linear-gradient(135deg, #050508, #0a0a18)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 20, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.15))", padding: "48px 40px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <Avatar initials={user?.name?.slice(0, 2) || "ST"} size={80} color="#06b6d4" />
            <h2 className="font-syne" style={{ fontSize: 32, fontWeight: 800, marginTop: 16 }}>{user?.name || "Student"}</h2>
            <p style={{ color: "#06b6d4", fontWeight: 600, marginTop: 4 }}>{domain} Developer</p>
            <p style={{ color: "var(--text2)", marginTop: 12, maxWidth: 600, margin: "12px auto 0", fontSize: 15, lineHeight: 1.7 }}>{portfolio.bio}</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
              {portfolio.skills?.map(s => <Badge key={s} color="#06b6d4">{s}</Badge>)}
            </div>
          </div>

          <div style={{ padding: 40 }}>
            <h3 className="font-syne" style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Featured Projects</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20, marginBottom: 40 }}>
              {portfolio.projects?.map((p, i) => (
                <GlassCard key={i} className="glass-hover">
                  <h4 className="font-syne" style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{p.name}</h4>
                  <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12, lineHeight: 1.6 }}>{p.desc}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {p.tech?.map(t => <Badge key={t} color="#8b5cf6">{t}</Badge>)}
                  </div>
                </GlassCard>
              ))}
            </div>
            <h3 className="font-syne" style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Achievements</h3>
            {portfolio.achievements?.map((a, i) => (
              <div key={i} style={{ padding: "12px 16px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, marginBottom: 8, display: "flex", gap: 10 }}>
                <span>⭐</span><span style={{ fontSize: 14 }}>{a}</span>
              </div>
            ))}
            <div style={{ marginTop: 24, padding: "16px 20px", background: "rgba(6,182,212,0.08)", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, color: "var(--text2)" }}>Share your portfolio</span>
              <div style={{ background: "rgba(255,255,255,0.08)", padding: "6px 14px", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 12, color: "#06b6d4" }}>domainx.io/{user?.name?.toLowerCase().replace(/\s+/g, "") || "student"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- EVENTS ---
const EventsPage = ({ user }) => {
  const [events, setEvents] = useState(EVENTS_DATA);
  const [filter, setFilter] = useState("all");
  const domain = DOMAINS.find(d => d.id === user?.selectedDomain)?.name || "All";
  const filtered = filter === "all" ? events : events.filter(e => e.type === filter);

  const toggleSave = (id) => setEvents(prev => prev.map(e => e.id === id ? { ...e, saved: !e.saved } : e));

  return (
    <div style={{ padding: "32px 24px" }}>
      <h1 className="font-syne" style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Tech <span className="neon-text">Events</span></h1>
      <p style={{ color: "var(--text2)", marginBottom: 24 }}>Curated events for your domain</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {["all", "Workshop", "Conference", "Hackathon", "Competition"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? "btn-primary" : "btn-ghost"} style={{ padding: "6px 16px", fontSize: 13, textTransform: "capitalize" }}>{f === "all" ? "All Events" : f}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
        {filtered.map(event => {
          const d = DOMAINS.find(dom => dom.name === event.domain);
          return (
            <GlassCard key={event.id} style={{ transition: "all 0.3s" }} className="glass-hover">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <Badge color={d?.color || "#06b6d4"}>{event.domain}</Badge>
                  <Badge color="#8b5cf6" style={{ marginLeft: 6 }}>{event.type}</Badge>
                </div>
                <button onClick={() => toggleSave(event.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }}>
                  {event.saved ? "🔖" : "📌"}
                </button>
              </div>
              <h3 className="font-syne" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{event.title}</h3>
              <div style={{ display: "flex", gap: 16, color: "var(--text2)", fontSize: 13 }}>
                <span>📅 {event.date}</span>
                <span>👥 {event.participants.toLocaleString()}</span>
              </div>
              <button className="btn-primary" style={{ width: "100%", marginTop: 16, padding: "10px", fontSize: 13 }}>Register Now</button>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};

// --- COMMUNITY ---
const CommunityPage = ({ user }) => {
  const [posts, setPosts] = useState(COMMUNITY_POSTS);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(false);

  const addPost = async () => {
    if (!newPost.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const post = { id: Date.now(), author: user?.name || "You", domain: DOMAINS.find(d => d.id === user?.selectedDomain)?.name || "Web Dev", content: newPost, likes: 0, comments: 0, avatar: user?.name?.slice(0, 2).toUpperCase() || "YO" };
    setPosts(prev => [post, ...prev]);
    setNewPost("");
    setLoading(false);
  };

  const like = (id) => setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));

  return (
    <div style={{ padding: "32px 24px" }}>
      <h1 className="font-syne" style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Peer <span className="neon-text">Community</span></h1>
      <p style={{ color: "var(--text2)", marginBottom: 24 }}>Share your progress, ask questions, inspire others</p>

      <GlassCard style={{ marginBottom: 24 }}>
        <textarea className="input-field" rows={3} value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Share your progress, a win, or ask for help..." style={{ resize: "none", marginBottom: 12 }} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="btn-primary" onClick={addPost} disabled={loading || !newPost.trim()} style={{ padding: "10px 24px" }}>
            {loading ? <Spinner /> : "Post →"}
          </button>
        </div>
      </GlassCard>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {posts.map(post => {
          const d = DOMAINS.find(dom => dom.name === post.domain);
          return (
            <GlassCard key={post.id}>
              <div style={{ display: "flex", gap: 14 }}>
                <Avatar initials={post.avatar} size={44} color={d?.color || "#06b6d4"} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span className="font-syne" style={{ fontWeight: 700, fontSize: 15 }}>{post.author}</span>
                    <Badge color={d?.color || "#06b6d4"}>{post.domain}</Badge>
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 14 }}>{post.content}</p>
                  <div style={{ display: "flex", gap: 16 }}>
                    <button onClick={() => like(post.id)} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
                      ❤️ {post.likes}
                    </button>
                    <button style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
                      💬 {post.comments}
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};

// --- PROFILE ---
const ProfilePage = ({ user, updateUser, onNavigate }) => {
  const domain = DOMAINS.find(d => d.id === user?.selectedDomain) || DOMAINS[0];
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || "", college: user?.college || "", year: user?.year || "" });

  const save = () => { updateUser(form); setEditing(false); };

  const progressData = [
    { name: "W1", value: 20 }, { name: "W2", value: 38 }, { name: "W3", value: 55 },
    { name: "W4", value: 65 }, { name: "W5", value: 72 }, { name: "W6", value: 85 },
  ];

  return (
    <div style={{ padding: "32px 24px" }}>
      <h1 className="font-syne" style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>My <span className="neon-text">Profile</span></h1>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <GlassCard style={{ textAlign: "center" }}>
            <Avatar initials={user?.name?.slice(0, 2) || "ST"} size={72} color="#06b6d4" />
            <h2 className="font-syne" style={{ fontSize: 22, fontWeight: 700, marginTop: 12 }}>{user?.name}</h2>
            <p style={{ color: "var(--text2)", fontSize: 14 }}>{user?.college}</p>
            <p style={{ color: "var(--text2)", fontSize: 13 }}>{user?.year}</p>
            <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <Badge color={domain.color}>{domain.icon} {domain.name}</Badge>
              <Badge color="#8b5cf6">Lv.{user?.level || 3}</Badge>
              <Badge color={user?.plan === "free" ? "#94a3b8" : "#f59e0b"}>{user?.plan === "free" ? "Free" : user?.plan === "pro" ? "Pro" : "Premium"}</Badge>
            </div>
            <button className="btn-ghost" onClick={() => setEditing(!editing)} style={{ width: "100%", marginTop: 16, fontSize: 13 }}>
              {editing ? "Cancel" : "✏️ Edit Profile"}
            </button>
          </GlassCard>

          {editing && (
            <GlassCard>
              <h3 className="font-syne" style={{ fontWeight: 700, marginBottom: 16 }}>Edit Profile</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input className="input-field" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <input className="input-field" placeholder="College" value={form.college} onChange={e => setForm({ ...form, college: e.target.value })} />
                <select className="input-field" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}>
                  {["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduate"].map(y => <option key={y}>{y}</option>)}
                </select>
                <button className="btn-primary" onClick={save}>Save Changes</button>
              </div>
            </GlassCard>
          )}

          <GlassCard>
            <h3 className="font-syne" style={{ fontWeight: 700, marginBottom: 16 }}>Stats</h3>
            {[
              { label: "XP Points", value: user?.xp || 2450, color: "#8b5cf6" },
              { label: "Day Streak", value: `${user?.streak || 7} days 🔥`, color: "#f59e0b" },
              { label: "Tasks Done", value: user?.tasksCompleted || 3, color: "#10b981" },
              { label: "Quiz Score", value: `${user?.quizScore || 3}/5`, color: "#06b6d4" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: 13, color: "var(--text2)" }}>{s.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </GlassCard>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <GlassCard>
            <h3 className="font-syne" style={{ fontWeight: 700, marginBottom: 16 }}>Growth Chart</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ background: "#0a0a12", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6" }} />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard>
            <h3 className="font-syne" style={{ fontWeight: 700, marginBottom: 16 }}>Domain History</h3>
            <div style={{ position: "relative" }}>
              {[domain, ...DOMAINS.slice(0, 2)].map((d, i) => (
                <div key={i} style={{ display: "flex", gap: 14, marginBottom: 20 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: d.color, marginTop: 4 }} />
                    {i < 2 && <div style={{ width: 2, height: 32, background: "rgba(255,255,255,0.08)", marginTop: 4 }} />}
                  </div>
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span className="font-syne" style={{ fontSize: 14, fontWeight: 700 }}>{d.name} {i === 0 ? "(Current)" : ""}</span>
                      {i === 0 && <Badge color={d.color}>Active</Badge>}
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>{i === 0 ? "Currently learning" : "Previously explored"}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="font-syne" style={{ fontWeight: 700, marginBottom: 16 }}>Badges Earned</h3>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {["🚀 First Login", "📝 Quiz Master", "🔥 7-Day Streak", "💡 Fast Learner", "🏆 Top 20%", "📊 Data Explorer"].map(b => (
                <div key={b} className="glass" style={{ padding: "8px 14px", fontSize: 13 }}>{b}</div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

// --- PRICING ---
const PricingPage = ({ user, updateUser, onNavigate }) => {
  const [upgradeModal, setUpgradeModal] = useState(null);

  const plans = [
    {
      id: "free", name: "Free", price: "₹0", period: "/month", color: "#94a3b8",
      features: ["8 Domain Discovery", "3 AI Messages/day", "Basic Roadmap", "Quiz & Tasks", "Community Access", "2 Domain Switches/month"],
      locked: [],
    },
    {
      id: "pro", name: "Pro", price: "₹499", period: "/month", color: "#06b6d4", popular: true,
      features: ["Everything in Free", "Unlimited AI Messages", "Advanced Roadmaps", "Skill Gap Analyzer", "Unlimited Switches", "Priority Support", "Portfolio Generator"],
      locked: [],
    },
    {
      id: "premium", name: "Premium Mentor", price: "₹999", period: "/month", color: "#8b5cf6",
      features: ["Everything in Pro", "1:1 AI Mock Interviews", "PDF Resume Export", "Career Coach Access", "Job Referrals", "Custom Portfolio URL", "Advanced Analytics"],
      locked: [],
    },
  ];

  const upgrade = (planId) => {
    updateUser({ plan: planId });
    setUpgradeModal(planId);
  };

  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h1 className="font-syne" style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Choose Your <span className="neon-text">Plan</span></h1>
        <p style={{ color: "var(--text2)" }}>Unlock your full potential with DomainX Pro</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, maxWidth: 900, margin: "0 auto" }}>
        {plans.map(plan => (
          <div key={plan.id} style={{ position: "relative" }}>
            {plan.popular && (
              <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", color: "white", padding: "4px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, zIndex: 1, whiteSpace: "nowrap" }}>
                Most Popular
              </div>
            )}
            <GlassCard style={{ borderColor: plan.popular ? "rgba(6,182,212,0.4)" : undefined, background: plan.popular ? "rgba(6,182,212,0.06)" : undefined }}>
              <h2 className="font-syne" style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: plan.color }}>{plan.name}</h2>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                <span className="font-syne" style={{ fontSize: 36, fontWeight: 800 }}>{plan.price}</span>
                <span style={{ color: "var(--text2)", fontSize: 14 }}>{plan.period}</span>
              </div>
              <div style={{ marginBottom: 28 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
                    <span style={{ color: plan.color, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 14, lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button className={user?.plan === plan.id ? "btn-ghost" : "btn-primary"} onClick={() => plan.id !== "free" && upgrade(plan.id)} style={{ width: "100%", padding: 14 }} disabled={user?.plan === plan.id}>
                {user?.plan === plan.id ? "Current Plan" : plan.id === "free" ? "Free Forever" : `Upgrade to ${plan.name}`}
              </button>
            </GlassCard>
          </div>
        ))}
      </div>

      <Modal open={!!upgradeModal} onClose={() => setUpgradeModal(null)} title="🎉 Plan Upgraded!">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🚀</div>
          <p style={{ color: "var(--text2)", marginBottom: 24 }}>You've successfully upgraded to <strong style={{ color: "#06b6d4" }}>{upgradeModal}</strong> plan. All features are now unlocked!</p>
          <button className="btn-primary" onClick={() => { setUpgradeModal(null); onNavigate("dashboard"); }} style={{ width: "100%" }}>
            Go to Dashboard
          </button>
        </div>
      </Modal>
    </div>
  );
};

// --- AI INTERVIEW (Mock Interview) ---
const InterviewPage = ({ user }) => {
  const domain = DOMAINS.find(d => d.id === user?.selectedDomain)?.name || "Web Dev";
  const [stage, setStage] = useState("setup");
  const [role, setRole] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const startInterview = async () => {
    setLoading(true);
    setStage("interview");
    try {
      const q = await callClaude([{ role: "user", content: `Start a technical mock interview for a ${domain} ${role || "developer"} role. Ask the first question only. Be professional like a real interviewer.` }],
        `You are an experienced technical interviewer. Conduct a realistic mock interview for ${domain}. Ask one question at a time. After each answer, give brief feedback and then ask the next question. After 5 questions total, give a final evaluation with a score out of 100 and specific feedback.`);
      setMessages([{ role: "assistant", content: q }]);
    } catch (e) {
      setMessages([{ role: "assistant", content: `Welcome! I'll be your interviewer today for the ${domain} ${role} position. Let's start: Can you walk me through your background and what excites you most about ${domain}?` }]);
    }
    setLoading(false);
  };

  const answer = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMsgs = [...messages, { role: "user", content: userMsg }];
    setMessages(newMsgs);
    setLoading(true);
    const questionCount = newMsgs.filter(m => m.role === "assistant").length;
    try {
      const reply = await callClaude(newMsgs, `You are an experienced ${domain} technical interviewer. Give feedback on the answer, then ${questionCount >= 5 ? "provide final evaluation with score out of 100 and 3 specific improvements" : "ask the next technical question"}. Be encouraging but honest.`, 700);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      if (questionCount >= 5) {
        const scoreMatch = reply.match(/(\d+)\/100|score[:\s]+(\d+)/i);
        if (scoreMatch) setScore(parseInt(scoreMatch[1] || scoreMatch[2]));
        setStage("done");
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Good answer! Let's continue with the next question: Tell me about a challenging technical problem you've solved recently." }]);
    }
    setLoading(false);
  };

  if (stage === "setup") return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <h1 className="font-syne" style={{ fontSize: 28, fontWeight: 800 }}>Mock <span className="neon-text">Interview</span></h1>
        <AIBadge />
        {user?.plan === "free" && <Badge color="#f59e0b">🔒 Premium Feature</Badge>}
      </div>
      <GlassCard style={{ maxWidth: 600 }}>
        <h2 className="font-syne" style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Configure Your Interview</h2>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: "var(--text2)", marginBottom: 8, display: "block" }}>Target Role (optional)</label>
          <input className="input-field" value={role} onChange={e => setRole(e.target.value)} placeholder={`e.g., Junior ${domain} Developer, SDE-1...`} />
        </div>
        <div style={{ padding: "14px 16px", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 12, marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>
            <strong style={{ color: "#06b6d4" }}>How it works:</strong> The AI will conduct a realistic technical interview with 5 questions tailored to {domain}. You'll get real-time feedback and a final score.
          </p>
        </div>
        <button className="btn-primary" onClick={startInterview} style={{ width: "100%", padding: 14 }}>
          Start Interview →
        </button>
      </GlassCard>
    </div>
  );

  return (
    <div style={{ padding: "32px 24px", height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1 className="font-syne" style={{ fontSize: 22, fontWeight: 800 }}>Live Interview</h1>
          <Badge color={stage === "done" ? "#10b981" : "#f59e0b"}>{stage === "done" ? "Completed" : "In Progress"}</Badge>
        </div>
        {score && <div className="font-syne" style={{ fontSize: 20, fontWeight: 800, color: score >= 70 ? "#10b981" : "#f59e0b" }}>Score: {score}/100</div>}
      </div>

      <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 14 }}>
            {m.role === "assistant" && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10, flexShrink: 0, marginTop: 4 }}>🤖</div>
            )}
            <div className={m.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"} style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div style={{ display: "flex" }}><div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10 }}>🤖</div><div className="chat-bubble-ai"><div className="typing-dots"><span/><span/><span/></div></div></div>}
        <div ref={messagesEndRef} />
      </div>

      {stage !== "done" && (
        <div style={{ display: "flex", gap: 10 }}>
          <textarea className="input-field" rows={3} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), answer())} placeholder="Type your answer... (Enter to submit, Shift+Enter for newline)" style={{ flex: 1, resize: "none" }} />
          <button className="btn-primary" onClick={answer} disabled={loading || !input.trim()} style={{ padding: "0 20px" }}>
            {loading ? <Spinner /> : "Submit"}
          </button>
        </div>
      )}
      {stage === "done" && (
        <button className="btn-primary" onClick={() => setStage("setup")} style={{ padding: "14px" }}>↻ Start New Interview</button>
      )}
    </div>
  );
};

// --- PROGRESS PAGE ---
const ProgressPage = ({ user }) => {
  const streakDays = Array.from({ length: 35 }, (_, i) => ({ day: i + 1, active: Math.random() > 0.4 }));
  const weeklyData = [
    { day: "Mon", hours: 2 }, { day: "Tue", hours: 3 }, { day: "Wed", hours: 1.5 },
    { day: "Thu", hours: 4 }, { day: "Fri", hours: 2 }, { day: "Sat", hours: 3.5 }, { day: "Sun", hours: 0 },
  ];

  return (
    <div style={{ padding: "32px 24px" }}>
      <h1 className="font-syne" style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Progress <span className="neon-text">Tracking</span></h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Progress", value: "78%", color: "#06b6d4", icon: "📈" },
          { label: "Current Streak", value: `${user?.streak || 7}🔥`, color: "#f59e0b", icon: "⚡" },
          { label: "Hours Studied", value: "127h", color: "#8b5cf6", icon: "⏱️" },
          { label: "Tasks Done", value: "34/50", color: "#10b981", icon: "✅" },
        ].map(s => (
          <GlassCard key={s.label} style={{ textAlign: "center", padding: 20 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
            <div className="font-syne" style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>{s.label}</div>
          </GlassCard>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <GlassCard>
          <h3 className="font-syne" style={{ fontWeight: 700, marginBottom: 16 }}>Weekly Study Hours</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ background: "#0a0a12", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              <Bar dataKey="hours" fill="#8b5cf6" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
        <GlassCard>
          <h3 className="font-syne" style={{ fontWeight: 700, marginBottom: 16 }}>Streak Calendar</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {streakDays.map(d => (
              <div key={d.day} title={`Day ${d.day}`} style={{ width: "100%", paddingTop: "100%", position: "relative", borderRadius: 4, background: d.active ? "rgba(6,182,212,0.6)" : "rgba(255,255,255,0.05)", cursor: "pointer" }}>
                <div style={{ position: "absolute", inset: 0 }} />
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--text2)", marginTop: 8, textAlign: "center" }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "rgba(6,182,212,0.6)", marginRight: 4 }}/>Active day
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "rgba(255,255,255,0.05)", marginRight: 4, marginLeft: 8 }}/>Inactive
          </p>
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="font-syne" style={{ fontWeight: 700, marginBottom: 16 }}>Skill Progress</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {[
            { skill: "Core Concepts", progress: 85 }, { skill: "Practical Projects", progress: 70 },
            { skill: "Problem Solving", progress: 78 }, { skill: "Collaboration", progress: 60 },
            { skill: "Industry Tools", progress: 55 }, { skill: "Communication", progress: 72 },
          ].map(s => (
            <div key={s.skill}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span>{s.skill}</span>
                <span className="font-mono" style={{ color: "#06b6d4" }}>{s.progress}%</span>
              </div>
              <ProgressBar value={s.progress} />
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

// ============================================================
// MAIN APP LAYOUT WITH SIDEBAR
// ============================================================
const AppLayout = ({ children, currentPage, onNavigate, user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const domain = DOMAINS.find(d => d.id === user?.selectedDomain);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "domain-discovery", label: "Domain Discovery", icon: "🧭" },
    { id: "roadmap", label: "Roadmap", icon: "🗺️" },
    { id: "skill-gap", label: "Skill Gap", icon: "📈" },
    { id: "tasks", label: "Tasks", icon: "✅" },
    { id: "internship", label: "Internship Sim", icon: "💼" },
    { id: "interview", label: "Mock Interview", icon: "🎤" },
    { id: "progress", label: "Progress", icon: "📉" },
    { id: "resume", label: "Resume", icon: "📄" },
    { id: "portfolio", label: "Portfolio", icon: "🌐" },
    { id: "leaderboard", label: "Leaderboard", icon: "🏆" },
    { id: "events", label: "Events", icon: "📅" },
    { id: "community", label: "Community", icon: "🤝" },
    { id: "ai-guide", label: "X-Guide AI", icon: "🤖" },
    { id: "pricing", label: "Pricing", icon: "💎" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#050508" }}>
      {/* Sidebar */}
      <div style={{ width: sidebarOpen ? 240 : 64, background: "rgba(255,255,255,0.02)", borderRight: "1px solid rgba(255,255,255,0.06)", transition: "width 0.3s ease", flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Logo */}
        <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {sidebarOpen && (
            <div className="font-syne" style={{ fontSize: 20, fontWeight: 800 }}>
              <span className="neon-text">Domain</span>X
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: 18, marginLeft: sidebarOpen ? 0 : "auto" }}>
            {sidebarOpen ? "←" : "→"}
          </button>
        </div>

        {/* Domain Badge */}
        {sidebarOpen && domain && (
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 6, fontFamily: "JetBrains Mono" }}>CURRENT DOMAIN</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: `${domain.color}15`, border: `1px solid ${domain.color}30`, borderRadius: 8, padding: "6px 10px" }}>
              <span>{domain.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: domain.color }}>{domain.name}</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {navItems.map(item => (
            <div key={item.id} className={`sidebar-item ${currentPage === item.id ? "active" : ""}`} onClick={() => onNavigate(item.id)} title={!sidebarOpen ? item.label : ""}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="sidebar-item" onClick={onLogout}>
            <span style={{ fontSize: 18 }}>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: "auto", maxHeight: "100vh" }}>
        {/* Top bar */}
        <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16, background: "rgba(255,255,255,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 20 }}>
            <span style={{ color: "#f59e0b", fontSize: 14 }}>🔥 {user?.streak || 7} day streak</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar initials={user?.name?.slice(0, 2).toUpperCase() || "ST"} size={32} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: "var(--text2)" }}>{user?.plan === "free" ? "Free" : user?.plan === "pro" ? "Pro" : "Premium"}</div>
            </div>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
};

// ============================================================
// ROOT APP
// ============================================================
export default function DomainXApp() {
  const [page, setPage] = useState("landing");
  const [user, setUser] = useState(null);
  const [prevPage, setPrevPage] = useState(null);

  const navigate = (newPage) => {
    setPrevPage(page);
    setPage(newPage);
  };

  const onAuth = (userData) => {
    setUser(userData);
    setPage("domain-discovery");
  };

  const onLogout = () => {
    setUser(null);
    setPage("landing");
  };

  const updateUser = (updates) => setUser(prev => ({ ...prev, ...updates }));

  // Auth-protected routes
  const authPages = ["dashboard", "domain-discovery", "quiz", "tasks", "results", "goal", "roadmap", "skill-gap", "internship", "interview", "progress", "resume", "portfolio", "leaderboard", "events", "community", "ai-guide", "profile", "pricing"];

  if (authPages.includes(page) && !user) {
    return <AuthPage type="login" onNavigate={navigate} onAuth={onAuth} />;
  }

  // Landing / Auth pages (no sidebar)
  if (page === "landing") return <><style>{styles}</style><LandingPage onNavigate={navigate} /></>;
  if (page === "login") return <><style>{styles}</style><AuthPage type="login" onNavigate={navigate} onAuth={onAuth} /></>;
  if (page === "signup") return <><style>{styles}</style><AuthPage type="signup" onNavigate={navigate} onAuth={onAuth} /></>;

  // Flow pages (no sidebar)
  const flowPages = ["domain-discovery", "quiz", "tasks", "results", "goal", "roadmap"];
  if (flowPages.includes(page)) {
    const PageComponent = {
      "domain-discovery": DomainDiscovery,
      "quiz": QuizPage,
      "tasks": TasksPage,
      "results": ResultsPage,
      "goal": GoalPage,
      "roadmap": RoadmapPage,
    }[page];
    return <><style>{styles}</style><PageComponent onNavigate={navigate} user={user} updateUser={updateUser} /></>;
  }

  // App pages (with sidebar)
  const AppPage = {
    "dashboard": DashboardPage,
    "skill-gap": SkillGapPage,
    "internship": InternshipPage,
    "interview": InterviewPage,
    "progress": ProgressPage,
    "resume": ResumePage,
    "portfolio": PortfolioPage,
    "leaderboard": LeaderboardPage,
    "events": EventsPage,
    "community": CommunityPage,
    "ai-guide": AIGuidePage,
    "profile": ProfilePage,
    "pricing": PricingPage,
  }[page];

  if (!AppPage) return <><style>{styles}</style><div style={{ padding: 40, color: "white" }}>Page not found. <span style={{ color: "#06b6d4", cursor: "pointer" }} onClick={() => navigate("dashboard")}>Go to Dashboard</span></div></>;

  return (
    <>
      <style>{styles}</style>
      <AppContext.Provider value={{ user, updateUser, navigate }}>
        <AppLayout currentPage={page} onNavigate={navigate} user={user} onLogout={onLogout}>
          <AppPage onNavigate={navigate} user={user} updateUser={updateUser} />
        </AppLayout>
      </AppContext.Provider>
    </>
  );
}
