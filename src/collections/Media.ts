import type { CollectionConfig } from 'payload'

import { isLoggedIn, isPublic } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Bild', plural: 'Bilder' },
  admin: {
    group: 'Inhalte',
    description: 'Alle Fotos der Website. Einfach hierher ziehen zum Hochladen.',
    useAsTitle: 'alt',
  },
  access: {
    read: isPublic,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  upload: {
    mimeTypes: ['image/*'],
    focalPoint: true,
    /**
     * Nur die Breite vorgeben, das Seitenverhältnis bleibt erhalten.
     *
     * Früher stand hier zusätzlich eine Höhe. Das schnitt hochkante Bilder
     * quer zu – bei einem Plakat fielen Kopf und Fuss weg – und für Bilder,
     * die kleiner als die verlangte Grösse waren, entstand gar keine Variante.
     * Den sichtbaren Zuschnitt übernimmt das Layout mit «object-cover».
     */
    imageSizes: [
      { name: 'thumbnail', width: 400, withoutEnlargement: true },
      { name: 'card', width: 900, withoutEnlargement: true },
      { name: 'portrait', width: 600, withoutEnlargement: true },
      { name: 'hero', width: 1800, withoutEnlargement: true },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Bildbeschreibung',
      admin: {
        description:
          'Kurz beschreiben, was auf dem Bild zu sehen ist – hilft blinden Besucher:innen und Google.',
      },
    },
  ],
}
