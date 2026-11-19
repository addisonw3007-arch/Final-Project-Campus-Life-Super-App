import config from '@payload-config'
import { getCurrentUser } from '@/lib/app-auth'
import { getPayload } from 'payload'
import CampusApp, { type CalendarEventView } from './CampusApp'

export default async function HomePage() {
  const user = await getCurrentUser()
  const result = user
    ? await (
        await getPayload({ config })
      ).find({
        collection: 'calendar-events',
        sort: 'start',
        limit: 100,
        user,
        overrideAccess: false,
      })
    : { docs: [] }

  const events: CalendarEventView[] = result.docs.map((event) => ({
    id: String(event.id),
    title: event.title,
    type: event.type,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    location: event.location,
    source: event.source,
    notes: event.notes,
    externalId: event.externalId,
  }))

  return (
    <CampusApp
      initialEvents={events}
      guestMode={!user}
      user={{
        name: user?.name ?? 'Campus Guest',
        email: user?.email ?? '',
        role: user?.role ?? 'student',
        year: user?.year,
      }}
    />
  )
}
