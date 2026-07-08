/**
 * Figma (file FDrHYp9F366R2GZ0Ra9koO, "SkinSwitcher" page) — component
 * "SkinSwitcher", a segmented pill (selected = accent-muted bg + ink text,
 * rest ink-muted). Options are registry-driven in code; Figma mirrors a fixed
 * 4-skin set (galenti selected).
 * @see https://www.figma.com/design/FDrHYp9F366R2GZ0Ra9koO/portfolio?node-id=93-3
 * Tokens come from the "Tokens" variable collection — skins galenti | rails-era
 * | react-era | agentic (+ night/day zones); flip mode at the frame level.
 */
import { useId } from 'react'
import { useSkin } from '@/shell/skin/SkinProvider'
import type { SkinName } from '@/ds/tokens/generated/skins'
import styles from './styles.module.css'

export interface SkinSwitcherProps {
  legend?: string
}

export function SkinSwitcher({ legend = 'Skin' }: SkinSwitcherProps) {
  const { skin, setSkin, skins } = useSkin()
  const visibleSkins = skins.filter((s) => !s.hidden)
  const radioName = useId()

  return (
    <fieldset className={styles.switcher}>
      <legend className={styles['legend-hidden']}>{legend}</legend>
      {visibleSkins.map((s) => (
        <label key={s.name} className={styles.item} data-checked={s.name === skin ? '' : undefined}>
          <input
            type="radio"
            name={radioName}
            value={s.name}
            checked={s.name === skin}
            onChange={() => setSkin(s.name as SkinName)}
          />
          <span>{s.label}</span>
        </label>
      ))}
    </fieldset>
  )
}
