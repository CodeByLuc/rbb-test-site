import type { Metadata } from 'next'

import { PostKarte } from '../../../components/PostKarte'
import { holePosts } from '../../../lib/daten'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'News',
  description: 'Berichte, Resultate und Mitteilungen des EHC Rot-Blau Bern-Bümpliz.',
}

export default async function NewsSeite() {
  const posts = await holePosts({ limit: 50 })

  return (
    <>
      {/*
        Kein sichtbarer Seitentitel mehr – die Navigation zeigt bereits, dass
        man auf «News» ist. Ein unsichtbares h1 bleibt für Screenreader und
        Suchmaschinen bestehen, die pro Seite eine Hauptüberschrift erwarten.
      */}
      <h1 className="sr-only">News</h1>

      <div className="inhalt py-14">
        {posts.length === 0 ? (
          <p className="kachel bg-white p-8 text-grau shadow-sm">
            Es sind noch keine Beiträge veröffentlicht.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostKarte key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
