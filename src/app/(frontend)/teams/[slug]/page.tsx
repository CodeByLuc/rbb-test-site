import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Bild, bildDaten, echtesTeamfoto } from '../../../../components/Bild'
import { Fliesstext } from '../../../../components/Fliesstext'
import { PostKarte } from '../../../../components/PostKarte'
import { SpielerFoto } from '../../../../components/SpielerFoto'
import { Tabelle } from '../../../../components/Tabelle'
import { TeamSpieleLive } from '../../../../components/TeamSpieleLive'
import { holePosts, holeTeam, holeTeams, holeTeamSpielplanMitFallback } from '../../../../lib/daten'
import {
  holeTabellenLink,
  holeTeamSpielplan,
  liveKandidat,
  mitKuerzeln,
  saisonAlias,
  type TabellenLink,
} from '../../../../lib/sihf'

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const teams = await holeTeams()
  return teams.filter((team) => team.slug).map((team) => ({ slug: team.slug! }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const team = await holeTeam(slug)
  if (!team) return { title: 'Team nicht gefunden' }

  return {
    title: team.name,
    description:
      team.kurzbeschreibung ?? `${team.name} des EHC Rot-Blau Bern-Bümpliz: Kader und Spielplan.`,
  }
}

const positionsNamen: Record<string, string> = {
  goalie: 'Torhüter',
  verteidigung: 'Verteidiger',
  sturm: 'Stürmer',
}

export default async function TeamSeite({ params }: Props) {
  const { slug } = await params
  const team = await holeTeam(slug)
  if (!team) notFound()

  const [plan, posts, automatischerLink] = await Promise.all([
    holeTeamSpielplanMitFallback(team),
    holePosts({ limit: 3, teamId: team.id }),
    holeTabellenLink(team.sihfLeagueId, team.sihfTeamId),
  ])

  // Der Link wird aus Liga- und Team-ID ermittelt; die von Hand erfasste
  // Adresse greift nur noch, wenn das nicht klappt.
  const tabellenLink: TabellenLink | null =
    automatischerLink ?? (team.tabellenUrl ? { url: team.tabellenUrl, art: 'tabelle' } : null)

  // In der Sommerpause hat die neue Saison noch keine Spiele – dann zeigen wir die letzte.
  const vorsaison =
    plan.spiele.length === 0 && team.sihfLeagueId
      ? await holeTeamSpielplan({
          ligaId: team.sihfLeagueId,
          teamId: team.sihfTeamId,
          teamName: team.sihfTeamName,
          saison: String(Number(saisonAlias()) - 1),
        })
      : null

  const anzeige = plan.spiele.length > 0 ? plan : vorsaison
  const istVorsaison = plan.spiele.length === 0 && (vorsaison?.spiele.length ?? 0) > 0
  const eigenerName = team.sihfTeamName || 'Rot-Blau'
  // Die Kachel «Letztes Spiel» ist schmal: mit den offiziellen Kürzeln passt sie.
  const letztesSpiel = anzeige?.letztes ? await mitKuerzeln(anzeige.letztes) : null
  // Läuft gerade ein Spiel (oder beginnt es bald), holt die Seite im Browser den Live-Stand.
  const kandidat = istVorsaison ? null : liveKandidat(plan.spiele)
  const mitSpielen =
    !!anzeige && !!(anzeige.naechste[0] || anzeige.letztes || kandidat || anzeige.tabelle.length > 0)
  const spielDaten = {
    tabelle: anzeige?.tabelle ?? [],
    letztes: letztesSpiel ?? anzeige?.letztes ?? null,
    naechste: anzeige?.naechste ?? [],
    kandidat,
    eigenerName,
    liga: team.liga,
    tabellenLink,
  }

  const spieler = team.spieler ?? []
  const trainer = team.trainer ?? []
  const trainings = team.trainingszeiten ?? []
  // Ohne eigenes Teamfoto erscheint oben einfach keines.
  const foto = echtesTeamfoto(team.teamfoto)
  const teamfoto = bildDaten(foto, 'hero')

  return (
    <>
      {/*
        Kein eigener Seitenkopf-Block mehr, wie auf den anderen Unterseiten.
        Anders als dort verrät die Navigation hier aber nicht, welches Team
        man ansieht ("TEAMS" bleibt bei jedem Team gleich aktiv) – darum
        bleibt der Teamname als normale, kleine Überschrift stehen, ohne
        eigenen Hintergrund oder Kasten.
      */}
      <div className="inhalt pt-8">
        <h1 className="abschnittstitel text-3xl text-nacht sm:text-4xl">{team.name}</h1>
        {team.kurzbeschreibung && (
          <p className="mt-2 max-w-2xl text-base text-grau">{team.kurzbeschreibung}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          {team.liga && (
            <span className="knopf bg-nacht px-3 py-1 font-display tracking-wide text-white uppercase">
              {team.liga}
            </span>
          )}
          {anzeige && anzeige.spiele.length > 0 && (
            <span className="text-grau">
              {anzeige.bilanz.siege} Siege · {anzeige.bilanz.niederlagen} Niederlagen · Tore{' '}
              {anzeige.bilanz.tore}:{anzeige.bilanz.gegentore}
            </span>
          )}
          <Link href="/teams" className="text-rot-dunkel underline hover:text-rot-tief">
            Alle Teams
          </Link>
        </div>
      </div>

      {/*
        Zwei durchgehende Spalten: links Teamfoto, Trainer, Kader und News,
        rechts Spiele, Tabelle und Trainingszeiten. So hängt der Abstand unter
        dem Foto nicht davon ab, wie hoch die Spielkarten daneben sind – er ist
        bei jedem Team gleich. Auf dem Telefon folgt die Kurzübersicht direkt
        auf das Foto.
      */}
      <div className="inhalt grid gap-10 pt-6 pb-10 lg:grid-cols-[3fr_2fr] lg:gap-8">
        <div className="min-w-0 space-y-10">
          {teamfoto && (
            <div className="kachel relative overflow-hidden shadow-xl">
              <Bild
                bild={foto}
                groesse="hero"
                priority
                className="block h-auto w-full"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            </div>
          )}

          {mitSpielen && (
            <TeamSpieleLive ansicht="kompakt" className="lg:hidden" {...spielDaten} />
          )}

          {/* Trainer & Betreuung – direkt unter dem Teamfoto, das Kader fürs
              Gesicht nach aussen ist die Betreuung. */}
          {trainer.length > 0 && (
            <section>
              <h2 className="abschnittstitel mb-5 text-4xl text-nacht">Trainer & Betreuung</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {trainer.map((person, index) => (
                  <div key={person.id ?? index} className="kachel overflow-hidden bg-white shadow-sm">
                    <SpielerFoto
                      bild={person.foto}
                      name={person.name}
                      className="aspect-square w-full object-cover"
                    />
                    <div className="p-3">
                      <p className="font-semibold text-nacht">{person.name}</p>
                      {person.funktion && <p className="text-xs text-grau">{person.funktion}</p>}
                      {person.email && (
                        <a
                          href={`mailto:${person.email}`}
                          className="text-xs text-rot-dunkel hover:underline"
                        >
                          {person.email}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {team.beschreibung && (
            <div className="kachel bg-white p-6 shadow-sm sm:p-8">
              <Fliesstext daten={team.beschreibung} />
            </div>
          )}

          {!team.sihfLeagueId && (
            <p className="kachel bg-white p-6 text-sm text-grau shadow-sm">
              Dieses Team spielt keine offizielle Meisterschaft. Trainingszeiten und Termine stehen
              rechts.
            </p>
          )}

          {/* Kader */}
          {spieler.length > 0 && (
            <section>
              <h2 className="abschnittstitel mb-5 text-4xl text-nacht">Kader</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {spieler.map((person, index) => (
                  <div key={person.id ?? index} className="kachel overflow-hidden bg-white shadow-sm">
                    <SpielerFoto
                      bild={person.foto}
                      name={person.name}
                      className="aspect-square w-full object-cover"
                    />
                    <div className="p-3">
                      <p className="flex items-baseline gap-2">
                        {person.nummer != null && (
                          <span className="font-display text-xl text-rot-dunkel">{person.nummer}</span>
                        )}
                        <span className="font-semibold text-nacht">{person.name}</span>
                      </p>
                      {person.position && (
                        <p className="text-xs text-grau">{positionsNamen[person.position]}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {posts.length > 0 && (
            <section>
              <h2 className="abschnittstitel mb-5 text-4xl text-nacht">News zu diesem Team</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {posts.map((post) => (
                  <PostKarte key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          {/* Letztes und nächstes Spiel mit Live-Stand. */}
          {mitSpielen && (
            <TeamSpieleLive ansicht="karten" className="hidden lg:grid" {...spielDaten} />
          )}

          {/*
            Auf dem Telefon steht oben die Kurzübersicht (Rang, letztes und
            nächstes Spiel); die ganze Tabelle erscheint erst, wenn sie lesbar ist.
          */}
          {team.sihfLeagueId && anzeige && anzeige.tabelle.length > 0 && (
            <div className="hidden space-y-4 lg:block">
              {istVorsaison && (
                <p className="kachel bg-white px-5 py-3 text-sm text-nacht shadow-sm">
                  <strong>Hinweis:</strong> Für die neue Saison sind noch keine Spiele angesetzt.
                  Es folgt die Tabelle der letzten Saison.
                </p>
              )}
              <Tabelle
                zeilen={anzeige.tabelle}
                eigenerName={eigenerName}
                titel={`Tabelle${team.liga ? ` – ${team.liga}` : ''}`}
                tabellenLink={tabellenLink}
              />
            </div>
          )}

          {trainings.length > 0 && (
            <div className="kachel bg-nacht text-white shadow-xl">
              <h2 className="bg-nacht-tief px-5 py-3 text-xl">Trainingszeiten</h2>
              <div className="trikotband-schmal" />
              <ul className="p-5 text-sm">
                {trainings.map((training, index) => (
                  <li
                    key={training.id ?? index}
                    className="border-b border-white/10 py-2.5 first:pt-0 last:border-0 last:pb-0"
                  >
                    <p className="font-display text-lg tracking-wide uppercase">{training.tag}</p>
                    <p className="text-white/70">{training.zeit}</p>
                    {training.ort && <p className="text-xs text-white/60">{training.ort}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </>
  )
}
