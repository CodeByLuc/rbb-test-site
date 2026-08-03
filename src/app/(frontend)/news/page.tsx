import type { Metadata } from 'next'

import { PostKarte } from '../../../components/PostKarte'
import { Seitenkopf } from '../../../components/Seitenkopf'
import { holePosts, holeStimmungsbild } from '../../../lib/daten'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'News',
  description: 'Berichte, Resultate und Mitteilungen des EHC Rot-Blau Bern-Bümpliz.',
}

export default async function NewsSeite() {
  const [posts, kopfbild] = await Promise.all([holePosts({ limit: 50 }), holeStimmungsbild()])

  return (
    <>
      <Seitenkopf
        titel="News"
        untertitel="Spielberichte, Wochenresultate und Mitteilungen aus dem Verein."
        hintergrundbild={kopfbild}
      />

      <div className="inhalt py-14">
        {posts.length === 0 ? (
          <p className="bg-white p-8 text-grau shadow-sm">
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
