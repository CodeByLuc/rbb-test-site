import type { CollectionConfig } from 'payload'

import { isAdmin, isPublic } from '../access'
import { generateSlug } from '../hooks/slug'
import { einfacherEditor } from '../lib/editor'

export const Teams: CollectionConfig = {
  slug: 'teams',
  labels: { singular: 'Team', plural: 'Teams' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'kategorie', 'reihenfolge'],
    group: 'Verein',
    description: 'Alle Mannschaften des EHC Rot-Blau.',
  },
  access: {
    read: isPublic,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [generateSlug('name')],
  },
  defaultSort: 'reihenfolge',
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Name',
      required: true,
      admin: { placeholder: 'z. B. 1. Mannschaft' },
    },
    {
      name: 'kategorie',
      type: 'select',
      label: 'Kategorie',
      required: true,
      defaultValue: 'aktiv',
      options: [
        { label: 'Aktive', value: 'aktiv' },
        { label: 'Nachwuchs', value: 'nachwuchs' },
        { label: 'Breitensport', value: 'breitensport' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'liga',
      type: 'text',
      label: 'Liga',
      admin: { position: 'sidebar', placeholder: 'z. B. 4. Liga, Gruppe 1' },
    },
    {
      name: 'reihenfolge',
      type: 'number',
      label: 'Reihenfolge',
      defaultValue: 100,
      admin: {
        position: 'sidebar',
        description: 'Kleine Zahl = weiter vorne in der Liste.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Vorstellung',
          fields: [
            {
              name: 'kurzbeschreibung',
              type: 'textarea',
              label: 'Kurzbeschreibung',
              maxLength: 300,
              admin: { description: 'Erscheint in der Teamübersicht.' },
            },
            {
              name: 'teamfoto',
              type: 'upload',
              relationTo: 'media',
              label: 'Teamfoto',
            },
            {
              name: 'beschreibung',
              type: 'richText',
              label: 'Ausführlicher Text',
              editor: einfacherEditor,
            },
          ],
        },
        {
          label: 'Personen',
          fields: [
            {
              name: 'trainer',
              type: 'array',
              label: 'Trainer & Betreuer',
              labels: { singular: 'Person', plural: 'Personen' },
              fields: [
                { name: 'name', type: 'text', label: 'Name', required: true },
                {
                  name: 'funktion',
                  type: 'text',
                  label: 'Funktion',
                  admin: { placeholder: 'z. B. Headcoach' },
                },
                { name: 'email', type: 'email', label: 'E-Mail' },
                { name: 'foto', type: 'upload', relationTo: 'media', label: 'Foto' },
              ],
            },
            {
              name: 'spieler',
              type: 'array',
              label: 'Spieler:innen',
              labels: { singular: 'Spieler:in', plural: 'Spieler:innen' },
              admin: { description: 'Kader mit Foto, Nummer und Position.' },
              fields: [
                { name: 'name', type: 'text', label: 'Name', required: true },
                { name: 'nummer', type: 'number', label: 'Nummer' },
                {
                  name: 'position',
                  type: 'select',
                  label: 'Position',
                  options: [
                    { label: 'Torhüter:in', value: 'goalie' },
                    { label: 'Verteidigung', value: 'verteidigung' },
                    { label: 'Sturm', value: 'sturm' },
                  ],
                },
                { name: 'foto', type: 'upload', relationTo: 'media', label: 'Foto' },
              ],
            },
          ],
        },
        {
          label: 'Training',
          fields: [
            {
              name: 'trainingszeiten',
              type: 'array',
              label: 'Trainingszeiten',
              labels: { singular: 'Training', plural: 'Trainings' },
              fields: [
                {
                  name: 'tag',
                  type: 'select',
                  label: 'Tag',
                  required: true,
                  options: [
                    'Montag',
                    'Dienstag',
                    'Mittwoch',
                    'Donnerstag',
                    'Freitag',
                    'Samstag',
                    'Sonntag',
                  ].map((tag) => ({ label: tag, value: tag })),
                },
                {
                  name: 'zeit',
                  type: 'text',
                  label: 'Zeit',
                  required: true,
                  admin: { placeholder: 'z. B. 20:15 – 21:45' },
                },
                {
                  name: 'ort',
                  type: 'text',
                  label: 'Ort',
                  admin: { placeholder: 'z. B. Eisstadion Weyermannshaus' },
                },
              ],
            },
          ],
        },
        {
          label: 'Spielplan (SIHF)',
          description:
            'Damit holt die Website Spielplan und Resultate automatisch von Swiss Ice Hockey.',
          fields: [
            {
              name: 'sihfTeamName',
              type: 'text',
              label: 'Teamname bei Swiss Ice Hockey',
              admin: {
                description:
                  'Genau so schreiben, wie das Team auf sihf.ch erscheint, z. B. "EHC Rot-Blau Bern-Bümpliz".',
              },
            },
            {
              name: 'sihfTeamId',
              type: 'text',
              label: 'SIHF Team-ID',
              admin: { description: 'Nummer aus der SIHF-Datenbank. Optional.' },
            },
            {
              name: 'sihfLeagueId',
              type: 'text',
              label: 'SIHF Liga-ID',
              admin: { description: 'Nummer der Liga in der SIHF-Datenbank. Optional.' },
            },
            {
              name: 'tabellenUrl',
              type: 'text',
              label: 'Link zur Tabelle',
              admin: {
                description: 'Vollständige Adresse der Ranglisten-Seite auf sihf.ch.',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      label: 'URL-Kürzel',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Entsteht automatisch aus dem Namen.',
      },
    },
  ],
}
