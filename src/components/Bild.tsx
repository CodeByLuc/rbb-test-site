import NextImage from 'next/image'

import type { Media } from '../payload-types'

type Groesse = 'thumbnail' | 'card' | 'portrait' | 'hero'

export type BildQuelle = number | Media | null | undefined

/** Holt URL und Masse aus einem Payload-Upload, bevorzugt die passende Bildgrösse. */
export function bildDaten(bild: BildQuelle, groesse?: Groesse) {
  if (!bild || typeof bild === 'number') return null

  const variante = groesse ? bild.sizes?.[groesse] : undefined
  const url = variante?.url ?? bild.url
  if (!url) return null

  return {
    url,
    breite: variante?.width ?? bild.width ?? 1200,
    hoehe: variante?.height ?? bild.height ?? 800,
    alt: bild.alt ?? '',
  }
}

type BildProps = {
  bild: BildQuelle
  groesse?: Groesse
  className?: string
  sizes?: string
  priority?: boolean
  /** Wird angezeigt, wenn kein Bild hinterlegt ist. */
  ersatz?: React.ReactNode
}

export function Bild({ bild, groesse = 'card', className, sizes, priority, ersatz }: BildProps) {
  const daten = bildDaten(bild, groesse)

  if (!daten) {
    return (
      ersatz ?? (
        <div
          className={`eisglanz flex items-center justify-center bg-blau-dunkel text-white/30 ${className ?? ''}`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="h-10 w-10" fill="currentColor">
            <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm1 2v8.6l3.5-3.4 3 2.9 4-4L19 15V7Zm3.5 1a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2Z" />
          </svg>
        </div>
      )
    )
  }

  return (
    <NextImage
      src={daten.url}
      alt={daten.alt}
      width={daten.breite}
      height={daten.hoehe}
      className={className}
      sizes={sizes}
      priority={priority}
    />
  )
}
