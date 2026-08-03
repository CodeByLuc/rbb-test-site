import {
  BlockquoteFeature,
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnderlineFeature,
  UnorderedListFeature,
  UploadFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * Absichtlich reduzierter Editor: nur Werkzeuge, die im Vereinsalltag gebraucht
 * werden. Die Werkzeugleiste ist fest eingeblendet (FixedToolbarFeature), damit
 * sie nicht erst beim Markieren von Text erscheint.
 */
export const einfacherEditor = lexicalEditor({
  features: [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    LinkFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    BlockquoteFeature(),
    UploadFeature({ collections: { media: { fields: [] } } }),
    HorizontalRuleFeature(),
    FixedToolbarFeature(),
  ],
})
