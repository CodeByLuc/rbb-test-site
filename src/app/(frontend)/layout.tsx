import type { Metadata } from 'next'
import { Barlow_Condensed, Source_Sans_3 } from 'next/font/google'
import React from 'react'

import { bildDaten } from '../../components/Bild'
import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { holeEinstellungen, holeTeams } from '../../lib/daten'
import './styles.css'

// Kantige Trikotschrift für Titel, ruhige Schrift für Fliesstext.
const display = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--schrift-display',
  display: 'swap',
})

const text = Source_Sans_3({
  subsets: ['latin'],
  variable: '--schrift-text',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'EHC Rot-Blau Bern-Bümpliz',
    template: '%s | EHC Rot-Blau Bern-Bümpliz',
  },
  description:
    'Eishockey aus Bern-Bümpliz: News, Teams, Spielpläne und Resultate des EHC Rot-Blau.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [einstellungen, teams] = await Promise.all([holeEinstellungen(), holeTeams()])
  // Das Logo immer im Original – Zuschnitt-Varianten würden es beschneiden.
  const logo = bildDaten(einstellungen.logo)

  return (
    <html lang="de-CH" className={`${display.variable} ${text.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#inhalt"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-100 focus:bg-rot focus:px-4 focus:py-2 focus:font-display focus:uppercase focus:text-white"
        >
          Direkt zum Inhalt
        </a>

        <Header
          logoUrl={logo?.url}
          teams={teams.map((team) => ({
            name: team.name,
            slug: team.slug ?? String(team.id),
            liga: team.liga,
          }))}
        />

        <main id="inhalt" className="flex-1">
          {children}
        </main>

        <Footer einstellungen={einstellungen} />
      </body>
    </html>
  )
}
