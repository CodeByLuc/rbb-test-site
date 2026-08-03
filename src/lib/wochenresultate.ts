import type { Payload } from 'payload'

import { datumAusSihf, holeTeamSpielplan, saisonAlias, type SihfSpiel } from './sihf'
import type { Team } from '../payload-types'

export type Wochenspiel = { team: Team; spiel: SihfSpiel }

const TAG_MS = 24 * 60 * 60 * 1000

/** Montag 00:00 der Woche, die vor dem Stichtag liegt, bis Montag 00:00 des Stichtags. */
export function letzteWoche(stichtag = new Date()) {
  const bis = new Date(stichtag)
  bis.setHours(0, 0, 0, 0)
  // Zurück auf den Montag dieser Woche (Sonntag = 0 zählt zur Vorwoche).
  const wochentag = (bis.getDay() + 6) % 7
  bis.setTime(bis.getTime() - wochentag * TAG_MS)
  const von = new Date(bis.getTime() - 7 * TAG_MS)
  return { von, bis }
}

const wirSindHeim = (spiel: SihfSpiel, eigenerName: string) =>
  spiel.heim.name.toLowerCase().includes(eigenerName.toLowerCase())

/** Sammelt alle gespielten Partien aller Teams innerhalb des Zeitraums. */
export async function sammleWochenresultate(
  payload: Payload,
  zeitraum: { von: Date; bis: Date },
): Promise<Wochenspiel[]> {
  const { docs: teams } = await payload.find({
    collection: 'teams',
    limit: 100,
    sort: 'reihenfolge',
    depth: 0,
  })

  const angebunden = teams.filter(
    (team) => team.sihfLeagueId && (team.sihfTeamId || team.sihfTeamName),
  )

  // Die Saison richtet sich nach dem Zeitraum, nicht nach dem heutigen Datum –
  // sonst würde ein Lauf im Sommer die noch leere neue Saison abfragen.
  const saison = saisonAlias(zeitraum.von)

  const proTeam = await Promise.all(
    angebunden.map(async (team) => {
      const plan = await holeTeamSpielplan({
        ligaId: team.sihfLeagueId,
        teamId: team.sihfTeamId,
        teamName: team.sihfTeamName,
        saison,
        // Der Job braucht frische Daten, keine zwischengespeicherten.
        revalidate: 0,
      })

      return plan.spiele
        .filter((spiel) => {
          if (!spiel.gespielt || spiel.abgesagt) return false
          const datum = datumAusSihf(spiel)
          return datum !== null && datum >= zeitraum.von && datum < zeitraum.bis
        })
        .map((spiel) => ({ team, spiel }))
    }),
  )

  return proTeam.flat().sort((a, b) => {
    const da = datumAusSihf(a.spiel)?.getTime() ?? 0
    const db = datumAusSihf(b.spiel)?.getTime() ?? 0
    return da - db
  })
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

const titelKnoten = (text: string) => ({
  type: 'heading',
  tag: 'h3',
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  children: [textKnoten(text)],
})

/** Baut den Editor-Inhalt für den Wochenrückblick. */
export function baueInhalt(resultate: Wochenspiel[], zeitraum: { von: Date; bis: Date }) {
  const formatiert = new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'long' })
  const bisAnzeige = new Date(zeitraum.bis.getTime() - TAG_MS)

  const kinder: unknown[] = [
    absatz([
      textKnoten(
        `Alle Resultate unserer Teams von ${formatiert.format(zeitraum.von)} bis ${formatiert.format(bisAnzeige)}.`,
      ),
    ]),
  ]

  if (resultate.length === 0) {
    kinder.push(absatz([textKnoten('In dieser Woche wurden keine Meisterschaftsspiele ausgetragen.')]))
    return { root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children: kinder } }
  }

  // Nach Team gruppieren, damit der Beitrag übersichtlich bleibt.
  const gruppen = new Map<number, Wochenspiel[]>()
  for (const eintrag of resultate) {
    const liste = gruppen.get(eintrag.team.id) ?? []
    liste.push(eintrag)
    gruppen.set(eintrag.team.id, liste)
  }

  for (const liste of gruppen.values()) {
    const team = liste[0].team
    kinder.push(titelKnoten(team.name))

    for (const { spiel } of liste) {
      const eigenerName = team.sihfTeamName || 'Rot-Blau'
      const heim = wirSindHeim(spiel, eigenerName)
      const eigene = heim ? spiel.toreHeim! : spiel.toreGast!
      const fremde = heim ? spiel.toreGast! : spiel.toreHeim!
      const ausgang = eigene > fremde ? 'Sieg' : eigene < fremde ? 'Niederlage' : 'Unentschieden'
      const zusatz = spiel.entscheidung ? ` n.${spiel.entscheidung}` : ''

      kinder.push(
        absatz([
          textKnoten(`${spiel.wochentag} ${spiel.datum}: `),
          textKnoten(`${spiel.heim.name} ${spiel.toreHeim}:${spiel.toreGast}${zusatz} ${spiel.gast.name}`, true),
          textKnoten(` – ${ausgang}`),
        ]),
      )
    }
  }

  return { root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children: kinder } }
}

export function baueTitel(zeitraum: { von: Date; bis: Date }) {
  const bisAnzeige = new Date(zeitraum.bis.getTime() - TAG_MS)
  const tagMonat = (datum: Date) =>
    `${String(datum.getDate()).padStart(2, '0')}.${String(datum.getMonth() + 1).padStart(2, '0')}.`
  return `Resultate der Woche: ${tagMonat(zeitraum.von)} – ${tagMonat(bisAnzeige)}${bisAnzeige.getFullYear()}`
}

export function baueAuszug(resultate: Wochenspiel[]) {
  if (resultate.length === 0) return 'In dieser Woche wurden keine Meisterschaftsspiele ausgetragen.'

  const siege = resultate.filter(({ team, spiel }) => {
    const eigenerName = team.sihfTeamName || 'Rot-Blau'
    const heim = wirSindHeim(spiel, eigenerName)
    const eigene = heim ? spiel.toreHeim! : spiel.toreGast!
    const fremde = heim ? spiel.toreGast! : spiel.toreHeim!
    return eigene > fremde
  }).length

  const spiele = resultate.length === 1 ? '1 Spiel' : `${resultate.length} Spiele`
  return `${spiele}, ${siege === 1 ? '1 Sieg' : `${siege} Siege`}: alle Resultate unserer Teams im Überblick.`
}
