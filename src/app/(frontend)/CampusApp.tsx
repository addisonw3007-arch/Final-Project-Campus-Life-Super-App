'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createCalendarEvent, logoutUser, type EventInput } from './actions'

type Page = 'home' | 'calendar' | 'academic' | 'tutoring' | 'tools' | 'map'

type IconName =
  | 'arrow'
  | 'book'
  | 'calendar'
  | 'chevron'
  | 'clock'
  | 'compass'
  | 'file'
  | 'home'
  | 'map'
  | 'menu'
  | 'message'
  | 'search'
  | 'spark'
  | 'target'
  | 'user'
  | 'users'

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </>
    ),
    calendar: (
      <>
        <path d="M8 2v4M16 2v4M3 10h18" />
        <rect x="3" y="4" width="18" height="18" rx="2" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15 9-2 5-5 2 2-5 5-2Z" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v11h14V10M9 21v-7h6v7" />
      </>
    ),
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" />
        <path d="M9 3v15M15 6v15" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3ZM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15ZM19 14l.6 1.4L21 16l-1.4.6L19 18l-.6-1.4L17 16l1.4-.6L19 14Z" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 22a8 8 0 0 1 16 0" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
      </>
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

const pages: { id: Page; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'academic', label: 'Academic Hub', icon: 'book' },
  { id: 'tutoring', label: 'Tutoring', icon: 'users' },
  { id: 'tools', label: 'Study Tools', icon: 'target' },
  { id: 'map', label: 'Campus Map', icon: 'map' },
]

function FrameLabel({ children }: { children: React.ReactNode }) {
  return <span className="frame-label">{children}</span>
}

export type CalendarEventView = {
  id: string
  title: string
  type: string
  start: string
  end?: string | null
  allDay?: boolean | null
  location?: string | null
  source?: string | null
  notes?: string | null
  externalId?: string | null
}

type CampusUser = { name: string; email: string; role?: string | null; year?: string | null }

const GUEST_CALENDAR_KEY = 'campus-life-guest-calendar'

function App({
  initialEvents,
  user,
  guestMode,
}: {
  initialEvents: CalendarEventView[]
  user: CampusUser
  guestMode: boolean
}) {
  const [page, setPage] = useState<Page>('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [events, setEvents] = useState(initialEvents)
  const [guestCalendarReady, setGuestCalendarReady] = useState(false)

  const currentPage = useMemo(() => pages.find((item) => item.id === page)!, [page])

  useEffect(() => {
    const requested = window.location.hash.slice(1) as Page
    if (pages.some((item) => item.id === requested)) setPage(requested)
  }, [])

  useEffect(() => {
    window.location.hash = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  useEffect(() => {
    if (!guestMode) {
      setEvents(initialEvents)
      return
    }

    try {
      const stored = window.localStorage.getItem(GUEST_CALENDAR_KEY)
      if (stored) setEvents(JSON.parse(stored) as CalendarEventView[])
    } catch {
      window.localStorage.removeItem(GUEST_CALENDAR_KEY)
    } finally {
      setGuestCalendarReady(true)
    }
  }, [guestMode, initialEvents])

  useEffect(() => {
    if (guestMode && guestCalendarReady) {
      window.localStorage.setItem(GUEST_CALENDAR_KEY, JSON.stringify(events))
    }
  }, [events, guestCalendarReady, guestMode])

  const go = (target: Page) => {
    setPage(target)
    setMenuOpen(false)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
        <button className="brand" onClick={() => go('home')} aria-label="Go to home">
          <span className="brand-mark">CL</span>
          <span>
            <strong>Campus Life</strong>
            <small>SUPER APP</small>
          </span>
        </button>
        <nav aria-label="Primary navigation">
          <p className="nav-eyebrow">MY CAMPUS</p>
          {pages.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => go(item.id)}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {page === item.id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-help">
          <Icon name="message" size={21} />
          <div>
            <strong>Need help?</strong>
            <span>Student support is here.</span>
          </div>
          <button aria-label="Open student support">
            <Icon name="chevron" size={17} />
          </button>
        </div>
        <div className="student-card">
          <span className="avatar">{guestMode ? 'CG' : user.name.slice(0, 2).toUpperCase()}</span>
          <div>
            <strong>{user.name}</strong>
            <span>
              {guestMode
                ? 'Guest mode'
                : user.role === 'tutor'
                  ? 'Student Tutor'
                  : user.year || 'Student'}
            </span>
          </div>
          {!guestMode && (
            <button
              aria-label="Sign out"
              title="Sign out"
              onClick={async () => {
                await logoutUser()
                window.location.reload()
              }}
            >
              <Icon name="chevron" size={16} />
            </button>
          )}
        </div>
      </aside>

      {menuOpen && (
        <button className="backdrop" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
      )}

      <div className="main-column">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <div className="breadcrumb">
            <span>Campus Life</span>
            <Icon name="chevron" size={14} />
            <strong>{currentPage.label}</strong>
          </div>
          <div className="top-actions">
            {searchOpen ? (
              <label className="search-field">
                <Icon name="search" size={17} />
                <input
                  autoFocus
                  placeholder="Search resources..."
                  onBlur={() => setSearchOpen(false)}
                />
              </label>
            ) : (
              <button
                className="icon-button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
              >
                <Icon name="search" size={19} />
              </button>
            )}
            <button className="icon-button notification" aria-label="Notifications">
              <Icon name="calendar" size={19} />
              <span />
            </button>
            <span className="mini-avatar">
              {guestMode
                ? 'CG'
                : user.name
                    .split(' ')
                    .map((x) => x[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
            </span>
          </div>
        </header>

        <main>
          <div className="wireframe-banner">
            <span>
              <Icon name="compass" size={17} /> Interactive starter wireframe
            </span>
            <p>Click navigation items and buttons to explore the proposed page flow.</p>
          </div>
          {page === 'home' && <Home go={go} events={events} user={user} />}
          {page === 'calendar' && (
            <CalendarPage events={events} guestMode={guestMode} setEvents={setEvents} user={user} />
          )}
          {page === 'academic' && <Academic go={go} />}
          {page === 'tutoring' && <Tutoring />}
          {page === 'tools' && <Tools />}
          {page === 'map' && <MapPage />}
        </main>

        <footer>
          <span>Campus Life Super App</span>
          <p>Student-centered access, all in one place.</p>
          <div>
            <button>Accessibility</button>
            <button>Help Center</button>
            <button>Feedback</button>
          </div>
        </footer>
      </div>
    </div>
  )
}

function Home({
  go,
  events,
  user,
}: {
  go: (page: Page) => void
  events: CalendarEventView[]
  user: CampusUser
}) {
  return (
    <div className="page">
      <section className="hero">
        <FrameLabel>HERO / WELCOME AREA</FrameLabel>
        <div>
          <p className="eyebrow">MONDAY, SEPTEMBER 16</p>
          <h1>Good morning, {user.name.split(' ')[0]}.</h1>
          <p>Everything you need to learn, connect, and thrive on campus.</p>
        </div>
        <div className="hero-graphic" aria-hidden="true">
          <span />
          <span />
          <Icon name="book" size={46} />
        </div>
      </section>

      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">QUICK ACCESS</p>
            <h2>What do you need today?</h2>
          </div>
          <span className="annotation">Primary student pathways</span>
        </div>
        <div className="quick-grid">
          <QuickCard
            icon="users"
            title="Find a tutor"
            text="Get help in the subjects that matter."
            color="red"
            onClick={() => go('tutoring')}
          />
          <QuickCard
            icon="file"
            title="Writing support"
            text="Plan, draft, and polish your work."
            color="cream"
            onClick={() => go('tools')}
          />
          <QuickCard
            icon="target"
            title="Study tools"
            text="Stay focused and study smarter."
            color="black"
            onClick={() => go('tools')}
          />
        </div>
        <p className="flow-note">
          <Icon name="arrow" size={17} /> Clicking a card takes the student to its resource page.
        </p>
      </section>

      <div className="home-columns">
        <section className="panel">
          <FrameLabel>UPCOMING / DYNAMIC CONTENT</FrameLabel>
          <div className="panel-head">
            <div>
              <p className="eyebrow">YOUR SCHEDULE</p>
              <h2>Coming up</h2>
            </div>
            <button onClick={() => go('calendar')}>
              View calendar <Icon name="arrow" size={16} />
            </button>
          </div>
          <div className="event-list">
            {events.length ? (
              events.slice(0, 3).map((item) => {
                const date = new Date(item.start)
                return (
                  <Event
                    key={item.id}
                    day={String(date.getDate())}
                    month={date.toLocaleString('en', { month: 'short' }).toUpperCase()}
                    title={item.title}
                    meta={`${date.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}${item.location ? ` • ${item.location}` : ''}`}
                    tag={item.source === 'brightspace' ? 'Brightspace' : item.type}
                  />
                )
              })
            ) : (
              <p className="empty-copy">
                Your next event will appear here. Open Calendar to add one.
              </p>
            )}
          </div>
        </section>
        <aside className="panel progress-panel">
          <FrameLabel>SIDEBAR / PROGRESS</FrameLabel>
          <p className="eyebrow">THIS WEEK</p>
          <h2>Your momentum</h2>
          <div className="progress-ring">
            <span>
              <strong>4</strong>
              <small>tasks done</small>
            </span>
          </div>
          <p>You’re building a strong rhythm. Keep it going.</p>
          <button className="text-link" onClick={() => go('tools')}>
            Open study plan <Icon name="arrow" size={16} />
          </button>
        </aside>
      </div>
    </div>
  )
}

function QuickCard({
  icon,
  title,
  text,
  color,
  onClick,
}: {
  icon: IconName
  title: string
  text: string
  color: string
  onClick: () => void
}) {
  return (
    <button className={`quick-card ${color}`} onClick={onClick}>
      <span className="quick-icon">
        <Icon name={icon} size={25} />
      </span>
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
      <Icon name="arrow" size={20} />
    </button>
  )
}

function Event({
  day,
  month,
  title,
  meta,
  tag,
}: {
  day: string
  month: string
  title: string
  meta: string
  tag: string
}) {
  return (
    <div className="event">
      <div className="date-box">
        <strong>{day}</strong>
        <span>{month}</span>
      </div>
      <div>
        <strong>{title}</strong>
        <span>{meta}</span>
      </div>
      <small>{tag}</small>
    </div>
  )
}

function CalendarPage({
  events,
  setEvents,
  user,
  guestMode,
}: {
  events: CalendarEventView[]
  setEvents: React.Dispatch<React.SetStateAction<CalendarEventView[]>>
  user: CampusUser
  guestMode: boolean
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()
  const [month, setMonth] = useState(() => {
    const date = new Date()
    return new Date(date.getFullYear(), date.getMonth(), 1)
  })
  const monthEvents = events.filter((event) => {
    const date = new Date(event.start)
    return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear()
  })
  const blanks = new Date(month.getFullYear(), month.getMonth(), 1).getDay()
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()

  const createGuestEvent = (input: EventInput) => {
    const title = input.title.trim().slice(0, 140)
    const start = new Date(input.start)
    if (!title || Number.isNaN(start.valueOf())) {
      return { ok: false, message: 'Add a title and valid date.' }
    }
    if (input.externalId && events.some((event) => event.externalId === input.externalId)) {
      return { ok: true, message: 'Already imported.' }
    }

    const event: CalendarEventView = {
      id: window.crypto.randomUUID(),
      title,
      type: input.type,
      start: start.toISOString(),
      end: input.end ? new Date(input.end).toISOString() : undefined,
      allDay: Boolean(input.allDay),
      location: input.location?.trim().slice(0, 120),
      notes: input.notes?.trim().slice(0, 1200),
      source: input.source ?? 'campus-life',
      externalId: input.externalId?.slice(0, 220),
    }
    setEvents((current) =>
      [...current, event].sort(
        (first, second) => new Date(first.start).valueOf() - new Date(second.start).valueOf(),
      ),
    )
    return { ok: true, message: 'Added to your calendar on this device.' }
  }

  const submit = (form: FormData) => {
    const input: EventInput = {
      title: String(form.get('title') || ''),
      type: String(form.get('type')) as EventInput['type'],
      start: String(form.get('start') || ''),
      end: String(form.get('end') || '') || undefined,
      location: String(form.get('location') || ''),
      notes: String(form.get('notes') || ''),
      attendeeEmail: String(form.get('attendeeEmail') || '') || undefined,
    }
    startTransition(async () => {
      const result = guestMode ? createGuestEvent(input) : await createCalendarEvent(input)
      setMessage(result.message)
      if (result.ok) {
        setShowForm(false)
        if (!guestMode) router.refresh()
      }
    })
  }

  const importICS = async (file?: File) => {
    if (!file) return
    const raw = await file.text()
    const blocks = raw.split('BEGIN:VEVENT').slice(1)
    let added = 0
    for (const block of blocks.slice(0, 100)) {
      const get = (key: string) =>
        block.match(new RegExp(`(?:^|\\n)${key}(?:;[^:]*)?:(.+)`, 'i'))?.[1]?.trim()
      const summary = get('SUMMARY')
      const startRaw = get('DTSTART')
      if (!summary || !startRaw) continue
      const normalized = startRaw
        .replace(/(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?.*/, '$1-$2-$3T$4:$5:00')
        .replace('T::00', 'T12:00:00')
      const uid = get('UID') || `${summary}-${startRaw}`
      const input: EventInput = {
        title: summary.replace(/\\,/g, ','),
        type: 'assignment',
        start: normalized,
        notes: get('DESCRIPTION')?.replace(/\\n/g, '\n'),
        source: 'brightspace',
        externalId: uid,
      }
      const result = guestMode ? createGuestEvent(input) : await createCalendarEvent(input)
      if (result.ok && result.message !== 'Already imported.') added++
    }
    setMessage(
      `Brightspace import complete: ${added} new assignment${added === 1 ? '' : 's'} added.`,
    )
    if (!guestMode) router.refresh()
  }

  return (
    <div className="page inner-page calendar-page">
      <PageTitle
        eyebrow="MY CALENDAR"
        title="Your semester, in one view."
        text={
          guestMode
            ? 'Add personal plans and bring in Brightspace deadlines. Your calendar stays on this device.'
            : 'Add personal plans, share tutor meetings, and bring in Brightspace assignment deadlines.'
        }
      />
      <div className="calendar-actions">
        <button className="primary-action" onClick={() => setShowForm(true)}>
          + Add event
        </button>
        <label className="import-action">
          <Icon name="calendar" size={17} /> Import Brightspace .ics
          <input
            type="file"
            accept=".ics,text/calendar"
            onChange={(e) => importICS(e.target.files?.[0])}
          />
        </label>
        <span className="sync-note">
          {guestMode
            ? 'Guest events stay in this browser. Brightspace → Calendar → Subscribe/Download'
            : 'No admin access needed: Brightspace → Calendar → Subscribe/Download'}
        </span>
      </div>
      {message && <div className="calendar-message">{message}</div>}
      <div className="calendar-layout">
        <section className="month-card">
          <div className="month-header">
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            >
              ←
            </button>
            <h2>{month.toLocaleString('en', { month: 'long', year: 'numeric' })}</h2>
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            >
              →
            </button>
          </div>
          <div className="weekday-row">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
          <div className="month-grid">
            {Array.from({ length: blanks }).map((_, i) => (
              <span className="calendar-day blank" key={`b${i}`} />
            ))}
            {Array.from({ length: days }).map((_, i) => {
              const dateEvents = monthEvents.filter(
                (event) => new Date(event.start).getDate() === i + 1,
              )
              return (
                <div className="calendar-day" key={i}>
                  <b>{i + 1}</b>
                  {dateEvents.slice(0, 2).map((event) => (
                    <span className={`event-pill ${event.type}`} key={event.id}>
                      {event.title}
                    </span>
                  ))}
                </div>
              )
            })}
          </div>
        </section>
        <aside className="agenda-card">
          <p className="eyebrow">UP NEXT</p>
          <h2>Agenda</h2>
          {events.length ? (
            events.slice(0, 6).map((event) => (
              <article key={event.id}>
                <span className={`agenda-dot ${event.type}`} />
                <div>
                  <strong>{event.title}</strong>
                  <small>
                    {new Date(event.start).toLocaleString('en', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </small>
                  <em>{event.source === 'brightspace' ? 'Brightspace' : event.type}</em>
                </div>
              </article>
            ))
          ) : (
            <p className="empty-copy">Nothing scheduled yet.</p>
          )}
        </aside>
      </div>
      {showForm && (
        <div className="modal-backdrop" onMouseDown={() => setShowForm(false)}>
          <form className="event-modal" action={submit} onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">NEW CALENDAR ITEM</p>
                <h2>Add an event</h2>
              </div>
              <button type="button" onClick={() => setShowForm(false)}>
                ×
              </button>
            </div>
            <label>
              Title
              <input name="title" required placeholder="Chemistry study session" />
            </label>
            <div className="form-row">
              <label>
                Type
                <select name="type">
                  <option value="personal">Personal</option>
                  <option value="assignment">Assignment</option>
                  <option value="study">Study session</option>
                  <option value="tutoring">Tutor meeting</option>
                </select>
              </label>
              <label>
                Starts
                <input name="start" type="datetime-local" required />
              </label>
            </div>
            <div className="form-row">
              <label>
                Ends
                <input name="end" type="datetime-local" />
              </label>
              <label>
                Location
                <input name="location" placeholder="Learning Commons" />
              </label>
            </div>
            {user.role === 'tutor' && (
              <label>
                Tutoree’s campus email
                <input name="attendeeEmail" type="email" placeholder="student@campus.edu" />
                <small>This meeting will appear on their calendar too.</small>
              </label>
            )}
            <label>
              Notes
              <textarea name="notes" rows={3} placeholder="Topics, preparation, or meeting link" />
            </label>
            <button className="primary-action" disabled={pending}>
              {pending ? 'Adding…' : 'Add to calendar'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function Academic({ go }: { go: (page: Page) => void }) {
  const resources = [
    {
      icon: 'users' as IconName,
      title: 'Tutoring Center',
      text: 'One-on-one and group support for your courses.',
      action: () => go('tutoring'),
    },
    {
      icon: 'file' as IconName,
      title: 'Writing Center',
      text: 'Feedback at any stage of the writing process.',
      action: () => go('tools'),
    },
    {
      icon: 'target' as IconName,
      title: 'Study Skills',
      text: 'Strategies for time, focus, notes, and exams.',
      action: () => go('tools'),
    },
    {
      icon: 'book' as IconName,
      title: 'Library Resources',
      text: 'Research guides, databases, and course reserves.',
      action: () => {},
    },
  ]
  return (
    <div className="page inner-page">
      <PageTitle
        eyebrow="ACADEMIC SUPPORT"
        title="Help is closer than you think."
        text="Find the people, tools, and spaces that can help you do your best work."
      />
      <div className="search-large">
        <Icon name="search" />
        <input placeholder="What do you need help with?" />
        <button>Search resources</button>
      </div>
      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">BROWSE SUPPORT</p>
            <h2>Academic resources</h2>
          </div>
          <span className="annotation">Content area: resource directory</span>
        </div>
        <div className="resource-grid">
          {resources.map((item) => (
            <button className="resource-card" onClick={item.action} key={item.title}>
              <span>
                <Icon name={item.icon} size={25} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <b>
                Explore <Icon name="arrow" size={16} />
              </b>
            </button>
          ))}
        </div>
      </section>
      <div className="callout">
        <Icon name="spark" size={26} />
        <div>
          <strong>Not sure where to start?</strong>
          <p>Answer three quick questions and we’ll point you to the right support.</p>
        </div>
        <button>Guide me</button>
      </div>
    </div>
  )
}

function Tutoring() {
  const [subject, setSubject] = useState('All subjects')
  return (
    <div className="page inner-page">
      <PageTitle
        eyebrow="TUTORING CENTER"
        title="Find support that fits your schedule."
        text="Connect with a peer tutor online or in person—at no extra cost."
      />
      <div className="filter-bar">
        <label>
          <span>Subject</span>
          <select value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option>All subjects</option>
            <option>Math</option>
            <option>Science</option>
            <option>Writing</option>
          </select>
        </label>
        <label>
          <span>Format</span>
          <select>
            <option>Any format</option>
            <option>In person</option>
            <option>Online</option>
          </select>
        </label>
        <label>
          <span>Availability</span>
          <select>
            <option>This week</option>
            <option>Today</option>
            <option>Next week</option>
          </select>
        </label>
        <button>Find a tutor</button>
      </div>
      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">AVAILABLE THIS WEEK</p>
            <h2>Recommended tutors</h2>
          </div>
          <span className="annotation">Filters update appointment results</span>
        </div>
        <div className="tutor-grid">
          <Tutor
            initials="AM"
            name="Avery Morgan"
            subject={subject === 'All subjects' ? 'Chemistry • Biology' : subject}
            time="Today, 2:00 PM"
          />
          <Tutor
            initials="DK"
            name="Devon Kim"
            subject={subject === 'All subjects' ? 'Calculus • Statistics' : subject}
            time="Tomorrow, 11:30 AM"
          />
          <Tutor
            initials="SR"
            name="Sam Rivera"
            subject={subject === 'All subjects' ? 'Writing • Humanities' : subject}
            time="Thu, 3:00 PM"
          />
        </div>
      </section>
      <p className="flow-note center">
        <Icon name="arrow" size={17} /> Selecting “View times” would open the tutor’s booking
        details.
      </p>
    </div>
  )
}

function Tutor({
  initials,
  name,
  subject,
  time,
}: {
  initials: string
  name: string
  subject: string
  time: string
}) {
  const [booked, setBooked] = useState(false)
  return (
    <article className="tutor-card">
      <div className="tutor-top">
        <span className="tutor-avatar">{initials}</span>
        <span className="status">AVAILABLE</span>
      </div>
      <h3>{name}</h3>
      <p>{subject}</p>
      <div className="next-time">
        <Icon name="clock" size={17} />
        <span>
          <small>Next opening</small>
          <strong>{time}</strong>
        </span>
      </div>
      <button onClick={() => setBooked(!booked)}>
        {booked ? 'Time selected' : 'View times'}{' '}
        <Icon name={booked ? 'calendar' : 'arrow'} size={16} />
      </button>
    </article>
  )
}

function Tools() {
  const [active, setActive] = useState('Study plan')
  const [focusMinutes, setFocusMinutes] = useState(25)
  const [planItems, setPlanItems] = useState<string[]>([
    'Read chapter 6',
    'Draft discussion response',
  ])
  const [newItem, setNewItem] = useState('')
  const [cards, setCards] = useState([
    { front: 'Mitosis', back: 'Cell division producing two identical cells' },
  ])
  const [cardFront, setCardFront] = useState('')
  const [cardBack, setCardBack] = useState('')
  const tools = [
    ['file', 'Essay planner', 'Break an assignment into clear, manageable steps.', 'Writing'],
    ['clock', 'Focus timer', 'Work in focused sessions with intentional breaks.', 'Productivity'],
    ['book', 'Citation builder', 'Create and organize citations for your sources.', 'Writing'],
    ['target', 'Study plan', 'Turn your deadlines into a realistic weekly plan.', 'Planning'],
    ['spark', 'Flashcard maker', 'Create quick review sets for any class.', 'Study'],
    ['calendar', 'Deadline tracker', 'See every assignment and exam in one place.', 'Planning'],
  ]
  return (
    <div className="page inner-page">
      <PageTitle
        eyebrow="STUDY TOOLKIT"
        title="Small tools. Better study days."
        text="Simple, accessible resources to help you plan, write, focus, and remember."
      />
      <div className="tool-layout">
        <aside className="tool-categories">
          <FrameLabel>SIDEBAR / FILTERS</FrameLabel>
          <p className="eyebrow">CATEGORIES</p>
          {['All tools', 'Writing', 'Planning', 'Study', 'Productivity'].map((x, i) => (
            <button className={i === 0 ? 'active' : ''} key={x}>
              {x}
              <span>{i === 0 ? '6' : i === 1 ? '2' : i === 2 ? '2' : '1'}</span>
            </button>
          ))}
        </aside>
        <section className="tools-content">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ALL TOOLS</p>
              <h2>Choose a tool</h2>
            </div>
            <span className="annotation">Cards open each study utility</span>
          </div>
          <div className="tools-grid">
            {tools.map(([icon, title, text, tag]) => (
              <button
                className={`tool-card ${active === title ? 'selected' : ''}`}
                key={title}
                onClick={() => setActive(title)}
              >
                <span className="tool-icon">
                  <Icon name={icon as IconName} size={23} />
                </span>
                <small>{tag}</small>
                <h3>{title}</h3>
                <p>{text}</p>
                <b>
                  Open tool <Icon name="arrow" size={16} />
                </b>
              </button>
            ))}
          </div>
          <div className="tool-workspace">
            <div>
              <p className="eyebrow">ACTIVE WORKSPACE</p>
              <h2>{active}</h2>
            </div>
            {active === 'Focus timer' ? (
              <div className="focus-tool">
                <div className="timer-ring">
                  <strong>{focusMinutes}:00</strong>
                  <span>focus session</span>
                </div>
                <div>
                  <button onClick={() => setFocusMinutes(focusMinutes === 25 ? 45 : 25)}>
                    Switch to {focusMinutes === 25 ? '45' : '25'} min
                  </button>
                  <button className="primary-action">Start focus session</button>
                  <p>Notifications will be quiet until your session ends.</p>
                </div>
              </div>
            ) : active === 'Flashcard maker' ? (
              <div className="flash-tool">
                <div className="flash-form">
                  <input
                    value={cardFront}
                    onChange={(e) => setCardFront(e.target.value)}
                    placeholder="Term or question"
                  />
                  <textarea
                    value={cardBack}
                    onChange={(e) => setCardBack(e.target.value)}
                    placeholder="Answer or definition"
                  />
                  <button
                    onClick={() => {
                      if (cardFront && cardBack) {
                        setCards([...cards, { front: cardFront, back: cardBack }])
                        setCardFront('')
                        setCardBack('')
                      }
                    }}
                  >
                    Add flashcard
                  </button>
                </div>
                <div className="flash-stack">
                  {cards.map((card, i) => (
                    <button key={i}>
                      <strong>{card.front}</strong>
                      <span>{card.back}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="plan-tool">
                <div className="plan-progress">
                  <strong>{planItems.length}</strong>
                  <span>steps in your plan</span>
                </div>
                <div className="plan-list">
                  {planItems.map((item, i) => (
                    <label key={i}>
                      <input type="checkbox" /> <span>{item}</span>
                    </label>
                  ))}
                  <div>
                    <input
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      placeholder="Add the next small step…"
                    />
                    <button
                      onClick={() => {
                        if (newItem.trim()) {
                          setPlanItems([...planItems, newItem.trim()])
                          setNewItem('')
                        }
                      }}
                    >
                      Add step
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function MapPage() {
  const [place, setPlace] = useState('Learning Commons')
  return (
    <div className="page inner-page map-page">
      <PageTitle
        eyebrow="CAMPUS MAP"
        title="Find your way, faster."
        text="Search student services, study spaces, and academic support across campus."
      />
      <div className="map-layout">
        <aside className="place-list">
          <FrameLabel>SIDEBAR / LOCATIONS</FrameLabel>
          <div className="search-small">
            <Icon name="search" size={17} />
            <input placeholder="Search campus" />
          </div>
          <p className="eyebrow">STUDENT ESSENTIALS</p>
          {['Learning Commons', 'Writing Center', 'Student Union', 'Main Library'].map((x, i) => (
            <button key={x} className={place === x ? 'active' : ''} onClick={() => setPlace(x)}>
              <span>
                <Icon name={i === 2 ? 'users' : 'book'} size={18} />
              </span>
              <div>
                <strong>{x}</strong>
                <small>
                  {i === 0
                    ? 'Tutoring • Study rooms'
                    : i === 1
                      ? 'Writing support'
                      : i === 2
                        ? 'Food • Student services'
                        : 'Research • Quiet study'}
                </small>
              </div>
              <Icon name="chevron" size={16} />
            </button>
          ))}
        </aside>
        <div className="map-canvas">
          <FrameLabel>CONTENT AREA / INTERACTIVE MAP</FrameLabel>
          <div className="road one" />
          <div className="road two" />
          <div className="road three" />
          <span className="building b1">SCIENCE</span>
          <span className="building b2">LIBRARY</span>
          <span className="building b3">STUDENT UNION</span>
          <span className="building b4">ARTS</span>
          <div className="map-pin">
            <Icon name="map" size={22} />
            <strong>{place}</strong>
            <small>Open now • Until 9 PM</small>
            <button>Get directions</button>
          </div>
        </div>
      </div>
      <p className="flow-note center">
        <Icon name="arrow" size={17} /> Clicking a location updates the map; “Get directions” begins
        a route.
      </p>
    </div>
  )
}

function PageTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <section className="page-title">
      <FrameLabel>HEADER / PAGE INTRO</FrameLabel>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{text}</p>
    </section>
  )
}

export default App
