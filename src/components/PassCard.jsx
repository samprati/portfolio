import { forwardRef } from 'react'

// A boarding-pass shaped card: blue header block, white body, and a dashed
// perforation with punched edge notches separating a small tear-off stub —
// modelled on assets/boarding pass.svg.
const BLUE = '#0b5fb8'
const PERF = '#8a8a96'
const STUB_H = 62 // height of the tear-off stub, px
const NOTCH = 12 // notch radius, px

// two transparent circles punched into the side edges, on the perforation line
const notchMask =
  `radial-gradient(circle ${NOTCH}px at 0 calc(100% - ${STUB_H}px), transparent ${NOTCH - 0.5}px, #000 ${NOTCH}px),` +
  `radial-gradient(circle ${NOTCH}px at 100% calc(100% - ${STUB_H}px), transparent ${NOTCH - 0.5}px, #000 ${NOTCH}px)`

const PassCard = forwardRef(function PassCard({ header, children, stub, style, headerStyle }, ref) {
  const masked = stub
    ? {
        maskImage: notchMask,
        WebkitMaskImage: notchMask,
        maskComposite: 'intersect',
        WebkitMaskComposite: 'source-in',
      }
    : null

  return (
    // outer clips the rounded corners; inner carries the white fill + notches
    <div ref={ref} style={{ ...pp.outer, ...style }}>
      <div style={{ ...pp.inner, ...masked }}>
        <div style={{ ...pp.header, ...headerStyle }}>{header}</div>
        <div style={{ ...pp.body, paddingBottom: stub ? STUB_H + 12 : 26 }}>{children}</div>
        {stub && <div style={pp.perf} />}
        {stub && <div style={pp.stub}>{stub}</div>}
        {/* moving specular glare — tracks the mouse for a glossy 3D look */}
        <div style={pp.glare} />
      </div>
    </div>
  )
})

export default PassCard

const MONO = "'SF Mono', ui-monospace, 'Roboto Mono', Menlo, monospace"
const HEAD = "'PP Gosha Sans', sans-serif"

export const pp = {
  outer: {
    position: 'absolute',
    borderRadius: 18,
    overflow: 'hidden',
    // layered shadows + a bright top edge → a card that sits above the scene
    boxShadow:
      '0 2px 0 rgba(255,255,255,0.5) inset, 0 34px 90px rgba(6,20,40,0.5), 0 12px 30px rgba(6,20,40,0.34)',
    border: '1px solid rgba(255,255,255,0.5)',
    willChange: 'opacity, transform',
    transformStyle: 'preserve-3d',
  },
  inner: {
    position: 'relative',
    background: 'rgba(255,255,255,0.96)',
    color: '#1d2836',
    WebkitBackdropFilter: 'blur(3px)',
    backdropFilter: 'blur(3px)',
    overflow: 'hidden',
  },
  glare: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background:
      'radial-gradient(circle at var(--mx,50%) var(--my,32%), rgba(255,255,255,0.5), rgba(255,255,255,0.12) 30%, transparent 58%)',
    mixBlendMode: 'soft-light',
    opacity: 0.9,
  },
  header: {
    background: BLUE,
    color: '#fff',
    padding: '22px 30px 24px',
  },
  body: {
    padding: '22px 30px 0',
  },
  perf: {
    position: 'absolute',
    left: NOTCH - 2,
    right: NOTCH - 2,
    bottom: STUB_H,
    borderTop: `2px dashed ${PERF}`,
    opacity: 0.6,
  },
  stub: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: STUB_H,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: '0 30px',
  },

  // ---- content helpers ----
  kickerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.82)',
  },
  tag: {
    background: 'rgba(255,255,255,0.92)',
    color: BLUE,
    fontWeight: 700,
    padding: '3px 9px',
    borderRadius: 5,
    letterSpacing: 1.5,
  },
  headTitle: {
    fontFamily: HEAD,
    fontWeight: 800,
    lineHeight: 1.04,
    letterSpacing: 0.3,
    margin: '14px 0 0',
  },
  headSub: {
    fontSize: 13,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 10,
    fontWeight: 600,
  },
  years: {
    fontFamily: MONO,
    fontSize: 12.5,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 8,
  },
  story: {
    fontSize: 16,
    lineHeight: 1.6,
    color: '#39485a',
    margin: '0 0 18px',
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: {
    fontFamily: MONO,
    fontSize: 11.5,
    letterSpacing: 0.3,
    color: BLUE,
    background: 'rgba(11,95,184,0.08)',
    border: '1px solid rgba(11,95,184,0.28)',
    borderRadius: 999,
    padding: '5px 11px',
  },
  barcode: {
    height: 34,
    width: '52%',
    background:
      'repeating-linear-gradient(90deg,#1d2836 0,#1d2836 2px,transparent 2px,transparent 4px,#1d2836 4px,#1d2836 7px,transparent 7px,transparent 9px,#1d2836 9px,#1d2836 10px,transparent 10px,transparent 13px)',
  },
  stubMeta: {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 1.5,
    color: '#6a7788',
    textAlign: 'right',
    lineHeight: 1.4,
  },
  // blue-on-white link for the arrival contact
  link: {
    color: BLUE,
    textDecoration: 'none',
    borderBottom: `1px solid ${BLUE}`,
    paddingBottom: 1,
  },
}
