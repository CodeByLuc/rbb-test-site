/**
 * Zugriff auf die öffentliche Statistik-Schnittstelle von Swiss Ice Hockey.
 *
 * Der Aufruf, der den kompletten Saisonspielplan einer Liga liefert:
 *
 *   https://data.sihf.ch/statistic/api/cms/cache300
 *     ?alias=results
 *     &searchQuery=1,2,4,8,10,11,12//<LIGA-ID>
 *     &filterQuery=<SAISON>/all/all/all
 *     &orderBy=date&orderByDescending=false
 *     &take=900
 *     &filterBy=season,league,region,phase
 *     &skip=0&language=de
 *
 * Entscheidend ist, dass `date` in `filterBy` FEHLT. Sobald es mitgeschickt wird,
 * liefert die Schnittstelle nur die Spiele eines einzelnen Tages.
 *
 * Die Antwort besteht aus `header` (Spaltendefinitionen mit `alias`) und `data`
 * (ein Array pro Spiel, positionsbasiert). Wir lesen die Spaltenpositionen aus
 * dem Header, damit eine geänderte Spaltenreihenfolge nichts kaputt macht.
 *
 * Wichtig: In Amateurligen ist `clubId` leer. Teams werden darum über die
 * Team-ID und ersatzweise über den Namen erkannt.
 */

const BASIS = 'https://data.sihf.ch/statistic/api/cms/cache300'
const LIGA_GRUPPEN = '1,2,4,8,10,11,12'

export type SihfTeam = {
  id: number | null
  name: string
  kuerzel: string | null
}

export type SihfSpiel = {
  gameId: string | null
  wochentag: string
  datum: string
  zeit: string
  zeitpunkt: string | null
  heim: SihfTeam
  gast: SihfTeam
  toreHeim: number | null
  toreGast: number | null
  gespielt: boolean
  abgesagt: boolean
  entscheidung: string
  status: string
  drittelHeim: string[]
  drittelGast: string[]
}

/**
 * Die Saison heisst bei der SIHF nach ihrem Endjahr: 2025/26 -> "2026".
 * Ab Juli zählt bereits die neue Saison.
 */
export function saisonAlias(datum: Date = new Date()): string {
  const jahr = datum.getFullYear()
  return String(datum.getMonth() >= 6 ? jahr + 1 : jahr)
}

const zahlOderNull = (wert: unknown): number | null => {
  const n = Number(String(wert ?? '').trim())
  return Number.isFinite(n) ? n : null
}

const alsTeam = (rohdaten: unknown): SihfTeam => {
  const t = (rohdaten ?? {}) as Record<string, unknown>
  return {
    id: zahlOderNull(t.id),
    name: typeof t.name === 'string' ? t.name : '',
    kuerzel: typeof t.acronym === 'string' ? t.acronym : null,
  }
}

type ApiAntwort = {
  header?: { alias?: string }[]
  data?: unknown[][]
}

function spieleAusAntwort(antwort: ApiAntwort): SihfSpiel[] {
  const header = antwort.header ?? []
  const pos = (alias: string) => header.findIndex((h) => h?.alias === alias)

  const iDay = pos('day')
  const iDate = pos('date')
  const iTime = pos('time')
  const iHome = pos('homeTeam')
  const iAway = pos('awayTeam')
  const iScore = pos('score')
  const iPeriods = pos('scorePerPeriod')
  const iDecision = pos('decision')
  const iStatus = pos('status')
  const iDetails = pos('details')

  const hole = (zeile: unknown[], index: number) => (index >= 0 ? zeile[index] : undefined)

  return (antwort.data ?? []).map((zeile) => {
    const score = (hole(zeile, iScore) ?? {}) as Record<string, unknown>
    const perioden = (hole(zeile, iPeriods) ?? {}) as Record<string, unknown>
    const status = (hole(zeile, iStatus) ?? {}) as Record<string, unknown>
    const details = (hole(zeile, iDetails) ?? {}) as Record<string, unknown>

    const toreHeim = zahlOderNull(score.homeTeam)
    const toreGast = zahlOderNull(score.awayTeam)

    return {
      gameId: details.gameId ? String(details.gameId) : null,
      wochentag: String(hole(zeile, iDay) ?? ''),
      datum: String(hole(zeile, iDate) ?? ''),
      zeit: String(hole(zeile, iTime) ?? ''),
      zeitpunkt: typeof status.startDateTime === 'string' ? status.startDateTime : null,
      heim: alsTeam(hole(zeile, iHome)),
      gast: alsTeam(hole(zeile, iAway)),
      toreHeim,
      toreGast,
      gespielt: toreHeim !== null && toreGast !== null,
      abgesagt: status.canceled === true,
      entscheidung: String(hole(zeile, iDecision) ?? '').trim(),
      status: typeof status.name === 'string' ? status.name : '',
      drittelHeim: Array.isArray(perioden.homeTeam) ? (perioden.homeTeam as string[]) : [],
      drittelGast: Array.isArray(perioden.awayTeam) ? (perioden.awayTeam as string[]) : [],
    }
  })
}

type LigaOptionen = {
  ligaId: string | number
  saison?: string
  /** Sekunden bis die Antwort neu geholt wird. 0 = immer frisch (für den Montags-Job). */
  revalidate?: number
}

/** Holt alle Spiele einer Liga für eine ganze Saison. */
export async function holeLigaSpiele({
  ligaId,
  saison,
  revalidate = 3600,
}: LigaOptionen): Promise<SihfSpiel[]> {
  const query = new URLSearchParams({
    alias: 'results',
    searchQuery: `${LIGA_GRUPPEN}//${ligaId}`,
    filterQuery: `${saison ?? saisonAlias()}/all/all/all`,
    orderBy: 'date',
    orderByDescending: 'false',
    take: '900',
    // Ohne 'date' liefert die Schnittstelle die ganze Saison statt nur einen Tag.
    filterBy: 'season,league,region,phase',
    skip: '0',
    language: 'de',
  })

  try {
    const antwort = await fetch(`${BASIS}?${query}`, {
      headers: { Accept: 'application/json' },
      ...(revalidate > 0 ? { next: { revalidate } } : { cache: 'no-store' as RequestCache }),
    })

    if (!antwort.ok) {
      console.error(`SIHF: Liga ${ligaId} antwortete mit Status ${antwort.status}`)
      return []
    }

    return spieleAusAntwort((await antwort.json()) as ApiAntwort)
  } catch (fehler) {
    // Die Website soll auch funktionieren, wenn die SIHF gerade nicht erreichbar ist.
    console.error(`SIHF: Liga ${ligaId} konnte nicht geladen werden`, fehler)
    return []
  }
}

const passt = (team: SihfTeam, teamId?: string | number | null, teamName?: string | null) => {
  if (teamId != null && String(teamId).trim() !== '' && team.id != null) {
    if (String(team.id) === String(teamId).trim()) return true
  }
  if (teamName && team.name) {
    return team.name.toLowerCase().includes(teamName.trim().toLowerCase())
  }
  return false
}

export type TeamSpielplan = {
  spiele: SihfSpiel[]
  letztes: SihfSpiel | null
  naechste: SihfSpiel[]
  bilanz: { siege: number; niederlagen: number; tore: number; gegentore: number }
  /** Tabelle der Gruppe, in der das Team spielt. */
  tabelle: TabellenZeile[]
}

/** Holt den Spielplan eines einzelnen Teams inklusive letztem Resultat und Bilanz. */
export async function holeTeamSpielplan(opts: {
  ligaId?: string | number | null
  teamId?: string | number | null
  teamName?: string | null
  saison?: string
  revalidate?: number
}): Promise<TeamSpielplan> {
  const leer: TeamSpielplan = {
    spiele: [],
    letztes: null,
    naechste: [],
    bilanz: { siege: 0, niederlagen: 0, tore: 0, gegentore: 0 },
    tabelle: [],
  }

  if (!opts.ligaId) return leer
  if (!opts.teamId && !opts.teamName) return leer

  const alle = await holeLigaSpiele({
    ligaId: opts.ligaId,
    saison: opts.saison,
    revalidate: opts.revalidate,
  })

  const spiele = alle.filter(
    (s) => passt(s.heim, opts.teamId, opts.teamName) || passt(s.gast, opts.teamId, opts.teamName),
  )

  const gespielte = spiele.filter((s) => s.gespielt && !s.abgesagt)
  const offene = spiele.filter((s) => !s.gespielt && !s.abgesagt)

  const bilanz = gespielte.reduce(
    (acc, s) => {
      const heim = passt(s.heim, opts.teamId, opts.teamName)
      const eigene = heim ? s.toreHeim! : s.toreGast!
      const fremde = heim ? s.toreGast! : s.toreHeim!
      acc.tore += eigene
      acc.gegentore += fremde
      if (eigene > fremde) acc.siege += 1
      else if (eigene < fremde) acc.niederlagen += 1
      return acc
    },
    { siege: 0, niederlagen: 0, tore: 0, gegentore: 0 },
  )

  return {
    spiele,
    letztes: gespielte.length > 0 ? gespielte[gespielte.length - 1] : null,
    naechste: offene.slice(0, 5),
    bilanz,
    tabelle: berechneGruppenTabelle(alle, { teamId: opts.teamId, teamName: opts.teamName }),
  }
}

export type TabellenZeile = {
  rang: number
  teamId: number | null
  name: string
  spiele: number
  siege: number
  siegeVerlaengerung: number
  niederlagenVerlaengerung: number
  niederlagen: number
  tore: number
  gegentore: number
  differenz: number
  punkte: number
}

/**
 * Rechnet die Tabelle aus den Spielen aus, nach dem Punktesystem von
 * Swiss Ice Hockey: Sieg 3, Sieg nach Verlängerung oder Penaltyschiessen 2,
 * Niederlage nach Verlängerung oder Penaltyschiessen 1, Niederlage 0.
 *
 * Eine Liga besteht oft aus mehreren Gruppen. Damit die Tabelle stimmt, wird nur
 * die Gruppe des eigenen Teams gewertet: alle Gegner, gegen die es angetreten
 * ist, und die Spiele dieser Teams untereinander.
 */
export function berechneGruppenTabelle(
  alleSpiele: SihfSpiel[],
  eigenes: { teamId?: string | number | null; teamName?: string | null },
): TabellenZeile[] {
  const eigeneSpiele = alleSpiele.filter(
    (s) => passt(s.heim, eigenes.teamId, eigenes.teamName) || passt(s.gast, eigenes.teamId, eigenes.teamName),
  )
  if (eigeneSpiele.length === 0) return []

  // Die Gruppe besteht aus dem eigenen Team und allen Gegnern.
  const gruppe = new Set<string>()
  for (const spiel of eigeneSpiele) {
    gruppe.add(spiel.heim.name)
    gruppe.add(spiel.gast.name)
  }

  const relevant = alleSpiele.filter(
    (s) => s.gespielt && !s.abgesagt && gruppe.has(s.heim.name) && gruppe.has(s.gast.name),
  )

  const zeilen = new Map<string, TabellenZeile>()
  const holen = (team: SihfTeam): TabellenZeile => {
    const vorhanden = zeilen.get(team.name)
    if (vorhanden) return vorhanden
    const neu: TabellenZeile = {
      rang: 0,
      teamId: team.id,
      name: team.name,
      spiele: 0,
      siege: 0,
      siegeVerlaengerung: 0,
      niederlagenVerlaengerung: 0,
      niederlagen: 0,
      tore: 0,
      gegentore: 0,
      differenz: 0,
      punkte: 0,
    }
    zeilen.set(team.name, neu)
    return neu
  }

  for (const spiel of relevant) {
    const heim = holen(spiel.heim)
    const gast = holen(spiel.gast)
    const nachVerlaengerung = spiel.entscheidung === 'OT' || spiel.entscheidung === 'SO'

    heim.spiele += 1
    gast.spiele += 1
    heim.tore += spiel.toreHeim!
    heim.gegentore += spiel.toreGast!
    gast.tore += spiel.toreGast!
    gast.gegentore += spiel.toreHeim!

    const heimGewinnt = spiel.toreHeim! > spiel.toreGast!
    const sieger = heimGewinnt ? heim : gast
    const verlierer = heimGewinnt ? gast : heim

    if (spiel.toreHeim === spiel.toreGast) {
      // Kommt nur vor, wenn ein Spiel ohne Entscheidung gewertet wird.
      heim.punkte += 1
      gast.punkte += 1
      continue
    }

    if (nachVerlaengerung) {
      sieger.siegeVerlaengerung += 1
      sieger.punkte += 2
      verlierer.niederlagenVerlaengerung += 1
      verlierer.punkte += 1
    } else {
      sieger.siege += 1
      sieger.punkte += 3
      verlierer.niederlagen += 1
    }
  }

  return [...zeilen.values()]
    .map((zeile) => ({ ...zeile, differenz: zeile.tore - zeile.gegentore }))
    .sort(
      (a, b) => b.punkte - a.punkte || b.differenz - a.differenz || b.tore - a.tore,
    )
    .map((zeile, index) => ({ ...zeile, rang: index + 1 }))
}

/** Wandelt "25.10.2025" in ein Date um. */
export function datumAusSihf(spiel: SihfSpiel): Date | null {
  if (spiel.zeitpunkt) {
    const d = new Date(spiel.zeitpunkt)
    if (!Number.isNaN(d.getTime())) return d
  }
  const teile = spiel.datum.split('.')
  if (teile.length !== 3) return null
  const d = new Date(Number(teile[2]), Number(teile[1]) - 1, Number(teile[0]))
  return Number.isNaN(d.getTime()) ? null : d
}

/** Formatiert das Resultat aus Sicht des eigenen Teams, z. B. "8:2 (Auswärts)". */
export function resultatText(spiel: SihfSpiel): string {
  if (!spiel.gespielt) return '–'
  const zusatz = spiel.entscheidung ? ` n.${spiel.entscheidung}` : ''
  return `${spiel.toreHeim}:${spiel.toreGast}${zusatz}`
}

export const SIHF_SPIEL_URL = (gameId: string) =>
  `https://www.sihf.ch/de/game-center/game/#/${gameId}`
