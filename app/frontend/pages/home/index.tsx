import { Head } from '@inertiajs/react'
import { useFx } from '@/ds/motion/useFx'
import { whenIdle } from '@/ds/motion/capabilities'
import type { FxHandle } from '@/ds/motion/fx/types'
import { AssemblyOpening } from '@/story/assembly/AssemblyOpening'
import { PrologueBeat } from '@/story/prologue/PrologueBeat'
import { ScrollRetheme, ScrollRethemeStory } from '@/story/retheme'
import { ScrollProgress } from '@/shell/story/ScrollProgress'
import { RailsBeat, ReactBeat, AgenticBeat, WordmarkBeat, WorkBeat, CloseBeat } from '@/story/beats'
import type { ProjectCard } from '@/gallery/types'
import styles from './styles.module.css'

// The locked thesis (webapp-concept decision 3) — shared verbatim with /work.
const THESIS =
  'Design technologist — I architect enterprise-scale design systems, ship them in production code, and write the agentic-AI playbook for design orgs.'

// Era fonts warmed by the boundaries before their crossings (chapter parity).
const RAILS_FONTS = ['Source Sans 3', 'Source Code Pro'] as const
const AGENTIC_FONTS = ['Hanken Grotesk', 'JetBrains Mono'] as const

// Terminal-boot caption — same lines the agentic chapter streams.
const KILN_BOOT = [
  '$ session start — kiln',
  '▸ agents: fleet ready',
  '▸ receipts: streaming',
] as const

interface HomeProps {
  galleryBand?: ProjectCard[]
}

/**
 * Home-as-Story (design-direction.md): one continuous scroll built from nine
 * beats — liftoff thesis, the untouched assembly overture, the prologue,
 * three era beats crossed by inline scroll rethemes, the wordmark
 * resolution, the work (skim destination), and the quiet close. Chapter
 * routes survive as deep-dives; the escape hatch jumps straight to beat 07.
 */
export default function Home({ galleryBand }: HomeProps) {
  // Beat 00 — the drift atmosphere and the thesis write-in arrive after
  // load + idle: the full statement is the LCP paint, the motion replays it.
  const liftoffRef = useFx<HTMLElement>((fx, el) => {
    const handles: FxHandle[] = []
    const cancelIdle = whenIdle(() => {
      handles.push(fx.mountDrift(el, { preset: 'bone' }))
      const thesis = el.querySelector<HTMLElement>('[data-thesis]')
      if (thesis !== null) {
        handles.push(fx.mountTypewriter(thesis, { charInterval: 0.022, maxDuration: 2.6 }))
      }
    })
    return {
      destroy: () => {
        cancelIdle()
        for (const handle of handles) handle.destroy()
      },
    }
  })

  return (
    <>
      <Head title="J Galenti">
        <meta
          name="description"
          content="J Galenti — design technologist. A portfolio built as evidence: a token-driven design system, re-theming story chapters, and agent-built receipts."
        />
      </Head>
      <main id="main" className={styles.page}>
        <ScrollProgress />
        <ScrollRethemeStory>
          {/* ── 00 · Liftoff — the thesis writes itself on bone ─────────── */}
          <section
            ref={liftoffRef}
            className={styles.liftoff}
            aria-label="Thesis"
            data-testid="liftoff"
          >
            <p className={styles['liftoff-kicker']}>00 · the story builds on scroll</p>
            <p className={styles.thesis} data-thesis data-testid="thesis">
              {THESIS}
            </p>
            <p className={styles['liftoff-cue']} aria-hidden="true">
              scroll ↓
            </p>
          </section>

          {/* ── 01 · Assembly — the flagship overture, choreography as-is ── */}
          <AssemblyOpening />

          {/* ── 02 · Prologue — the skip control's landing target ────────── */}
          <div id="gateway" tabIndex={-1} className={styles['prologue-wrap']}>
            <PrologueBeat />
          </div>

          {/* ── 03–05 · Era beats — the page rethemes inline on scroll ───── */}
          <ScrollRetheme
            skin="rails-era"
            treatment="crt"
            caption="loading 2014…"
            warmFonts={RAILS_FONTS}
          />
          <RailsBeat />

          <ScrollRetheme
            skin="react-era"
            treatment="webpack"
            caption="webpack: compiling… ⚡ built in 2.4s"
          />
          <ReactBeat />

          <ScrollRetheme
            skin="agentic"
            treatment="terminal"
            caption={KILN_BOOT}
            warmFonts={AGENTIC_FONTS}
          />
          <AgenticBeat />

          {/* ── 06 · Resolution — sweep home to bone, the wordmark moment ── */}
          <ScrollRetheme caption="— present day" />
          <WordmarkBeat />

          {/* ── 07 · The work — the skim destination (hatch lands here) ──── */}
          <WorkBeat galleryBand={galleryBand} />

          {/* ── 08 · System · résumé · close ──────────────────────────────── */}
          <CloseBeat />
        </ScrollRethemeStory>
      </main>
    </>
  )
}
