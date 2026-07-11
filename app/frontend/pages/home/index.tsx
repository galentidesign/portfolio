import { Head } from '@inertiajs/react'
import { useFx } from '@/ds/motion/useFx'
import { whenIdle } from '@/ds/motion/capabilities'
import type { FxHandle } from '@/ds/motion/fx/types'
import { AssemblyOpening } from '@/story/assembly/AssemblyOpening'
import { PrologueBeat } from '@/story/prologue/PrologueBeat'
import { ScrollRetheme, ScrollRethemeStory } from '@/story/retheme'
import { ScrollProgress } from '@/shell/story/ScrollProgress'
import { RailsBeat } from '@/story/beats/RailsBeat'
import { ReactBeat } from '@/story/beats/ReactBeat'
import { AgenticBeat } from '@/story/beats/AgenticBeat'
import { WordmarkBeat } from '@/story/beats/WordmarkBeat'
import { WorkBeat } from '@/story/beats/WorkBeat'
import { CloseBeat } from '@/story/beats/CloseBeat'
import { IslandMount } from '@/story/beats/IslandMount'
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
  // Beat 00 — the atmosphere (drift + thesis focus cascade) arrives after
  // load + idle AND the visitor's first gesture. The full statement is the
  // LCP paint, and LCP only stops observing at first input — mounting
  // animated content into the LCP viewport (or replaying its largest
  // element) before then re-times the metric to the end of the animation.
  // A real visitor's first scroll/touch arrives almost immediately; an
  // input-less session simply keeps the finished, still statement.
  const liftoffRef = useFx<HTMLElement>((fx, el) => {
    const handles: FxHandle[] = []
    let idleReady = false
    let inputSeen = false
    let played = false

    const INPUT_EVENTS = ['pointerdown', 'pointermove', 'wheel', 'touchstart', 'keydown', 'scroll']
    const playWhenReady = () => {
      if (played || !idleReady || !inputSeen) return
      played = true
      for (const type of INPUT_EVENTS) window.removeEventListener(type, onInput)
      handles.push(fx.mountDrift(el, { preset: 'bone' }))
      const thesis = el.querySelector<HTMLElement>('[data-thesis]')
      if (thesis !== null) {
        handles.push(fx.mountFocusCascade(thesis, { stagger: 0.09, maxDuration: 2.4 }))
      }
    }
    const onInput = () => {
      inputSeen = true
      playWhenReady()
    }
    for (const type of INPUT_EVENTS) {
      window.addEventListener(type, onInput, { passive: true })
    }

    const cancelIdle = whenIdle(() => {
      idleReady = true
      playWhenReady()
    })

    return {
      destroy: () => {
        cancelIdle()
        for (const type of INPUT_EVENTS) window.removeEventListener(type, onInput)
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
          {/* ── 00 · Liftoff — the thesis sharpens into focus on bone ───── */}
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
          <IslandMount placeholderHeight="72rem">
            <RailsBeat />
          </IslandMount>

          <ScrollRetheme
            skin="react-era"
            treatment="webpack"
            caption="webpack: compiling… ⚡ built in 2.4s"
          />
          <IslandMount placeholderHeight="64rem">
            <ReactBeat />
          </IslandMount>

          <ScrollRetheme
            skin="agentic"
            treatment="terminal"
            caption={KILN_BOOT}
            warmFonts={AGENTIC_FONTS}
          />
          <IslandMount placeholderHeight="64rem">
            <AgenticBeat />
          </IslandMount>

          {/* ── 06 · Resolution — sweep home to bone, the wordmark moment ── */}
          <ScrollRetheme caption="— present day" />
          <IslandMount placeholderHeight="36rem">
            <WordmarkBeat />
          </IslandMount>

          {/* ── 07 · The work — the skim destination. Eager on purpose: the
              hatch's #the-work target must exist from the first click, and
              the 90-second gate rides this beat. ─────────────────────────── */}
          <WorkBeat galleryBand={galleryBand} />

          {/* ── 08 · System · résumé · close ──────────────────────────────── */}
          <IslandMount placeholderHeight="40rem">
            <CloseBeat />
          </IslandMount>
        </ScrollRethemeStory>
      </main>
    </>
  )
}
