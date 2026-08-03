import type { SihfSpiel } from '../lib/sihf'
import { SIHF_SPIEL_URL } from '../lib/sihf'

const istEigenes = (name: string, eigenerName: string) =>
  name.toLowerCase().includes(eigenerName.toLowerCase())

type Ausgang = 'sieg' | 'niederlage' | 'remis'

/** Ausgang aus Sicht des eigenen Teams. */
function ausgang(spiel: SihfSpiel, eigenerName: string): Ausgang | null {
  if (!spiel.gespielt) return null
  const heim = istEigenes(spiel.heim.name, eigenerName)
  const eigene = heim ? spiel.toreHeim! : spiel.toreGast!
  const fremde = heim ? spiel.toreGast! : spiel.toreHeim!
  if (eigene > fremde) return 'sieg'
  if (eigene < fremde) return 'niederlage'
  return 'remis'
}

const kuerzel: Record<Ausgang, string> = { sieg: 'S', niederlage: 'N', remis: 'U' }
const langtext: Record<Ausgang, string> = {
  sieg: 'Sieg',
  niederlage: 'Niederlage',
  remis: 'Unentschieden',
}

const marke: Record<Ausgang, string> = {
  sieg: 'bg-emerald-500 text-white',
  niederlage: 'bg-rot text-white',
  remis: 'bg-white/25 text-white',
}

/** Kleines Quadrat mit S/N/U – wie in einer Formkurve. */
function AusgangMarke({ ergebnis }: { ergebnis: Ausgang }) {
  return (
    <span
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center font-display text-sm font-extrabold ${marke[ergebnis]}`}
      title={langtext[ergebnis]}
    >
      {kuerzel[ergebnis]}
      <span className="sr-only">{langtext[ergebnis]}</span>
    </span>
  )
}

/** Eine Zeile pro Spiel, dunkel wie eine Anzeigetafel. */
export function SpielZeile({ spiel, eigenerName }: { spiel: SihfSpiel; eigenerName: string }) {
  const ergebnis = ausgang(spiel, eigenerName)
  const heimIstWir = istEigenes(spiel.heim.name, eigenerName)

  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 border-b border-white/10 px-4 py-3 transition-colors last:border-0 hover:bg-white/5 sm:grid-cols-[7.5rem_1fr_auto_auto]">
      <div className="font-display text-base tracking-wide text-white/60 uppercase">
        <span className="text-rot">{spiel.wochentag}</span> {spiel.datum}
        <span className="ml-2 font-sans text-xs text-white/40">{spiel.zeit}</span>
      </div>

      <div className="col-span-2 min-w-0 font-display text-lg leading-tight uppercase sm:col-span-1">
        <span className={heimIstWir ? 'text-white' : 'text-white/55'}>{spiel.heim.name}</span>
        <span className="mx-2 text-white/25">gegen</span>
        <span className={!heimIstWir ? 'text-white' : 'text-white/55'}>{spiel.gast.name}</span>
      </div>

      <div className="flex items-center gap-3">
        {spiel.abgesagt ? (
          <span className="bg-white/15 px-2 py-1 font-display text-sm tracking-wide uppercase">
            Abgesagt
          </span>
        ) : spiel.gespielt ? (
          <>
            <span className="tafelzahl text-2xl text-white">
              {spiel.toreHeim}:{spiel.toreGast}
            </span>
            {spiel.entscheidung && (
              <span className="font-display text-xs tracking-wider text-rot uppercase">
                n.{spiel.entscheidung}
              </span>
            )}
            {ergebnis && <AusgangMarke ergebnis={ergebnis} />}
          </>
        ) : (
          <span className="font-display text-sm tracking-wide text-white/45 uppercase">
            steht an
          </span>
        )}
      </div>

      {spiel.gameId && (
        <a
          href={SIHF_SPIEL_URL(spiel.gameId)}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden font-display text-xs tracking-widest text-white/40 uppercase hover:text-rot sm:block"
        >
          Details
        </a>
      )}
    </li>
  )
}

export function SpielListe({
  titel,
  spiele,
  eigenerName,
  leerText = 'Momentan sind keine Spiele angesetzt.',
}: {
  titel: string
  spiele: SihfSpiel[]
  eigenerName: string
  leerText?: string
}) {
  return (
    <section className="overflow-hidden bg-nacht text-white shadow-xl">
      <div className="flex items-baseline justify-between gap-4 bg-nacht-tief px-4 py-3">
        <h2 className="text-xl sm:text-2xl">{titel}</h2>
        <span className="font-display text-xs tracking-widest text-white/40 uppercase">
          Swiss Ice Hockey
        </span>
      </div>
      <div className="trikotband-schmal" />
      {spiele.length === 0 ? (
        <p className="px-4 py-8 text-sm text-white/60">{leerText}</p>
      ) : (
        <ul>
          {spiele.map((spiel, index) => (
            <SpielZeile
              key={spiel.gameId ?? `${spiel.datum}-${index}`}
              spiel={spiel}
              eigenerName={eigenerName}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

/** Grosser Block für die nächste Partie – Heim oder auswärts, mit Datum und Ort. */
export function NaechstesSpiel({
  spiel,
  eigenerName,
  teamName,
}: {
  spiel: SihfSpiel
  eigenerName: string
  teamName?: string
}) {
  const heimIstWir = istEigenes(spiel.heim.name, eigenerName)
  const gegner = heimIstWir ? spiel.gast.name : spiel.heim.name

  return (
    <div className="eisglanz relative overflow-hidden bg-blau text-white shadow-2xl">
      <div className="relative px-5 py-7 sm:px-8 sm:py-9">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <span className="bg-rot px-2.5 py-1 font-display text-xs tracking-[0.2em] uppercase">
            Nächstes Spiel
          </span>
          {teamName && (
            <span className="font-display text-base tracking-wide text-white/75 uppercase">
              {teamName}
            </span>
          )}
        </div>

        <p className="font-display text-4xl leading-[0.9] uppercase sm:text-5xl">
          {heimIstWir ? 'Heimspiel gegen' : 'Auswärts bei'}
          <span className="mt-1 block text-white">{gegner}</span>
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/20 pt-4 font-display text-lg tracking-wide uppercase">
          <span>
            <span className="text-rot">{spiel.wochentag}</span> {spiel.datum}
          </span>
          <span className="text-white/80">{spiel.zeit}</span>
          <span className="text-white/60">{heimIstWir ? 'Heim' : 'Auswärts'}</span>
        </div>
      </div>
    </div>
  )
}

/** Grosse Anzeigetafel für das letzte Resultat. */
export function LetztesResultat({
  spiel,
  eigenerName,
}: {
  spiel: SihfSpiel
  eigenerName: string
}) {
  const ergebnis = ausgang(spiel, eigenerName)
  const heimIstWir = istEigenes(spiel.heim.name, eigenerName)

  return (
    <div className="eisglanz relative overflow-hidden bg-nacht-tief text-white shadow-2xl">
      <div className="relative px-5 py-7 sm:px-8 sm:py-9">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="bg-rot px-2.5 py-1 font-display text-xs tracking-[0.2em] uppercase">
            Letztes Spiel
          </span>
          <span className="font-display text-base tracking-wide text-white/60 uppercase">
            {spiel.wochentag}, {spiel.datum} · {spiel.zeit}
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
          <span
            className={`font-display text-xl leading-[0.9] uppercase sm:text-3xl ${
              heimIstWir ? 'text-white' : 'text-white/60'
            }`}
          >
            {spiel.heim.name}
          </span>

          <span className="tafelzahl bg-black/40 px-4 py-2 text-5xl text-white sm:px-6 sm:text-7xl">
            {spiel.toreHeim}<span className="text-rot">:</span>{spiel.toreGast}
          </span>

          <span
            className={`text-right font-display text-xl leading-[0.9] uppercase sm:text-3xl ${
              !heimIstWir ? 'text-white' : 'text-white/60'
            }`}
          >
            {spiel.gast.name}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-4">
          {ergebnis && (
            <span className="flex items-center gap-2">
              <AusgangMarke ergebnis={ergebnis} />
              <span className="font-display text-base tracking-wide uppercase">
                {langtext[ergebnis]}
              </span>
            </span>
          )}
          {spiel.entscheidung && (
            <span className="font-display text-sm tracking-widest text-rot uppercase">
              nach {spiel.entscheidung === 'OT' ? 'Verlängerung' : 'Penaltyschiessen'}
            </span>
          )}
          {spiel.drittelHeim.length > 0 && (
            <span className="font-display text-sm tracking-wide text-white/55 uppercase">
              Drittel {spiel.drittelHeim.join('·')} zu {spiel.drittelGast.join('·')}
            </span>
          )}
          {spiel.gameId && (
            <a
              href={SIHF_SPIEL_URL(spiel.gameId)}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto font-display text-xs tracking-widest text-white/45 uppercase hover:text-rot"
            >
              Spieldetails ↗
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
