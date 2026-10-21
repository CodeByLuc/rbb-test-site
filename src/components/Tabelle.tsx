import type { TabellenZeile } from '../lib/sihf'

/**
 * Tabelle der Gruppe. Punkte nach dem Reglement von Swiss Ice Hockey: Sieg 3,
 * Sieg nach Verlängerung 2, Niederlage nach Verlängerung 1, Niederlage 0.
 *
 * Spalten sind ausgeschrieben (Spiele, Siege, Niederlagen), damit niemand
 * Kürzel entziffern muss. Siege und Niederlagen zählen die Verlängerung mit.
 */
export function Tabelle({
  zeilen,
  eigenerName,
  titel = 'Tabelle',
  tabellenUrl,
}: {
  zeilen: TabellenZeile[]
  eigenerName: string
  titel?: string
  tabellenUrl?: string | null
}) {
  if (zeilen.length === 0) return null

  const istEigenes = (name: string) => name.toLowerCase().includes(eigenerName.toLowerCase())
  const kopf = 'px-2 py-3 text-center font-normal'
  const zahl = 'px-2 py-3.5 text-center text-base tabular-nums text-white/75'

  return (
    <section className="kachel overflow-hidden bg-nacht text-white shadow-xl">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 bg-nacht-tief px-5 py-4">
        <h2 className="text-2xl">{titel}</h2>
        <span className="text-xs text-white/50">Stand nach den letzten Spielen</span>
      </div>
      <div className="trikotband-schmal" />

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-white/6 font-display text-sm tracking-wider text-white/60 uppercase">
            <th scope="col" className={`${kopf} w-12 pl-5`} title="Rang">
              #
            </th>
            <th scope="col" className="px-2 py-3 font-normal">
              Team
            </th>
            <th scope="col" className={kopf}>
              Spiele
            </th>
            <th scope="col" className={kopf}>
              Siege
            </th>
            <th scope="col" className={kopf}>
              Niederl.
            </th>
            <th scope="col" className={kopf}>
              Tore
            </th>
            <th scope="col" className={kopf}>
              Diff.
            </th>
            <th scope="col" className={`${kopf} pr-5`}>
              Punkte
            </th>
          </tr>
        </thead>
        <tbody>
          {zeilen.map((zeile) => {
            const eigen = istEigenes(zeile.name)
            return (
              <tr
                key={zeile.name}
                className={`border-b border-white/8 last:border-0 ${
                  eigen ? 'bg-rot/22' : 'hover:bg-white/5'
                }`}
              >
                <td className="py-3.5 pr-2 pl-5 text-center">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center font-display text-base font-extrabold ${
                      eigen ? 'bg-rot text-white' : 'text-white/60'
                    }`}
                  >
                    {zeile.rang}
                  </span>
                </td>
                <td
                  className={`px-2 py-3.5 font-display text-lg leading-tight tracking-wide uppercase ${
                    eigen ? 'text-white' : 'text-white/85'
                  }`}
                >
                  {zeile.name}
                </td>
                <td className={zahl}>{zeile.spiele}</td>
                <td className={zahl}>{zeile.siege + zeile.siegeVerlaengerung}</td>
                <td className={zahl}>{zeile.niederlagen + zeile.niederlagenVerlaengerung}</td>
                <td className={`${zahl} whitespace-nowrap`}>
                  {zeile.tore}:{zeile.gegentore}
                </td>
                <td className={zahl}>
                  {zeile.differenz > 0 ? `+${zeile.differenz}` : zeile.differenz}
                </td>
                <td
                  className={`py-3.5 pr-5 pl-2 text-center font-display text-2xl font-extrabold tabular-nums ${
                    eigen ? 'text-rot' : 'text-white'
                  }`}
                >
                  {zeile.punkte}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-3">
        <p className="text-xs text-white/50">
          Punkte: Sieg 3, Sieg nach Verlängerung 2, Niederlage nach Verlängerung 1.
        </p>
        {tabellenUrl && (
          <a
            href={tabellenUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-xs tracking-widest text-white/60 uppercase hover:text-rot"
          >
            Offizielle Tabelle ↗
          </a>
        )}
      </div>
    </section>
  )
}
