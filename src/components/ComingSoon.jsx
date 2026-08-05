import { useEffect, useMemo } from 'react'
import './ComingSoon.css'

// Temporary launch splash for samprati.design.
// To go live with the real portfolio: set SHOW_COMING_SOON = false in App.jsx
// (and later delete ComingSoon.jsx + ComingSoon.css).
export default function ComingSoon() {
  useEffect(() => {
    const prev = document.title
    document.title = 'samprati.design — Coming soon'
    return () => { document.title = prev }
  }, [])

  return (
    <div className="cs-root" role="main">
      <BackgroundArt />
      <div className="cs-vignette" aria-hidden="true" />
      <Starfield />
      <span className="cs-shoot cs-shoot-a" aria-hidden="true" />
      <span className="cs-shoot cs-shoot-b" aria-hidden="true" />

      <div className="cs-inner">
        <p className="cs-eyebrow">
          <span className="cs-eyebrow-dot" />Coming soon · 2026
        </p>
        <h1 className="cs-title">samprati<span className="dot">.</span>design</h1>
        <p className="cs-sub">
          The new home for <b>Samprati Dash</b> — product &amp; experience designer with
          12+ years turning complex, data-heavy products into calm, usable experiences.
          A sharper portfolio is in the making.
        </p>

        <div className="cs-status">
          <span className="cs-pulse" />
          In the making — launching soon
        </div>

        <div className="cs-cta">
          <a href="mailto:withsimplydash@gmail.com">Get in touch</a>
          <span className="cs-cta-sep">·</span>
          <a href="/Samprati_Dash_Resume.pdf" target="_blank" rel="noopener noreferrer">View résumé</a>
        </div>
      </div>

      <div className="cs-foot">© {new Date().getFullYear()} Samprati Dash · All rights reserved</div>
    </div>
  )
}

// A twinkling starfield — stars generated once, each with its own size, position
// and twinkle rhythm so the sky feels alive rather than static.
function Starfield() {
  const stars = useMemo(() => {
    const rand = (a, b) => a + Math.random() * (b - a)
    return Array.from({ length: 90 }, () => ({
      left: `${rand(0, 100)}%`,
      top: `${rand(0, 100)}%`,
      size: `${rand(1, 2.6).toFixed(2)}px`,
      delay: `${rand(0, 6).toFixed(2)}s`,
      dur: `${rand(2.4, 6).toFixed(2)}s`,
      base: rand(0.15, 0.6).toFixed(2),
    }))
  }, [])

  return (
    <div className="cs-stars" aria-hidden="true">
      {stars.map((s, i) => (
        <span
          key={i}
          className="cs-star"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            '--base': s.base,
            animationDelay: s.delay,
            animationDuration: s.dur,
          }}
        />
      ))}
    </div>
  )
}

// The public/background.svg art, inlined so its glow + flare can be animated.
// The orb drifts, the glow rings breathe, and the lens flare shimmers.
function BackgroundArt() {
  return (
    <svg
      className="cs-svg"
      viewBox="0 0 500 300"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <style>{`
        .cls-1,.cls-2,.cls-3,.cls-4,.cls-5,.cls-6{mix-blend-mode:screen}
        .cls-3{fill:url(#radial-gradient)}
        .cls-6{fill:url(#radial-gradient-2)}
        .cls-7{fill:url(#radial-gradient-3)}
        .cls-10{fill:url(#linear-gradient)}
        .cls-5{fill:url(#radial-gradient-4)}
        .cls-2{fill:url(#radial-gradient-5)}
        .cls-1{fill:url(#radial-gradient-6)}
        .cls-9{fill:#1b181f}

        /* --- animation --- */
        .cls-3,.cls-6,.cls-7{transform-box:fill-box;transform-origin:center;
          animation:cs-glow 6s ease-in-out infinite}
        .cls-6{animation-duration:5s;animation-delay:-1s}
        .cls-7{animation-duration:7s;animation-delay:-2s}
        .cls-1,.cls-2,.cls-5{animation:cs-flare 6.5s ease-in-out infinite}
        .cls-2{animation-duration:5.5s;animation-delay:-1.5s}
        .cls-1{animation-duration:8s}
        .cs-orb{animation:cs-drift 14s ease-in-out infinite}

        @keyframes cs-glow{0%,100%{opacity:.72;transform:scale(1)}
          50%{opacity:1;transform:scale(1.05)}}
        @keyframes cs-flare{0%,100%{opacity:.55}50%{opacity:1}}
        @keyframes cs-drift{0%,100%{transform:translate(0,0)}
          50%{transform:translate(0,-6px)}}

        @media (prefers-reduced-motion:reduce){
          .cls-1,.cls-2,.cls-3,.cls-5,.cls-6,.cls-7,.cs-orb{animation:none}
        }
      `}</style>

      <defs>
        <radialGradient id="radial-gradient" cx="251.08" cy="181.85" fx="251.08" fy="181.85" r="119.86" gradientTransform="translate(-28.27 -43.13) scale(1.11 1.06)" gradientUnits="userSpaceOnUse">
          <stop offset=".66" stopColor="#b3506d" />
          <stop offset=".68" stopColor="#9d4660" />
          <stop offset=".73" stopColor="#6d3142" />
          <stop offset=".78" stopColor="#461f2a" />
          <stop offset=".83" stopColor="#271118" />
          <stop offset=".88" stopColor="#11070a" />
          <stop offset=".92" stopColor="#040202" />
          <stop offset=".96" stopColor="#000" />
        </radialGradient>
        <radialGradient id="radial-gradient-2" cy="181.85" fy="181.85" r="106.8" href="#radial-gradient" />
        <radialGradient id="radial-gradient-3" cx="249.48" cy="-185.33" fx="249.48" fy="-185.33" r="106.8" gradientTransform="translate(11.73 230.46) scale(.96 .65)" gradientUnits="userSpaceOnUse">
          <stop offset=".66" stopColor="#d46b00" />
          <stop offset=".71" stopColor="#9d4f00" />
          <stop offset=".75" stopColor="#6e3700" />
          <stop offset=".8" stopColor="#462300" />
          <stop offset=".84" stopColor="#271400" />
          <stop offset=".89" stopColor="#110800" />
          <stop offset=".93" stopColor="#040200" />
          <stop offset=".96" stopColor="#000" />
        </radialGradient>
        <linearGradient id="linear-gradient" x1="250" y1="264.7" x2="250" y2="30.23" gradientUnits="userSpaceOnUse">
          <stop offset=".28" stopColor="#1b181f" />
          <stop offset=".96" stopColor="#2b282f" />
        </linearGradient>
        <radialGradient id="radial-gradient-4" cx="-395.81" cy="-2552.02" fx="-395.81" fy="-2552.02" r="170.22" gradientTransform="translate(-65.29 318.73) rotate(90) scale(.56 .16)" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#b3506d" />
          <stop offset="0" stopColor="#b04f6b" />
          <stop offset=".08" stopColor="#873c52" />
          <stop offset=".15" stopColor="#632c3c" />
          <stop offset=".24" stopColor="#441e29" />
          <stop offset=".33" stopColor="#2b131a" />
          <stop offset=".43" stopColor="#180a0e" />
          <stop offset=".55" stopColor="#0a0406" />
          <stop offset=".69" stopColor="#020101" />
          <stop offset=".96" stopColor="#000" />
        </radialGradient>
        <radialGradient id="radial-gradient-5" cx="-395.81" fx="-395.81" r="100.01" gradientTransform="translate(-65.29 318.73) rotate(90) scale(.56 .16)" href="#radial-gradient-4" />
        <radialGradient id="radial-gradient-6" cx="-343.3" cy="1843.45" fx="-343.3" fy="1843.45" r="119.86" gradientTransform="translate(138.02 615.12) rotate(-180) scale(.56 .28)" href="#radial-gradient-4" />
      </defs>

      <rect className="cls-9" width="500" height="300" />
      <g className="cs-orb">
        <g>
          <g>
            <ellipse className="cls-3" cx="250" cy="148.89" rx="132.84" ry="126.56" />
            <ellipse className="cls-6" cx="250" cy="148.89" rx="118.37" ry="112.77" />
            <g className="cls-4">
              <ellipse className="cls-7" cx="250" cy="110.59" rx="102" ry="69.08" />
            </g>
          </g>
          <circle className="cls-10" cx="250" cy="169.37" r="108.3" />
        </g>
        <g>
          <ellipse className="cls-5" cx="330.46" cy="96.86" rx="26.4" ry="95.42" transform="translate(20.48 246.86) rotate(-42.16)" />
          <ellipse className="cls-2" cx="330.46" cy="96.86" rx="15.51" ry="56.06" transform="translate(20.48 246.86) rotate(-42.16)" />
        </g>
        <ellipse className="cls-1" cx="330.46" cy="96.86" rx="67.18" ry="33.7" transform="translate(31.17 267.19) rotate(-45.98)" />
      </g>
    </svg>
  )
}
