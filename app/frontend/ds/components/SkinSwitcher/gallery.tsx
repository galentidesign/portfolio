import { useSkin } from '@/shell/skin/SkinProvider'
import { SkinSwitcher } from './SkinSwitcher'

export const galleryMeta = { slug: 'skin-switcher', title: 'Skin Switcher' }

export default function SkinSwitcherGallery() {
  const { skin } = useSkin()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        padding: 'var(--space-5)',
      }}
    >
      <SkinSwitcher />
      <span
        style={{
          fontFamily: 'var(--type-mono-family)',
          fontSize: 'var(--type-mono-size)',
          color: 'var(--color-ink-muted)',
        }}
      >
        current skin from useSkin() (live): {skin}
      </span>
    </div>
  )
}
