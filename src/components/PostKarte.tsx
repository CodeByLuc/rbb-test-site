import Link from 'next/link'

import { datumLang } from '../lib/daten'
import type { Post } from '../payload-types'
import { Bild } from './Bild'
import { textAuszug } from './Fliesstext'

export function PostKarte({ post, gross = false }: { post: Post; gross?: boolean }) {
  const vorschau = post.auszug?.trim() || textAuszug(post.inhalt, gross ? 200 : 130)
  const teamName = typeof post.team === 'object' && post.team ? post.team.name : null

  return (
    <article
      className={`group relative flex flex-col overflow-hidden bg-white shadow-md transition-shadow hover:shadow-2xl ${
        gross ? 'sm:col-span-2' : ''
      }`}
    >
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

        {/* Etiketten auf dem Bild */}
        <div className="absolute top-0 left-0 flex flex-wrap gap-px">
          {post.typ === 'resultate' && (
            <span className="bg-rot px-2.5 py-1 font-display text-xs tracking-[0.18em] text-white uppercase">
              Resultate
            </span>
          )}
          {teamName && (
            <span className="bg-blau px-2.5 py-1 font-display text-xs tracking-[0.18em] text-white uppercase">
              {teamName}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <time
          dateTime={post.datum}
          className="mb-2 font-display text-xs tracking-[0.2em] text-rot-dunkel uppercase"
        >
          {datumLang(post.datum)}
        </time>

        <h3 className={`mb-2 leading-[0.95] text-nacht ${gross ? 'text-3xl sm:text-4xl' : 'text-2xl'}`}>
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
