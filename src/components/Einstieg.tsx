import Link from 'next/link'

import type { Einstellungen, Team } from '../payload-types'
import { Bild, bildDaten } from './Bild'

/**
 * Bausteine für Besucherinnen und Besucher, die den Verein noch nicht kennen.
 *
 * Die Startseite zeigte bisher vor allem Resultate und Tabellen – Dinge, die
 * nur versteht, wer schon dabei ist. Wer zum ersten Mal auf die Seite kommt,
 * will zuerst wissen: Wohin gehört mein Kind, wann wird trainiert, und wie
 * fange ich an.
 */

/** Aus «U9» wird «bis 9 Jahre» – die Altersangabe steckt im Teamnamen. */
function altersangabe(team: Team): string | null {
  const name = team.name.trim()

  const jugend = name.match(/^U\s?(\d{1,2})$/i)
  if (jugend) return `bis ${jugend[1]} Jahre`

  if (/hockeyschule/i.test(name)) return 'ab 4 Jahren'
  if (/senioren/i.test(name)) return 'ab 30 Jahren'
  if (/damen/i.test(name)) return 'Frauen, jedes Alter'
  if (/mannschaft/i.test(name)) return 'Erwachsene'

  return null
}

/**
 * Übersicht aller Teams mit Altersangabe – der schnellste Weg für Eltern,
 * die richtige Gruppe zu finden.
 */
export function TeamFinder({ teams }: { teams: Team[] }) {
  if (teams.length === 0) return null

  // Die Jüngsten zuerst: so lesen Eltern von oben nach unten.
  const reihenfolge = ['hockeyschule', 'u9', 'u12', 'u14', 'u16', 'damen', 'mannschaft', 'senioren']
  const sortiert = [...teams].sort((a, b) => {
    const rang = (t: Team) => {
      const treffer = reihenfolge.findIndex((s) => t.name.toLowerCase().replace(/[\s.]/g, '').includes(s))
      return treffer === -1 ? 99 : treffer
    }
    return rang(a) - rang(b)
  })

  return (
    <section className="inhalt py-14 sm:py-16">
      <div className="mb-8 max-w-3xl">
        <h2 className="abschnittstitel text-4xl text-nacht sm:text-5xl">Wo passt du hin?</h2>
        <p className="mt-3 text-lg leading-relaxed text-grau">
          Vom ersten Schritt auf dem Eis bis zur Meisterschaft – bei uns spielen Kinder ab vier
          Jahren, Jugendliche, Frauen und Erwachsene. Wähle die passende Gruppe.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {sortiert.map((team) => {
          const alter = altersangabe(team)
          const foto = bildDaten(team.teamfoto, 'card')
          // Ohne Foto bliebe sonst eine grosse leere Fläche stehen – dann wird
          // die Kachel flach und lebt von Schrift und Farbe.
          const hoehe = foto ? 'min-h-44 sm:min-h-52' : ''
          const ligaZeigen =
            team.liga && team.liga.trim().toLowerCase() !== team.name.trim().toLowerCase()

          return (
            <Link
              key={team.id}
              href={`/teams/${team.slug}`}
              className={`group relative isolate flex flex-col justify-end overflow-hidden bg-nacht text-white shadow-md transition-shadow hover:shadow-2xl ${hoehe}`}
            >
              {foto ? (
                <>
                  <Bild
                    bild={team.teamfoto}
                    groesse="card"
                    className="absolute inset-0 h-full w-full object-cover opacity-55 transition-all duration-300 group-hover:scale-105 group-hover:opacity-70"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20rem"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-nacht-tief via-nacht-tief/55 to-transparent" />
                </>
              ) : (
                <div className="eisglanz absolute inset-0 opacity-70" />
              )}

              <div className="relative p-4">
                {alter && (
                  <span className="mb-1.5 block font-display text-xs tracking-[0.18em] text-rot uppercase">
                    {alter}
                  </span>
                )}
                <span className="block font-display text-xl leading-[0.95] tracking-wide uppercase sm:text-2xl">
                  {team.name}
                </span>
                {ligaZeigen && <span className="mt-1 block text-xs text-white/60">{team.liga}</span>}
              </div>

              <span className="absolute right-0 bottom-0 h-1 w-full origin-left scale-x-0 bg-rot transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}

/**
 * Der Weg vom Interesse zum ersten Training – in drei Schritten, mit Ort,
 * Zeiten und einer Adresse, an die man schreiben kann.
 */
export function SoGehtLos({
  einstellungen,
  hockeyschule,
}: {
  einstellungen: Einstellungen
  hockeyschule?: Team
}) {
  const zeiten = hockeyschule?.trainingszeiten ?? []
  const email = einstellungen.email ?? 'hockeyschule@rot-blau.ch'

  const schritte = [
    {
      nummer: '1',
      titel: 'Melde dich',
      text: 'Eine kurze Nachricht genügt – wir sagen dir, wann das nächste Training passt.',
    },
    {
      nummer: '2',
      titel: 'Komm vorbei',
      text: 'Schlittschuhe, Handschuhe und Helm reichen für den Anfang. Ausrüstung haben wir zum Ausleihen.',
    },
    {
      nummer: '3',
      titel: 'Probier es aus',
      text: 'Die ersten Trainings sind kostenlos und unverbindlich. Erst danach entscheidest du.',
    },
  ]

  return (
    <section className="relative isolate overflow-hidden bg-nacht text-white">
      <div className="eisglanz absolute inset-0 opacity-60" />

      <div className="inhalt relative grid gap-10 py-14 sm:py-16 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <div>
          <h2 className="abschnittstitel text-4xl sm:text-5xl">So fängst du an</h2>
          <p className="mt-3 max-w-xl text-lg text-white/75">
            Noch nie auf dem Eis gestanden? Kein Problem. Bei uns beginnen Kinder und Erwachsene
            ohne Vorkenntnisse.
          </p>

          <ol className="mt-8 space-y-5">
            {schritte.map((schritt) => (
              <li key={schritt.nummer} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-rot font-display text-2xl leading-none">
                  {schritt.nummer}
                </span>
                <div>
                  <p className="font-display text-xl tracking-wide uppercase">{schritt.titel}</p>
                  <p className="mt-1 text-white/70">{schritt.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href={`mailto:${email}?subject=Schnuppertraining`}
              className="bg-rot px-7 py-3.5 font-display text-lg tracking-wide uppercase transition-colors hover:bg-rot-dunkel"
            >
              Schnuppertraining anfragen
            </a>
            <Link
              href="/verein"
              className="border-2 border-white/40 px-7 py-3.5 font-display text-lg tracking-wide uppercase transition-colors hover:border-white hover:bg-white hover:text-nacht"
            >
              Mitglied werden
            </Link>
          </div>
        </div>

        {/* Ort und Zeiten – die zwei Fragen, die sofort danach kommen. */}
        <div className="bg-white/6 p-6 backdrop-blur-sm sm:p-8">
          <h3 className="font-display text-2xl tracking-wide uppercase">Wo wir spielen</h3>
          <p className="mt-2 text-white/75">
            Kunsteisbahn Weyermannshaus
            <span className="block text-white/50">Bern-Bümpliz</span>
          </p>

          {zeiten.length > 0 && (
            <>
              <div className="trikotband-schmal my-6" />
              <h3 className="font-display text-2xl tracking-wide uppercase">
                Training Hockeyschule
              </h3>
              <ul className="mt-3 space-y-2">
                {zeiten.map((zeit, index) => (
                  <li
                    key={zeit.id ?? index}
                    className="flex flex-wrap items-baseline justify-between gap-x-3 border-b border-white/10 pb-2 last:border-0"
                  >
                    <span className="font-display text-lg tracking-wide uppercase">{zeit.tag}</span>
                    <span className="tabular-nums text-white/75">{zeit.zeit}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="trikotband-schmal my-6" />
          <h3 className="font-display text-2xl tracking-wide uppercase">Fragen?</h3>
          <a
            href={`mailto:${email}`}
            className="mt-2 block break-all text-white/75 underline decoration-rot decoration-2 underline-offset-4 hover:text-white"
          >
            {email}
          </a>
          {einstellungen.telefon && (
            <p className="mt-1 text-white/75">{einstellungen.telefon}</p>
          )}
        </div>
      </div>

      <div className="trikotband" />
    </section>
  )
}
