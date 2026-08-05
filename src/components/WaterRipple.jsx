import { useEffect, useRef } from 'react'

// Interactive water-ripple image. Renders one or two images (cross-fading via
// `designer`) on a WebGL canvas and radiates expanding ripples from wherever the
// pointer moves — like disturbing the surface of water. Dependency-free.
//
// props:
//   images   [pilotSrc, designerSrc]  — second is optional; cross-faded in
//   designer boolean                   — when true, blends toward images[1]
//   alignX/Y 0..1                      — cover-crop focus (default right, center)

const MAX = 16 // max simultaneous ripples

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex0;
uniform sampler2D uTex1;
uniform float uBlend;
uniform vec2 uScale0;
uniform vec2 uOffset0;
uniform vec2 uScale1;
uniform vec2 uOffset1;
uniform float uAspect;
uniform int uCount;
uniform vec2 uCenters[${MAX}];
uniform float uStarts[${MAX}];
uniform float uNow;

void main(){
  vec2 uv = vUv;
  vec2 disp = vec2(0.0);
  for(int i = 0; i < ${MAX}; i++){
    if(i >= uCount) break;
    vec2 dir = uv - uCenters[i];
    dir.x *= uAspect;                 // keep ripples circular
    float d = length(dir);
    float age = uNow - uStarts[i];
    float front = age * 0.55;         // ring expansion speed
    float ring = exp(-pow((d - front) / 0.045, 2.0));
    float env = exp(-age * 2.4) * smoothstep(0.0, 0.05, age);
    float wave = sin((d - front) * 140.0);
    disp += (dir / (d + 1e-5)) * (0.02 * ring * env * wave);
  }
  disp.x /= uAspect;

  vec2 suv = uv + disp;
  vec4 c0 = texture2D(uTex0, suv * uScale0 + uOffset0);
  vec4 c1 = texture2D(uTex1, suv * uScale1 + uOffset1);
  vec4 col = mix(c0, c1, uBlend);
  col.rgb += clamp(length(disp) * 7.0, 0.0, 0.3); // wet sheen on the ripple crests
  gl_FragColor = col;
}
`

export default function WaterRipple({ images, designer = false, alignX = 1, alignY = 0.5, className, style }) {
  const canvasRef = useRef(null)
  const designerRef = useRef(designer)
  designerRef.current = designer

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false })
    if (!gl) {
      // no/failed WebGL → show the first image via CSS so it's never blank
      const first = (images || [])[0]
      if (first) {
        canvas.style.backgroundImage = `url(${first})`
        canvas.style.backgroundSize = 'cover'
        canvas.style.backgroundPosition = 'center right'
      }
      return
    }

    // --- compile program ---
    const compile = (type, src) => {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    // --- fullscreen quad ---
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    // --- uniforms ---
    const U = (n) => gl.getUniformLocation(prog, n)
    const u = {
      tex0: U('uTex0'), tex1: U('uTex1'), blend: U('uBlend'),
      scale0: U('uScale0'), offset0: U('uOffset0'), scale1: U('uScale1'), offset1: U('uOffset1'),
      aspect: U('uAspect'), count: U('uCount'), centers: U('uCenters[0]'),
      starts: U('uStarts[0]'), now: U('uNow'),
    }
    gl.uniform1i(u.tex0, 0)
    gl.uniform1i(u.tex1, 1)
    // safe defaults so the very first frames map the full image (never the
    // white corner) even before cover/size is computed
    gl.uniform2f(u.scale0, 1, 1); gl.uniform2f(u.offset0, 0, 0)
    gl.uniform2f(u.scale1, 1, 1); gl.uniform2f(u.offset1, 0, 0)
    gl.uniform1f(u.aspect, 1)
    gl.uniform1f(u.blend, 0)

    // --- textures ---
    const makeTex = (unit) => {
      const tex = gl.createTexture()
      gl.activeTexture(gl.TEXTURE0 + unit)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      // 1px placeholder until the image loads
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([10, 16, 26, 255]))
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      return tex
    }
    const texs = [makeTex(0), makeTex(1)]
    const sizes = [null, null]

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    ;(images || []).slice(0, 2).forEach((src, i) => {
      if (!src) return
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        gl.activeTexture(gl.TEXTURE0 + i)
        gl.bindTexture(gl.TEXTURE_2D, texs[i])
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
        sizes[i] = [img.naturalWidth, img.naturalHeight]
        computeCover()
      }
      img.src = src
    })

    // --- cover-crop mapping (like CSS background-size:cover) ---
    let W = 1, H = 1
    const coverFor = (loc, size) => {
      if (!size) { gl.uniform2f(loc.s, 1, 1); gl.uniform2f(loc.o, 0, 0); return }
      const ca = W / H, ia = size[0] / size[1]
      let sx = 1, sy = 1
      if (ia > ca) sx = ca / ia // image wider → crop sides
      else sy = ia / ca         // image taller → crop top/bottom
      gl.uniform2f(loc.s, sx, sy)
      gl.uniform2f(loc.o, (1 - sx) * alignX, (1 - sy) * alignY)
    }
    const computeCover = () => {
      gl.uniform1f(u.aspect, W / H)
      coverFor({ s: u.scale0, o: u.offset0 }, sizes[0])
      coverFor({ s: u.scale1, o: u.offset1 }, sizes[1] || sizes[0])
    }

    // --- resize (only act on real size changes; defer to avoid RO loop warnings) ---
    let resizeScheduled = false
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = canvas.getBoundingClientRect()
      const nw = Math.max(1, Math.round(r.width * dpr))
      const nh = Math.max(1, Math.round(r.height * dpr))
      if (nw === W && nh === H) return
      W = nw; H = nh
      canvas.width = W
      canvas.height = H
      gl.viewport(0, 0, W, H)
      computeCover()
    }
    const ro = new ResizeObserver(() => {
      if (resizeScheduled) return
      resizeScheduled = true
      requestAnimationFrame(() => { resizeScheduled = false; resize() })
    })
    ro.observe(canvas)
    resize()

    // --- ripples from the pointer ---
    const ripples = [] // { x, y, t0 }
    const MAX_AGE = 1.7
    const t0 = performance.now()
    const nowS = () => (performance.now() - t0) / 1000
    let lastSpawn = 0

    const spawn = (clientX, clientY) => {
      const r = canvas.getBoundingClientRect()
      const x = (clientX - r.left) / r.width
      const y = 1 - (clientY - r.top) / r.height // flip to GL bottom-origin
      if (x < 0 || x > 1 || y < 0 || y > 1) return
      const t = nowS()
      if (t - lastSpawn < 0.04) return // throttle the trail a little
      lastSpawn = t
      ripples.push({ x, y, t0: t })
      if (ripples.length > MAX) ripples.shift()
    }
    const onMove = (e) => spawn(e.clientX, e.clientY)
    const onTouch = (e) => { const t = e.touches[0]; if (t) spawn(t.clientX, t.clientY) }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('touchmove', onTouch, { passive: true })

    // --- render loop ---
    const centers = new Float32Array(MAX * 2)
    const starts = new Float32Array(MAX)
    let blend = designerRef.current ? 1 : 0
    let raf

    const frame = () => {
      const t = nowS()
      // cull expired ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        if (t - ripples[i].t0 > MAX_AGE) ripples.splice(i, 1)
      }
      const n = ripples.length
      for (let i = 0; i < n; i++) {
        centers[i * 2] = ripples[i].x
        centers[i * 2 + 1] = ripples[i].y
        starts[i] = ripples[i].t0
      }
      // ease the pilot→designer blend
      const target = designerRef.current ? 1 : 0
      blend += (target - blend) * 0.09

      gl.useProgram(prog)
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texs[0])
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texs[1])
      gl.uniform1i(u.count, n)
      gl.uniform2fv(u.centers, centers)
      gl.uniform1fv(u.starts, starts)
      gl.uniform1f(u.now, t)
      gl.uniform1f(u.blend, blend)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('touchmove', onTouch)
      // NOTE: do NOT call WEBGL_lose_context here. In React StrictMode the
      // component mounts, unmounts, then remounts on the SAME canvas (= same GL
      // context), so losing it in cleanup would kill the live remount's context.
      // The browser reclaims the context when the canvas is removed.
    }
    // Set up the WebGL context once. `images`/align are read at mount only; the
    // pilot→designer change comes through designerRef, not a re-run (a re-run
    // here would recreate the GL context every frame and exhaust the browser).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <canvas ref={canvasRef} className={className} style={style} aria-hidden="true" />
}
