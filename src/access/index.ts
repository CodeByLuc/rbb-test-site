import type { Access, FieldAccess } from 'payload'

// Rollen: 'admin' darf alles, 'autor' darf Beiträge schreiben und Bilder hochladen.

export const isAdmin: Access = ({ req: { user } }) => user?.role === 'admin'

export const isAdminField: FieldAccess = ({ req: { user } }) => user?.role === 'admin'

export const isLoggedIn: Access = ({ req: { user } }) => Boolean(user)

export const isPublic: Access = () => true
