import type { Metadata } from 'next'

import { Bild } from '../../../components/Bild'
import { holeGlobal } from '../../../lib/daten'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Vorstand',
  description: 'Der Vorstand des EHC Rot-Blau Bern-Bümpliz und seine Ansprechpersonen.',
}

export default async function VorstandSeite() {
  const verein = await holeGlobal('verein')
  const vorstand = verein.vorstand ?? []

  return (
    <>
      <h1 className="sr-only">Vorstand</h1>

      <div className="inhalt py-14">
        <h2 className="abschnittstitel mb-5 text-4xl text-nacht sm:text-6xl">Vorstand</h2>

        {vorstand.length === 0 ? (
          <p className="kachel bg-white p-8 text-grau shadow-sm">
            Der Vorstand wird im Redaktionsbereich unter «Seite Verein» erfasst.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vorstand.map((person, index) => (
              <article
                key={person.id ?? index}
                className="kachel flex items-center gap-4 bg-white p-5 shadow-sm"
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
        )}
      </div>
    </>
  )
}
