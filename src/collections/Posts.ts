import type { CollectionConfig } from 'payload'

import { isAdminField } from '../access'
import { generateSlug } from '../hooks/slug'
import { einfacherEditor } from '../lib/editor'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Beitrag', plural: 'Beiträge' },
  admin: {
    useAsTitle: 'titel',
    defaultColumns: ['titel', 'datum', 'team', '_status'],
    group: 'Inhalte',
    description: 'News und Berichte für die Startseite.',
    preview: (doc) => (doc?.slug ? `/news/${doc.slug}` : null),
  },
  versions: {
    drafts: true,
  },
  access: {
    // Gäste sehen nur veröffentlichte Beiträge.
    read: ({ req: { user } }) => {
      if (user) return true
      return { _status: { equals: 'published' } }
    },
    create: ({ req: { user } }) => Boolean(user),
    // Autor:innen bearbeiten und löschen nur ihre eigenen Beiträge.
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { autor: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { autor: { equals: user.id } }
    },
  },
  hooks: {
    beforeValidate: [generateSlug('titel')],
    beforeChange: [
      ({ data, req, operation }) => {
        // Autor:in automatisch setzen, damit niemand ein Feld ausfüllen muss.
        if (operation === 'create' && req.user && !data.autor) {
          data.autor = req.user.id
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'titel',
      type: 'text',
      label: 'Titel',
      required: true,
      admin: { placeholder: 'z. B. Sieg gegen Lyss im letzten Drittel gedreht' },
    },
    {
      name: 'titelbild',
      type: 'upload',
      relationTo: 'media',
      label: 'Titelbild',
      admin: {
        description: 'Das grosse Bild oben im Beitrag und auf der Startseite.',
      },
    },
    {
      name: 'auszug',
      type: 'textarea',
      label: 'Kurzfassung',
      maxLength: 300,
      admin: {
        description:
          'Ein bis zwei Sätze für die Vorschau auf der Startseite. Leer lassen ist auch in Ordnung.',
      },
    },
    {
      name: 'inhalt',
      type: 'richText',
      label: 'Text',
      editor: einfacherEditor,
      required: true,
    },
    {
      name: 'galerie',
      type: 'array',
      label: 'Bildergalerie',
      labels: { singular: 'Bild', plural: 'Bilder' },
      admin: {
        description: 'Weitere Fotos, die unter dem Text als Galerie erscheinen.',
      },
      fields: [
        {
          name: 'bild',
          type: 'upload',
          relationTo: 'media',
          label: 'Bild',
          required: true,
        },
      ],
    },
    {
      name: 'datum',
      type: 'date',
      label: 'Datum',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' },
      },
    },
    {
      name: 'team',
      type: 'relationship',
      relationTo: 'teams',
      label: 'Betrifft Team',
      admin: {
        position: 'sidebar',
        description: 'Optional. Der Beitrag erscheint dann auch auf der Teamseite.',
      },
    },
    {
      name: 'autor',
      type: 'relationship',
      relationTo: 'users',
      label: 'Autor:in',
      access: { update: () => false },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Wird automatisch gesetzt.',
      },
    },
    {
      name: 'slug',
      type: 'text',
      label: 'URL-Kürzel',
      unique: true,
      index: true,
      access: { update: isAdminField },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Entsteht automatisch aus dem Titel.',
      },
    },
    {
      name: 'typ',
      type: 'select',
      defaultValue: 'news',
      options: [
        { label: 'News', value: 'news' },
        { label: 'Wochenresultate', value: 'resultate' },
      ],
      // Wird nur vom Montags-Job gesetzt, darum im Editor unsichtbar.
      admin: { hidden: true },
    },
  ],
}
