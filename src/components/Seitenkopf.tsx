import { Bild, bildDaten, type BildQuelle } from './Bild'

/** Einheitlicher Kopfbereich für alle Unterseiten – dunkel und kräftig. */
export function Seitenkopf({
  titel,
  untertitel,
  zusatz,
  hintergrundbild,
}: {
  titel: string
  untertitel?: string | null
  zusatz?: React.ReactNode
  hintergrundbild?: BildQuelle
}) {
  const bild = bildDaten(hintergrundbild, 'hero')

  return (
    <section className="relative isolate overflow-hidden bg-nacht text-white">
      {bild && (
        <Bild
          bild={hintergrundbild}
          groesse="hero"
          priority
          className="absolute inset-0 h-full w-full object-cover opacity-35"
          sizes="100vw"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-nacht via-nacht/85 to-nacht/50" />
      <div className="eisglanz absolute inset-0 opacity-60" />

      <div className="inhalt relative py-12 sm:py-16">
        <h1 className="text-5xl leading-[0.85] sm:text-6xl lg:text-7xl">{titel}</h1>
        {untertitel && (
          <p className="mt-4 max-w-2xl text-lg text-white/75">{untertitel}</p>
        )}
        {zusatz && <div className="mt-6">{zusatz}</div>}
      </div>

      <div className="trikotband" />
    </section>
  )
}
