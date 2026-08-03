import type { CollectionConfig } from 'payload'

import { isAdmin, isPublic } from '../access'

export const Sponsoren: CollectionConfig = {
  slug: 'sponsoren',
  labels: { singular: 'Sponsor', plural: 'Sponsoren' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'kategorie', 'reihenfolge', 'aktiv'],
    group: 'Verein',
    description: 'Partner des Vereins – erscheinen auf der Startseite und der Sponsorenseite.',
  },
  access: {
    read: isPublic,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  defaultSort: 'reihenfolge',
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Name',
      required: true,
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Logo',
      admin: { description: 'Am besten mit weissem oder transparentem Hintergrund.' },
    },
    {
      name: 'website',
      type: 'text',
      label: 'Website',
      admin: { placeholder: 'https://…' },
    },
    {
      name: 'kategorie',
      type: 'select',
      label: 'Kategorie',
      required: true,
      defaultValue: 'sponsor',
      options: [
        { label: 'Hauptsponsor', value: 'hauptsponsor' },
        { label: 'Sponsor', value: 'sponsor' },
        { label: 'Gönner', value: 'goenner' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'reihenfolge',
      type: 'number',
      label: 'Reihenfolge',
      defaultValue: 100,
      admin: { position: 'sidebar', description: 'Kleine Zahl = weiter vorne.' },
    },
    {
      name: 'aktiv',
      type: 'checkbox',
      label: 'Wird angezeigt',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
}
