import 'dotenv/config'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

/**
 * Entfernt Wochenresultat-Beiträge, in denen gar keine Spiele stehen.
 *
 *   npx tsx src/seed/leere-resultate-entfernen.ts
 *
 * In der Sommerpause hat der wöchentliche Lauf jeden Montag einen Beitrag
 * «In dieser Woche wurden keine Meisterschaftsspiele ausgetragen» angelegt.
 * Die schoben die echten Vereinsnachrichten aus der Übersicht. Die Route legt
 * solche Beiträge inzwischen nicht mehr an; die bereits entstandenen räumt
 * dieses Script weg.
 */

/** Sucht im Lexical-Baum nach sichtbarem Text. */
function textVon(knoten: unknown): string {
  if (!knoten || typeof knoten !== 'object') return ''
  const k = knoten as { text?: string; children?: unknown[]; root?: unknown }
  if (k.root) return textVon(k.root)
  const eigener = typeof k.text === 'string' ? k.text : ''
  const kinder = Array.isArray(k.children) ? k.children.map(textVon).join(' ') : ''
  return `${eigener} ${kinder}`.trim()
}

async function main() {
  const payload = await getPayload({ config: await configPromise })

  const { docs } = await payload.find({
    collection: 'posts',
    where: { typ: { equals: 'resultate' } },
    limit: 200,
    depth: 0,
  })

  console.log(`\nWochenresultat-Beiträge: ${docs.length}\n`)

  const leer = docs.filter((post) =>
    /keine Meisterschaftsspiele/i.test(textVon((post as { inhalt?: unknown }).inhalt)),
  )

  if (leer.length === 0) {
    console.log('Keiner davon ist leer – nichts zu tun.\n')
    process.exit(0)
  }

  for (const post of leer) {
    await payload.delete({ collection: 'posts', id: post.id })
    console.log(`  entfernt: ${post.titel}`)
  }

  console.log(`\n${leer.length} leere Beiträge entfernt, ${docs.length - leer.length} behalten.\n`)
  process.exit(0)
}

main().catch((f) => {
  console.error('Fehlgeschlagen:', f?.message ?? f)
  process.exit(1)
})
