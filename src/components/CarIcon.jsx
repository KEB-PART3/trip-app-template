// The roadtrip car, drawn instead of typed. Emoji are font glyphs with
// per-platform vertical metrics — the 🚗 sat high on desktop Chrome and low on
// Android, and no pixel nudge fixes both. An SVG has no font metrics: a
// flex-centered box centers it identically on every phone.
// Default width makes roof-to-wheels match the 16px clock digits in the Flights
// time column (13px rendered); pass width to match other type sizes.
export default function CarIcon({ width = 28 }) {
  return (
    <svg
      width={width}
      height={width * 0.625}
      viewBox="0 0 32 20"
      role="img"
      aria-label="car"
      style={{ display: 'block' }}
    >
      {/* body */}
      <path
        d="M3.5 9.5 L8 9 L12 4.5 Q12.4 4 13 4 H20 Q20.6 4 21 4.5 L24.8 9 L28.5 9.6 Q31 10.1 31 12.5 V14 Q31 15.5 29.5 15.5 H2.5 Q1 15.5 1 14 V12 Q1 10 3.5 9.5 Z"
        fill="#d64541"
      />
      {/* windows */}
      <path d="M12.9 5.4 H16 V9 H10 Z" fill="#cfe3ef" />
      <path d="M17.2 5.4 H19.8 L22.8 9 H17.2 Z" fill="#cfe3ef" />
      {/* wheels */}
      <circle cx="8.5" cy="15.5" r="3.4" fill="#26221e" />
      <circle cx="8.5" cy="15.5" r="1.4" fill="#8a8378" />
      <circle cx="23.5" cy="15.5" r="3.4" fill="#26221e" />
      <circle cx="23.5" cy="15.5" r="1.4" fill="#8a8378" />
    </svg>
  )
}
