import Link from 'next/link'

import type { Einstellungen } from '../payload-types'
import { Logo } from './Logo'

const plattformNamen: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
}

export function Footer({ einstellungen }: { einstellungen: Einstellungen }) {
  const jahr = new Date().getFullYear()

  return (
    <footer className="mt-16 bg-nacht-tief text-white/80">
      <div className="trikotband" />

      <div className="inhalt grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[auto_1fr_1fr_1fr] lg:gap-14">
        <div>
          <Logo logo={einstellungen.logo} className="h-28 w-auto" />
        </div>

        <div>
          <h3 className="abschnittstitel mb-4 text-xl text-white">Kontakt</h3>
          <address className="space-y-1.5 text-sm not-italic">
            {einstellungen.adresse && (
              <p className="whitespace-pre-line">{einstellungen.adresse}</p>
            )}
            {einstellungen.eishalle && <p className="text-white/60">{einstellungen.eishalle}</p>}
            {einstellungen.email && (
              <p>
                <a
                  className="font-semibold hover:text-rot"
                  href={`mailto:${einstellungen.email}`}
                >
                  {einstellungen.email}
                </a>
              </p>
            )}
            {einstellungen.telefon && <p>{einstellungen.telefon}</p>}
          </address>
        </div>

        <div>
          <h3 className="abschnittstitel mb-4 text-xl text-white">Seiten</h3>
          <ul className="space-y-2 font-display text-base tracking-wide uppercase">
            {[
              { titel: 'News', pfad: '/news' },
              { titel: 'Teams', pfad: '/teams' },
              { titel: 'Eishockey', pfad: '/eishockey' },
              { titel: 'Verein', pfad: '/verein' },
              { titel: 'Sponsoren', pfad: '/sponsoren' },
            ].map((eintrag) => (
              <li key={eintrag.pfad}>
                <Link className="hover:text-rot" href={eintrag.pfad}>
                  {eintrag.titel}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="abschnittstitel mb-4 text-xl text-white">Folge uns</h3>
          <ul className="space-y-2 font-display text-base tracking-wide uppercase">
            {(einstellungen.sozialeMedien ?? []).map((profil) => (
              <li key={profil.id ?? profil.url}>
                <a
                  className="hover:text-rot"
                  href={profil.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {plattformNamen[profil.plattform] ?? profil.plattform}
                </a>
              </li>
            ))}
          </ul>
          <Link
            href="/admin"
            className="mt-6 inline-block border-2 border-white/25 px-4 py-2 font-display text-sm tracking-widest uppercase hover:border-rot hover:bg-rot hover:text-white"
          >
            Redaktion
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-white/45">
        © {jahr} {einstellungen.vereinsname} · Spielpläne und Resultate: Swiss Ice Hockey Federation
      </div>
    </footer>
  )
}
