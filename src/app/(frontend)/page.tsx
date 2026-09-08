import Link from 'next/link'

import { Bild, bildDaten } from '../../components/Bild'
import { Logo } from '../../components/Logo'
import { PostKarte } from '../../components/PostKarte'
import { SponsorenWidget } from '../../components/SponsorenWidget'
import {
  holeEinstellungen,
  holePosts,
  holeSponsoren,
  holeStimmungsbild,
  holeTeams,
} from '../../lib/daten'
import {
  datumAusSihf,
  holeTeamSpielplan,
  saisonAlias,
  type SihfSpiel,
  type TeamSpielplan,
} from '../../lib/sihf'
import type { Team } from '../../payload-types'

// Die Startseite wird stündlich neu gebaut, damit Resultate von selbst aktuell sind.
export const revalidate = 3600

type TeamPlan = { team: Team; plan: TeamSpielplan }

/**
 * Spielpläne aller angebundenen Teams. Hat die neue Saison noch keine Spiele
 * (Sommerpause), wird auf die letzte zurückgegriffen.
 */
async function alleSpielplaene(
  teams: Team[],
): Promise<{ plaene: TeamPlan[]; istVorsaison: boolean }> {
  const angebunden = teams.filter(
    (team) => team.sihfLeagueId && (team.sihfTeamId || team.sihfTeamName),
  )

  const holen = (saison?: string) =>
    Promise.all(
      angebunden.map(async (team) => ({
        team,
        plan: await holeTeamSpielplan({
          ligaId: team.sihfLeagueId,
          teamId: team.sihfTeamId,
          teamName: team.sihfTeamName,
          saison,
        }),
      })),
    )

  const aktuell = (await holen()).filter((eintrag) => eintrag.plan.spiele.length > 0)
  if (aktuell.length > 0) return { plaene: aktuell, istVorsaison: false }

  const vorsaison = String(Number(saisonAlias()) - 1)
  const alt = (await holen(vorsaison)).filter((eintrag) => eintrag.plan.spiele.length > 0)
  return { plaene: alt, istVorsaison: alt.length > 0 }
}

/** Ein Resultat in der dunklen Leiste unter dem Hero. */
function ResultatKachel({ team, spiel }: { team: Team; spiel: SihfSpiel }) {
  const eigenerName = team.sihfTeamName || 'Rot-Blau'
  const wirSindHeim = spiel.heim.name.toLowerCase().includes(eigenerName.toLowerCase())
  const eigene = wirSindHeim ? spiel.toreHeim! : spiel.toreGast!
  const fremde = wirSindHeim ? spiel.toreGast! : spiel.toreHeim!
  const gegner = wirSindHeim ? spiel.gast.name : spiel.heim.name
  const streifen =
    eigene > fremde ? 'bg-emerald-500' : eigene < fremde ? 'bg-rot' : 'bg-white/40'

  return (
    <Link
      href={`/teams/${team.slug}`}
      className="relative flex items-center gap-4 bg-white/5 px-4 py-2.5 transition-colors hover:bg-white/12"
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${streifen}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-lg leading-none tracking-wide uppercase">
          {team.name}
        </p>
        <p className="mt-1 truncate text-sm text-white/55">
          {wirSindHeim ? 'gegen' : 'bei'} {gegner}
        </p>
        <p className="mt-0.5 font-display text-xs tracking-widest text-white/35 uppercase">
          {spiel.wochentag} {spiel.datum}
        </p>
      </div>
      <span className="tafelzahl shrink-0 text-4xl">
        {eigene}
        <span className="text-rot">:</span>
        {fremde}
      </span>
    </Link>
  )
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

  const { plaene, istVorsaison } = await alleSpielplaene(teams)

  // Neuestes Resultat zuerst, damit oben wirklich das letzte Spiel steht.
  const resultate = plaene
    .filter((eintrag) => eintrag.plan.letztes)
    .map((eintrag) => ({ team: eintrag.team, spiel: eintrag.plan.letztes! }))
    .sort((a, b) => {
      const da = datumAusSihf(a.spiel)?.getTime() ?? 0
      const db = datumAusSihf(b.spiel)?.getTime() ?? 0
      return db - da
    })

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
          className={`inhalt relative grid gap-6 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-10 ${
            // Ohne Hintergrundfoto wirkt viel Höhe wie eine leere Fläche.
            hero ? 'py-7 sm:py-10' : 'py-5 sm:py-7'
          }`}
        >
          <Logo logo={einstellungen.logo} className="h-20 w-auto drop-shadow-2xl sm:h-28 lg:h-32" />

          <div>
            <p className="mb-2 flex flex-wrap items-center gap-2 font-display text-sm tracking-[0.28em] uppercase">
              <span className="bg-rot px-2 py-0.5">Seit 1942</span>
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
                className="knopf bg-rot px-6 py-2.5 font-display text-lg tracking-wide uppercase transition-colors hover:bg-rot-dunkel"
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

        {/* Resultate als Anzeigetafel */}
        {resultate.length > 0 && (
          <div className="relative border-t border-white/12 bg-black/35">
            <div className="inhalt">
              <div className="flex flex-wrap items-baseline justify-between gap-2 pt-3 pb-2">
                <h2 className="abschnittstitel flex flex-wrap items-baseline gap-3 text-2xl">
                  Letzte Resultate
                  {istVorsaison && (
                    <span className="font-sans text-xs font-semibold tracking-[0.18em] text-white/45 normal-case">
                      Saison {Number(saisonAlias()) - 2}/{String(Number(saisonAlias()) - 1).slice(2)}
                    </span>
                  )}
                </h2>
                <span className="font-display text-xs tracking-widest text-white/40 uppercase">
                  automatisch von Swiss Ice Hockey
                </span>
              </div>
              <div className="grid gap-px bg-white/10 pb-4 sm:grid-cols-2 lg:grid-cols-4">
                {resultate.map((eintrag) => (
                  <ResultatKachel key={eintrag.team.id} {...eintrag} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="trikotband" />
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
          <div className="absolute bottom-0 left-0 right-0 trikotband" />
        </section>
      )}

      {/* News und Sponsoren */}
      <section className="inhalt py-8">
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div>
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className="abschnittstitel text-3xl text-nacht sm:text-4xl">News</h2>
              <Link
                href="/news"
                className="font-display text-base tracking-wide text-rot-dunkel uppercase hover:underline"
              >
                Alle News →
              </Link>
            </div>

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
    </>
  )
}
