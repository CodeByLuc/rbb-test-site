'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { WappenSvg } from './Logo'

export type NavTeam = { name: string; slug: string; liga?: string | null }

type HeaderProps = {
  logoUrl?: string | null
  teams: NavTeam[]
}

const hauptNavigation = [
  { titel: 'News', pfad: '/news' },
  { titel: 'Teams', pfad: '/teams' },
  { titel: 'Eishockey', pfad: '/eishockey' },
  { titel: 'Verein', pfad: '/verein' },
  { titel: 'Sponsoren', pfad: '/sponsoren' },
]

export function Header({ logoUrl, teams }: HeaderProps) {
  const [menuOffen, setMenuOffen] = useState(false)
  const pfad = usePathname()

  const istAktiv = (ziel: string) => pfad === ziel || pfad.startsWith(`${ziel}/`)
  const schliessen = () => setMenuOffen(false)

  return (
    <header className="sticky top-0 z-50 bg-nacht text-white shadow-lg shadow-nacht/20">
      <div className="inhalt flex items-stretch justify-between gap-4">
        {/* Das Wappen trägt den Vereinsnamen bereits – daneben keine Wiederholung. */}
        <Link
          href="/"
          onClick={schliessen}
          className="flex items-center py-2"
          aria-label="EHC Rot-Blau Bern-Bümpliz – Startseite"
        >
          {/*
            max-w-none ist nötig: Tailwind setzt img{max-width:100%}, das sich hier
            auf den Link bezieht, dessen Breite wiederum vom Bild abhängt. Der
            Browser löst diesen Zirkel mit Breite 0 auf – das Logo verschwindet.
          */}
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="EHC Rot-Blau Bern-Bümpliz"
              className="h-16 w-auto max-w-none shrink-0 sm:h-20"
            />
          ) : (
            <WappenSvg className="h-16 w-auto max-w-none shrink-0 sm:h-20" />
          )}
        </Link>

        <nav className="hidden items-stretch lg:flex" aria-label="Hauptnavigation">
          {hauptNavigation.map((eintrag) => {
            const aktiv = istAktiv(eintrag.pfad)
            return (
              <div key={eintrag.pfad} className="group relative flex items-stretch">
                <Link
                  href={eintrag.pfad}
                  className={`relative flex items-center px-4 font-display text-lg tracking-wide uppercase transition-colors xl:px-5 xl:text-xl ${
                    aktiv ? 'text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {eintrag.titel}
                  <span
                    className={`absolute inset-x-2 bottom-0 h-1 bg-rot transition-transform duration-200 ${
                      aktiv ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  />
                </Link>

                {eintrag.pfad === '/teams' && teams.length > 0 && (
                  <div className="invisible absolute top-full left-0 w-72 translate-y-1 border-t-4 border-rot bg-nacht-tief opacity-0 shadow-2xl transition-all group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    {teams.map((team) => (
                      <Link
                        key={team.slug}
                        href={`/teams/${team.slug}`}
                        className="flex items-baseline justify-between gap-3 border-b border-white/8 px-4 py-2.5 last:border-0 hover:bg-rot"
                      >
                        <span className="font-display text-base tracking-wide uppercase">
                          {team.name}
                        </span>
                        {team.liga && (
                          <span className="text-xs text-white/50">{team.liga}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOffen((offen) => !offen)}
          className="my-2 flex items-center gap-2 bg-rot px-4 font-display text-base tracking-wider uppercase lg:hidden"
          aria-expanded={menuOffen}
          aria-controls="mobiles-menu"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            {menuOffen ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
          {menuOffen ? 'Zu' : 'Menü'}
        </button>
      </div>

      <div className="trikotband" />

      {menuOffen && (
        <nav
          id="mobiles-menu"
          className="bg-nacht-tief lg:hidden"
          aria-label="Hauptnavigation"
        >
          <div className="inhalt flex flex-col py-2">
            {hauptNavigation.map((eintrag) => (
              <div key={eintrag.pfad} className="border-b border-white/10 last:border-0">
                <Link
                  href={eintrag.pfad}
                  onClick={schliessen}
                  className={`block py-3.5 font-display text-2xl uppercase ${
                    istAktiv(eintrag.pfad) ? 'text-rot' : 'text-white'
                  }`}
                >
                  {eintrag.titel}
                </Link>
                {eintrag.pfad === '/teams' && (
                  <div className="mb-3 grid grid-cols-2 gap-x-4">
                    {teams.map((team) => (
                      <Link
                        key={team.slug}
                        href={`/teams/${team.slug}`}
                        onClick={schliessen}
                        className="border-l-2 border-rot/50 py-1.5 pl-3 font-display text-base tracking-wide text-white/70 uppercase"
                      >
                        {team.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
