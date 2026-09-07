import type { SihfSpiel, TabellenZeile } from '../lib/sihf'

/**
 * Kurzübersicht eines Teams für schmale Bildschirme.
 *
 * Auf dem Telefon sind eine zehnzeilige Tabelle und ein ganzer Spielplan
 * unlesbar – man scrollt nur. Stattdessen die drei Angaben, die zählen:
 * auf welchem Rang steht das Team, wie ging das letzte Spiel aus, und wann
 * wird das nächste gespielt. Die vollen Ansichten erscheinen ab der
 * Bildschirmbreite, auf der sie auch lesbar sind.
 */

const istEigenes = (name: string, eigenerName: string) =>
  name.toLowerCase().includes(eigenerName.toLowerCase())

/** Resultat und Gegner aus Sicht des eigenen Teams. */
function ausSicht(spiel: SihfSpiel, eigenerName: string) {
  const heim = istEigenes(spiel.heim.name, eigenerName)
  return {
    gegner: heim ? spiel.gast.name : spiel.heim.name,
    heimspiel: heim,
    eigene: heim ? spiel.toreHeim : spiel.toreGast,
    fremde: heim ? spiel.toreGast : spiel.toreHeim,
  }
}

function Zeile({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-white/10 px-4 py-3 last:border-0">
      <p className="mb-1 font-display text-xs tracking-[0.2em] text-white/45 uppercase">{titel}</p>
      {children}
    </div>
  )
}

export function TeamKompakt({
  tabelle,
  letztes,
  naechstes,
  eigenerName,
  liga,
  tabellenUrl,
  className = '',
}: {
  tabelle: TabellenZeile[]
  letztes?: SihfSpiel | null
  naechstes?: SihfSpiel | null
  eigenerName: string
  liga?: string | null
  tabellenUrl?: string | null
  className?: string
}) {
  const eigeneZeile = tabelle.find((z) => istEigenes(z.name, eigenerName))

  // Ohne jede dieser Angaben gäbe es nichts zu zeigen.
  if (!eigeneZeile && !letztes && !naechstes) return null

  return (
    <section className={`kachel overflow-hidden bg-nacht text-white shadow-xl ${className}`}>
      <div className="flex items-center justify-between gap-3 bg-nacht-tief px-4 py-3">
        <h2 className="text-xl">{liga ?? 'Spielbetrieb'}</h2>
        {eigeneZeile && (
          <span className="knopf bg-rot px-2.5 py-1 font-display text-sm tracking-wide uppercase">
            Rang {eigeneZeile.rang} von {tabelle.length}
          </span>
        )}
      </div>
      <div className="trikotband-schmal" />

      {eigeneZeile && (
        <Zeile titel="Punkte">
          <p className="flex items-baseline gap-2">
            <span className="tafelzahl text-3xl text-white">{eigeneZeile.punkte}</span>
            <span className="text-sm text-white/60">
              aus {eigeneZeile.spiele} {eigeneZeile.spiele === 1 ? 'Spiel' : 'Spielen'}
            </span>
          </p>
          <p className="mt-1 text-xs text-white/45">
            {eigeneZeile.siege} Siege · {eigeneZeile.niederlagen} Niederlagen · Tore{' '}
            {eigeneZeile.tore}:{eigeneZeile.gegentore}
          </p>
        </Zeile>
      )}

      {letztes &&
        (() => {
          const s = ausSicht(letztes, eigenerName)
          const gewonnen = (s.eigene ?? 0) > (s.fremde ?? 0)
          const unentschieden = s.eigene === s.fremde
          return (
            <Zeile titel="Letztes Spiel">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-lg leading-tight tracking-wide uppercase">
                    {s.heimspiel ? 'gegen' : 'bei'} {s.gegner}
                  </p>
                  <p className="text-xs text-white/45">
                    {letztes.wochentag} {letztes.datum}
                  </p>
                </div>
                <span
                  className={`tafelzahl shrink-0 text-2xl ${
                    unentschieden ? 'text-white' : gewonnen ? 'text-emerald-400' : 'text-rot'
                  }`}
                >
                  {s.eigene}:{s.fremde}
                </span>
              </div>
            </Zeile>
          )
        })()}

      {naechstes &&
        (() => {
          const s = ausSicht(naechstes, eigenerName)
          return (
            <Zeile titel="Nächstes Spiel">
              <p className="font-display text-lg leading-tight tracking-wide uppercase">
                {s.heimspiel ? 'gegen' : 'bei'} {s.gegner}
              </p>
              <p className="mt-0.5 text-sm text-white/70">
                {naechstes.wochentag}, {naechstes.datum}
                {naechstes.zeit && ` um ${naechstes.zeit}`}
              </p>
            </Zeile>
          )
        })()}

      {tabellenUrl && (
        <a
          href={tabellenUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block border-t border-white/10 px-4 py-3 font-display text-sm tracking-widest text-white/55 uppercase hover:bg-white/5 hover:text-rot"
        >
          Ganze Tabelle bei Swiss Ice Hockey ↗
        </a>
      )}
    </section>
  )
}
