import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { getState } from './api.js'
import { TRIP_NAME } from './constants.js'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Itinerary from './pages/Itinerary.jsx'
import Flights from './pages/Flights.jsx'
import Jukebox from './pages/Jukebox.jsx'
import Lore from './pages/Lore.jsx'
import House from './pages/House.jsx'
import Props, { NickPicker } from './pages/Props.jsx'
import InstallCoach, { isStandalone } from './pages/InstallCoach.jsx'

const TABS = [
  { key: 'home',      label: 'Home',      emoji: '🏠' },
  { key: 'itinerary', label: 'Itinerary', emoji: '📅' },
  { key: 'flights',   label: 'Flights',   emoji: '✈️' },
  { key: 'jukebox',   label: 'Jukebox',   emoji: '🎸' },
  { key: 'props',     label: 'Props',     emoji: '🔮' },
  { key: 'lore',      label: 'Trips',     emoji: '🗺️' }
]

export default function App() {
  // Auth lives in an HttpOnly cookie the server sets on login, so the server is
  // the source of truth: null = still checking, false = locked, true = in.
  const [unlocked, setUnlocked] = useState(null)
  const [state, setState] = useState(null)
  const [tab, setTab] = useState('home')
  const [subPage, setSubPage] = useState(null) // 'house' | null
  const [itinDay, setItinDay] = useState(null) // YYYY-MM-DD to land on, from the Home rail
  // Bumped on every navigation. Itinerary depends on it so that re-tapping the
  // SAME day from the Home rail still re-scrolls — focusDay alone wouldn't
  // change, so its effect would never re-fire and you'd sit at the top.
  const [navSeq, setNavSeq] = useState(0)

  // ---- Scroll on navigation ----
  // There is no router here; pages are swapped inside one long document, so
  // window.scrollY survives a page change unless something resets it. Nothing
  // did, which is why opening the House from a scrolled-down Home dropped you
  // into the middle of the House page. Policy: going somewhere new starts at
  // the top, coming BACK returns you to where you were standing.
  const homeScroll = useRef(0)   // where Home was when we left it for the House
  const restoreTo = useRef(null) // a one-shot "put me back here" for the next commit

  // useLayoutEffect, not useEffect, so this lands before paint (no visible jump)
  // AND before Itinerary's passive effect — which means a day-targeted jump into
  // the itinerary still wins, instead of being clobbered by the reset.
  useLayoutEffect(() => {
    const target = restoreTo.current
    restoreTo.current = null
    if (target == null) { window.scrollTo(0, 0); return }

    window.scrollTo(0, target)
    // ...but the page may still be growing underneath us. Home's weather card
    // renders taller the moment the forecast resolves, so a restore issued
    // before that clamps against a document that isn't full height yet and
    // lands short (measured: 60px). Re-apply for a few frames until it sticks.
    let tries = 0
    let raf = requestAnimationFrame(function settle() {
      if (Math.abs(window.scrollY - target) <= 2 || tries++ > 20) return
      window.scrollTo(0, target)
      raf = requestAnimationFrame(settle)
    })
    // If they start scrolling themselves, stop immediately — never fight a thumb.
    const stop = () => { cancelAnimationFrame(raf); tries = 99 }
    window.addEventListener('wheel', stop, { passive: true, once: true })
    window.addEventListener('touchstart', stop, { passive: true, once: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchstart', stop)
    }
  }, [tab, subPage, navSeq])
  // Who this phone belongs to — picked once after login, honor system.
  const [nick, setNick] = useState(() => localStorage.getItem('ff-nick') || '')
  const pickNick = n => { localStorage.setItem('ff-nick', n); setNick(n) }
  // Theme: starts from the device's setting on first visit, then it's simply
  // light or dark — flip it at the bottom of any page.
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('ff-theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#f6f1e2' : '#0a0a0a')
  }, [theme])
  const setTheme = t => { localStorage.setItem('ff-theme', t); setThemeState(t) }

  // One-time add-to-home-screen coach (skipped if already installed).
  const [coached, setCoached] = useState(() => !!localStorage.getItem('ff-a2hs') || isStandalone())
  const dismissCoach = () => { localStorage.setItem('ff-a2hs', '1'); setCoached(true) }

  const refresh = useCallback(async () => {
    try {
      setState(await getState())
      setUnlocked(true)
    } catch (e) {
      if (e.status === 401) setUnlocked(false)
      else console.error(e)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])
  useEffect(() => {
    if (unlocked !== true) return
    const iv = setInterval(refresh, 5000)
    return () => clearInterval(iv)
  }, [unlocked, refresh])

  function onUnlock() {
    setUnlocked(true)
    refresh()
  }
  if (unlocked === null) return <div className="login-wrap" /> // checking the cookie
  if (!unlocked) return <Login onUnlock={onUnlock} />
  if (!nick) return <NickPicker onPick={pickNick} />
  if (!coached) return <InstallCoach onDone={dismissCoach} />

  const navigate = (target, opts) => {
    if (target === 'house') {
      // Remember where Home was so "← Back" can put them back on the card they
      // tapped, rather than at the top of a page they've already scrolled past.
      homeScroll.current = window.scrollY
      setSubPage(target)
      setNavSeq(n => n + 1)
      return
    }
    setItinDay(target === 'itinerary' ? (opts?.day ?? null) : null)
    setSubPage(null)
    setTab(target)
    setNavSeq(n => n + 1)
  }

  // Only the House page's own "← Back" restores. Tapping the Home tab from the
  // House is a fresh start, not a return, and goes to the top like any other tab.
  const leaveHouse = () => {
    restoreTo.current = homeScroll.current
    setSubPage(null)
    setNavSeq(n => n + 1)
  }

  let page
  if (subPage === 'house') page = <House onBack={leaveHouse} />
  else if (tab === 'home') page = <Home state={state} nick={nick} onRefresh={refresh} onNavigate={navigate} />
  else if (tab === 'itinerary') page = <Itinerary focusDay={itinDay} navSeq={navSeq} />
  else if (tab === 'flights') page = <Flights />
  else if (tab === 'jukebox') page = <Jukebox state={state} onRefresh={refresh} />
  else if (tab === 'props') page = <Props state={state} onRefresh={refresh} nick={nick} />
  else if (tab === 'lore') page = <Lore />

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">🧭</span>
          <span className="brand-text">{TRIP_NAME}</span>
        </div>
        {tab === 'home' && !subPage && (
          <button
            className="theme-btn"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        )}
      </header>
      <main className="page">{page}</main>
      <nav className="tabbar">
        {TABS.map(t => (
          <button
            key={t.key}
            className={'tab' + (tab === t.key && !subPage ? ' active' : '')}
            onClick={() => navigate(t.key)}
          >
            {t.img
              ? <img className="tab-img" src={t.img} alt={t.imgAlt} />
              : <span className="tab-emoji">{t.emoji}</span>}
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
