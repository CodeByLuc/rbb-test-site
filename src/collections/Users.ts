import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminField } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Benutzer', plural: 'Benutzer' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Verwaltung',
    description: 'Wer darf sich einloggen und Beiträge schreiben.',
  },
  auth: true,
  access: {
    // Nur Admins verwalten Konten. Alle anderen sehen und ändern nur sich selbst.
    create: isAdmin,
    delete: isAdmin,
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return { id: { equals: user?.id } }
    },
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return { id: { equals: user?.id } }
    },
    admin: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Name',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      label: 'Rolle',
      required: true,
      defaultValue: 'autor',
      // Niemand kann sich selbst zum Admin machen.
      access: { create: isAdminField, update: isAdminField },
      options: [
        { label: 'Autor:in (darf Beiträge schreiben)', value: 'autor' },
        { label: 'Administrator:in (darf alles)', value: 'admin' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Autor:innen können nur Beiträge und Bilder anlegen.',
      },
    },
  ],
}
