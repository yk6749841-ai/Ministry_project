import { useEffect, useState } from 'react'
import './App.css'
import AssessorPortal from './domains/assessments/AssessorPortal'
import CreateReport from './domains/buildings/CreateReport'
import NotificationCenter from './domains/buildings/NotificationCenter'
import ReportDetails from './domains/buildings/ReportDetails'
import ReportsList from './domains/buildings/ReportsList'
import LocalAuthorityPortal from './domains/municipalApprovals/LocalAuthorityPortal'
import SettlementProcesses from './domains/settlementProcesses/SettlementProcesses'
import SystemHealth from './domains/systemHealth/SystemHealth'
import AccessDenied from './domains/users/AccessDenied'
import Login from './domains/users/Login'
import { roleCanViewAssessorPortal, roleCanViewMunicipalPortal } from './domains/users/permissions'
import { getSession, logout } from './domains/users/usersApi'

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash || '#/')
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#/')
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash.replace(/^#/, '') || '/'
}

const navigate = (to) => {
  window.location.hash = to
}

const REPORT_PREFIX = '/reports/'

const ROLE_LABELS = {
  MINISTRY: 'משרד השיכון',
  MUNICIPALITY: 'רשות מקומית',
  APPRAISER: 'שמאי',
}

function App() {
  const route = useHashRoute()
  const [session, setSession] = useState(undefined) // undefined = loading, null = logged out

  useEffect(() => {
    getSession()
      .then(setSession)
      .catch(() => setSession(null))
  }, [])

  if (session === undefined) {
    return (
      <div className="app">
        <p className="muted">טוען…</p>
      </div>
    )
  }

  if (!session) {
    return <Login onLoggedIn={(user) => setSession({ user })} />
  }

  async function handleLogout() {
    await logout()
    setSession(null)
    navigate('/')
  }

  const role = session.user.role

  let view
  if (route === '/new') {
    view = (
      <CreateReport
        onCreated={(id) => navigate(`${REPORT_PREFIX}${id}`)}
        onCancel={() => navigate('/')}
      />
    )
  } else if (route === '/notifications') {
    view = <NotificationCenter onBack={() => navigate('/')} />
  } else if (route === '/settlement-processes') {
    view = <SettlementProcesses onBack={() => navigate('/')} />
  } else if (route === '/system-health') {
    view = <SystemHealth onBack={() => navigate('/')} />
  } else if (route === '/assessor') {
    view = roleCanViewAssessorPortal(role) ? (
      <AssessorPortal onBack={() => navigate('/')} />
    ) : (
      <AccessDenied onBack={() => navigate('/')} />
    )
  } else if (route === '/authority') {
    view = roleCanViewMunicipalPortal(role) ? (
      <LocalAuthorityPortal onBack={() => navigate('/')} />
    ) : (
      <AccessDenied onBack={() => navigate('/')} />
    )
  } else if (route.startsWith(REPORT_PREFIX)) {
    const reportId = route.slice(REPORT_PREFIX.length)
    view = (
      <ReportDetails
        key={reportId}
        id={reportId}
        role={role}
        onBack={() => navigate('/')}
      />
    )
  } else {
    view = (
      <ReportsList
        role={role}
        onOpen={(id) => navigate(`${REPORT_PREFIX}${id}`)}
        onCreate={() => navigate('/new')}
        onOpenNotifications={() => navigate('/notifications')}
        onOpenAssessorPortal={() => navigate('/assessor')}
        onOpenAuthorityPortal={() => navigate('/authority')}
        onOpenSettlementProcesses={() => navigate('/settlement-processes')}
        onOpenSystemHealth={() => navigate('/system-health')}
      />
    )
  }

  return (
    <div className="app">
      <div className="app__brand">
        <span>משרד הבינוי והשיכון · דיווחי נזק</span>
        <span className="app__session">
          {session.user.fullName} · {ROLE_LABELS[role] ?? role}
          {session.user.settlementId ? ` · ${session.user.settlementId}` : ''}
          <button type="button" className="btn btn--ghost" onClick={handleLogout}>
            התנתק
          </button>
        </span>
      </div>
      <main className="app__main">{view}</main>
    </div>
  )
}

export default App
