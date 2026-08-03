import type { GlobalConfig } from 'payload'

import { isAdmin, isPublic } from '../access'
import { einfacherEditor } from '../lib/editor'

export const Verein: GlobalConfig = {
  slug: 'verein',
  label: 'Seite «Verein»',
  admin: {
    group: 'Seiteninhalte',
    description: 'Geschichte, Aktuelles und Vorstand.',
  },
  access: { read: isPublic, update: isAdmin },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Geschichte',
          fields: [
            {
              name: 'gruendungsjahr',
              type: 'number',
              label: 'Gegründet im Jahr',
            },
            {
              name: 'geschichte',
              type: 'richText',
              label: 'Geschichte des Vereins',
              editor: einfacherEditor,
            },
            {
              name: 'historischeBilder',
              type: 'array',
              label: 'Bilder zur Geschichte',
              labels: { singular: 'Bild', plural: 'Bilder' },
              fields: [
                { name: 'bild', type: 'upload', relationTo: 'media', label: 'Bild', required: true },
                { name: 'legende', type: 'text', label: 'Bildlegende' },
              ],
            },
          ],
        },
        {
          label: 'Aktuelles',
          fields: [
            {
              name: 'aktuell',
              type: 'richText',
              label: 'Wo der Verein heute steht',
              editor: einfacherEditor,
            },
          ],
        },
        {
          label: 'Vorstand',
          fields: [
            {
              name: 'vorstand',
              type: 'array',
              label: 'Vorstandsmitglieder',
              labels: { singular: 'Mitglied', plural: 'Mitglieder' },
              fields: [
                { name: 'name', type: 'text', label: 'Name', required: true },
                {
                  name: 'funktion',
                  type: 'text',
                  label: 'Funktion',
                  required: true,
                  admin: { placeholder: 'z. B. Präsident' },
                },
                { name: 'email', type: 'email', label: 'E-Mail' },
                { name: 'telefon', type: 'text', label: 'Telefon' },
                { name: 'foto', type: 'upload', relationTo: 'media', label: 'Foto' },
              ],
            },
          ],
        },
        {
          label: 'Mitglied werden',
          fields: [
            {
              name: 'mitgliedschaft',
              type: 'richText',
              label: 'Infos zur Mitgliedschaft',
              editor: einfacherEditor,
            },
            {
              name: 'anmeldeformular',
              type: 'upload',
              relationTo: 'dokumente',
              label: 'Anmeldeformular (PDF)',
            },
            {
              name: 'statuten',
              type: 'upload',
              relationTo: 'dokumente',
              label: 'Statuten (PDF)',
            },
          ],
        },
      ],
    },
  ],
}
