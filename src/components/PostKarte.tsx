import Link from 'next/link'

import { datumLang } from '../lib/daten'
import type { Post } from '../payload-types'
import { Bild, bildDaten } from './Bild'
import { textAuszug } from './Fliesstext'

/**
 * Vorschaukarte eines Beitrags.
 *
 * Ohne Titelbild entfällt der Bildbereich ganz. Früher blieb dort eine leere
 * Fläche im Format 3:2 stehen – bei mehreren bildlosen Beiträgen wirkte die
 * Seite dadurch wie eine Ansammlung leerer Kästen. Stattdessen tritt der Text
 * in den Vordergrund, und ein roter Balken gibt der Karte Halt.
 */
export function PostKarte({ post, gross = false }: { post: Post; gross?: boolean }) {
  const vorschau = post.auszug?.trim() || textAuszug(post.inhalt, gross ? 200 : 130)
  const teamName = typeof post.team === 'object' && post.team ? post.team.name : null
  const hatBild = Boolean(bildDaten(post.titelbild, gross ? 'hero' : 'card'))

  const etiketten = (
    <>
      {post.typ === 'resultate' && (
        <span className="etikett bg-rot px-2.5 py-1 font-display text-xs tracking-[0.18em] text-white uppercase">
          Resultate
        </span>
      )}
      {teamName && (
        <span className="etikett bg-blau px-2.5 py-1 font-display text-xs tracking-[0.18em] text-white uppercase">
          {teamName}
        </span>
      )}
    </>
  )

  return (
    <article
      className={`kachel group relative flex flex-col overflow-hidden bg-white shadow-md transition-shadow hover:shadow-2xl ${
        gross ? 'sm:col-span-2' : ''
      }`}
    >
      {hatBild ? (
        <Link href={`/news/${post.slug}`} className="relative block overflow-hidden">
          <Bild
            bild={post.titelbild}
            groesse={gross ? 'hero' : 'card'}
            className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              gross ? 'aspect-16/9' : 'aspect-3/2'
            }`}
            sizes={gross ? '(max-width: 640px) 100vw, 60vw' : '(max-width: 640px) 100vw, 30vw'}
            priority={gross}
          />
          <div className="absolute top-0 left-0 flex flex-wrap gap-px">{etiketten}</div>
        </Link>
      ) : (
        // Ohne Bild: schmaler Farbbalken statt leerer Fläche.
        <div className="trikotband-schmal" />
      )}

      <div className={`flex flex-1 flex-col p-5 ${gross && !hatBild ? 'sm:p-7' : ''}`}>
        {!hatBild && (teamName || post.typ === 'resultate') && (
          <div className="mb-3 flex flex-wrap gap-px">{etiketten}</div>
        )}

        <time
          dateTime={post.datum}
          className="mb-2 font-display text-xs tracking-[0.2em] text-rot-dunkel uppercase"
        >
          {datumLang(post.datum)}
        </time>

        <h3
          className={`mb-2 leading-[0.95] text-nacht ${
            gross ? 'text-3xl sm:text-4xl' : hatBild ? 'text-2xl' : 'text-xl sm:text-2xl'
          }`}
        >
          <Link href={`/news/${post.slug}`} className="group-hover:text-rot-dunkel">
            {post.titel}
          </Link>
        </h3>

        {vorschau && <p className="mb-4 flex-1 text-sm leading-relaxed text-grau">{vorschau}</p>}

        <Link
          href={`/news/${post.slug}`}
          className="mt-auto self-start border-b-2 border-rot pb-0.5 font-display text-sm tracking-widest text-nacht uppercase transition-colors hover:text-rot"
        >
          Weiterlesen
        </Link>
      </div>
    </article>
  )
}
