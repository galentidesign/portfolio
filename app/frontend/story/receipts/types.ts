/**
 * Types for the agent-build receipt data — one entry per milestone session.
 * Source: docs/receipts/2026-07-04-m0.md through 2026-07-06-m9.md.
 */

export type AgentTier = 'frontier' | 'mid' | 'small'

export interface AgentGroup {
  tier: AgentTier
  count: number
  /** e.g. "orchestrator", "parallel build", "e2e", "extraction" */
  role: string
}

export interface SuiteCounts {
  unit: number
  rspec: number
  e2e: number
}

export interface MilestoneReceipt {
  /** "m0".."m9" */
  id: string
  /** ISO date from the receipt filename */
  date: string
  /** repo-relative path, e.g. "docs/receipts/2026-07-06-m9.md" */
  sourcePath: string
  /** H1 title text after the "MN — " prefix, date parens stripped */
  title: string
  /** one tight sentence (≤140 chars) condensed from the receipt's goal statement, reusing its own words */
  goal: string
  commits: number
  /** e.g. "a6f3a36..4cc498e" when the receipt states it */
  range?: string
  filesChanged?: number
  insertions?: number
  /** orchestrator first */
  agents: AgentGroup[]
  /** suite counts stated at that session's close */
  suite?: SuiteCounts
  /** 2–4 notable workflow moments, ≤160 chars each, tight paraphrase or verbatim fragments */
  moments: string[]
  /** verbatim quote (1–2 sentences, ≤300 chars) — only for the 3–5 juiciest sessions */
  excerpt?: string
}
