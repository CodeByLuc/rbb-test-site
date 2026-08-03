import type { Metadata } from 'next'

import { Bild } from '../../../components/Bild'
import { Fliesstext } from '../../../components/Fliesstext'
import { Seitenkopf } from '../../../components/Seitenkopf'
import { holeGlobal, holeStimmungsbild } from '../../../lib/daten'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Verein',
  description: 'Geschichte, Vorstand und Mitgliedschaft beim EHC Rot-Blau Bern-Bümpliz.',
}

export default async function VereinSeite() {
  const [verein, kopfbild] = await Promise.all([holeGlobal('verein'), holeStimmungsbild()])
  const vorstand = verein.vorstand ?? []
  const bilder = verein.historischeBilder ?? []

  const dokument = (wert: unknown) =>
    wert && typeof wert === 'object' && 'url' in wert
      ? (wert as { url?: string | null; titel?: string | null })
      : null

  const anmeldeformular = dokument(verein.anmeldeformular)
  const statuten = dokument(verein.statuten)

  return (
    <>
      <Seitenkopf
        titel="Verein"
        untertitel={
          verein.gruendungsjahr
            ? `Eishockey in Bern-Bümpliz seit ${verein.gruendungsjahr}.`
            : 'Wer wir sind und wofür wir stehen.'
        }
        hintergrundbild={kopfbild}
      />

      <div className="inhalt space-y-14 py-14">
        {verein.geschichte && (
          <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <div className="bg-white p-6 shadow-sm sm:p-8">
              <h2 className="abschnittstitel mb-4 text-4xl text-nacht sm:text-6xl">Unsere Geschichte</h2>
              <Fliesstext daten={verein.geschichte} />
            </div>

            {bilder.length > 0 && (
              <div className="space-y-4">
                {bilder.map((eintrag, index) => (
                  <figure key={eintrag.id ?? index} className="overflow-hidden bg-white shadow-sm">
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
          <section className="bg-white p-6 shadow-sm sm:p-8">
            <h2 className="abschnittstitel mb-4 text-4xl text-nacht sm:text-6xl">Der Verein heute</h2>
            <Fliesstext daten={verein.aktuell} />
          </section>
        )}

        {vorstand.length > 0 && (
          <section>
            <h2 className="abschnittstitel mb-5 text-4xl text-nacht sm:text-6xl">Vorstand</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vorstand.map((person, index) => (
                <article
                  key={person.id ?? index}
                  className="flex items-center gap-4 bg-white p-5 shadow-sm"
                >
                  <Bild
                    bild={person.foto}
                    groesse="thumbnail"
                    className="h-20 w-20 shrink-0 rounded-full object-cover"
                    sizes="80px"
                  />
                  <div className="min-w-0">
                    <p className="font-display text-lg text-nacht uppercase">{person.name}</p>
                    <p className="text-sm text-rot">{person.funktion}</p>
                    {person.email && (
                      <a
                        href={`mailto:${person.email}`}
                        className="block truncate text-xs text-grau hover:text-rot-dunkel hover:underline"
                      >
                        {person.email}
                      </a>
                    )}
                    {person.telefon && <p className="text-xs text-grau">{person.telefon}</p>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {(verein.mitgliedschaft || anmeldeformular || statuten) && (
          <section className="bg-blau p-6 text-white shadow-sm sm:p-8">
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
                  className="bg-rot px-5 py-3 font-display text-sm tracking-wide uppercase hover:bg-rot-dunkel"
                >
                  Anmeldeformular
                </a>
              )}
              {statuten?.url && (
                <a
                  href={statuten.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-white/40 px-5 py-3 font-display text-sm tracking-wide uppercase hover:border-white hover:bg-white/10"
                >
                  Statuten
                </a>
              )}
            </div>
          </section>
        )}

        {!verein.geschichte && !verein.aktuell && vorstand.length === 0 && (
          <p className="bg-white p-8 text-grau shadow-sm">
            Die Inhalte dieser Seite werden im Redaktionsbereich unter «Seite Verein» erfasst.
          </p>
        )}
      </div>
    </>
  )
}
