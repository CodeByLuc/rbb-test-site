import type { CollectionConfig } from 'payload'

import { isLoggedIn, isPublic } from '../access'

export const Dokumente: CollectionConfig = {
  slug: 'dokumente',
  labels: { singular: 'Dokument', plural: 'Dokumente' },
  admin: {
    group: 'Inhalte',
    useAsTitle: 'titel',
    description: 'PDFs wie Anmeldeformulare, Statuten oder Sponsoring-Unterlagen.',
  },
  access: {
    read: isPublic,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  upload: {
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.*'],
  },
  fields: [
    {
      name: 'titel',
      type: 'text',
      label: 'Titel',
      required: true,
      admin: { description: 'So wird der Download auf der Website benannt.' },
    },
  ],
}
