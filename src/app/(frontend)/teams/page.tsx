import type { Metadata } from 'next'
import Link from 'next/link'

import { Bild } from '../../../components/Bild'
import { Seitenkopf } from '../../../components/Seitenkopf'
import { holeTeams } from '../../../lib/daten'
import type { Team } from '../../../payload-types'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Teams',
  description:
    'Alle Mannschaften des EHC Rot-Blau Bern-Bümpliz: Aktive, Nachwuchs und Breitensport.',
}

const kategorien = [
  { wert: 'aktiv', titel: 'Aktive', text: 'Unsere Mannschaften im Meisterschaftsbetrieb.' },
  { wert: 'nachwuchs', titel: 'Nachwuchs', text: 'Von der Hockeyschule bis zu den Junioren.' },
  { wert: 'breitensport', titel: 'Breitensport', text: 'Eishockey aus Freude am Spiel.' },
] as const

function TeamKachel({ team }: { team: Team }) {
  return (
    <Link
      href={`/teams/${team.slug}`}
      className="group relative isolate flex min-h-64 flex-col justify-end overflow-hidden bg-nacht text-white shadow-lg"
    >
      <Bild
        bild={team.teamfoto}
        groesse="card"
        className="absolute inset-0 h-full w-full object-cover opacity-55 transition-all duration-500 group-hover:scale-105 group-hover:opacity-70"
        sizes="(max-width: 640px) 100vw, 33vw"
        ersatz={<div className="eisglanz absolute inset-0 bg-blau-dunkel" />}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-nacht-tief via-nacht-tief/55 to-transparent" />

      <div className="relative p-5">
        {team.liga && (
          <span className="mb-2 inline-block bg-rot px-2 py-0.5 font-display text-xs tracking-[0.18em] uppercase">
            {team.liga}
          </span>
        )}
        <h3 className="text-3xl leading-[0.9]">{team.name}</h3>
        {team.kurzbeschreibung && (
          <p className="mt-2 line-clamp-2 text-sm text-white/70">{team.kurzbeschreibung}</p>
        )}
        <span className="mt-3 inline-block border-b-2 border-rot pb-0.5 font-display text-sm tracking-widest uppercase">
          Zum Team
        </span>
      </div>
    </Link>
  )
}

export default async function TeamsSeite() {
  const teams = await holeTeams()
  const kopfbild = teams.find((team) => team.teamfoto)?.teamfoto

  return (
    <>
      <Seitenkopf
        titel="Teams"
        untertitel="Neun Mannschaften, ein Verein – vom ersten Schritt auf dem Eis bis zur Meisterschaft."
        hintergrundbild={kopfbild}
      />

      <div className="inhalt space-y-12 py-14">
        {teams.length === 0 && (
          <p className="bg-white p-8 text-grau shadow-sm">Es sind noch keine Teams erfasst.</p>
        )}

        {kategorien.map((kategorie) => {
          const gruppe = teams.filter((team) => team.kategorie === kategorie.wert)
          if (gruppe.length === 0) return null

          return (
            <section key={kategorie.wert}>
              <div className="mb-5">
                <h2 className="abschnittstitel text-3xl text-nacht sm:text-4xl">
                  {kategorie.titel}
                </h2>
                <p className="mt-1 pl-[1.1rem] text-sm text-grau">{kategorie.text}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {gruppe.map((team) => (
                  <TeamKachel key={team.id} team={team} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </>
  )
}
