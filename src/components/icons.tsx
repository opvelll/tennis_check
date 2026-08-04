import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function IconBase({ size = 22, children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {children}
    </svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m5 12.5 4.2 4L19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </IconBase>
  )
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m15 5-7 7 7 7M8 12h11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </IconBase>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m9 5 7 7-7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </IconBase>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </IconBase>
  )
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M14 5h5v5M19 5l-8 8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </IconBase>
  )
}

export function FilterIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </IconBase>
  )
}

export function ListIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <circle cx="4.5" cy="6" fill="currentColor" r="1.25" />
      <circle cx="4.5" cy="12" fill="currentColor" r="1.25" />
      <circle cx="4.5" cy="18" fill="currentColor" r="1.25" />
    </IconBase>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </IconBase>
  )
}

export function SettingsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19 13.5v-3l-2.2-.7a7 7 0 0 0-.7-1.6l1-2-2.2-2.1-2 1a7 7 0 0 0-1.8-.7l-.6-2.2h-3L7 4.4a7 7 0 0 0-1.8.7l-2-1L1.1 6.2l1 2a7 7 0 0 0-.7 1.7l-2.2.6v3l2.2.7a7 7 0 0 0 .7 1.7l-1 2 2.1 2.1 2-1a7 7 0 0 0 1.8.7l.6 2.2h3l.7-2.2a7 7 0 0 0 1.7-.7l2 1 2.1-2.1-1-2a7 7 0 0 0 .7-1.7L19 13.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" transform="translate(2 -0.1) scale(.91)" />
    </IconBase>
  )
}

export function ClipboardIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 5.5H6.5A1.5 1.5 0 0 0 5 7v12a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V7a1.5 1.5 0 0 0-1.5-1.5H16" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 3.5h6v4H9zM8 12h8M8 16h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </IconBase>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </IconBase>
  )
}
