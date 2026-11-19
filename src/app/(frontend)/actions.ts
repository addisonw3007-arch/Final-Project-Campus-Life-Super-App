'use server'

import config from '@payload-config'
import { clearAppSession, getCurrentUser, setAppSession } from '@/lib/app-auth'
import { getPayload } from 'payload'

export type ActionResult = { ok: boolean; message: string }

const text = (value: FormDataEntryValue | null, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

export async function registerUser(_: ActionResult, form: FormData): Promise<ActionResult> {
  const name = text(form.get('name'), 80)
  const email = text(form.get('email'), 160).toLowerCase()
  const password = text(form.get('password'), 100)
  if (!name || !email.includes('@') || password.length < 8) {
    return { ok: false, message: 'Enter your name, campus email, and an 8+ character password.' }
  }
  try {
    const payload = await getPayload({ config })
    await payload.create({
      collection: 'users',
      data: { name, email, password },
      overrideAccess: false,
    })
    const result = await payload.login({ collection: 'users', data: { email, password } })
    if (!result.token) return { ok: false, message: 'Account created. Please sign in.' }
    await setAppSession(result.token)
    return { ok: true, message: 'Welcome to Campus Life.' }
  } catch {
    return { ok: false, message: 'That email may already be registered.' }
  }
}

export async function loginUser(_: ActionResult, form: FormData): Promise<ActionResult> {
  const email = text(form.get('email'), 160).toLowerCase()
  const password = text(form.get('password'), 100)
  try {
    const payload = await getPayload({ config })
    const result = await payload.login({ collection: 'users', data: { email, password } })
    if (!result.token) throw new Error('No session')
    await setAppSession(result.token)
    return { ok: true, message: 'Signed in.' }
  } catch {
    return { ok: false, message: 'Email or password is incorrect.' }
  }
}

export async function logoutUser(): Promise<ActionResult> {
  await clearAppSession()
  return { ok: true, message: 'Signed out.' }
}

export type EventInput = {
  title: string
  type: 'personal' | 'assignment' | 'tutoring' | 'study'
  start: string
  end?: string
  allDay?: boolean
  location?: string
  notes?: string
  attendeeEmail?: string
  source?: 'campus-life' | 'brightspace'
  externalId?: string
}

export async function createCalendarEvent(input: EventInput): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, message: 'Please sign in again.' }
  const title = input.title.trim().slice(0, 140)
  const start = new Date(input.start)
  if (!title || Number.isNaN(start.valueOf()))
    return { ok: false, message: 'Add a title and valid date.' }

  const payload = await getPayload({ config })
  let attendees: string[] = []
  if (input.attendeeEmail) {
    if (user.role !== 'tutor')
      return { ok: false, message: 'Only verified tutors can add a tutoree.' }
    const match = await payload.find({
      collection: 'users',
      where: { email: { equals: input.attendeeEmail.trim().toLowerCase() } },
      limit: 1,
      user,
      overrideAccess: false,
    })
    if (!match.docs[0]) return { ok: false, message: 'No student account matches that email.' }
    attendees = [String(match.docs[0].id)]
  }

  if (input.externalId) {
    const existing = await payload.find({
      collection: 'calendar-events',
      where: {
        and: [
          { externalId: { equals: input.externalId.slice(0, 220) } },
          { owner: { equals: user.id } },
        ],
      },
      limit: 1,
      user,
      overrideAccess: false,
    })
    if (existing.docs.length) return { ok: true, message: 'Already imported.' }
  }

  await payload.create({
    collection: 'calendar-events',
    data: {
      title,
      type: input.type,
      start: start.toISOString(),
      end: input.end ? new Date(input.end).toISOString() : undefined,
      allDay: Boolean(input.allDay),
      location: input.location?.trim().slice(0, 120),
      notes: input.notes?.trim().slice(0, 1200),
      attendees,
      source: input.source ?? 'campus-life',
      externalId: input.externalId?.slice(0, 220),
      owner: user.id,
    },
    user,
    overrideAccess: false,
  })
  return {
    ok: true,
    message: attendees.length
      ? 'Meeting added for you and your tutoree.'
      : 'Added to your calendar.',
  }
}
