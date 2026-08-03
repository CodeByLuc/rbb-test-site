import type { GlobalConfig } from 'payload'

import { isAdmin, isPublic } from '../access'
import { einfacherEditor } from '../lib/editor'

export const Einstellungen: GlobalConfig = {
  slug: 'einstellungen',
  label: 'Einstellungen',
  admin: {
    group: 'Verwaltung',
    description: 'Logo, Kontaktangaben und Sponsoring-Unterlagen.',
  },
  access: { read: isPublic, update: isAdmin },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Verein',
          fields: [
            {
              name: 'vereinsname',
              type: 'text',
              label: 'Vereinsname',
              required: true,
              defaultValue: 'EHC Rot-Blau Bern-Bümpliz',
            },
            { name: 'logo', type: 'upload', relationTo: 'media', label: 'Logo' },
            {
              name: 'claim',
              type: 'text',
              label: 'Motto',
              admin: { placeholder: 'z. B. Eishockey in Bümpliz seit 1949' },
            },
          ],
        },
        {
          label: 'Kontakt',
          fields: [
            { name: 'adresse', type: 'textarea', label: 'Adresse' },
            { name: 'email', type: 'email', label: 'E-Mail' },
            { name: 'telefon', type: 'text', label: 'Telefon' },
            {
              name: 'eishalle',
              type: 'text',
              label: 'Heimeishalle',
              admin: { placeholder: 'z. B. Eisstadion Weyermannshaus, Bern' },
            },
            {
              name: 'sozialeMedien',
              type: 'array',
              label: 'Soziale Medien',
              labels: { singular: 'Profil', plural: 'Profile' },
              fields: [
                {
                  name: 'plattform',
                  type: 'select',
                  label: 'Plattform',
                  required: true,
                  options: [
                    { label: 'Instagram', value: 'instagram' },
                    { label: 'Facebook', value: 'facebook' },
                    { label: 'YouTube', value: 'youtube' },
                    { label: 'TikTok', value: 'tiktok' },
                  ],
                },
                { name: 'url', type: 'text', label: 'Adresse', required: true },
              ],
            },
          ],
        },
        {
          label: 'Sponsoring',
          fields: [
            {
              name: 'sponsoringText',
              type: 'richText',
              label: 'Text auf der Sponsorenseite',
              editor: einfacherEditor,
            },
            {
              name: 'sponsoringBlatt',
              type: 'upload',
              relationTo: 'dokumente',
              label: 'Sponsoring-Unterlagen (PDF)',
              admin: { description: 'Wird auf der Sponsorenseite zum Download angeboten.' },
            },
            {
              name: 'sponsoringKontakt',
              type: 'text',
              label: 'Kontakt für Sponsoring',
              admin: { placeholder: 'Name und E-Mail' },
            },
          ],
        },
      ],
    },
  ],
}
