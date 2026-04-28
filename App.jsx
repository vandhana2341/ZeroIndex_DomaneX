import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { Brain, Lock, Rocket, Trophy, User } from 'lucide-react'

const domains = ['AI/ML', 'Web Dev', 'Cybersecurity', 'Data Science', 'App Dev', 'Cloud', 'UI/UX', 'DevOps']
const goals = ['Job', 'Startup', 'Freelance', 'Research', 'Higher Studies']
const durations = ['3m', '6m', '1y', '2y']
const plans = ['Free', 'Pro', 'Premium Mentor']
const quizBank = [
  { q: 'You enjoy building user interfaces.', map: 'Web Dev' },
  { q: 'You like solving mathematical modeling problems.', map: 'AI/ML' },
  { q: 'You are curious about security vulnerabilities.', map: 'Cybersecurity' },
  { q: 'You like deriving insights from data trends.', map: 'Data Science' },
  { q: 'You enjoy mobile-first product thinking.', map: 'App Dev' },
  { q: 'Infrastructure automation excites you.', map: 'DevOps' },
  { q: 'You enjoy creating visual systems and flows.', map: 'UI/UX' },
  { q: 'Cloud scalability patterns interest you.', map: 'Cloud' },
  { q: 'You like model deployment and optimization.', map: 'AI/ML' },
  { q: 'You enjoy APIs and service design.', map: 'Web Dev' },
]

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const isSupabaseReady = Boolean(supabaseUrl && supabaseKey)
const supabase = isSupabaseReady ? createClient(supabaseUrl, supabaseKey) : null

function getStorage(key, fallback) {
  const raw = localStorage.getItem(key)
  return raw ? JSON.parse(raw) : fallback
}

function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

const AppContext = createContext(null)
const AuthContext = createContext(null)

function generateRoadmap(domain, goal, duration, dailyHours) {
  const weeks = duration === '3m' ? 12 : duration === '6m' ? 24 : duration === '1y' ? 48 : 96
  const weeklyHours = dailyHours * 7
  return Array.from({ length: Math.min(12, weeks) }, (_, i) => ({
    week: i + 1,
    milestone: `Week ${i + 1}: ${domain} ${goal} milestone`,
    tasks: [`Concept drill ${i + 1}`, `Build mini project ${i + 1}`, 'Peer feedback review'],
    mistakes: ['Skipping revision', 'Ignoring tests'],
    cert: `${domain} Cert Path ${Math.ceil((i + 1) / 4)}`,
    expected: `Confidence increase with ${weeklyHours}h effort`,
  }))
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseReady) {
      setLoading(false)
      return
    }
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user ?? null)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  async function login(email, password) {
    if (!isSupabaseReady) return { error: null, mock: true }
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signup(email, password) {
    if (!isSupabaseReady) {
      setUser({ email })
      return { error: null, mock: true }
    }
    return supabase.auth.signUp({ email, password })
  }

  async function logout() {
    if (!isSupabaseReady) {
      setUser(null)
      return
    }
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

function AppProvider({ children }) {
  const starter = {
    onboarding: { name: '', college: '', year: '' },
    plan: 'Free',
    domain: '',
    domainHistory: [],
    quizAnswers: [],
    quizScore: {},
    tasks: [],
    roadmap: [],
    goal: goals[0],
    duration: durations[1],
    dailyHours: 2,
    progress: 16,
    streak: 3,
    badges: 2,
    readiness: 24,
    aiUsedToday: 0,
    chats: [],
    eventsSaved: [],
    xp: 140,
    level: 2,
  }
  const [state, setState] = useState(() => getStorage('domanex_state', starter))

  useEffect(() => {
    setStorage('domanex_state', state)
  }, [state])

  const actions = useMemo(
    () => ({
      setOnboarding(data) {
        setState((s) => ({ ...s, onboarding: data }))
      },
      setDomain(domain, mode = 'auto') {
        setState((s) => ({
          ...s,
          domain,
          progress: 0,
          readiness: 0,
          tasks: [],
          domainHistory: [...s.domainHistory, { domain, mode, date: new Date().toISOString() }],
          roadmap: generateRoadmap(domain, s.goal, s.duration, s.dailyHours),
        }))
      },
      setQuiz(answers, score) {
        setState((s) => ({ ...s, quizAnswers: answers, quizScore: score }))
      },
      completeTask(task) {
        setState((s) => ({
          ...s,
          tasks: [...s.tasks, task],
          progress: Math.min(100, s.progress + 7),
          xp: s.xp + 15,
          level: Math.floor((s.xp + 15) / 100) + 1,
        }))
      },
      setGoalDuration(goal, duration, dailyHours) {
        setState((s) => ({
          ...s,
          goal,
          duration,
          dailyHours,
          roadmap: generateRoadmap(s.domain || domains[0], goal, duration, dailyHours),
        }))
      },
      setPlan(plan) {
        setState((s) => ({ ...s, plan }))
      },
      useAi(message) {
        setState((s) => ({
          ...s,
          aiUsedToday: s.aiUsedToday + 1,
          chats: [...s.chats, { message, at: new Date().toISOString() }],
        }))
      },
      saveEvent(id) {
        setState((s) => ({ ...s, eventsSaved: [...new Set([...s.eventsSaved, id])] }))
      },
    }),
    [],
  )

  return <AppContext.Provider value={{ state, actions }}>{children}</AppContext.Provider>
}

const useAuth = () => useContext(AuthContext)
const useApp = () => useContext(AppContext)

const navItems = [
  ['Dashboard', '/dashboard'],
  ['Roadmap', '/roadmap'],
  ['Internship', '/internship'],
  ['Progress', '/progress'],
  ['Resume', '/resume'],
  ['Events', '/events'],
  ['Leaderboard', '/leaderboard'],
  ['Community', '/community'],
  ['Profile', '/profile'],
]

function Gate({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/auth" replace />
  return children
}

function Card({ title, children, right }) {
  return (
    <section className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  )
}

function Layout({ children }) {
  const { logout, user } = useAuth()
  const loc = useLocation()
  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <header className="glass-card mb-6 flex items-center justify-between p-4">
        <Link to="/dashboard" className="text-xl font-bold text-cyan-300">
          DomainX
        </Link>
        <p className="hidden text-sm text-slate-300 md:block">Find Your Tech Path. Build Your Future.</p>
        <div className="flex items-center gap-3 text-sm">
          <span className="rounded-full border border-white/10 px-3 py-1 text-slate-200">{user?.email ?? 'Demo Mode'}</span>
          <button onClick={logout} className="rounded-xl bg-cyan-400/20 px-3 py-2 text-cyan-200">Logout</button>
        </div>
      </header>
      <nav className="glass-card mb-6 flex flex-wrap gap-2 p-3">
        {navItems.map(([label, path]) => (
          <Link
            key={path}
            to={path}
            className={`rounded-xl px-3 py-2 text-sm ${loc.pathname === path ? 'bg-cyan-500/25 text-cyan-200' : 'text-slate-300 hover:bg-white/10'}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  )
}

function Landing() {
  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center px-6 py-16 md:grid-cols-2">
      <div>
        <p className="mb-3 text-cyan-300">AI-Powered Career Platform</p>
        <h1 className="mb-4 text-5xl font-black text-white">DomainX</h1>
        <p className="mb-8 text-slate-300">Find Your Tech Path. Build Your Future.</p>
        <Link to="/auth" className="rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-6 py-3 font-semibold text-black">
          Start Your Journey
        </Link>
      </div>
      <div className="glass-card p-8">
        <ul className="space-y-3 text-slate-200">
          <li className="flex items-center gap-2"><Brain size={18} /> Domain discovery + adaptive quiz</li>
          <li className="flex items-center gap-2"><Rocket size={18} /> Smart roadmap + scheduler</li>
          <li className="flex items-center gap-2"><Trophy size={18} /> Internship simulator + leaderboard</li>
          <li className="flex items-center gap-2"><User size={18} /> Resume + portfolio generator</li>
        </ul>
      </div>
    </main>
  )
}

function AuthPage() {
  const { login, signup } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="glass-card w-full max-w-md p-6">
        <h2 className="mb-4 text-2xl font-bold text-white">{mode === 'login' ? 'Login' : 'Create account'}</h2>
        <div className="space-y-3">
          <input className="w-full rounded-xl bg-white/5 p-3 text-white" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full rounded-xl bg-white/5 p-3 text-white" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button
            onClick={async () => {
              const fn = mode === 'login' ? login : signup
              await fn(email, password)
              nav('/onboarding')
            }}
            className="w-full rounded-xl bg-cyan-400 py-3 font-semibold text-black"
          >
            Continue
          </button>
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="w-full text-sm text-cyan-300">
            {mode === 'login' ? 'Need an account?' : 'Already have account?'}
          </button>
        </div>
      </div>
    </main>
  )
}

function Onboarding() {
  const { state, actions } = useApp()
  const nav = useNavigate()
  const [form, setForm] = useState(state.onboarding)
  return (
    <Layout>
      <Card title="Onboarding">
        <div className="grid gap-3 md:grid-cols-3">
          {['name', 'college', 'year'].map((k) => (
            <input key={k} placeholder={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="rounded-xl bg-white/5 p-3 text-white" />
          ))}
        </div>
        <button onClick={() => { actions.setOnboarding(form); nav('/domain-discovery') }} className="mt-4 rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-black">Save & Continue</button>
      </Card>
    </Layout>
  )
}

function DomainDiscovery() {
  const { state, actions } = useApp()
  const switches = state.domainHistory.filter((d) => new Date(d.date).getMonth() === new Date().getMonth()).length
  const limitReached = state.plan === 'Free' && switches >= 2
  return (
    <Layout>
      <Card title="Domain Discovery" right={<span className="text-sm text-slate-400">Switches this month: {switches}</span>}>
        <div className="grid gap-3 md:grid-cols-4">
          {domains.map((d) => (
            <button key={d} disabled={limitReached} onClick={() => actions.setDomain(d, 'retake-quiz')} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:border-cyan-300/50 disabled:opacity-40">
              {d}
            </button>
          ))}
        </div>
        {limitReached && <p className="mt-3 text-amber-300"><Lock className="mr-1 inline" size={14} /> Free plan limit reached. Upgrade for unlimited switches.</p>}
        <Link to="/quiz" className="mt-4 inline-block rounded-xl bg-violet-500 px-4 py-2 font-semibold">Start Adaptive Quiz</Link>
      </Card>
    </Layout>
  )
}

function Quiz() {
  const { actions } = useApp()
  const nav = useNavigate()
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState([])
  const q = quizBank[idx]
  return (
    <Layout>
      <Card title={`Quiz ${idx + 1}/10`}>
        <p className="mb-4 text-lg text-white">{q.q}</p>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((w) => (
            <button key={w} onClick={() => {
              const next = [...answers, { q: idx, weight: w, domain: q.map }]
              setAnswers(next)
              if (idx === 9) {
                const score = next.reduce((acc, a) => ({ ...acc, [a.domain]: (acc[a.domain] ?? 0) + a.weight }), {})
                actions.setQuiz(next, score)
                nav('/tasks')
              } else setIdx(idx + 1)
            }} className="block w-full rounded-xl bg-white/5 p-3 text-left hover:bg-cyan-400/15">
              Option weight {w}
            </button>
          ))}
        </div>
      </Card>
    </Layout>
  )
}

function Tasks() {
  const { actions } = useApp()
  const nav = useNavigate()
  const tasks = ['Build mini app', 'Read docs', 'Debug challenge', 'System design prompt', 'Mock interview']
  return (
    <Layout>
      <Card title="Mini Task Engine">
        <div className="space-y-2">
          {tasks.map((t, i) => (
            <button key={t} onClick={() => actions.completeTask({ task: t, difficulty: i + 1, hint: 'Break problem down', expected: 'Shippable output' })} className="w-full rounded-xl bg-white/5 p-3 text-left">
              {t}
            </button>
          ))}
        </div>
        <button onClick={() => nav('/results')} className="mt-4 rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-black">View Results</button>
      </Card>
    </Layout>
  )
}

function Results() {
  const { state } = useApp()
  const nav = useNavigate()
  const top = Object.entries(state.quizScore).sort((a, b) => b[1] - a[1]).slice(0, 3)
  const chart = top.map(([name, value]) => ({ name, value }))
  return (
    <Layout>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Top 3 Domains">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chart}>
              <XAxis dataKey="name" />
              <YAxis />
              <Bar dataKey="value" fill="#22d3ee" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Circular Score">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={chart} dataKey="value" outerRadius={90}>
                {chart.map((_, i) => <Cell key={i} fill={['#22d3ee', '#3b82f6', '#8b5cf6'][i % 3]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <button onClick={() => nav('/goal-duration')} className="mt-4 rounded-xl bg-violet-500 px-4 py-2">Continue</button>
    </Layout>
  )
}

function GoalDuration() {
  const { state, actions } = useApp()
  const nav = useNavigate()
  return (
    <Layout>
      <Card title="Goal + Smart Scheduler">
        <div className="grid gap-3 md:grid-cols-3">
          <select value={state.goal} onChange={(e) => actions.setGoalDuration(e.target.value, state.duration, state.dailyHours)} className="rounded-xl bg-white/5 p-3">
            {goals.map((g) => <option key={g}>{g}</option>)}
          </select>
          <select value={state.duration} onChange={(e) => actions.setGoalDuration(state.goal, e.target.value, state.dailyHours)} className="rounded-xl bg-white/5 p-3">
            {durations.map((d) => <option key={d}>{d}</option>)}
          </select>
          <input type="number" min="1" max="12" value={state.dailyHours} onChange={(e) => actions.setGoalDuration(state.goal, state.duration, Number(e.target.value))} className="rounded-xl bg-white/5 p-3" />
        </div>
        <button onClick={() => nav('/roadmap')} className="mt-4 rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-black">Generate Roadmap</button>
      </Card>
    </Layout>
  )
}

function Dashboard() {
  const { state } = useApp()
  const score = state.progress * 0.5 + state.readiness * 0.3 + state.streak * 2 + state.badges * 5
  return (
    <Layout>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Progress', `${state.progress}%`],
          ['Streak', `${state.streak} days`],
          ['XP / Level', `${state.xp} / ${state.level}`],
          ['Leaderboard Score', score.toFixed(1)],
        ].map(([k, v]) => <Card key={k} title={k}><p className="text-2xl font-bold text-cyan-200">{v}</p></Card>)}
      </div>
    </Layout>
  )
}

function Roadmap() {
  const { state } = useApp()
  return (
    <Layout>
      <Card title="Intelligent Roadmap">
        <div className="space-y-3">
          {state.roadmap.map((w) => <div key={w.week} className="rounded-xl border border-white/10 p-3"><p className="font-semibold">{w.milestone}</p><p className="text-sm text-slate-300">{w.expected}</p></div>)}
        </div>
      </Card>
    </Layout>
  )
}

function Internship() { return <Layout><Card title="Internship Simulator"><p>Kanban-ready internship tasks, readiness score, and domain simulation flow are initialized.</p></Card></Layout> }
function ProgressPage() { return <Layout><Card title="Progress Tracking"><p>Charts, streaks, badges, and task completion analytics are tracked in state and ready for Supabase sync.</p></Card></Layout> }
function ResumePage() { const { state } = useApp(); return <Layout><Card title="Resume + Portfolio"><p>ATS preview with export lock on Free plan.</p><pre className="mt-3 overflow-auto rounded-xl bg-black/40 p-3 text-xs">{JSON.stringify(state.onboarding, null, 2)}</pre></Card></Layout> }
function EventsPage() { return <Layout><Card title="Events"><p>Domain-based events with bookmark support and Pro recommendations.</p></Card></Layout> }
function Community() { return <Layout><Card title="Peer Community"><p>Domain groups, posts, comments, likes and progress sharing entry point.</p></Card></Layout> }
function Profile() { const { state } = useApp(); return <Layout><Card title="Profile Dashboard"><p className="mb-2">Plan: {state.plan}</p><div className="space-y-2">{state.domainHistory.map((h, i) => <div key={i} className="rounded-xl bg-white/5 p-2 text-sm">{h.domain} - {h.mode}</div>)}</div></Card></Layout> }

function Leaderboard() {
  const { state } = useApp()
  const rows = [
    { name: 'Ari', progress: 87, readiness: 76, streak: 13, badges: 7 },
    { name: 'Kian', progress: 79, readiness: 72, streak: 9, badges: 5 },
    { name: state.onboarding.name || 'You', progress: state.progress, readiness: state.readiness, streak: state.streak, badges: state.badges },
  ].map((r) => ({ ...r, score: r.progress * 0.5 + r.readiness * 0.3 + r.streak * 2 + r.badges * 5 }))
  rows.sort((a, b) => b.score - a.score)
  return <Layout><Card title="Leaderboard">{rows.map((r, i) => <p key={r.name} className="mb-2 rounded-xl bg-white/5 p-2">{i + 1}. {r.name} - {r.score.toFixed(1)}</p>)}</Card></Layout>
}

function Pricing() {
  const { state, actions } = useApp()
  return (
    <Layout>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan} title={plan}>
            <button onClick={() => actions.setPlan(plan)} className="rounded-xl bg-cyan-400 px-3 py-2 font-semibold text-black">
              {state.plan === plan ? 'Current Plan' : 'Upgrade'}
            </button>
          </Card>
        ))}
      </div>
    </Layout>
  )
}

function XGuide() {
  const { state, actions } = useApp()
  const [q, setQ] = useState('')
  const freeLimited = state.plan === 'Free' && state.aiUsedToday >= 3
  return (
    <Layout>
      <Card title="X-Guide AI">
        <input value={q} onChange={(e) => setQ(e.target.value)} className="w-full rounded-xl bg-white/5 p-3" placeholder="Ask about weak areas, next tasks, rank growth..." />
        <button disabled={freeLimited} onClick={() => actions.useAi(q)} className="mt-3 rounded-xl bg-violet-500 px-3 py-2 disabled:opacity-40">Ask AI</button>
        {freeLimited && <p className="mt-2 text-amber-300">Free plan AI limit reached (3/day).</p>}
      </Card>
    </Layout>
  )
}

function AppRoutes() {
  const { state } = useApp()
  const portfolioData = useMemo(() => ({ skills: [state.domain || 'Web Dev'], projects: state.tasks.slice(0, 3) }), [state.domain, state.tasks])
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/onboarding" element={<Gate><Onboarding /></Gate>} />
      <Route path="/domain-discovery" element={<Gate><DomainDiscovery /></Gate>} />
      <Route path="/quiz" element={<Gate><Quiz /></Gate>} />
      <Route path="/tasks" element={<Gate><Tasks /></Gate>} />
      <Route path="/results" element={<Gate><Results /></Gate>} />
      <Route path="/goal-duration" element={<Gate><GoalDuration /></Gate>} />
      <Route path="/dashboard" element={<Gate><Dashboard /></Gate>} />
      <Route path="/roadmap" element={<Gate><Roadmap /></Gate>} />
      <Route path="/internship" element={<Gate><Internship /></Gate>} />
      <Route path="/progress" element={<Gate><ProgressPage /></Gate>} />
      <Route path="/resume" element={<Gate><ResumePage /></Gate>} />
      <Route path="/events" element={<Gate><EventsPage /></Gate>} />
      <Route path="/leaderboard" element={<Gate><Leaderboard /></Gate>} />
      <Route path="/community" element={<Gate><Community /></Gate>} />
      <Route path="/profile" element={<Gate><Profile /></Gate>} />
      <Route path="/pricing" element={<Gate><Pricing /></Gate>} />
      <Route path="/x-guide" element={<Gate><XGuide /></Gate>} />
      <Route path="/portfolio/:username" element={<main className="p-8 text-white">{JSON.stringify(portfolioData)}</main>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
