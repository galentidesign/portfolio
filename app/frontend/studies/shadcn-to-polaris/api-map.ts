// Component API mapping: CoBlend Chores flow → @shopify/polaris@13.9.5
//
// CoBlend component APIs verified from the Chores flow source.
// Polaris component APIs verified from:
//   node_modules/@shopify/polaris/build/ts/src/components/**/*.d.ts (v13.9.5)
//
// Component universe covers every component used in the Chores Index / Create / Edit flow:
//   Button (CVA), Badge/StatusBadge, Card variants, Checkbox (Radix), Input, Textarea,
//   Label (Radix), FormField (hand-rolled), native <select>, Dialog (Radix),
//   ToggleGroup (hand-rolled), Toaster (sonner), EmptyState wrapper,
//   ListItemCard rows (Index is a card list, not a table), @dnd-kit sortable step editor.
//
// Classification legend:
//   clean         — near-direct equivalent; API surface is compatible.
//   standardized  — equivalent role; API model or prop names require adaptation.
//   mismatch      — no Polaris equivalent or fundamentally incompatible model.

import type { ApiRow } from './types'

export const API_MAP: readonly ApiRow[] = [
  {
    id: 'button',
    component: 'Button',
    coBlendApi:
      'CVA (v0.7.1); variants: default/destructive/outline/secondary/ghost/ghost-on-dark/destructive-ghost/link; sizes: default/sm/lg/icon/touch (h-12); asChild via Radix Slot@1.2.4',
    polarisComponent: 'Button',
    polarisApi:
      'variant: plain | primary | secondary | tertiary | monochromePlain; tone: critical | success; size: micro | slim | medium | large',
    note: 'Eight CVA variants collapse to five Polaris variants; ghost/ghost-on-dark → plain; touch size (h-12) has no direct Polaris size; asChild pattern has no Polaris equivalent.',
    classification: 'standardized',
  },
  {
    id: 'badge',
    component: 'Badge + StatusBadge',
    coBlendApi:
      'shadcn Badge; variants: default/secondary/destructive/outline; StatusBadge wrapper maps pending→warning, verified→success, denied→destructive, info, points',
    polarisComponent: 'Badge',
    polarisApi:
      'tone: info | success | warning | critical | attention | new | magic | info-strong | success-strong | warning-strong | critical-strong | attention-strong | read-only | enabled; size: small | medium | large',
    note: 'StatusBadge pending/verified/denied map cleanly to Polaris warning/success/critical tones; points tone has no Polaris home.',
    classification: 'clean',
  },
  {
    id: 'card',
    component: 'Card (highlight/glow/achievement variants)',
    coBlendApi:
      'shadcn Card (CardHeader/CardContent/CardFooter); highlight and glow effects via className; achievement variant includes animation (pulse-once keyframe)',
    polarisComponent: 'Card',
    polarisApi: 'children, title, sectioned, roundedAbove',
    note: 'Polaris Card has no variant prop; highlight/glow visual treatments would require a custom wrapper outside the component API; animation requires a reduced-motion gate.',
    classification: 'mismatch',
  },
  {
    id: 'checkbox',
    component: 'Checkbox',
    coBlendApi:
      'Radix UI Checkbox@1.3.3; controlled via checked/onCheckedChange; requires pairing with Radix Label for accessible association',
    polarisComponent: 'Checkbox',
    polarisApi:
      'label (required, wired internally); checked; onChange(newChecked: boolean, id: string); helpText; error',
    note: 'Polaris Checkbox bundles its label and wires the association internally; Radix requires a separate Label component configured correctly.',
    classification: 'standardized',
  },
  {
    id: 'input',
    component: 'Input',
    coBlendApi:
      'shadcn Input; native HTML input wrapped with CVA styling; no built-in label, helpText, or error — provided by the surrounding FormField',
    polarisComponent: 'TextField',
    polarisApi:
      'label (required); value; onChange(value: string, id: string); error; helpText; autoComplete (required)',
    note: 'Polaris TextField bundles label, error text, and help text; shadcn Input is a bare wrapper that relies on FormField for those concerns.',
    classification: 'standardized',
  },
  {
    id: 'textarea',
    component: 'Textarea',
    coBlendApi:
      'shadcn Textarea; native HTML textarea with CVA styling; same FormField dependency as Input',
    polarisComponent: 'TextField',
    polarisApi: 'multiline: true | number (row count); all other props same as TextField',
    note: 'Polaris uses a single TextField with multiline prop rather than a separate Textarea component.',
    classification: 'clean',
  },
  {
    id: 'label',
    component: 'Label',
    coBlendApi:
      'Radix Label@2.1.8; standalone component associated via htmlFor; must be co-located with the input in FormField',
    polarisComponent: '(built into TextField, Checkbox, Select)',
    polarisApi: 'label prop on each input component — association is internal and always present',
    note: 'Polaris inputs own their labels as required props; Radix Label is a standalone primitive requiring correct consumer wiring.',
    classification: 'standardized',
  },
  {
    id: 'form-field',
    component: 'FormField (hand-rolled)',
    coBlendApi:
      'Custom wrapper: passes label + htmlFor, renders required asterisk, renders error text below field via aria-describedby, wraps any input primitive',
    polarisComponent: 'FormLayout (layout) + individual field props',
    polarisApi:
      'FormLayout and FormLayout.Group for spatial arrangement; each field component (TextField, Select, Checkbox) carries label, error, helpText as first-class props',
    note: 'CoBlend FormField is an external composition layer; Polaris distributes those concerns into each field component, making them impossible to omit accidentally.',
    classification: 'standardized',
  },
  {
    id: 'select',
    component: 'Native <select>',
    coBlendApi:
      'Native HTML select element used in Chores flow (scope, sort, recurrence); shadcn Select@2.2.6 is installed but unused in this flow',
    polarisComponent: 'Select',
    polarisApi:
      'label (required); options: (SelectOption | SelectGroup)[]; value; onChange(selected: string, id: string); error; labelHidden; placeholder',
    note: 'Near-direct migration; Polaris Select adds built-in label wiring, error display, and group support that native select lacks.',
    classification: 'clean',
  },
  {
    id: 'dialog',
    component: 'Dialog',
    coBlendApi:
      'Radix Dialog@1.1.15 used for delete confirmation; inherits Radix focus trap and focus restoration; sr-only close button with accessible label',
    polarisComponent: 'Modal',
    polarisApi:
      'open; title (required); onClose() (required); children; footer; size: small | large | fullScreen; sectioned',
    note: 'Both provide focus trap and focus restoration on close; Polaris Modal requires explicit footer content for action buttons whereas Radix Dialog.Footer is a layout primitive.',
    classification: 'clean',
  },
  {
    id: 'toggle-group',
    component: 'ToggleGroup (hand-rolled)',
    coBlendApi:
      'Plain button group; no radiogroup ARIA role; no aria-pressed on individual buttons; no arrow-key navigation between options',
    polarisComponent: 'ChoiceList',
    polarisApi:
      'title; choices: { value, label }[]; selected: string[]; allowMultiple; onChange(selected: string[], name: string); renders with radiogroup / checkboxgroup role',
    note: 'The hand-rolled ToggleGroup has a keyboard and screen-reader gap; ChoiceList provides correct radiogroup semantics and arrow-key navigation out of the box.',
    classification: 'mismatch',
  },
  {
    id: 'toaster',
    component: 'Toaster (sonner)',
    coBlendApi:
      'sonner@2.0.7; toast() / toast.success() / toast.error() imperative API; portal-positioned outside the component tree',
    polarisComponent: 'Toast + Frame',
    polarisApi:
      'Toast: content, active, onDismiss, duration, error; requires Frame wrapper for portal positioning',
    note: 'sonner is a self-contained toast library; Polaris Toast is a Frame-dependent component — Frame must wrap the page root for Toast to render correctly.',
    classification: 'standardized',
  },
  {
    id: 'empty-state',
    component: 'EmptyState wrapper',
    coBlendApi:
      'Custom wrapper: shadcn Card with an icon slot (Lucide icon@0.577.0) and a CTA Button; no image required',
    polarisComponent: 'EmptyState',
    polarisApi:
      'image (required — URL or path); heading; children; action: ComplexAction; secondaryAction: ComplexAction',
    note: 'Polaris EmptyState requires an image prop (not an icon); the custom wrapper would need to be replaced with a real illustration asset.',
    classification: 'mismatch',
  },
  {
    id: 'list-item-card',
    component: 'ListItemCard (card list — Index view)',
    coBlendApi:
      'Custom ListItemCard rows rendered in a flex container; no table semantics, no column headers, no bulk-selection support',
    polarisComponent: 'IndexTable or ResourceList',
    polarisApi:
      'IndexTable: headings (NonEmptyArray), itemCount, rows with IndexTable.Row + IndexTable.Cell; ResourceList: items, renderItem with ResourceItem',
    note: 'Card list has no semantic table structure; IndexTable adds accessible column headers, row selection, and bulk actions; ResourceList is simpler for card-style rows.',
    classification: 'standardized',
  },
  {
    id: 'dnd-kit',
    component: '@dnd-kit sortable step editor',
    coBlendApi:
      '@dnd-kit/core@6.3.1 with PointerSensor only; no KeyboardSensor registered; drag-to-reorder of ordered steps in the Edit view',
    polarisComponent: 'none',
    polarisApi: '—',
    note: 'No Polaris drag-and-drop primitive exists; the PointerSensor-only configuration violates WCAG 2.1 SC 2.1.1 on both platforms — keyboard reorder must be added regardless.',
    classification: 'mismatch',
  },
]
