import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { de } from '@payloadcms/translations/languages/de'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Dokumente } from './collections/Dokumente'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { Sponsoren } from './collections/Sponsoren'
import { Teams } from './collections/Teams'
import { Users } from './collections/Users'
import { Eishockey } from './globals/Eishockey'
import { Einstellungen } from './globals/Einstellungen'
import { Verein } from './globals/Verein'
import { einfacherEditor } from './lib/editor'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' – EHC Rot-Blau',
    },
  },
  // Das Redaktionssystem läuft komplett auf Deutsch.
  i18n: {
    supportedLanguages: { de },
    fallbackLanguage: 'de',
  },
  collections: [Posts, Teams, Sponsoren, Media, Dokumente, Users],
  globals: [Eishockey, Verein, Einstellungen],
  editor: einfacherEditor,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || 'file:./rot-blau.db',
    },
  }),
  sharp,
  upload: {
    limits: {
      // Handyfotos sind schnell mal gross – 25 MB reichen bequem.
      fileSize: 25_000_000,
    },
  },
})
