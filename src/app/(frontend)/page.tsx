import Link from 'next/link'

import { Bild, bildDaten } from '../../components/Bild'
import { PostKarte } from '../../components/PostKarte'
import { ResultatLive } from '../../components/ResultatLive'
import { SponsorenWidget } from '../../components/SponsorenWidget'
import {
  holeEinstellungen,
  holePosts,
  holeSponsoren,
  holeStimmungsbild,
  holeTeams,
  holeTeamSpielplanMitFallback,
} from '../../lib/daten'
import {
  datumAusSihf,
  LIVE_VORLAUF_MS,
  liveKandidat,
  type SihfSpiel,
  type TeamSpielplan,
} from '../../lib/sihf'
import type { Team } from '../../payload-types'

// Die Startseite wird häufig neu gebaut für aktuelle Logo/Sponsor-Änderungen
export const revalidate = 60

type TeamPlan = { team: Team; plan: TeamSpielplan; kandidat: SihfSpiel | null }

/**
 * Spielpläne aller angebundenen Teams der laufenden Saison. Teams ohne
 * absolviertes Spiel erscheinen nicht – es gibt bewusst keinen Rückgriff auf
 * die Vorsaison. Ausnahme: Das erste Spiel läuft gerade (oder beginnt gleich),
 * dann zeigt der Balken es live.
 */
async function alleSpielplaene(teams: Team[]): Promise<TeamPlan[]> {
  const angebunden = teams.filter(
    (team) => team.sihfLeagueId && (team.sihfTeamId || team.sihfTeamName),
  )

  const plaene = await Promise.all(
    angebunden.map(async (team) => {
      const plan = await holeTeamSpielplanMitFallback(team)
      return { team, plan, kandidat: liveKandidat(plan.spiele) }
    }),
  )
  return plaene.filter((eintrag) => eintrag.plan.letztes || angepfiffen(eintrag.kandidat))
}

/** Hat das Spiel begonnen (oder beginnt es in den nächsten Minuten)? */
const angepfiffen = (spiel: SihfSpiel | null) =>
  !!spiel?.zeitpunkt && Date.parse(spiel.zeitpunkt) <= Date.now() + LIVE_VORLAUF_MS

/** Zeitpunkt, nach dem der Balken sortiert: das laufende Spiel, sonst das letzte. */
function sortierzeit({ plan, kandidat }: TeamPlan): number {
  if (angepfiffen(kandidat)) return Date.parse(kandidat!.zeitpunkt!)
  return plan.letztes ? (datumAusSihf(plan.letztes)?.getTime() ?? 0) : 0
}

export default async function Startseite() {
  const [einstellungen, posts, sponsoren, teams, stimmungsbild] = await Promise.all([
    holeEinstellungen(),
    // Nur die neuesten Beiträge – die Startseite soll zeigen, was gerade
    // passiert, nicht ein vollständiges Archiv. Ältere Beiträge stehen unter
    // /news.
    holePosts({ limit: 3 }),
    holeSponsoren(),
    holeTeams(),
    holeStimmungsbild(),
  ])

  const plaene = await alleSpielplaene(teams)

  // Laufendes bzw. neuestes Spiel zuerst, damit oben wirklich das aktuelle steht.
  const resultate = [...plaene].sort((a, b) => sortierzeit(b) - sortierzeit(a))

  const [neuester, ...weitere] = posts
  const heroFoto = teams.find((team) => team.teamfoto)?.teamfoto ?? neuester?.titelbild
  const hero = bildDaten(heroFoto, 'hero')
  const bandFoto = stimmungsbild ?? null

  return (
    <>
      {/* Hero mit echtem Vereinsfoto */}
      <section className="relative isolate overflow-hidden bg-nacht-tief text-white">
        {hero && (
          <Bild
            bild={heroFoto}
            groesse="hero"
            priority
            className="absolute inset-0 h-full w-full object-cover opacity-45"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-nacht-tief via-nacht-tief/90 to-nacht-tief/40" />
        <div className="eisglanz absolute inset-0 opacity-70" />

        <div
          className={`inhalt relative ${
            // Ohne Hintergrundfoto wirkt viel Höhe wie eine leere Fläche.
            hero ? 'py-7 sm:py-10' : 'py-5 sm:py-7'
          }`}
        >
          <div>
            <p className="mb-2 flex flex-wrap items-center gap-2 font-display text-sm tracking-[0.28em] uppercase">
              <span className="bg-rot-dunkel px-2 py-0.5">Seit 1942</span>
              <span className="text-white/70">Eishockey in Bern-Bümpliz</span>
            </p>
            <h1 className="text-4xl leading-[0.85] sm:text-6xl lg:text-7xl">
              Rot-Blau
              <span className="mt-1 block text-rot">Bern-Bümpliz</span>
            </h1>

            {/* Ein Satz, der auch ohne Vorwissen erklärt, worum es geht. */}
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
              {einstellungen.claim ??
                'Unser Verein bringt Kinder ab vier Jahren aufs Eis und begleitet sie bis in die Aktivmannschaft. Mitmachen kann jede und jeder – Vorkenntnisse braucht es keine.'}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/teams/hockeyschule"
                className="knopf bg-rot-dunkel px-6 py-2.5 font-display text-lg tracking-wide uppercase transition-colors hover:bg-rot-tief"
              >
                Eishockey ausprobieren
              </Link>
              <Link
                href="/teams"
                className="knopf border-2 border-white/45 px-6 py-2.5 font-display text-lg tracking-wide uppercase transition-colors hover:border-white hover:bg-white hover:text-nacht"
              >
                Teams und Spielplan
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Roter Balken: letztes Resultat jedes Teams der laufenden Saison, laufende Spiele live. */}
      {resultate.length > 0 && (
        <section
          aria-labelledby="resultate-titel"
          className="relative overflow-hidden bg-rot-dunkel text-white"
        >
          {/* Dieselben diagonalen Linien wie im Hero, hier in Weiss. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[repeating-linear-gradient(108deg,rgba(255,255,255,0.07)_0_2px,transparent_2px_30px)]"
          />
          <div className="inhalt relative flex flex-col gap-4 py-5 md:flex-row md:items-center md:gap-10 md:py-6">
            <h2
              id="resultate-titel"
              className="shrink-0 font-display leading-[0.9] uppercase"
            >
              <span className="block text-sm tracking-[0.3em] text-white">Letzte</span>
              <span className="block text-3xl md:text-4xl">Resultate</span>
            </h2>
            <ul className="flex flex-1 flex-col gap-5 border-t border-white/30 pt-4 md:flex-row md:flex-wrap md:gap-x-10 md:gap-y-5 md:border-t-0 md:border-l md:pt-0 md:pl-10">
              {resultate.map(({ team, plan, kandidat }) => (
                <ResultatLive
                  key={team.id}
                  teamName={team.name}
                  teamSlug={team.slug}
                  eigenerName={team.sihfTeamName || 'Rot-Blau'}
                  letztes={plan.letztes}
                  kandidat={kandidat}
                />
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* News und Sponsoren */}
      <section className="inhalt py-8">
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="abschnittstitel mb-4 text-3xl text-nacht sm:text-4xl">News</h2>

            {posts.length === 0 ? (
              <p className="kachel bg-white p-8 text-grau shadow-sm">
                Noch keine Beiträge. Der erste entsteht im{' '}
                <Link href="/admin" className="font-semibold text-rot-dunkel underline">
                  Redaktionsbereich
                </Link>
                .
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {neuester && <PostKarte post={neuester} gross />}
                {weitere.map((post) => (
                  <PostKarte key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <SponsorenWidget sponsoren={sponsoren} />
          </aside>
        </div>
      </section>

      {/* Foto-Band mit Slogan – nur sinnvoll, wenn es ein Foto dafür gibt. */}
      {bildDaten(bandFoto, 'hero') && (
        <section className="relative isolate flex min-h-52 items-center overflow-hidden bg-nacht text-white sm:min-h-64">
          <Bild
            bild={bandFoto}
            groesse="hero"
            className="absolute inset-0 h-full w-full object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-nacht-tief via-nacht-tief/55 to-nacht-tief/25" />
          <div className="inhalt relative py-7 text-center">
            <p className="font-display text-4xl leading-[0.85] uppercase sm:text-5xl lg:text-6xl">
              Einer für alle
              <span className="mt-1 block text-rot">Alle für einen</span>
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-white/80 sm:text-lg">
              Seit 1942 Eishockey im Westen von Bern.
            </p>
          </div>
          <div className="absolute top-0 left-0 right-0 trikotband" />
        </section>
      )}
    </>
  )
}
