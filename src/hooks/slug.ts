import type { CollectionBeforeValidateHook, CollectionSlug } from 'payload'

export const slugify = (input: string): string =>
  input
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

/**
 * Erzeugt automatisch einen eindeutigen Slug aus dem angegebenen Feld,
 * damit Autor:innen sich nie um URLs kümmern müssen.
 */
export const generateSlug =
  (fromField: string): CollectionBeforeValidateHook =>
  async ({ data, originalDoc, req, collection }) => {
    if (!data) return data

    const source = (data[fromField] ?? originalDoc?.[fromField]) as string | undefined
    if (data.slug || !source) return data

    const base = slugify(source) || 'eintrag'
    let candidate = base
    let counter = 2

    // Bei Namensgleichheit wird -2, -3, ... angehängt statt einen Fehler zu werfen.
    for (;;) {
      const existing = await req.payload.find({
        collection: collection.slug as CollectionSlug,
        where: {
          slug: { equals: candidate },
          ...(originalDoc?.id ? { id: { not_equals: originalDoc.id } } : {}),
        },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      if (existing.totalDocs === 0) break
      candidate = `${base}-${counter++}`
    }

    data.slug = candidate
    return data
  }
