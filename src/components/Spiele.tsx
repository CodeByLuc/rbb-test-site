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
    <div className="kachel eisglanz relative overflow-hidden bg-blau text-white shadow-2xl">
      <div className="relative px-5 py-7 sm:px-8 sm:py-9">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <span className="etikett bg-rot px-2.5 py-1 font-display text-xs tracking-[0.2em] uppercase">
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
        {spiel.ort && <p className="mt-3 text-sm text-white/70">{spiel.ort}</p>}
      </div>
    </div>
  )
}

/** Echte Kürzel sind kurz; manche Quellen liefern dort den vollen Namen. */
const istKurz = (kuerzel: string | null | undefined): kuerzel is string =>
  !!kuerzel && kuerzel.length <= 8

/**
 * Teamname auf der Anzeigetafel: das offizielle Kürzel gross, sonst der volle
 * Name kleiner und mit Silbentrennung – damit nichts über den Rand läuft.
 */
function TeamAnzeige({
  team,
  eigen,
  rechts = false,
}: {
  team: SihfSpiel['heim']
  eigen: boolean
  rechts?: boolean
}) {
  const kuerzel = istKurz(team.kuerzel) ? team.kuerzel : null
  const farbe = eigen ? 'text-white' : 'text-white/60'
  const ausrichtung = rechts ? 'text-right' : ''

  if (kuerzel) {
    return (
      <span
        title={team.name}
        className={`font-display text-3xl leading-none tracking-wide uppercase sm:text-4xl ${farbe} ${ausrichtung}`}
      >
        {kuerzel}
      </span>
    )
  }

  return (
    <span
      lang="de"
      className={`font-display text-lg leading-[0.95] break-words hyphens-auto uppercase sm:text-xl ${farbe} ${ausrichtung}`}
    >
      {team.name}
    </span>
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
    <div className="kachel eisglanz relative overflow-hidden bg-nacht-tief text-white shadow-2xl">
      <div className="relative px-5 py-7 sm:px-8 sm:py-9">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="etikett bg-rot px-2.5 py-1 font-display text-xs tracking-[0.2em] uppercase">
            Letztes Spiel
          </span>
          <span className="font-display text-base tracking-wide text-white/60 uppercase">
            {spiel.wochentag}, {spiel.datum} · {spiel.zeit}
          </span>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-5">
          <TeamAnzeige team={spiel.heim} eigen={heimIstWir} />

          <span className="tafelzahl bg-black/40 px-3 py-2 text-5xl text-white sm:px-5 sm:text-6xl">
            {spiel.toreHeim}<span className="text-rot">:</span>{spiel.toreGast}
          </span>

          <TeamAnzeige team={spiel.gast} eigen={!heimIstWir} rechts />
        </div>

        {(istKurz(spiel.heim.kuerzel) || istKurz(spiel.gast.kuerzel)) && (
          <p className="mt-3 text-sm text-white/60">
            {spiel.heim.name} – {spiel.gast.name}
          </p>
        )}

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
