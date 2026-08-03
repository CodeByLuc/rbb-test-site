import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Bild } from '../../../../components/Bild'
import { Fliesstext, textAuszug } from '../../../../components/Fliesstext'
import { datumLang, holePost, holePosts } from '../../../../lib/daten'

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const posts = await holePosts({ limit: 100 })
  return posts.filter((post) => post.slug).map((post) => ({ slug: post.slug! }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await holePost(slug)
  if (!post) return { title: 'Beitrag nicht gefunden' }

  return {
    title: post.titel,
    description: post.auszug?.trim() || textAuszug(post.inhalt, 160),
  }
}

export default async function BeitragSeite({ params }: Props) {
  const { slug } = await params
  const post = await holePost(slug)
  if (!post) notFound()

  const autorName = typeof post.autor === 'object' && post.autor ? post.autor.name : null
  const team = typeof post.team === 'object' && post.team ? post.team : null
  const galerie = (post.galerie ?? []).filter((eintrag) => eintrag.bild)

  return (
    <article className="pb-16">
      <div className="bg-blau text-white">
        <div className="inhalt max-w-3xl py-12 sm:py-16">
          <Link
            href="/news"
            className="mb-6 inline-flex items-center gap-1 font-display text-sm tracking-wide text-white/70 uppercase hover:text-white"
          >
            <span aria-hidden="true">←</span> Alle News
          </Link>
          <h1 className="text-4xl sm:text-5xl">{post.titel}</h1>
          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
            <time dateTime={post.datum}>{datumLang(post.datum)}</time>
            {autorName && <span>· von {autorName}</span>}
            {team && (
              <Link href={`/teams/${team.slug}`} className="underline hover:text-white">
                · {team.name}
              </Link>
            )}
          </p>
        </div>
        <div className="kante h-1.5" />
      </div>

      <div className="inhalt max-w-3xl">
        {post.titelbild && (
          <Bild
            bild={post.titelbild}
            groesse="hero"
            priority
            className="mt-8 w-full object-cover shadow-sm"
            sizes="(max-width: 768px) 100vw, 48rem"
          />
        )}

        {post.auszug && (
          <p className="mt-8 border-l-4 border-rot pl-4 text-lg leading-relaxed text-nacht">
            {post.auszug}
          </p>
        )}

        <div className="mt-8">
          <Fliesstext daten={post.inhalt} />
        </div>

        {galerie.length > 0 && (
          <section className="mt-12">
            <h2 className="abschnittstitel mb-4 text-3xl text-nacht">Bilder</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {galerie.map((eintrag, index) => (
                <Bild
                  key={eintrag.id ?? index}
                  bild={eintrag.bild}
                  groesse="card"
                  className="aspect-[3/2] w-full object-cover shadow-sm"
                  sizes="(max-width: 640px) 100vw, 24rem"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}
