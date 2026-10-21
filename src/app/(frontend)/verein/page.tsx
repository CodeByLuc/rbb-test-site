import type { Metadata } from 'next'

import { Bild } from '../../../components/Bild'
import { Fliesstext } from '../../../components/Fliesstext'
import { holeGlobal } from '../../../lib/daten'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Verein',
  description: 'Geschichte und Mitgliedschaft beim EHC Rot-Blau Bern-Bümpliz.',
}

export default async function VereinSeite() {
  const verein = await holeGlobal('verein')
  const bilder = verein.historischeBilder ?? []

  const dokument = (wert: unknown) =>
    wert && typeof wert === 'object' && 'url' in wert
      ? (wert as { url?: string | null; titel?: string | null })
      : null

  const anmeldeformular = dokument(verein.anmeldeformular)
  const statuten = dokument(verein.statuten)

  return (
    <>
      <h1 className="sr-only">Verein</h1>

      <div className="inhalt space-y-14 py-14">
        {verein.geschichte && (
          <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <div className="kachel bg-white p-6 shadow-sm sm:p-8">
              <h2 className="abschnittstitel mb-4 text-4xl text-nacht sm:text-6xl">Unsere Geschichte</h2>
              <Fliesstext daten={verein.geschichte} />
            </div>

            {bilder.length > 0 && (
              <div className="space-y-4">
                {bilder.map((eintrag, index) => (
                  <figure key={eintrag.id ?? index} className="kachel overflow-hidden bg-white shadow-sm">
                    <Bild
                      bild={eintrag.bild}
                      groesse="card"
                      className="aspect-[3/2] w-full object-cover"
                      sizes="(max-width: 1024px) 100vw, 20rem"
                    />
                    {eintrag.legende && (
                      <figcaption className="p-3 text-xs text-grau">{eintrag.legende}</figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}
          </section>
        )}

        {verein.aktuell && (
          <section className="kachel bg-white p-6 shadow-sm sm:p-8">
            <h2 className="abschnittstitel mb-4 text-4xl text-nacht sm:text-6xl">Der Verein heute</h2>
            <Fliesstext daten={verein.aktuell} />
          </section>
        )}

        {(verein.mitgliedschaft || anmeldeformular || statuten) && (
          <section className="kachel bg-blau p-6 text-white shadow-sm sm:p-8">
            <h2 className="abschnittstitel mb-4 text-4xl sm:text-6xl">Mitglied werden</h2>
            {verein.mitgliedschaft && (
              <div className="fliesstext text-white/90 [&_a]:text-white [&_h2]:text-white [&_h3]:text-white">
                <Fliesstext daten={verein.mitgliedschaft} />
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              {anmeldeformular?.url && (
                <a
                  href={anmeldeformular.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="knopf bg-rot px-5 py-3 font-display text-sm tracking-wide uppercase hover:bg-rot-dunkel"
                >
                  Anmeldeformular
                </a>
              )}
              {statuten?.url && (
                <a
                  href={statuten.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="knopf border border-white/40 px-5 py-3 font-display text-sm tracking-wide uppercase hover:border-white hover:bg-white/10"
                >
                  Statuten
                </a>
              )}
            </div>
          </section>
        )}

        {!verein.geschichte && !verein.aktuell && (
          <p className="kachel bg-white p-8 text-grau shadow-sm">
            Die Inhalte dieser Seite werden im Redaktionsbereich unter «Seite Verein» erfasst.
          </p>
        )}
      </div>
    </>
  )
}
