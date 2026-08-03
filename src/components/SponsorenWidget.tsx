import Link from 'next/link'

import type { Sponsoren } from '../payload-types'
import { bildDaten } from './Bild'

const kategorieTitel: Record<string, string> = {
  hauptsponsor: 'Hauptsponsoren',
  sponsor: 'Sponsoren',
  goenner: 'Gönner',
}

function SponsorKachel({ sponsor, gross }: { sponsor: Sponsoren; gross?: boolean }) {
  // Original statt Zuschnitt-Variante, sonst werden Sponsorenlogos beschnitten.
  const logo = bildDaten(sponsor.logo)

  const inhalt = (
    <div
      className={`flex h-full items-center justify-center border-b-3 border-transparent bg-white p-4 transition-all group-hover/kachel:border-rot group-hover/kachel:shadow-lg ${
        gross ? 'min-h-24' : 'min-h-18'
      }`}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo.url}
          alt={sponsor.name}
          className={`w-auto object-contain ${gross ? 'max-h-16' : 'max-h-11'}`}
          loading="lazy"
        />
      ) : (
        <span
          className={`text-center font-display leading-tight text-nacht uppercase ${
            gross ? 'text-lg' : 'text-sm'
          }`}
        >
          {sponsor.name}
        </span>
      )}
    </div>
  )

  if (!sponsor.website) return <div className="group/kachel h-full">{inhalt}</div>

  return (
    <a
      href={sponsor.website}
      target="_blank"
      rel="noopener noreferrer"
      title={`${sponsor.name} – Website öffnen`}
      className="group/kachel block h-full"
    >
      {inhalt}
    </a>
  )
}

/** Kompakte Kachel-Anordnung für die Startseite. */
export function SponsorenWidget({ sponsoren }: { sponsoren: Sponsoren[] }) {
  if (sponsoren.length === 0) return null

  const haupt = sponsoren.filter((s) => s.kategorie === 'hauptsponsor')
  const weitere = sponsoren.filter((s) => s.kategorie !== 'hauptsponsor').slice(0, 9)

  return (
    <div className="bg-nacht text-white shadow-xl">
      <div className="px-5 pt-5">
        <h2 className="abschnittstitel text-2xl">Unsere Partner</h2>
        <p className="mt-1 mb-4 text-sm text-white/60">Sie machen Eishockey in Bümpliz möglich.</p>
      </div>

      <div className="space-y-px bg-white/10 p-px">
        {haupt.length > 0 && (
          <div className="grid grid-cols-1 gap-px sm:grid-cols-2">
            {haupt.map((sponsor) => (
              <SponsorKachel key={sponsor.id} sponsor={sponsor} gross />
            ))}
          </div>
        )}
        {weitere.length > 0 && (
          <div className="grid grid-cols-3 gap-px">
            {weitere.map((sponsor) => (
              <SponsorKachel key={sponsor.id} sponsor={sponsor} />
            ))}
          </div>
        )}
      </div>

      <div className="p-5">
        <Link
          href="/sponsoren"
          className="block bg-rot px-4 py-3 text-center font-display text-base tracking-widest uppercase transition-colors hover:bg-rot-dunkel"
        >
          Sponsor werden
        </Link>
      </div>
    </div>
  )
}

/** Vollständige Auflistung nach Kategorie für die Sponsorenseite. */
export function SponsorenListe({ sponsoren }: { sponsoren: Sponsoren[] }) {
  const gruppen = (['hauptsponsor', 'sponsor', 'goenner'] as const)
    .map((kategorie) => ({
      kategorie,
      titel: kategorieTitel[kategorie],
      eintraege: sponsoren.filter((s) => s.kategorie === kategorie),
    }))
    .filter((gruppe) => gruppe.eintraege.length > 0)

  if (gruppen.length === 0) {
    return <p className="text-grau">Die Sponsoren werden bald hier erscheinen.</p>
  }

  return (
    <div className="space-y-10">
      {gruppen.map((gruppe) => (
        <section key={gruppe.kategorie}>
          <h2 className="abschnittstitel mb-4 text-3xl text-nacht">{gruppe.titel}</h2>
          <div
            className={`grid gap-px bg-linie p-px ${
              gruppe.kategorie === 'hauptsponsor'
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
            }`}
          >
            {gruppe.eintraege.map((sponsor) => (
              <SponsorKachel
                key={sponsor.id}
                sponsor={sponsor}
                gross={gruppe.kategorie === 'hauptsponsor'}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
