import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type {
  Eishockey,
  Einstellungen,
  Media,
  Post,
  Sponsoren,
  Team,
  Verein,
} from '../payload-types'
import {
  baueSpielplan,
  holeClubRangliste,
  holeClubSpiele,
  holeTeamSpielplan,
  spieleAusManuellerListe,
  type SihfSpiel,
  type TeamSpielplan,
} from './sihf'

export const payloadHolen = async () => getPayload({ config: await configPromise })

/** Nur veröffentlichte Beiträge – Entwürfe bleiben unsichtbar. */
const nurVeroeffentlicht = { _status: { equals: 'published' } }

/**
 * Führt eine Abfrage aus und liefert bei einem Fehler den Ersatzwert.
 *
 * Nötig, weil die Seiten beim Erzeugen (Build) auf die Datenbank zugreifen. Ist
 * diese frisch angelegt oder kurz nicht erreichbar, soll die Website trotzdem
 * entstehen und leere Bereiche zeigen – statt das ganze Deployment abzubrechen.
 */
async function sicher<T>(was: string, abfrage: () => Promise<T>, ersatz: T): Promise<T> {
  try {
    return await abfrage()
  } catch (fehler) {
    console.warn(`[Daten] ${was} nicht verfügbar:`, (fehler as Error)?.message ?? fehler)
    return ersatz
  }
}

export async function holeEinstellungen(): Promise<Einstellungen> {
  return sicher(
    'Einstellungen',
    async () => {
      const payload = await payloadHolen()
      return payload.findGlobal({ slug: 'einstellungen', depth: 2 })
    },
    // Leeres Gerüst: Kopf- und Fusszeile zeigen dann nur das Wappen.
    { id: 0, updatedAt: '', createdAt: '' } as Einstellungen,
  )
}

export async function holeTeams(): Promise<Team[]> {
  return sicher(
    'Teams',
    async () => {
      const payload = await payloadHolen()
      const { docs } = await payload.find({
        collection: 'teams',
        limit: 100,
        sort: 'reihenfolge',
        depth: 1,
      })
      return docs
    },
    [],
  )
}

export async function holeTeam(slug: string): Promise<Team | null> {
  return sicher(
    `Team ${slug}`,
    async () => {
      const payload = await payloadHolen()
      const { docs } = await payload.find({
        collection: 'teams',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 2,
      })
      return docs[0] ?? null
    },
    null,
  )
}

/**
 * Wie `holeTeamSpielplan`, greift aber auf von Hand erfasste Spiele zurück
 * (Team-Feld "Spielplan von Hand"), sobald die SIHF-Statistik-API für die
 * Liga eines Teams (noch) nichts liefert – z. B. kurz nach Saisonbeginn, ehe
 * die Amateurliga dort erfasst ist. Sobald die Live-Abfrage Spiele findet,
 * hat sie Vorrang.
 */
async function spielplanOhneRangliste(
  team: Pick<Team, 'sihfLeagueId' | 'sihfTeamId' | 'sihfTeamName' | 'manuelleSpiele'>,
  opts?: { saison?: string; revalidate?: number },
): Promise<TeamSpielplan> {
  const live = await holeTeamSpielplan({
    ligaId: team.sihfLeagueId,
    teamId: team.sihfTeamId,
    teamName: team.sihfTeamName,
    saison: opts?.saison,
    revalidate: opts?.revalidate,
  })

  if (live.spiele.length > 0) return live
  if (!team.manuelleSpiele || team.manuelleSpiele.length === 0) return live

  const manuell = spieleAusManuellerListe(team.manuelleSpiele)
  return baueSpielplan(manuell, { teamName: team.sihfTeamName })
}

/**
 * Spielplan, Resultate und Tabelle eines Teams. Ist beim Team der
 * Aufruf-Schlüssel der Club-Schnittstelle hinterlegt und liefert sie eine
 * Rangliste, ersetzt diese offizielle Tabelle die selbst berechnete.
 */
export async function holeTeamSpielplanMitFallback(
  team: Pick<
    Team,
    'sihfLeagueId' | 'sihfTeamId' | 'sihfTeamName' | 'manuelleSpiele' | 'sihfRanglisteKey' | 'sihfSpieleKey' | 'sihfResultateKey'
  >,
  opts?: { saison?: string; revalidate?: number },
): Promise<TeamSpielplan> {
  let plan = await spielplanOhneRangliste(team, opts)
  // Die Schlüssel der Club-Schnittstelle gelten immer für die laufende Saison.
  if (opts?.saison) return plan

  const eigenes = { teamId: team.sihfTeamId, teamName: team.sihfTeamName }
  const nachZeit = (a: SihfSpiel, b: SihfSpiel) =>
    (a.zeitpunkt ? Date.parse(a.zeitpunkt) : 0) - (b.zeitpunkt ? Date.parse(b.zeitpunkt) : 0)

  // Bereits gespielte Spiele aus der Club-Schnittstelle («Letzte Spiele»):
  // sie sind offiziell und aktuell und gehen der bisherigen Quelle vor.
  if (team.sihfResultateKey) {
    const gespielt = (await holeClubSpiele(team.sihfResultateKey, opts?.revalidate)).filter(
      (s) => s.gespielt,
    )
    if (gespielt.length > 0) {
      const schluessel = (s: SihfSpiel) => s.gameId ?? `${s.datum}|${s.heim.name}|${s.gast.name}`
      const neu = new Set(gespielt.map(schluessel))
      const uebrige = plan.spiele.filter((s) => !neu.has(schluessel(s)))
      plan = baueSpielplan([...uebrige, ...gespielt].sort(nachZeit), eigenes)
    }
  }

  // Kommende Spiele kommen aus der Club-Schnittstelle (inkl. Halle und
  // aktueller Anspielzeit); bereits gespielte Resultate bleiben aus der bisherigen Quelle.
  if (team.sihfSpieleKey) {
    const kommende = (await holeClubSpiele(team.sihfSpieleKey, opts?.revalidate)).filter(
      (s) => !s.gespielt,
    )
    if (kommende.length > 0) {
      const gespielt = plan.spiele.filter((s) => s.gespielt)
      const alle = [...gespielt, ...kommende].sort(nachZeit)
      plan = baueSpielplan(alle, eigenes)
    }
  }

  if (!team.sihfRanglisteKey) return plan
  const tabelle = await holeClubRangliste(team.sihfRanglisteKey, opts?.revalidate)
  return tabelle.length > 0 ? { ...plan, tabelle } : plan
}

export async function holePosts(optionen?: {
  limit?: number
  teamId?: number | string
}): Promise<Post[]> {
  return sicher(
    'Beiträge',
    async () => {
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
    },
    [],
  )
}

export async function holePost(slug: string): Promise<Post | null> {
  return sicher(
    `Beitrag ${slug}`,
    async () => {
      const payload = await payloadHolen()
      const { docs } = await payload.find({
        collection: 'posts',
        where: { and: [nurVeroeffentlicht, { slug: { equals: slug } }] },
        limit: 1,
        depth: 2,
      })
      return docs[0] ?? null
    },
    null,
  )
}

export async function holeSponsoren(): Promise<Sponsoren[]> {
  return sicher(
    'Sponsoren',
    async () => {
      const payload = await payloadHolen()
      const { docs } = await payload.find({
        collection: 'sponsoren',
        where: { aktiv: { equals: true } },
        limit: 100,
        sort: 'reihenfolge',
        depth: 1,
      })
      return docs
    },
    [],
  )
}

/** Ein Foto für den Kopfbereich von Unterseiten. Logos (PNG) bleiben aussen vor. */
export async function holeStimmungsbild(): Promise<Media | null> {
  return sicher(
    'Stimmungsbild',
    async () => {
      const payload = await payloadHolen()
      const { docs } = await payload.find({
        collection: 'media',
        where: { mimeType: { contains: 'jpeg' } },
        limit: 1,
        sort: 'createdAt',
      })
      return docs[0] ?? null
    },
    null,
  )
}

export async function holeGlobal<T extends 'eishockey' | 'verein'>(
  slug: T,
): Promise<T extends 'eishockey' ? Eishockey : Verein> {
  type Ergebnis = T extends 'eishockey' ? Eishockey : Verein
  return sicher(
    `Seite ${slug}`,
    async () => {
      const payload = await payloadHolen()
      return (await payload.findGlobal({ slug, depth: 2 })) as unknown as Ergebnis
    },
    { id: 0, updatedAt: '', createdAt: '' } as Ergebnis,
  )
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
