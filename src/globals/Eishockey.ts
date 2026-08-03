import type { GlobalConfig } from 'payload'

import { isAdmin, isPublic } from '../access'
import { einfacherEditor } from '../lib/editor'

export const Eishockey: GlobalConfig = {
  slug: 'eishockey',
  label: 'Seite «Eishockey»',
  admin: {
    group: 'Seiteninhalte',
    description: 'Regeln, Sommertraining und Goalie-Training.',
  },
  access: { read: isPublic, update: isAdmin },
  fields: [
    {
      name: 'einleitung',
      type: 'textarea',
      label: 'Einleitung',
      admin: { description: 'Kurzer Text oben auf der Seite.' },
    },
    {
      name: 'regeln',
      type: 'richText',
      label: 'Regeln',
      editor: einfacherEditor,
      admin: { description: 'Die wichtigsten IIHF-Regeln einfach erklärt.' },
    },
    {
      name: 'regelwerkLink',
      type: 'text',
      label: 'Link zum offiziellen Regelbuch',
      admin: { placeholder: 'https://…' },
    },
    {
      name: 'angebote',
      type: 'array',
      label: 'Trainingsangebote',
      labels: { singular: 'Angebot', plural: 'Angebote' },
      admin: {
        description: 'Sommertraining, Goalie-Training usw.',
      },
      fields: [
        {
          name: 'titel',
          type: 'text',
          label: 'Titel',
          required: true,
          admin: { placeholder: 'z. B. Goalie-Training' },
        },
        { name: 'beschreibung', type: 'textarea', label: 'Beschreibung' },
        {
          name: 'termine',
          type: 'text',
          label: 'Termine',
          admin: { placeholder: 'z. B. jeden Donnerstag, 18:30 – 20:00' },
        },
        { name: 'ort', type: 'text', label: 'Ort' },
        { name: 'kontakt', type: 'text', label: 'Kontakt' },
        { name: 'bild', type: 'upload', relationTo: 'media', label: 'Bild' },
      ],
    },
  ],
}
