type LogoProps = {
  size?: number
}

function Logo({ size = 28 }: LogoProps) {
  return (
    <div className="logo">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="var(--accent)" />
        <path
          d="M8 11.5c2.5-1.2 5.2-1.2 8 .5 2.8-1.7 5.5-1.7 8-.5V22c-2.5-1.2-5.2-1.2-8 .5-2.8-1.7-5.5-1.7-8-.5z M16 12v10.5"
          fill="none"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
      <span className="logo-name">Investory</span>
    </div>
  )
}

export default Logo
