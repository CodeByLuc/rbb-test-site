import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Bild, bildDaten } from '../../../../components/Bild'
import { Fliesstext } from '../../../../components/Fliesstext'
import { PostKarte } from '../../../../components/PostKarte'
import { Seitenkopf } from '../../../../components/Seitenkopf'
import { LetztesResultat, NaechstesSpiel, SpielListe } from '../../../../components/Spiele'
import { Tabelle } from '../../../../components/Tabelle'
import { TeamKompakt } from '../../../../components/TeamKompakt'
import { holePosts, holeTeam, holeTeamBilder, holeTeams } from '../../../../lib/daten'
import { holeTeamSpielplan, saisonAlias } from '../../../../lib/sihf'

export const revalidate = 3600

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
  goalie: 'Torhüter:in',
  verteidigung: 'Verteidigung',
  sturm: 'Sturm',
}

export default async function TeamSeite({ params }: Props) {
  const { slug } = await params
  const team = await holeTeam(slug)
  if (!team) notFound()

  const [plan, posts, teamBilder] = await Promise.all([
    holeTeamSpielplan({
      ligaId: team.sihfLeagueId,
      teamId: team.sihfTeamId,
      teamName: team.sihfTeamName,
    }),
    holePosts({ limit: 3, teamId: team.id }),
    holeTeamBilder(team.name),
  ])

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

  const spieler = team.spieler ?? []
  const trainer = team.trainer ?? []
  const trainings = team.trainingszeiten ?? []
  const teamfoto = bildDaten(team.teamfoto, 'hero')

  // Das Teamfoto steht schon oben gross – in der Galerie waere es doppelt.
  const teamfotoId = typeof team.teamfoto === 'object' ? team.teamfoto?.id : team.teamfoto
  const portraets = teamBilder.filter((bild) => bild.id !== teamfotoId)

  return (
    <>
      <Seitenkopf
        titel={team.name}
        untertitel={team.kurzbeschreibung}
        zusatz={
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {team.liga && (
              <span className="knopf bg-white/15 px-3 py-1 font-display tracking-wide uppercase">
                {team.liga}
              </span>
            )}
            {anzeige && anzeige.spiele.length > 0 && (
              <span className="text-white/75">
                {anzeige.bilanz.siege} Siege · {anzeige.bilanz.niederlagen} Niederlagen · Tore{' '}
                {anzeige.bilanz.tore}:{anzeige.bilanz.gegentore}
              </span>
            )}
            <Link href="/teams" className="text-white/70 underline hover:text-white">
              Alle Teams
            </Link>
          </div>
        }
      />

      {/*
        Aufbau nach der Skizze: oben das Teamfoto gross, daneben die beiden
        Partien. Darunter links der Kader, rechts die Tabelle.
      */}
      <div className="inhalt grid gap-6 pt-8 lg:grid-cols-[2fr_1fr] lg:gap-8">
        {teamfoto && (
          <div className="kachel relative overflow-hidden bg-nacht shadow-xl">
            <Bild
              bild={team.teamfoto}
              groesse="hero"
              priority
              className="aspect-16/9 w-full object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          </div>
        )}

        {/* Letztes und nächstes Spiel – auf dem Telefon als Kurzübersicht. */}
        {anzeige && (anzeige.naechste[0] || anzeige.letztes || anzeige.tabelle.length > 0) && (
          <>
            <TeamKompakt
              tabelle={anzeige.tabelle}
              letztes={anzeige.letztes}
              naechstes={anzeige.naechste[0]}
              eigenerName={eigenerName}
              liga={team.liga}
              tabellenUrl={team.tabellenUrl}
              className="lg:hidden"
            />

            <div className="hidden gap-5 lg:grid lg:content-start">
              {anzeige.naechste[0] && (
                <NaechstesSpiel spiel={anzeige.naechste[0]} eigenerName={eigenerName} />
              )}
              {anzeige.letztes && (
                <LetztesResultat spiel={anzeige.letztes} eigenerName={eigenerName} />
              )}
            </div>
          </>
        )}
      </div>

      <div className="inhalt grid gap-10 py-10 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-10">
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
                    <Bild
                      bild={person.foto}
                      groesse="portrait"
                      className="aspect-[3/4] w-full object-cover"
                      sizes="(max-width: 640px) 50vw, 16rem"
                    />
                    <div className="p-3">
                      <p className="flex items-baseline gap-2">
                        {person.nummer != null && (
                          <span className="font-display text-xl text-rot">{person.nummer}</span>
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

          {/*
            Porträts aus der Mediathek. Welches Bild welche Person zeigt, geht
            aus den Kameradateinamen nicht hervor – darum stehen sie als
            Galerie und nicht mit Namen beim Kader.
          */}
          {portraets.length > 0 && (
            <section>
              <h2 className="abschnittstitel mb-5 text-4xl text-nacht">Porträts</h2>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                {portraets.map((bild) => (
                  <div key={bild.id} className="kachel overflow-hidden bg-nacht shadow-sm">
                    <Bild
                      bild={bild}
                      groesse="portrait"
                      className="aspect-[3/4] w-full object-cover"
                      sizes="(max-width: 640px) 33vw, 12rem"
                    />
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
          {/*
            Tabelle und Spielplan brauchen Breite. Auf dem Telefon steht oben
            die Kurzübersicht, hier erscheinen sie erst, wenn sie auch lesbar
            sind – sonst scrollt man nur an Zahlenkolonnen vorbei.
          */}
          {team.sihfLeagueId && anzeige && (
            <div className="hidden space-y-4 lg:block">
              {istVorsaison && (
                <p className="kachel border-l-4 border-rot bg-white px-4 py-3 text-sm text-nacht shadow-sm">
                  Für die neue Saison sind noch keine Spiele angesetzt. Es folgen Tabelle und
                  Spielplan der letzten Saison.
                </p>
              )}

              {anzeige.tabelle.length > 0 && (
                <Tabelle
                  zeilen={anzeige.tabelle}
                  eigenerName={eigenerName}
                  titel={`Tabelle${team.liga ? ` – ${team.liga}` : ''}`}
                  tabellenUrl={team.tabellenUrl}
                />
              )}

              <SpielListe
                titel={istVorsaison ? 'Spiele der letzten Saison' : 'Spielplan und Resultate'}
                spiele={anzeige.spiele}
                eigenerName={eigenerName}
                leerText="Die Spiele erscheinen hier, sobald Swiss Ice Hockey den Spielplan veröffentlicht."
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
                    {training.ort && <p className="text-xs text-white/45">{training.ort}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {trainer.length > 0 && (
            <div className="kachel bg-white shadow-md">
              <h2 className="abschnittstitel px-5 pt-5 text-2xl text-nacht">Trainer & Betreuung</h2>
              <ul className="space-y-4 p-5">
                {trainer.map((person, index) => (
                  <li key={person.id ?? index} className="flex items-center gap-3">
                    <Bild
                      bild={person.foto}
                      groesse="thumbnail"
                      className="h-14 w-14 shrink-0 object-cover"
                      sizes="56px"
                    />
                    <div className="min-w-0">
                      <p className="font-display text-lg tracking-wide text-nacht uppercase">
                        {person.name}
                      </p>
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
