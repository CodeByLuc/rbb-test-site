import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Media, Post, Sponsoren, Team } from '../payload-types'

export const payloadHolen = async () => getPayload({ config: await configPromise })

/** Nur veröffentlichte Beiträge – Entwürfe bleiben unsichtbar. */
const nurVeroeffentlicht = { _status: { equals: 'published' } }

export async function holeEinstellungen() {
  const payload = await payloadHolen()
  return payload.findGlobal({ slug: 'einstellungen', depth: 2 })
}

export async function holeTeams(): Promise<Team[]> {
  const payload = await payloadHolen()
  const { docs } = await payload.find({
    collection: 'teams',
    limit: 100,
    sort: 'reihenfolge',
    depth: 1,
  })
  return docs
}

export async function holeTeam(slug: string): Promise<Team | null> {
  const payload = await payloadHolen()
  const { docs } = await payload.find({
    collection: 'teams',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })
  return docs[0] ?? null
}

export async function holePosts(optionen?: {
  limit?: number
  teamId?: number | string
}): Promise<Post[]> {
  const payload = await payloadHolen()
  const { docs } = await payload.find({
    collection: 'posts',
    where: optionen?.teamId
      ? { and: [nurVeroeffentlicht, { team: { equals: optionen.teamId } }] }
      : nurVeroeffentlicht,
    limit: optionen?.limit ?? 12,
    sort: '-datum',
    depth: 2,
  })
  return docs
}

export async function holePost(slug: string): Promise<Post | null> {
  const payload = await payloadHolen()
  const { docs } = await payload.find({
    collection: 'posts',
    where: { and: [nurVeroeffentlicht, { slug: { equals: slug } }] },
    limit: 1,
    depth: 2,
  })
  return docs[0] ?? null
}

export async function holeSponsoren(): Promise<Sponsoren[]> {
  const payload = await payloadHolen()
  const { docs } = await payload.find({
    collection: 'sponsoren',
    where: { aktiv: { equals: true } },
    limit: 100,
    sort: 'reihenfolge',
    depth: 1,
  })
  return docs
}

/** Ein Foto für den Kopfbereich von Unterseiten. Logos (PNG) bleiben aussen vor. */
export async function holeStimmungsbild(): Promise<Media | null> {
  const payload = await payloadHolen()
  const { docs } = await payload.find({
    collection: 'media',
    where: { mimeType: { contains: 'jpeg' } },
    limit: 1,
    sort: 'createdAt',
  })
  return docs[0] ?? null
}

export async function holeGlobal<T extends 'eishockey' | 'verein'>(slug: T) {
  const payload = await payloadHolen()
  return payload.findGlobal({ slug, depth: 2 })
}

/** "25. Oktober 2025" */
export const datumLang = (wert?: string | null) =>
  wert
    ? new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'long', year: 'numeric' }).format(
        new Date(wert),
      )
    : ''

/** "25.10.2025" */
export const datumKurz = (wert?: string | null) =>
  wert ? new Intl.DateTimeFormat('de-CH', { dateStyle: 'short' }).format(new Date(wert)) : ''
