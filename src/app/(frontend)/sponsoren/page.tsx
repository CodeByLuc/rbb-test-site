import type { Metadata } from 'next'

import { Fliesstext } from '../../../components/Fliesstext'
import { Seitenkopf } from '../../../components/Seitenkopf'
import { SponsorenListe } from '../../../components/SponsorenWidget'
import { holeEinstellungen, holeSponsoren, holeStimmungsbild } from '../../../lib/daten'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Sponsoren',
  description:
    'Partner und Gönner des EHC Rot-Blau Bern-Bümpliz sowie Informationen zum Sponsoring.',
}

export default async function SponsorenSeite() {
  const [sponsoren, einstellungen, kopfbild] = await Promise.all([
    holeSponsoren(),
    holeEinstellungen(),
    holeStimmungsbild(),
  ])

  const blatt =
    einstellungen.sponsoringBlatt && typeof einstellungen.sponsoringBlatt === 'object'
      ? einstellungen.sponsoringBlatt
      : null

  return (
    <>
      <Seitenkopf
        titel="Sponsoren"
        untertitel="Ohne unsere Partner gäbe es kein Eishockey in Bümpliz. Herzlichen Dank."
        hintergrundbild={kopfbild}
      />

      <div className="inhalt grid gap-10 py-14 lg:grid-cols-[2fr_1fr]">
        <div>
          <SponsorenListe sponsoren={sponsoren} />
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="bg-white p-6 shadow-sm">
            <h2 className="abschnittstitel mb-4 text-3xl text-nacht">Sponsor werden</h2>

            {einstellungen.sponsoringText ? (
              <Fliesstext daten={einstellungen.sponsoringText} />
            ) : (
              <p className="text-sm leading-relaxed text-grau">
                Als Partner erreichen Sie über 200 Aktive und ihre Familien im Westen von Bern – auf
                dem Eis, auf der Website und auf unseren Kanälen. Wir stellen gerne ein Paket
                zusammen, das zu Ihnen passt.
              </p>
            )}

            <div className="mt-6 space-y-3">
              {blatt?.url && (
                <a
                  href={blatt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-rot px-5 py-3 text-center font-display text-sm tracking-wide text-white uppercase hover:bg-rot-dunkel"
                >
                  {blatt.titel ?? 'Sponsoring-Unterlagen'} herunterladen
                </a>
              )}

              {einstellungen.email && (
                <a
                  href={`mailto:${einstellungen.email}?subject=Sponsoring%20EHC%20Rot-Blau`}
                  className="block border-2 border-blau px-5 py-3 text-center font-display text-sm tracking-wide text-nacht uppercase hover:bg-blau hover:text-white"
                >
                  Anfrage per E-Mail
                </a>
              )}
            </div>

            {einstellungen.sponsoringKontakt && (
              <p className="mt-5 text-sm text-grau">
                <span className="font-semibold text-nacht">Kontakt:</span>{' '}
                {einstellungen.sponsoringKontakt}
              </p>
            )}
          </div>
        </aside>
      </div>
    </>
  )
}
