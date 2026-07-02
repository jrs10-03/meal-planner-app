// Small inline stroke icons (no dependency).
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const Icon = {
  Search: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>),
  Plus: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>),
  Trash: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" {...base} {...p}><path d="M4 7h16M9 7V5h6v2m-8 0 1 13h8l1-13" /></svg>),
  Edit: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" {...base} {...p}><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="M14 6l4 4" /></svg>),
  Gear: (p) => (<svg viewBox="0 0 24 24" width="20" height="20" {...base} {...p}><circle cx="12" cy="12" r="3.2" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>),
  External: (p) => (<svg viewBox="0 0 24 24" width="14" height="14" {...base} {...p}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h5" /></svg>),
  Close: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>),
  Up: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" {...base} {...p}><path d="m6 15 6-6 6 6" /></svg>),
  Down: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" {...base} {...p}><path d="m6 9 6 6 6-6" /></svg>),
  Check: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" {...base} {...p}><path d="m5 12 5 5L20 6" /></svg>),
  Copy: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" {...base} {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></svg>),
  Fire: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" {...base} {...p}><path d="M12 3c1 3-2 4-2 7a2 2 0 0 0 4 0c0-1 0-1 .5-2 1.5 1.5 2.5 3 2.5 5a5 5 0 0 1-10 0c0-4 3-6 5-10Z" /></svg>),
  Spark: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" {...base} {...p}><path d="M12 3v4m0 10v4m9-9h-4M7 12H3m13.5-6.5-2.8 2.8M9.3 14.7l-2.8 2.8m11 0-2.8-2.8M9.3 9.3 6.5 6.5" /></svg>),
}
