import type { TabellenZeile } from '../lib/sihf'

/**
 * Tabelle der Gruppe. Die Werte werden aus den Resultaten von Swiss Ice Hockey
 * berechnet: Sieg 3 Punkte, Sieg nach Verlängerung 2, Niederlage nach
 * Verlängerung 1, Niederlage 0.
 *
 * Auf schmalen Bildschirmen bleiben nur Rang, Team, Spiele, Differenz und Punkte
 * sichtbar – so muss niemand seitlich scrollen.
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
  const nurBreit = 'hidden sm:table-cell'

  return (
    <section className="overflow-hidden bg-nacht text-white shadow-xl">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 bg-nacht-tief px-4 py-3">
        <h2 className="text-xl sm:text-2xl">{titel}</h2>
        <span className="font-display text-xs tracking-widest text-white/40 uppercase">
          Stand nach den letzten Spielen
        </span>
      </div>
      <div className="trikotband-schmal" />

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-white/6 font-display text-xs tracking-widest text-white/55 uppercase">
            <th scope="col" className="px-2 py-2.5 text-center sm:px-3">
              Rg
            </th>
            <th scope="col" className="px-2 py-2.5 sm:px-3">
              Team
            </th>
            <th scope="col" className="px-2 py-2.5 text-center" title="Spiele">
              Sp
            </th>
            <th scope="col" className={`${nurBreit} px-2 py-2.5 text-center`} title="Siege">
              S
            </th>
            <th
              scope="col"
              className={`${nurBreit} px-2 py-2.5 text-center`}
              title="Siege nach Verlängerung oder Penaltyschiessen"
            >
              SV
            </th>
            <th
              scope="col"
              className={`${nurBreit} px-2 py-2.5 text-center`}
              title="Niederlagen nach Verlängerung oder Penaltyschiessen"
            >
              NV
            </th>
            <th scope="col" className={`${nurBreit} px-2 py-2.5 text-center`} title="Niederlagen">
              N
            </th>
            <th scope="col" className={`${nurBreit} px-3 py-2.5 text-center`} title="Tore">
              Tore
            </th>
            <th scope="col" className="px-2 py-2.5 text-center" title="Tordifferenz">
              Diff
            </th>
            <th scope="col" className="px-2 py-2.5 text-center sm:px-3" title="Punkte">
              Pkt
            </th>
          </tr>
        </thead>
        <tbody>
          {zeilen.map((zeile) => {
            const eigen = istEigenes(zeile.name)
            const zahl = 'px-2 py-2.5 text-center text-sm tabular-nums text-white/70'
            return (
              <tr
                key={zeile.name}
                className={`border-b border-white/8 last:border-0 ${
                  eigen ? 'bg-rot/22' : 'hover:bg-white/5'
                }`}
              >
                <td className="px-2 py-2.5 text-center sm:px-3">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center font-display text-sm font-extrabold ${
                      eigen ? 'bg-rot text-white' : 'text-white/55'
                    }`}
                  >
                    {zeile.rang}
                  </span>
                </td>
                <td
                  className={`px-2 py-2.5 font-display text-base leading-tight tracking-wide uppercase sm:px-3 sm:text-lg ${
                    eigen ? 'text-white' : 'text-white/80'
                  }`}
                >
                  {zeile.name}
                </td>
                <td className={zahl}>{zeile.spiele}</td>
                <td className={`${nurBreit} ${zahl}`}>{zeile.siege}</td>
                <td className={`${nurBreit} ${zahl}`}>{zeile.siegeVerlaengerung}</td>
                <td className={`${nurBreit} ${zahl}`}>{zeile.niederlagenVerlaengerung}</td>
                <td className={`${nurBreit} ${zahl}`}>{zeile.niederlagen}</td>
                <td className={`${nurBreit} ${zahl} whitespace-nowrap px-3`}>
                  {zeile.tore}:{zeile.gegentore}
                </td>
                <td className={zahl}>
                  {zeile.differenz > 0 ? `+${zeile.differenz}` : zeile.differenz}
                </td>
                <td
                  className={`px-2 py-2.5 text-center font-display text-lg font-extrabold tabular-nums sm:px-3 ${
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

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
        <p className="text-xs text-white/40">
          Aus den Resultaten von Swiss Ice Hockey berechnet. Sieg 3, Sieg n.V. 2, Niederlage n.V. 1.
        </p>
        {tabellenUrl && (
          <a
            href={tabellenUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-xs tracking-widest text-white/50 uppercase hover:text-rot"
          >
            Offizielle Tabelle ↗
          </a>
        )}
      </div>
    </section>
  )
}
