'use client'

import { useRef } from 'react'

import { Bild, bildDaten, type BildQuelle } from './Bild'

/**
 * Kaderfoto: in der Kachel nur Kopf bis Brust, damit die Spieler nicht in
 * viel leerem Trikot untergehen. Ein Klick öffnet das ganze Foto gross.
 */
export function SpielerFoto({
  bild,
  name,
  className,
}: {
  bild: BildQuelle
  name: string
  className?: string
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const gross = bildDaten(bild, 'hero')

  if (!gross) {
    return <Bild bild={bild} groesse="portrait" className={className} />
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="group block w-full cursor-zoom-in"
        aria-label={`Foto von ${name} gross ansehen`}
      >
        <Bild
          bild={bild}
          groesse="portrait"
          className={`${className ?? ''} object-top transition-transform duration-300 group-hover:scale-105`}
        />
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          // Klick auf den Hintergrund (::backdrop lässt sich nicht direkt
          // treffen) schliesst – nur der Klick auf das Bild selbst nicht.
          if (e.target === e.currentTarget) dialogRef.current?.close()
        }}
        className="m-auto max-h-[85vh] max-w-[90vw] overflow-hidden rounded-lg bg-transparent p-0 backdrop:bg-nacht/85"
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Schliessen"
            className="absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-nacht/70 text-white hover:bg-rot"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gross.url}
            alt={`${name} – ganzes Foto`}
            className="max-h-[85vh] max-w-[90vw] object-contain"
          />
        </div>
      </dialog>
    </>
  )
}
