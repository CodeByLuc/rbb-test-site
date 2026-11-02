import type { Payload } from 'payload'

import { holeTeamSpielplanMitFallback } from './daten'
import { holeSihfTeamSpiele, holeSpielStand, mitStand, saisonAlias, type SihfSpiel } from './sihf'
import type { Team } from '../payload-types'

export type Wochenspiel = { team: Team; spiel: SihfSpiel }

/** Was ein Team in der Woche gespielt hat, wo es steht und wie es weitergeht. */
export type TeamWoche = {
  team: Team
  spiele: SihfSpiel[]
  naechstes: SihfSpiel | null
  rang: { rang: number; teams: number; punkte: number } | null
}

/**
 * Zeitraum als Kalendertage (jeweils UTC-Mitternacht), normalerweise Montag
 * bis Sonntag. `bis` ist der Tag danach und gehört nicht mehr dazu.
 */
export type Spielwoche = { von: Date; bis: Date }

const TAG_MS = 24 * 60 * 60 * 1000

/** Kalendertag in der Schweiz – der Server auf Vercel läuft in UTC. */
function zuercherTag(zeitpunkt: Date): number {
  const [j, m, t] = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Zurich',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(zeitpunkt)
    .split('-')
    .map(Number)
  return Date.UTC(j, m - 1, t)
}

/**
 * Die zuletzt abgeschlossene Spielwoche: Montag bis zum letzten Sonntag
 * (an einem Sonntag also die laufende Woche). Läuft der Job am Sonntagabend
 * erst nach Mitternacht, zählt so trotzdem noch die richtige Woche.
 */
export function spielwoche(stichtag = new Date()): Spielwoche {
  const tag = zuercherTag(stichtag)
  const sonntag = tag - new Date(tag).getUTCDay() * TAG_MS
  return { von: new Date(sonntag - 6 * TAG_MS), bis: new Date(sonntag + TAG_MS) }
}

/** Ob der Zeitraum eine ganze Woche ist – sonst z. B. nur das Wochenende. */
const ganzeWoche = (woche: Spielwoche) => woche.bis.getTime() - woche.von.getTime() === 7 * TAG_MS

/** Kalendertag eines Spiels, aus "25.10.2025" (Schweizer Datum der SIHF). */
function spielTag(spiel: SihfSpiel): number | null {
  const [t, m, j] = spiel.datum.split('.').map(Number)
  if ([t, m, j].every(Number.isFinite) && j > 2000) return Date.UTC(j, m - 1, t)
  return spiel.zeitpunkt ? zuercherTag(new Date(spiel.zeitpunkt)) : null
}

const nachTag = (a: SihfSpiel, b: SihfSpiel) =>
  (spielTag(a) ?? 0) - (spielTag(b) ?? 0) || (a.zeit ?? '').localeCompare(b.zeit ?? '')

const istEigenes = (name: string, team: Team) =>
  name.toLowerCase().includes((team.sihfTeamName || 'Rot-Blau').toLowerCase())

/**
 * Sammelt für jedes angebundene Team die Spiele der Woche, den Tabellenplatz
 * und das nächste Spiel.
 *
 * Die Spiele kommen von der Spielplanseite des Teams auf sihf.ch – nur dort
 * stehen auch Testspiele. Liefert sie nichts (oder geht es um eine frühere
 * Saison), gelten dieselben Quellen wie auf den Teamseiten. Der Tabellenplatz
 * kommt immer von dort (offizielle Rangliste der Club-Schnittstelle).
 */
export async function sammleWoche(payload: Payload, woche: Spielwoche): Promise<TeamWoche[]> {
  const { docs: teams } = await payload.find({
    collection: 'teams',
    limit: 100,
    sort: 'reihenfolge',
    depth: 0,
  })

  const angebunden = teams.filter(
    (team) => team.sihfLeagueId && (team.sihfTeamId || team.sihfTeamName),
  )

  // Die Club-Schnittstelle kennt nur die laufende Saison. Für eine Woche aus
  // einer früheren Saison (Test mit `stichtag`) bleibt die Statistik-API.
  const saison = saisonAlias(woche.von)
  const laufend = saison === saisonAlias()
  const jetzt = Date.now()

  return Promise.all(
    angebunden.map(async (team): Promise<TeamWoche> => {
      const plan = await holeTeamSpielplanMitFallback(team, {
        // Der Job braucht frische Daten, keine zwischengespeicherten.
        revalidate: 0,
        ...(laufend ? {} : { saison }),
      })
      const vonSihf = laufend ? await holeSihfTeamSpiele(team.sihfLeagueId, team.sihfTeamId, 0) : []
      const spiele = [...(vonSihf.length > 0 ? vonSihf : plan.spiele)].sort(nachTag)

      const inWoche = spiele.filter((spiel) => {
        const tag = spielTag(spiel)
        return !spiel.abgesagt && tag !== null && tag >= woche.von.getTime() && tag < woche.bis.getTime()
      })

      // Die Spielseite liefert Drittelresultate und ob es eine Verlängerung gab.
      // Am Sonntagabend steht das jüngste Resultat zudem oft nur dort.
      const heute = zuercherTag(new Date(jetzt))
      const gespielt = (
        await Promise.all(
          inWoche.map(async (spiel) => {
            if (!spiel.gameId || (spielTag(spiel) ?? 0) > heute) return spiel
            const stand = await holeSpielStand(spiel.gameId, 0)
            return stand?.zustand === 'beendet' ? mitStand(spiel, stand) : spiel
          }),
        )
      ).filter((spiel) => spiel.gespielt)

      const naechstes =
        spiele.find(
          (spiel) => !spiel.gespielt && !spiel.abgesagt && (spielTag(spiel) ?? 0) >= woche.bis.getTime(),
        ) ?? null

      const zeile = plan.tabelle.find((z) => istEigenes(z.name, team))

      return {
        team,
        spiele: gespielt,
        naechstes,
        rang: zeile ? { rang: zeile.rang, teams: plan.tabelle.length, punkte: zeile.punkte } : null,
      }
    }),
  )
}

/** Alle Spiele der Woche in zeitlicher Reihenfolge. */
export function alsListe(wochen: TeamWoche[]): Wochenspiel[] {
  return wochen
    .flatMap(({ team, spiele }) => spiele.map((spiel) => ({ team, spiel })))
    .sort((a, b) => nachTag(a.spiel, b.spiel))
}

const absatz = (kinder: unknown[]) => ({
  type: 'paragraph',
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  textFormat: 0,
  children: kinder,
})

const textKnoten = (text: string, fett = false) => ({
  type: 'text',
  version: 1,
  detail: 0,
  format: fett ? 1 : 0,
  mode: 'normal',
  style: '',
  text,
})

const zeilenumbruch = { type: 'linebreak', version: 1 }

const titelKnoten = (text: string) => ({
  type: 'heading',
  tag: 'h3',
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  children: [textKnoten(text)],
})

const wochentage = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

const anzahl = (n: number, einzahl: string, mehrzahl: string) =>
  `${n} ${n === 1 ? einzahl : mehrzahl}`

/** "Die Damen gewannen", aber "Die U14 gewann". */
const MEHRZAHL = /damen|herren|frauen|senioren|junioren|veteranen/i

/** Resultat aus Sicht des eigenen Teams. */
function ausSicht(team: Team, spiel: SihfSpiel) {
  const heim = istEigenes(spiel.heim.name, team)
  return {
    heim,
    eigene: heim ? spiel.toreHeim! : spiel.toreGast!,
    fremde: heim ? spiel.toreGast! : spiel.toreHeim!,
    gegner: heim ? spiel.gast.name : spiel.heim.name,
  }
}

/** Ein Satz pro Spiel, je nach Ausgang etwas anders formuliert. */
function spielSatz(team: Team, spiel: SihfSpiel): string {
  const { heim, eigene, fremde, gegner } = ausSicht(team, spiel)
  const v = (einzahl: string, mehrzahl: string) => (MEHRZAHL.test(team.name) ? mehrzahl : einzahl)
  const tag = spielTag(spiel)
  const wer = `Die ${team.name}`
  const wann = tag !== null ? `am ${wochentage[new Date(tag).getUTCDay()]}` : ''
  const art = spiel.zaehltZurTabelle === false ? ' im Testspiel' : ''
  const wo = `${wann}${art} ${heim ? 'zu Hause' : 'auswärts'} gegen ${gegner}`.trim()
  const resultat = `${eigene}:${fremde}`
  const differenz = Math.abs(eigene - fremde)
  const verlaengerung =
    spiel.entscheidung === 'OT' ? 'nach Verlängerung' : spiel.entscheidung === 'SO' ? 'im Penaltyschiessen' : ''

  if (eigene > fremde) {
    if (verlaengerung) {
      return `${wer} ${v('gewann', 'gewannen')} ${wo} ${verlaengerung} mit ${resultat} und ${v('holte', 'holten')} damit zwei Punkte.`
    }
    if (differenz >= 4) return `${wer} ${v('feierte', 'feierten')} ${wo} einen deutlichen ${resultat}-Sieg.`
    if (differenz === 1) return `${wer} ${v('setzte', 'setzten')} sich ${wo} knapp mit ${resultat} durch.`
    return `${wer} ${v('gewann', 'gewannen')} ${wo} mit ${resultat}.`
  }

  if (eigene < fremde) {
    if (verlaengerung) {
      return `${wer} ${v('verlor', 'verloren')} ${wo} erst ${verlaengerung} mit ${resultat} – immerhin bleibt ein Punkt.`
    }
    if (differenz >= 4) return `${wer} ${v('verlor', 'verloren')} ${wo} deutlich mit ${resultat}.`
    if (differenz === 1) return `${wer} ${v('musste', 'mussten')} sich ${wo} knapp mit ${resultat} geschlagen geben.`
    return `${wer} ${v('musste', 'mussten')} sich ${wo} mit ${resultat} geschlagen geben.`
  }

  return `${wer} ${v('trennte', 'trennten')} sich ${wo} ${resultat} unentschieden.`
}

/** "Drittelsresultate: 1:3, 0:1, 1:3." aus Sicht des eigenen Teams. */
function drittelText(team: Team, spiel: SihfSpiel): string {
  if (spiel.drittelHeim.length === 0) return ''
  const { heim } = ausSicht(team, spiel)
  const teile = spiel.drittelHeim.map((tore, i) =>
    heim ? `${tore}:${spiel.drittelGast[i]}` : `${spiel.drittelGast[i]}:${tore}`,
  )
  return ` Drittelsresultate: ${teile.join(', ')}.`
}

function naechstesText(team: Team, spiel: SihfSpiel): string {
  const { heim, gegner } = ausSicht(team, spiel)
  const tag = spielTag(spiel)
  const datum =
    tag !== null
      ? `am ${wochentage[new Date(tag).getUTCDay()]}, ${spiel.datum.slice(0, 6)}${spiel.zeit ? `, um ${spiel.zeit} Uhr` : ''}`
      : ''
  const art = spiel.zaehltZurTabelle === false ? ' im Testspiel' : ''
  return `Weiter geht es ${datum}${art} ${heim ? 'zu Hause' : 'auswärts'} gegen ${gegner}.`.replace(/\s+/g, ' ')
}

function bilanz(resultate: Wochenspiel[]) {
  let siege = 0
  let niederlagen = 0
  for (const { team, spiel } of resultate) {
    const { eigene, fremde } = ausSicht(team, spiel)
    if (eigene > fremde) siege += 1
    else if (eigene < fremde) niederlagen += 1
  }
  return { spiele: resultate.length, siege, niederlagen }
}

/** Der erste Absatz – die Woche (oder das Wochenende) in einem Satz. */
function einleitung(resultate: Wochenspiel[], woche: Spielwoche): string {
  const formatiert = new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'long', timeZone: 'UTC' })
  const zeitraum = `vom ${formatiert.format(woche.von)} bis ${formatiert.format(new Date(woche.bis.getTime() - TAG_MS))}`
  const { spiele, siege, niederlagen } = bilanz(resultate)

  // "eine erfolgreiche Woche", aber "ein erfolgreiches Wochenende"
  const woche7 = ganzeWoche(woche)
  const eine = (adjektiv: string) =>
    woche7 ? `Eine ${adjektiv} Woche` : `Ein ${adjektiv}s Wochenende`
  const diese = woche7 ? 'Diese Woche' : 'Dieses Wochenende'
  const was = woche7 ? 'Was für eine Woche!' : 'Was für ein Wochenende!'

  if (spiele === 1) {
    return `${diese} (${zeitraum}) stand für unsere Teams ein Spiel auf dem Programm – ${
      siege === 1 ? 'und es endete mit einem Sieg.' : 'leider ohne Sieg.'
    }`
  }
  if (siege === spiele) return `${was} Unsere Teams haben ${zeitraum} alle ${spiele} Spiele gewonnen.`
  if (siege === 0) {
    return `${eine('schwierige')}: In ${spiele} Spielen ${zeitraum} blieben unsere Teams ohne Sieg. Kopf hoch – die nächste Chance kommt bestimmt.`
  }
  if (siege > niederlagen) {
    return `${eine('erfolgreiche')} für Rot-Blau: Aus ${spiele} Spielen ${zeitraum} holten unsere Teams ${anzahl(siege, 'Sieg', 'Siege')}.`
  }
  if (siege === niederlagen) {
    return `Licht und Schatten bei Rot-Blau: ${spiele} Spiele ${zeitraum}, ${anzahl(siege, 'Sieg', 'Siege')} und ${anzahl(niederlagen, 'Niederlage', 'Niederlagen')}.`
  }
  return `${eine('durchzogene')}: Unsere Teams gewannen ${zeitraum} ${siege} von ${spiele} Spielen.`
}

/** Baut den Editor-Inhalt für den Wochenrückblick. */
export function baueInhalt(wochen: TeamWoche[], woche: Spielwoche) {
  const resultate = alsListe(wochen)
  const kinder: unknown[] = [absatz([textKnoten(einleitung(resultate, woche))])]

  for (const { team, spiele, naechstes, rang } of wochen) {
    if (spiele.length === 0) continue
    kinder.push(titelKnoten(team.name))

    // Pro Spiel: das Resultat fett, darunter der Satz dazu.
    for (const spiel of spiele) {
      const zusatz = spiel.entscheidung ? ` n.${spiel.entscheidung}` : ''
      kinder.push(
        absatz([
          textKnoten(
            `${spiel.wochentag} ${spiel.datum.slice(0, 6)}${spiel.zaehltZurTabelle === false ? ' (Testspiel)' : ''}: ${spiel.heim.name} – ${spiel.gast.name} ${spiel.toreHeim}:${spiel.toreGast}${zusatz}`,
            true,
          ),
          zeilenumbruch,
          textKnoten(spielSatz(team, spiel) + drittelText(team, spiel)),
        ]),
      )
    }

    const ausblick = [
      rang
        ? `In der Tabelle bedeutet das Rang ${rang.rang} von ${rang.teams} mit ${anzahl(rang.punkte, 'Punkt', 'Punkten')}.`
        : '',
      naechstes ? naechstesText(team, naechstes) : '',
    ]
      .filter(Boolean)
      .join(' ')
    if (ausblick) kinder.push(absatz([textKnoten(ausblick)]))
  }

  kinder.push(
    absatz([
      textKnoten('Hopp Rot-Blau! ', true),
      textKnoten('Spielpläne, Tabellen und Live-Resultate gibt es jederzeit auf den Teamseiten.'),
    ]),
  )

  return { root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children: kinder } }
}

export function baueTitel(woche: Spielwoche) {
  const sonntag = new Date(woche.bis.getTime() - TAG_MS)
  const tagMonat = (datum: Date) =>
    `${String(datum.getUTCDate()).padStart(2, '0')}.${String(datum.getUTCMonth() + 1).padStart(2, '0')}.`
  const art = ganzeWoche(woche) ? 'Wochenrückblick' : 'Rückblick aufs Wochenende'
  return `${art}: ${tagMonat(woche.von)} – ${tagMonat(sonntag)}${sonntag.getUTCFullYear()}`
}

export function baueAuszug(wochen: TeamWoche[]) {
  const { spiele, siege } = bilanz(alsListe(wochen))
  return `${anzahl(spiele, 'Spiel', 'Spiele')}, ${anzahl(siege, 'Sieg', 'Siege')}: der Rückblick mit allen Resultaten unserer Teams.`
}
