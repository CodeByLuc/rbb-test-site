/**
 * Einheitlicher Kopfbereich für alle Unterseiten.
 *
 * Früher ein dunkler, ganzflächiger Block mit Hintergrundfoto, Farbverlauf
 * und einer 8px-Trikotband-Leiste am unteren Rand – auf jeder Unterseite ein
 * eigener kleiner Hero. Rückmeldung: dieser Kasten wirkt zu wuchtig und zu
 * dominant, bevor der eigentliche Inhalt überhaupt beginnt.
 *
 * Jetzt steht der Titel direkt auf dem normalen Seitenhintergrund, wie jede
 * andere Überschrift auf der Seite auch – die dunkle, fotohinterlegte
 * Bildsprache bleibt der Startseite vorbehalten.
 */
export function Seitenkopf({
  titel,
  untertitel,
  zusatz,
}: {
  titel: string
  untertitel?: string | null
  zusatz?: React.ReactNode
}) {
  return (
    <div className="inhalt pt-8 pb-2 sm:pt-10">
      <h1 className="abschnittstitel text-4xl text-nacht sm:text-5xl">{titel}</h1>
      {untertitel && (
        <p className="mt-3 max-w-2xl text-base text-grau sm:text-lg">{untertitel}</p>
      )}
      {zusatz && <div className="mt-4">{zusatz}</div>}
    </div>
  )
}
