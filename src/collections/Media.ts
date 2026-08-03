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
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 900, height: 600, position: 'centre' },
      { name: 'portrait', width: 600, height: 800, position: 'centre' },
      { name: 'hero', width: 1800, height: 900, position: 'centre' },
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
