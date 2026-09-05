// Shader de fond pour #about-numbers : réutilise EN LECTURE SEULE les
// shaders déjà validés du footer (footerWebGL.js n'est ni importé ni
// modifié — instance WebGL totalement indépendante, aucun état partagé).
// Idle identique au footer ; seule différence : la vitesse d'avancement du
// temps injecté dans uTime réagit à la vitesse du scroll (jamais uIdleSpeed
// lui-même, pour ne jamais sauter dans la phase du bruit).
// Aucune interaction souris : uStrength reste à 0 en permanence.

import VERTEX_SHADER from "./shaders/footer/vertex.glsl?raw"
import FRAGMENT_SHADER from "./shaders/footer/fragment.glsl?raw"

function createShader(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("aboutNumbersWebGL: erreur de compilation shader", gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  if (!vertexShader || !fragmentShader) return null

  const program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("aboutNumbersWebGL: erreur de link programme", gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }
  return program
}

/**
 * @param {HTMLElement} numbersEl  .about-numbers
 * @param {object} [options]
 * @param {number} [options.idleStrength=0.5]     identique au footer
 * @param {number} [options.idleSpeed=0.15]       identique au footer (jamais modifié en direct)
 * @param {number} [options.zoom=1.4]             identique au footer — à revérifier sur cette texture
 * @param {number} [options.maxPixelRatio=2]
 * @param {number} [options.baseTimeScale=1]      vitesse idle au repos
 * @param {number} [options.maxScrollBoost=3]     boost max ajouté à baseTimeScale
 * @param {number} [options.velocityReference=2500] px/s de scroll pour saturer le boost
 * @param {number} [options.riseDamping=8]        réactivité à l'accélération
 * @param {number} [options.fallDamping=1.5]      lenteur du retour au calme
 */
export function createAboutNumbersWebGL(numbersEl, options = {}) {
  const canvas = numbersEl.querySelector(".about-numbers-webgl")
  const imageEl = numbersEl.querySelector(".about-numbers-background img")
  if (!canvas || !imageEl) return null

  const config = {
    idleStrength: 0.25,
    idleSpeed: 0.1,
    zoom: 1.4,
    maxPixelRatio: 2,
    baseTimeScale: 1,
    maxScrollBoost: 8,
    velocityReference: 2500,
    riseDamping: 12,
    fallDamping: 1.5,
    ...options,
  }

  const gl =
    canvas.getContext("webgl", { alpha: false, premultipliedAlpha: false }) ||
    canvas.getContext("experimental-webgl", { alpha: false, premultipliedAlpha: false })
  if (!gl) return null

  const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER)
  if (!program) return null

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const aPosition = gl.getAttribLocation(program, "aPosition")

  const uniforms = {
    uTexture: gl.getUniformLocation(program, "uTexture"),
    uResolution: gl.getUniformLocation(program, "uResolution"),
    uImageResolution: gl.getUniformLocation(program, "uImageResolution"),
    uMouse: gl.getUniformLocation(program, "uMouse"),
    uVelocity: gl.getUniformLocation(program, "uVelocity"),
    uStrength: gl.getUniformLocation(program, "uStrength"),
    uRadius: gl.getUniformLocation(program, "uRadius"),
    uTime: gl.getUniformLocation(program, "uTime"),
    uIdleStrength: gl.getUniformLocation(program, "uIdleStrength"),
    uIdleSpeed: gl.getUniformLocation(program, "uIdleSpeed"),
    uZoom: gl.getUniformLocation(program, "uZoom"),
  }

  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

  let textureReady = false
  let imageResolution = [1, 1]

  // Pas d'interaction souris : valeurs neutres fixées une fois pour toutes.
  // uStrength=0 annule mathématiquement mouseOffset quel que soit uVelocity.
  gl.useProgram(program)
  gl.uniform2f(uniforms.uMouse, 0.5, 0.5)
  gl.uniform2f(uniforms.uVelocity, 0, 0)
  gl.uniform1f(uniforms.uStrength, 0)
  gl.uniform1f(uniforms.uRadius, 0.4)

  // --- Temps injecté dans le shader : accumulé à un rythme qui varie selon
  // la vitesse de scroll, jamais en touchant uIdleSpeed (voir shader). ---
  let shaderTime = 0
  let currentTimeScale = config.baseTimeScale
  let previousScrollY = window.scrollY

  let rect = numbersEl.getBoundingClientRect()
  let resizeTimer = null

  function resizeCanvas() {
    rect = numbersEl.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, config.maxPixelRatio)
    const width = Math.max(1, Math.round(rect.width * dpr))
    const height = Math.max(1, Math.round(rect.height * dpr))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
    }
  }

  function scheduleCanvasResize() {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      resizeTimer = null
      resizeCanvas()
    }, 150)
  }

  resizeCanvas()
  window.addEventListener("resize", scheduleCanvasResize)

  const resizeObserver = new ResizeObserver(scheduleCanvasResize)
  resizeObserver.observe(numbersEl)

  let isVisible = false
  let rafId = null
  let lastTime = null
  const MAX_DT = 1 / 30

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      const wasVisible = isVisible
      isVisible = entries[0].isIntersecting
      if (isVisible && !wasVisible && rafId === null) {
        lastTime = null
        previousScrollY = window.scrollY // évite un pic de vélocité fictif au redémarrage
        rafId = requestAnimationFrame(loop)
      }
    },
    { rootMargin: "0px" },
  )
  intersectionObserver.observe(numbersEl)

  function renderFrame(rawDt) {
    if (!Number.isFinite(rawDt) || rawDt <= 0) rawDt = 1 / 60
    // dt clampé : utilisé pour le damping, l'accumulation de temps et le
    // rendu, afin qu'un hitch (onglet en arrière-plan, gros GC...) ne fasse
    // pas sauter l'animation d'un coup.
    const dt = Math.min(rawDt, MAX_DT)

    // Vitesse de scroll calculée avec rawDt (temps RÉEL entre deux frames),
    // volontairement PAS avec dt clampé : sinon un hitch réduirait
    // artificiellement le temps écoulé au dénominateur et gonflerait la
    // vélocité mesurée, déclenchant un boost maximal non désiré. À l'arrêt,
    // le delta de scrollY recalculé chaque frame retombe naturellement à 0.
    const currentScrollY = window.scrollY
    const scrollVelocity = Math.abs(currentScrollY - previousScrollY) / rawDt
    previousScrollY = currentScrollY

    const normalizedVelocity = Math.min(scrollVelocity / config.velocityReference, 1)
    const targetTimeScale = config.baseTimeScale + normalizedVelocity * config.maxScrollBoost

    const damping = targetTimeScale > currentTimeScale ? config.riseDamping : config.fallDamping
    currentTimeScale += (targetTimeScale - currentTimeScale) * (1 - Math.exp(-damping * dt))

    shaderTime += dt * currentTimeScale

    if (!textureReady) return

    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.enableVertexAttribArray(aPosition)
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.uniform1i(uniforms.uTexture, 0)
    gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height)
    gl.uniform2f(uniforms.uImageResolution, imageResolution[0], imageResolution[1])
    gl.uniform1f(uniforms.uTime, shaderTime)
    gl.uniform1f(uniforms.uIdleStrength, config.idleStrength)
    gl.uniform1f(uniforms.uIdleSpeed, config.idleSpeed)
    gl.uniform1f(uniforms.uZoom, config.zoom)

    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  function loop(timestamp) {
    const rawDt = lastTime === null ? 1 / 60 : (timestamp - lastTime) / 1000
    lastTime = timestamp

    renderFrame(rawDt)
    rafId = isVisible ? requestAnimationFrame(loop) : null
  }

  function uploadTexture() {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageEl)
    imageResolution = [imageEl.naturalWidth || 1, imageEl.naturalHeight || 1]
    textureReady = true
    renderFrame(1 / 60)
    canvas.style.opacity = "1"
  }

  if (imageEl.complete && imageEl.naturalWidth > 0) {
    uploadTexture()
  } else {
    imageEl.addEventListener("load", uploadTexture, { once: true })
  }

  function destroy() {
    if (rafId !== null) cancelAnimationFrame(rafId)
    clearTimeout(resizeTimer)
    intersectionObserver.disconnect()
    resizeObserver.disconnect()
    window.removeEventListener("resize", scheduleCanvasResize)
    imageEl.removeEventListener("load", uploadTexture)
    gl.deleteTexture(texture)
    gl.deleteBuffer(positionBuffer)
    gl.deleteProgram(program)
  }

  return { destroy }
}
