import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
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

/**
 * Lokal läuft die Website auf einer SQLite-Datei, in Produktion auf Neon
 * (PostgreSQL). Ausschlaggebend ist die Verbindungsadresse: sieht sie wie
 * PostgreSQL aus, wird der Postgres-Adapter genommen.
 *
 * Beide Namen werden akzeptiert, weil Neon und Vercel unterschiedlich benennen.
 */
const verbindung = process.env.DATABASE_URI || process.env.DATABASE_URL || ''
const istPostgres = verbindung.startsWith('postgres://') || verbindung.startsWith('postgresql://')

const datenbank = istPostgres
  ? postgresAdapter({
      pool: { connectionString: verbindung },
      // Legt fehlende Tabellen beim ersten Start selbst an. Ohne dies müsste
      // vor jedem Deploy von Hand eine Migration laufen.
      push: true,
    })
  : sqliteAdapter({
      client: { url: verbindung || 'file:./rot-blau.db' },
    })

/**
 * Auf Vercel ist das Dateisystem nicht beschreibbar – hochgeladene Bilder
 * müssen in den Blob-Speicher. Ohne Token (lokal) bleibt alles im Ordner
 * /media liegen.
 *
 * «clientUploads» ist dabei entscheidend: Vercel begrenzt Anfragen an den
 * Server auf 4,5 MB. Ein Handyfoto oder ein Screenshot ist schnell grösser und
 * würde daran scheitern. Mit dieser Einstellung wandert die Datei direkt vom
 * Browser in den Blob-Speicher, ohne über den Server zu laufen.
 */
const speicher = process.env.BLOB_READ_WRITE_TOKEN
  ? [
      vercelBlobStorage({
        enabled: true,
        collections: { media: true, dokumente: true },
        token: process.env.BLOB_READ_WRITE_TOKEN,
        clientUploads: true,
      }),
    ]
  : []

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
  db: datenbank,
  plugins: speicher,
  sharp,
  upload: {
    limits: {
      // Handyfotos sind schnell mal gross – 25 MB reichen bequem.
      fileSize: 25_000_000,
    },
  },
})
