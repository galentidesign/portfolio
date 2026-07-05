import { createContext, useContext, useState, type ReactNode } from 'react'
import {
  skins as allSkins,
  defaultSkin,
  skinNames,
  SKIN_STORAGE_KEY,
  type SkinMeta,
  type SkinName,
} from '@/ds/tokens/generated/skins'

interface SkinContextValue {
  skin: SkinName
  setSkin: (name: SkinName, opts?: { persist?: boolean }) => void
  skins: readonly SkinMeta[]
}

const SkinContext = createContext<SkinContextValue | null>(null)

function isSkinName(value: string): value is SkinName {
  return (skinNames as readonly string[]).includes(value)
}

function getInitialSkin(): SkinName {
  const attr = document.documentElement.dataset.skin
  if (attr !== undefined && isSkinName(attr)) return attr
  return defaultSkin.name as SkinName
}

export function SkinProvider({ children }: { children: ReactNode }) {
  const [skin, setSkinState] = useState<SkinName>(getInitialSkin)

  const setSkin = (name: SkinName, opts?: { persist?: boolean }) => {
    document.documentElement.dataset.skin = name
    setSkinState(name)
    if (opts?.persist !== false) {
      try {
        localStorage.setItem(SKIN_STORAGE_KEY, name)
      } catch {
        // private mode or storage quota exceeded
      }
    }
  }

  return (
    <SkinContext.Provider value={{ skin, setSkin, skins: allSkins }}>
      {children}
    </SkinContext.Provider>
  )
}

/**
 * Returns the current skin name, a setter, and the full skin registry (including hidden entries).
 * Consumers that render a switcher UI should filter out `skins.filter(s => !s.hidden)`.
 *
 * Must be called within a <SkinProvider> — throws otherwise.
 */
export function useSkin(): SkinContextValue {
  const ctx = useContext(SkinContext)
  if (ctx === null) {
    throw new Error('useSkin must be called within a <SkinProvider>')
  }
  return ctx
}
