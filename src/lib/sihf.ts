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
  /**
   * Ob das Spiel zur Meisterschaftstabelle zählt. `undefined` heisst "ja" –
   * die Live-Abfrage liefert ohnehin nur die Meisterschaftsspiele der
   * gewählten Liga. Bei von Hand erfassten Spielen kann es auch
   * Testspiele/Freundschaftsspiele geben, die keinen Tabellenplatz vergeben.
   */
  zaehltZurTabelle?: boolean
  /** Austragungsort (nur aus der Club-Schnittstelle bekannt). */
  ort?: string | null
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
    // Während des Spiels steht hier schon der Zwischenstand (z. B. 0:0 im
    // 1. Drittel). Gespielt ist das Spiel erst, wenn es zu 100 % durch ist.
    const fertig = status.percent === undefined || Number(status.percent) >= 100

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
      gespielt: toreHeim !== null && toreGast !== null && fertig,
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
  /** Sekunden bis die Antwort neu geholt wird. 0 = immer frisch (für den Sonntags-Job). */
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

const leererSpielplan: TeamSpielplan = {
  spiele: [],
  letztes: null,
  naechste: [],
  bilanz: { siege: 0, niederlagen: 0, tore: 0, gegentore: 0 },
  tabelle: [],
}

/**
 * Baut aus einer Liste von Ligaspielen den Spielplan eines einzelnen Teams:
 * eigene Spiele, letztes Resultat, nächste Termine, Bilanz und Gruppentabelle.
 *
 * Von `holeTeamSpielplan` (live von der SIHF) genauso genutzt wie von der
 * manuellen Erfassung in `lib/daten.ts` (wenn die SIHF-Statistik-API für eine
 * Liga noch keine Daten führt) – beide liefern am Ende dieselbe Form.
 */
export function baueSpielplan(
  alle: SihfSpiel[],
  eigenes: { teamId?: string | number | null; teamName?: string | null },
): TeamSpielplan {
  const spiele = alle.filter(
    (s) => passt(s.heim, eigenes.teamId, eigenes.teamName) || passt(s.gast, eigenes.teamId, eigenes.teamName),
  )

  const gespielte = spiele.filter((s) => s.gespielt && !s.abgesagt)
  const offene = spiele.filter((s) => !s.gespielt && !s.abgesagt)

  const bilanz = gespielte.reduce(
    (acc, s) => {
      const heim = passt(s.heim, eigenes.teamId, eigenes.teamName)
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
    tabelle: berechneGruppenTabelle(alle, eigenes),
  }
}

const wochentage = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

export type ManuellesSpiel = {
  datum?: string | null
  zeit?: string | null
  heim: string
  gast: string
  toreHeim?: number | null
  toreGast?: number | null
  wettbewerb?: string | null
}

/**
 * Wandelt von Hand erfasste Spiele (siehe Teams-Kollektion, Feld
 * "manuelleSpiele") in dieselbe Form um wie die SIHF-Antwort, damit
 * `baueSpielplan` beide Quellen gleich verarbeiten kann.
 *
 * Diese manuelle Liste greift nur als Notlösung, solange die
 * SIHF-Statistik-API für eine Liga (noch) keine Spiele liefert – etwa ganz zu
 * Saisonbeginn, bevor die Amateurliga dort erfasst ist.
 */
export function spieleAusManuellerListe(eintraege: ManuellesSpiel[]): SihfSpiel[] {
  return eintraege
    .filter((e) => e.datum && e.heim && e.gast)
    .map((e) => {
      const d = new Date(e.datum!)
      const gespielt = e.toreHeim != null && e.toreGast != null
      return {
        gameId: null,
        wochentag: wochentage[d.getUTCDay()] ?? '',
        datum: `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}`,
        zeit: e.zeit ?? '',
        zeitpunkt: e.datum ?? null,
        heim: { id: null, name: e.heim, kuerzel: null },
        gast: { id: null, name: e.gast, kuerzel: null },
        toreHeim: e.toreHeim ?? null,
        toreGast: e.toreGast ?? null,
        gespielt,
        abgesagt: false,
        entscheidung: '',
        status: gespielt ? 'Ende' : '',
        drittelHeim: [],
        drittelGast: [],
        zaehltZurTabelle: !/exhibition|testspiel|freundschaft/i.test(e.wettbewerb ?? ''),
      } satisfies SihfSpiel
    })
    .sort((a, b) => (a.zeitpunkt ?? '').localeCompare(b.zeitpunkt ?? ''))
}

/** Holt den Spielplan eines einzelnen Teams inklusive letztem Resultat und Bilanz. */
export async function holeTeamSpielplan(opts: {
  ligaId?: string | number | null
  teamId?: string | number | null
  teamName?: string | null
  saison?: string
  revalidate?: number
}): Promise<TeamSpielplan> {
  if (!opts.ligaId) return leererSpielplan
  if (!opts.teamId && !opts.teamName) return leererSpielplan

  const alle = await holeLigaSpiele({
    ligaId: opts.ligaId,
    saison: opts.saison,
    revalidate: opts.revalidate,
  })

  return baueSpielplan(alle, { teamId: opts.teamId, teamName: opts.teamName })
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
    (s) =>
      s.zaehltZurTabelle !== false &&
      (passt(s.heim, eigenes.teamId, eigenes.teamName) || passt(s.gast, eigenes.teamId, eigenes.teamName)),
  )
  if (eigeneSpiele.length === 0) return []

  // Die Gruppe besteht aus dem eigenen Team und allen Gegnern.
  const gruppe = new Set<string>()
  for (const spiel of eigeneSpiele) {
    gruppe.add(spiel.heim.name)
    gruppe.add(spiel.gast.name)
  }

  const relevant = alleSpiele.filter(
    (s) =>
      s.gespielt &&
      !s.abgesagt &&
      s.zaehltZurTabelle !== false &&
      gruppe.has(s.heim.name) &&
      gruppe.has(s.gast.name),
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

  // Alle Gruppenteams schon vor der Auswertung eintragen – sonst verschwindet
  // vor Saisonstart (noch kein Spiel gewertet) die ganze Tabelle, statt wie auf
  // sihf.ch alle Teams mit null Punkten zu zeigen.
  for (const spiel of eigeneSpiele) {
    holen(spiel.heim)
    holen(spiel.gast)
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
  `https://www.sihf.ch/de/game-center/game/${gameId}`

/**
 * Club-Schnittstelle von Swiss Ice Hockey (MySIHF → «Club-Schnittstelle»).
 * Jedes Widget hat einen Aufruf-Schlüssel (KeyId); mit Ausgabeformat XML
 * liefert die URL die offizielle Rangliste des Teams in der gewählten Phase.
 * Gegenüber der eigenen Berechnung aus den Spielen zählt sie genau so, wie
 * der Verband wertet (z. B. ohne Testspiele).
 */
const CLUB_BASIS = 'https://clubdata.sihf.ch/Statistics/ClubStatistic.aspx'
const KEY_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const xmlWert = (block: string, tag: string): string => {
  const m = block.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
  return (m?.[1] ?? '')
    .trim()
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

const xmlZahl = (block: string, tag: string): number => {
  const n = Number(xmlWert(block, tag))
  return Number.isFinite(n) ? n : 0
}

/** Holt die Rangliste eines Club-Widgets. Leer, wenn nichts oder Fehler. */
export async function holeClubRangliste(keyId: string, revalidate = 300): Promise<TabellenZeile[]> {
  const schluessel = keyId.trim()
  if (!KEY_ID.test(schluessel)) return []

  try {
    const antwort = await fetch(`${CLUB_BASIS}?keyid=${schluessel}`, {
      ...(revalidate > 0 ? { next: { revalidate } } : { cache: 'no-store' as RequestCache }),
    })
    if (!antwort.ok) return []

    // Die Schnittstelle liefert ISO-8859-1, nicht UTF-8.
    const text = new TextDecoder('iso-8859-1').decode(await antwort.arrayBuffer())
    if (!text.includes('<Ranking')) return []

    return (text.match(/<Team>[\s\S]*?<\/Team>/g) ?? []).map((block) => ({
      rang: xmlZahl(block, 'Pos'),
      teamId: xmlZahl(block, 'TeamID') || null,
      name: xmlWert(block, 'TeamName'),
      spiele: xmlZahl(block, 'Games'),
      siege: xmlZahl(block, 'GamesWonInTime'),
      siegeVerlaengerung: xmlZahl(block, 'GamesWonExtraTime'),
      niederlagenVerlaengerung: xmlZahl(block, 'GamesLostExtraTime'),
      niederlagen: xmlZahl(block, 'GamesLostInTime'),
      tore: xmlZahl(block, 'GoalsFor'),
      gegentore: xmlZahl(block, 'GoalsAgainst'),
      differenz: xmlZahl(block, 'GoalsDifference'),
      punkte: xmlZahl(block, 'Points'),
    }))
  } catch (fehler) {
    console.error('SIHF Club-Schnittstelle nicht erreichbar', fehler)
    return []
  }
}

/** Anspielzeit (Schweizer Ortszeit) als ISO-Zeitpunkt, z. B. "2026.10.24" + "19:15". */
function zuercherZeitpunkt(datum: string, zeit: string): string | null {
  const [j, m, t] = datum.split('.').map(Number)
  const [h, min] = zeit.split(':').map(Number)
  if ([j, m, t, h, min].some((n) => !Number.isFinite(n))) return null

  const format = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Zurich',
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  })
  const versatz = (ts: number) => {
    const teile = format.formatToParts(new Date(ts))
    const wert = (art: string) => Number(teile.find((p) => p.type === art)?.value)
    return Date.UTC(wert('year'), wert('month') - 1, wert('day'), wert('hour'), wert('minute')) - ts
  }
  const roh = Date.UTC(j, m - 1, t, h, min)
  return new Date(roh - versatz(roh)).toISOString()
}

/** Holt die Spiele eines Club-Widgets («Nächste Spiele» o. ä., Format XML). */
export async function holeClubSpiele(keyId: string, revalidate = 300): Promise<SihfSpiel[]> {
  const schluessel = keyId.trim()
  if (!KEY_ID.test(schluessel)) return []

  try {
    const antwort = await fetch(`${CLUB_BASIS}?keyid=${schluessel}`, {
      ...(revalidate > 0 ? { next: { revalidate } } : { cache: 'no-store' as RequestCache }),
    })
    if (!antwort.ok) return []

    const text = new TextDecoder('iso-8859-1').decode(await antwort.arrayBuffer())
    if (!text.includes('<Result')) return []

    return (text.match(/<Game[ >][\s\S]*?<\/Game>/g) ?? []).flatMap((block): SihfSpiel[] => {
      const datum = xmlWert(block, 'Date')
      const [j, m, t] = datum.split('.').map(Number)
      if (![j, m, t].every(Number.isFinite)) return []

      const zeit = xmlWert(block, 'Begin')
      // HomePoints/AwayPoints sind die Tabellenpunkte aus dem Spiel (z. B. 1:2
      // nach verlorenem Penaltyschiessen), nicht die Tore. Sie zeigen nur, ob
      // das Spiel gewertet ist.
      const punkteHeim = zahlOderNull(xmlWert(block, 'HomePoints'))
      const punkteGast = zahlOderNull(xmlWert(block, 'AwayPoints'))
      const gespielt = punkteHeim !== null && punkteGast !== null

      // Die Tore stehen in den Drittelresultaten, z. B. "2:5,1:1,6:3,0:1[p]":
      // drei Drittel, danach Verlängerung/Penaltyschiessen mit Markierung.
      // Die Summe ergibt das Schlussresultat wie auf sihf.ch (hier 9:10).
      const teile = xmlWert(block, 'ThirdsResults')
        .split(',')
        .map((teil) => teil.trim().match(/^(\d+):(\d+)(?:\[(\w+)\])?$/))
      const drittel = teile.every(Boolean) && teile.length > 0 ? (teile as RegExpMatchArray[]) : []
      const summe = (seite: 1 | 2) => drittel.reduce((acc, teil) => acc + Number(teil[seite]), 0)
      const regulaer = drittel.filter((teil) => !teil[3])
      const penalty = drittel.some((teil) => teil[3]?.toLowerCase() === 'p')
      const verlaengerung =
        !penalty && (xmlWert(block, 'Overtime').toLowerCase() === 'true' || drittel.some((teil) => teil[3]))

      // Ohne Drittelresultate bleibt nur der gemeldete Wert als Notlösung.
      const toreHeim = gespielt ? (drittel.length > 0 ? summe(1) : punkteHeim) : null
      const toreGast = gespielt ? (drittel.length > 0 ? summe(2) : punkteGast) : null

      return [
        {
          gameId: xmlWert(block, 'GameID') || null,
          wochentag: wochentage[new Date(Date.UTC(j, m - 1, t)).getUTCDay()] ?? '',
          datum: `${String(t).padStart(2, '0')}.${String(m).padStart(2, '0')}.${j}`,
          zeit,
          zeitpunkt: zuercherZeitpunkt(datum, zeit),
          heim: { id: xmlZahl(block, 'HomeTeamID') || null, name: xmlWert(block, 'HomeTeamName'), kuerzel: null },
          gast: { id: xmlZahl(block, 'AwayTeamID') || null, name: xmlWert(block, 'AwayTeamName'), kuerzel: null },
          toreHeim,
          toreGast,
          gespielt,
          abgesagt: false,
          entscheidung: penalty ? 'SO' : verlaengerung ? 'OT' : '',
          status: xmlWert(block, 'StatusSymbol'),
          drittelHeim: regulaer.map((teil) => teil[1]),
          drittelGast: regulaer.map((teil) => teil[2]),
          ort: xmlWert(block, 'Arena') || null,
        },
      ]
    })
  } catch (fehler) {
    console.error('SIHF Club-Schnittstelle (Spiele) nicht erreichbar', fehler)
    return []
  }
}

export type SpielZustand = 'geplant' | 'live' | 'beendet' | 'abgesagt'

/** Stand eines einzelnen Spiels, so wie ihn die Spielseite auf sihf.ch zeigt. */
export type SpielStand = {
  gameId: string
  zustand: SpielZustand
  /** Spielabschnitt, z. B. "2. Drittel" oder "Ende". */
  periode: string
  toreHeim: number | null
  toreGast: number | null
  /** Drittelresultate aus Sicht Heim:Gast, z. B. ["1:3", "0:1"]. */
  drittel: string[]
  /** "OT" nach Verlängerung, "SO" nach Penaltyschiessen, sonst leer. */
  entscheidung: string
  kuerzel: { heim: string; gast: string } | null
}

const ZUSTAENDE: Record<string, SpielZustand> = {
  scheduled: 'geplant',
  live: 'live',
  finished: 'beendet',
  canceled: 'abgesagt',
}

/**
 * Liest den Spielstand aus der Spielseite. Der Kopf der Seite trägt den
 * Zustand als Klasse (`is-scheduled`, `is-live`, `is-finished`,
 * `is-canceled`), daneben stehen Abschnitt, Tore und Drittelresultate.
 */
function spielStandAusHtml(gameId: string, html: string): SpielStand | null {
  const zustand = ZUSTAENDE[html.match(/class="c-game-detail-header is-([a-z]+)"/)?.[1] ?? '']
  if (!zustand) return null

  const text = (roh: string) => roh.replace(/&amp;/g, '&').trim()
  const kuerzel = [
    ...html.matchAll(/c-game-detail-header__team-acronym">\s*([^<]{1,12}?)\s*</g),
  ].map((treffer) => text(treffer[1]))

  // Nur der grosse Spielstand zählt; vor dem Spiel steht dort nichts.
  const block = html.match(/c-game-detail-header__score"[\s\S]*?<\/div>/)?.[0] ?? ''
  const tore = [...block.matchAll(/__score-value">\s*(\d+)\s*</g)].map((treffer) => Number(treffer[1]))
  const hatTore = zustand !== 'geplant' && tore.length >= 2
  // Zusatzabschnitte tragen eine Marke: "OT" (Verlängerung) oder "SO" (Penaltyschiessen).
  const marken = [...html.matchAll(/c-game-detail-header__period-label">\s*([A-Z]+)\s*</g)].map(
    (treffer) => treffer[1],
  )

  return {
    gameId,
    zustand,
    // "01.11.2026 - Ende" bzw. "02.11.2026 - 2. Drittel"
    periode: text(html.match(/c-game-detail-header__date">[^<]*? - ([^<]+)</)?.[1] ?? ''),
    toreHeim: hatTore ? tore[0] : null,
    toreGast: hatTore ? tore[1] : null,
    drittel: [...html.matchAll(/c-game-detail-header__period">\s*<span>\s*(\d+:\d+)\s*</g)].map(
      (treffer) => treffer[1],
    ),
    entscheidung: marken.includes('SO') ? 'SO' : marken.includes('OT') ? 'OT' : '',
    kuerzel: kuerzel.length >= 2 ? { heim: kuerzel[0], gast: kuerzel[1] } : null,
  }
}

/**
 * Aktueller Stand eines Spiels von sihf.ch – während des Spiels mit dem
 * laufenden Resultat. Die Seite selbst ist dort eine Minute zwischengespeichert,
 * schneller kann es also nicht werden. Leer, wenn die Seite fehlt oder sich ihr
 * Aufbau ändert.
 */
export async function holeSpielStand(gameId: string, revalidate = 30): Promise<SpielStand | null> {
  if (!/^\d+$/.test(gameId)) return null
  try {
    const antwort = await fetch(SIHF_SPIEL_URL(gameId), {
      ...(revalidate > 0 ? { next: { revalidate } } : { cache: 'no-store' as RequestCache }),
    })
    if (!antwort.ok) return null
    return spielStandAusHtml(gameId, await antwort.text())
  } catch {
    return null
  }
}

/**
 * Offizielle Teamkürzel eines Spiels (z. B. "EHCRB", "HCW"). Weder die
 * Club-Schnittstelle noch die Statistik-API liefern sie zuverlässig, die
 * Spielseite auf sihf.ch aber schon. Einen Tag zwischengespeichert; fehlt die
 * Seite oder ändert sich ihr Aufbau, gibt es einfach keine Kürzel.
 */
export async function holeSpielKuerzel(
  gameId: string,
): Promise<{ heim: string; gast: string } | null> {
  return (await holeSpielStand(gameId, 86400))?.kuerzel ?? null
}

const STUNDE_MS = 60 * 60 * 1000

/** Ab so viel vor dem Anspiel fragt die Website den Live-Stand ab. */
export const LIVE_VORLAUF_MS = 15 * 60 * 1000
/** So lange nach dem Anspiel bleibt das Spiel mit «Beendet» stehen. */
export const LIVE_NACHLAUF_MS = 12 * STUNDE_MS

/**
 * Das Spiel, das gerade läuft, eben zu Ende ging oder in den nächsten 24
 * Stunden beginnt. Für dieses Spiel holt die Seite im Browser den Live-Stand.
 * Bereits angepfiffene Spiele haben Vorrang vor dem nächsten.
 */
export function liveKandidat(spiele: SihfSpiel[], jetzt = Date.now()): SihfSpiel | null {
  const imFenster = spiele
    .filter((s) => s.gameId && s.zeitpunkt && !s.abgesagt)
    .map((spiel) => ({ spiel, start: Date.parse(spiel.zeitpunkt!) }))
    .filter(({ start }) => start >= jetzt - LIVE_NACHLAUF_MS && start <= jetzt + 24 * STUNDE_MS)

  const begonnen = imFenster
    .filter(({ start }) => start <= jetzt + LIVE_VORLAUF_MS)
    .sort((a, b) => b.start - a.start)
  if (begonnen[0]) return begonnen[0].spiel

  return imFenster.sort((a, b) => a.start - b.start)[0]?.spiel ?? null
}

/** Übernimmt Resultat und Drittel aus dem Live-Stand, solange das Spiel läuft oder beendet ist. */
export function mitStand(spiel: SihfSpiel, stand: SpielStand | null): SihfSpiel {
  if (!stand || stand.toreHeim === null || stand.toreGast === null) return spiel
  if (stand.zustand !== 'live' && stand.zustand !== 'beendet') return spiel

  const drittel = stand.drittel.slice(0, 3).map((teil) => teil.split(':'))
  return {
    ...spiel,
    toreHeim: stand.toreHeim,
    toreGast: stand.toreGast,
    gespielt: stand.zustand === 'beendet',
    status: stand.periode,
    entscheidung: stand.entscheidung || spiel.entscheidung,
    drittelHeim: drittel.map((teil) => teil[0]),
    drittelGast: drittel.map((teil) => teil[1]),
    heim: stand.kuerzel ? { ...spiel.heim, kuerzel: stand.kuerzel.heim } : spiel.heim,
    gast: stand.kuerzel ? { ...spiel.gast, kuerzel: stand.kuerzel.gast } : spiel.gast,
  }
}

const GAME_CENTER = 'https://www.sihf.ch/de/game-center'

/** Wandelt HTML-Zeichen wie "&#xFC;" zurück in Text. */
const htmlText = (roh: string) =>
  roh
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, zahl: string) => String.fromCodePoint(Number(zahl)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()

/**
 * Kompletter Spielplan eines Teams in der laufenden Saison, direkt von der
 * Spielplanseite auf sihf.ch (`game-center/team/spielplan/<Liga>-<Region>-<Team>`).
 *
 * Anders als die Statistik-API und die Club-Schnittstelle stehen dort alle
 * Spiele, auch Testspiele, jeweils mit Phase («Regular Season Gr. 2»,
 * «Exhibition Games»), Resultat und Live-Kennzeichen. Die Region in der
 * Adresse ist egal, sihf.ch leitet auf die richtige weiter. Leer, wenn die
 * Seite fehlt oder sich ihr Aufbau ändert.
 */
export async function holeSihfTeamSpiele(
  ligaId?: string | number | null,
  teamId?: string | number | null,
  revalidate = 300,
): Promise<SihfSpiel[]> {
  const liga = String(ligaId ?? '').trim()
  const team = String(teamId ?? '').trim()
  if (!/^\d+$/.test(liga) || !/^\d+$/.test(team)) return []

  try {
    const antwort = await fetch(`${GAME_CENTER}/team/spielplan/${liga}-1-${team}`, {
      ...(revalidate > 0 ? { next: { revalidate } } : { cache: 'no-store' as RequestCache }),
    })
    if (!antwort.ok) return []
    const html = await antwort.text()

    const karten = [
      ...html.matchAll(
        /<a href="[^"]*\/game\/(\d+)"[^>]*data-home-team-id="(\d*)"[^>]*data-away-team-id="(\d*)"[^>]*data-is-live="(true|false)"[^>]*>/g,
      ),
    ]

    return karten.flatMap((karte, i): SihfSpiel[] => {
      const start = karte.index ?? 0
      const inhalt = html.slice(start, karten[i + 1]?.index ?? html.length)
      // Jedes Spiel steht unter seinem Spieltag: data-date="2026-10-30"
      const tagStart = html.lastIndexOf('data-date="', start)
      const tag = html.slice(tagStart, tagStart + 22).match(/data-date="(\d{4})-(\d{2})-(\d{2})"/)
      if (tagStart < 0 || !tag) return []
      const [, j, m, t] = tag

      const feld = (name: string) =>
        htmlText(inhalt.match(new RegExp(`c-game-preview__${name}">([^<]*)<`))?.[1] ?? '')
      const namen = [...inhalt.matchAll(/c-game-preview__team-name">([^<]*)</g)].map((n) => htmlText(n[1]))
      // Vor dem Spiel steht "-" statt der Tore.
      const tore = [...inhalt.matchAll(/c-game-preview__team-score">([^<]*)</g)].map((n) => {
        const wert = htmlText(n[1])
        return /^\d+$/.test(wert) ? Number(wert) : null
      })
      if (namen.length < 2) return []

      const live = karte[4] === 'true'
      const zeit = feld('time')
      const anspiel = /^\d{1,2}:\d{2}$/.test(zeit) ? zeit : ''
      const status = feld('status')
      const phase = feld('phase-name')
      const toreHeim = tore[0] ?? null
      const toreGast = tore[1] ?? null

      return [
        {
          gameId: karte[1],
          wochentag: wochentage[new Date(Date.UTC(+j, +m - 1, +t)).getUTCDay()] ?? '',
          datum: `${t}.${m}.${j}`,
          zeit: anspiel,
          zeitpunkt: anspiel ? zuercherZeitpunkt(`${j}.${m}.${t}`, anspiel) : null,
          heim: { id: Number(karte[2]) || null, name: namen[0], kuerzel: null },
          gast: { id: Number(karte[3]) || null, name: namen[1], kuerzel: null },
          toreHeim,
          toreGast,
          gespielt: !live && toreHeim !== null && toreGast !== null,
          abgesagt: /abgesagt|verschoben|cancel/i.test(status),
          entscheidung: '',
          status: live ? zeit : status || zeit,
          drittelHeim: [],
          drittelGast: [],
          zaehltZurTabelle: !/exhibition|test|freundschaft/i.test(phase),
        },
      ]
    })
  } catch (fehler) {
    console.error('SIHF Spielplanseite nicht erreichbar', fehler)
    return []
  }
}

export type TabellenLink = {
  url: string
  /** "tabelle" = Rangliste der eigenen Gruppe, "team" = Teamseite (Liga ohne Tabelle). */
  art: 'tabelle' | 'team'
}

/**
 * Link zur offiziellen Tabelle der Gruppe, in der das Team spielt.
 *
 * Die Teamseite auf sihf.ch leitet von jeder Region auf die richtige Region
 * und Gruppe weiter und verlinkt sich danach selbst mit beiden, etwa
 * `team/19-3-103916?group=79220`. Daraus entsteht die Tabellenadresse
 * `liga/tabelle/19-3?group=79220`. Manche Ligen (z. B. U14) haben dort keine
 * Tabelle – dann führt der Link auf die Teamseite. Einen Tag zwischengespeichert.
 */
export async function holeTabellenLink(
  ligaId?: string | number | null,
  teamId?: string | number | null,
): Promise<TabellenLink | null> {
  const liga = String(ligaId ?? '').trim()
  const team = String(teamId ?? '').trim()
  if (!/^\d+$/.test(liga) || !/^\d+$/.test(team)) return null

  try {
    // Die Region in der Adresse ist egal, sihf.ch leitet auf die richtige weiter.
    const antwort = await fetch(`${GAME_CENTER}/team/${liga}-1-${team}`, {
      next: { revalidate: 86400 },
    })
    if (!antwort.ok) return null
    const html = await antwort.text()

    const treffer = html.match(new RegExp(`game-center/team/(\\d+)-(\\d+)-${team}\\?group=(\\d+)`))
    if (!treffer) return null
    const [, ligaEcht, region, gruppe] = treffer

    const tabelle = `${GAME_CENTER}/liga/tabelle/${ligaEcht}-${region}?group=${gruppe}`
    const pruefung = await fetch(tabelle, { next: { revalidate: 86400 } })
    if (pruefung.ok) return { url: tabelle, art: 'tabelle' }

    return { url: `${GAME_CENTER}/team/${ligaEcht}-${region}-${team}?group=${gruppe}`, art: 'team' }
  } catch {
    return null
  }
}

/** Ergänzt ein Spiel um die offiziellen Teamkürzel, sofern verfügbar. */
export async function mitKuerzeln(spiel: SihfSpiel): Promise<SihfSpiel> {
  const kuerzel = spiel.gameId ? await holeSpielKuerzel(spiel.gameId) : null
  if (!kuerzel) return spiel
  return {
    ...spiel,
    heim: { ...spiel.heim, kuerzel: kuerzel.heim },
    gast: { ...spiel.gast, kuerzel: kuerzel.gast },
  }
}
