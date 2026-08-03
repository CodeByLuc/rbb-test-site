import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

/** Gibt den Text aus dem Redaktionssystem als HTML aus. */
export function Fliesstext({
  daten,
  className = '',
}: {
  daten?: SerializedEditorState | null
  className?: string
}) {
  if (!daten) return null
  return <RichText data={daten} className={`fliesstext ${className}`} />
}

/** Zieht reinen Text aus dem Editor-Inhalt, z. B. für Vorschauen und Meta-Beschreibungen. */
export function textAuszug(daten: unknown, maxLaenge = 180): string {
  const sammeln = (knoten: unknown): string => {
    if (!knoten || typeof knoten !== 'object') return ''
    const k = knoten as Record<string, unknown>
    if (typeof k.text === 'string') return k.text
    if (Array.isArray(k.children)) return k.children.map(sammeln).join(' ')
    if (k.root) return sammeln(k.root)
    return ''
  }

  const text = sammeln(daten).replace(/\s+/g, ' ').trim()
  if (text.length <= maxLaenge) return text
  return `${text.slice(0, maxLaenge).replace(/\s+\S*$/, '')} …`
}
