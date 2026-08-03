import type { Metadata } from 'next'

import { Bild } from '../../../components/Bild'
import { Fliesstext } from '../../../components/Fliesstext'
import { Seitenkopf } from '../../../components/Seitenkopf'
import { holeGlobal, holeStimmungsbild } from '../../../lib/daten'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Eishockey',
  description: 'Regeln, Sommertraining, Shootingtraining und Goalie-Training beim EHC Rot-Blau.',
}

export default async function EishockeySeite() {
  const [inhalt, kopfbild] = await Promise.all([holeGlobal('eishockey'), holeStimmungsbild()])
  const angebote = inhalt.angebote ?? []

  return (
    <>
      <Seitenkopf
        titel="Eishockey"
        untertitel={inhalt.einleitung ?? 'Regeln, Trainings und alles, was das Spiel ausmacht.'}
        hintergrundbild={kopfbild}
      />

      <div className="inhalt grid gap-10 py-14 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-8">
          {inhalt.regeln && (
            <section className="bg-white p-6 shadow-sm sm:p-8">
              <h2 className="abschnittstitel mb-4 text-4xl text-nacht sm:text-6xl">
                Die Regeln in Kürze
              </h2>
              <Fliesstext daten={inhalt.regeln} />
              {inhalt.regelwerkLink && (
                <a
                  href={inhalt.regelwerkLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 bg-blau px-5 py-3 font-display text-sm tracking-wide text-white uppercase hover:bg-blau-dunkel"
                >
                  Offizielles Regelbuch
                  <span aria-hidden="true">↗</span>
                </a>
              )}
            </section>
          )}

          {angebote.length > 0 && (
            <section>
              <h2 className="abschnittstitel mb-5 text-4xl text-nacht sm:text-6xl">
                Trainingsangebote
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {angebote.map((angebot, index) => (
                  <article
                    key={angebot.id ?? index}
                    className="flex flex-col overflow-hidden bg-white shadow-sm"
                  >
                    {angebot.bild && (
                      <Bild
                        bild={angebot.bild}
                        groesse="card"
                        className="aspect-[3/2] w-full object-cover"
                        sizes="(max-width: 640px) 100vw, 24rem"
                      />
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="mb-2 text-xl text-nacht">{angebot.titel}</h3>
                      {angebot.beschreibung && (
                        <p className="mb-4 flex-1 text-sm leading-relaxed text-grau">
                          {angebot.beschreibung}
                        </p>
                      )}
                      <dl className="space-y-1 text-sm">
                        {angebot.termine && (
                          <div className="flex gap-2">
                            <dt className="font-semibold text-nacht">Termine:</dt>
                            <dd className="text-grau">{angebot.termine}</dd>
                          </div>
                        )}
                        {angebot.ort && (
                          <div className="flex gap-2">
                            <dt className="font-semibold text-nacht">Ort:</dt>
                            <dd className="text-grau">{angebot.ort}</dd>
                          </div>
                        )}
                        {angebot.kontakt && (
                          <div className="flex gap-2">
                            <dt className="font-semibold text-nacht">Kontakt:</dt>
                            <dd className="text-grau">{angebot.kontakt}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {!inhalt.regeln && angebote.length === 0 && (
            <p className="bg-white p-8 text-grau shadow-sm">
              Die Inhalte dieser Seite werden im Redaktionsbereich unter «Seite Eishockey» erfasst.
            </p>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="bg-blau p-6 text-white shadow-sm">
            <h2 className="mb-3 text-xl">Neu beim Eishockey?</h2>
            <p className="text-sm text-white/85">
              Bei uns starten Kinder und Erwachsene ohne Vorkenntnisse. Schlittschuhe und Stock
              genügen für den Anfang – die Schutzausrüstung besprechen wir gemeinsam.
            </p>
            <a
              href="/verein"
              className="mt-5 inline-block bg-rot px-5 py-2.5 font-display text-sm tracking-wide uppercase hover:bg-rot-dunkel"
            >
              Schnuppertraining
            </a>
          </div>
        </aside>
      </div>
    </>
  )
}
