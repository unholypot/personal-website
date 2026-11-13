// A small rocket in the descent's three tones. It bobs gently, and lifts off a little when the
// email link beside it is hovered or focused. Decorative.
export default function Rocket() {
  return (
    <svg className="rocket" viewBox="0 0 40 64" aria-hidden="true" focusable="false">
      <g className="rocket-body">
        <path d="M20 2 C28 12 30 24 29 42 L11 42 C10 24 12 12 20 2 Z" fill="#f2e6ce" />
        <path d="M20 2 C28 12 30 24 29 42 L21 42 C22 22 22 10 20 2 Z" fill="#d6c9ae" />
        <circle cx="20" cy="22" r="5" fill="#14213d" />
        <circle cx="20" cy="22" r="2.4" fill="#2f8f8b" />
        <path d="M11 30 L2 46 L11 42 Z" fill="#d9532b" />
        <path d="M29 30 L38 46 L29 42 Z" fill="#a83c1c" />
        <path d="M11 42 H29 L26 47 H14 Z" fill="#14213d" />
        <path className="rocket-flame" d="M15 47 L20 62 L25 47 Z" fill="#e3a72f" />
      </g>
    </svg>
  )
}
