/**
 * The assembly-opening beat sequence — ids, order, and narrative captions.
 * The motion timeline's labels and the e2e/perf hooks key on these ids;
 * captions are the content-parity surface between static and motion modes.
 * Scroll ranges live in the motion layer (see README timeline contract).
 */

export interface Beat {
  id: 'tokens' | 'atom' | 'molecule' | 'organisms' | 'shell'
  caption: string
}

export const BEATS: readonly Beat[] = [
  {
    id: 'tokens',
    caption: 'Raw tokens — the palette, type, spacing, and easing every component compiles from.',
  },
  {
    id: 'atom',
    caption: 'Atom — a Button compiles from four tokens.',
  },
  {
    id: 'molecule',
    caption: 'Molecule — label, input, and button become a Form Field.',
  },
  {
    id: 'organisms',
    caption: 'Organisms — the same tokens, composed into Nav and Table.',
  },
  {
    id: 'shell',
    caption: "The shell itself — the same system, snapped together. You're inside it now.",
  },
] as const
