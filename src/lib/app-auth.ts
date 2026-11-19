import 'server-only'

import config from '@payload-config'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'

const COOKIE = 'app-session'

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null

  const payload = await getPayload({ config })
  const { user } = await payload.auth({
    headers: new Headers({ Authorization: `JWT ${token}` }),
  })

  if (!user || user.collection !== 'users') return null
  return user
}

export async function setAppSession(token: string) {
  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearAppSession() {
  ;(await cookies()).delete(COOKIE)
}
