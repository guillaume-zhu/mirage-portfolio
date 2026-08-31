// Shader de fond interactif pour #footer : un plan plein écran (1 triangle),
// une texture (réutilise l'<img> déjà chargée), et un fragment shader qui
// pousse légèrement la matière autour du curseur, avec inertie et retour au
// calme. Aucune dépendance à GSAP/ScrollTrigger : ce module ne gère que le
// rendu du background, jamais la transition de section.

import VERTEX_SHADER from "./shaders/footer/vertex.glsl?raw"
import FRAGMENT_SHADER from "./shaders/footer/fragment.glsl?raw"

function createShader(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("footerWebGL: erreur de compilation shader", gl.getShaderInfoLog(shader))
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
    console.error("footerWebGL: erreur de link programme", gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }
  return program
}

function frameIndependentDamping(damping, dt) {
  // `damping` est calibré pour une référence 60 fps (valeur intuitive 0..1).
  // On le convertit en facteur d'interpolation exponentielle indépendant du
  // framerate : le même `damping` produit la même vitesse de convergence
  // perçue à 60 Hz, 120 Hz, etc.
  return 1 - Math.pow(1 - damping, dt * 60)
}

/**
 * Initialise le shader de fond du footer.
 * @param {HTMLElement} footerEl  #footer (les pointer events s'y accrochent, pas sur le canvas)
 * @param {object} [options]
 * @param {number} [options.radius=0.22]           rayon d'influence (uv écran, corrigé du ratio)
 * @param {number} [options.velocityGain=0.25]      amplifie la vélocité (uv/s) avant envoi au shader
 * @param {number} [options.positionDamping=0.1]    lissage de la position du curseur (plus petit = plus visqueux)
 * @param {number} [options.velocityDamping=0.15]   lissage de la vélocité déjà lissée
 * @param {number} [options.strengthRise=0.15]      vitesse de montée de l'intensité
 * @param {number} [options.strengthDecay=0.05]     vitesse de résorption de l'intensité
 * @param {number} [options.maxPixelRatio=1.5]
 * @returns {{ destroy: () => void } | null} null si WebGL indisponible (le fallback <img> reste seul visible)
 */
export function createFooterWebGL(footerEl, options = {}) {
  const canvas = footerEl.querySelector(".footer-webgl")
  const imageEl = footerEl.querySelector(".footer-background-image")
  if (!canvas || !imageEl) return null

  const config = {
    radius: 0.4,
    velocityGain: 0.25,
    positionDamping: 0.1,
    velocityDamping: 0.15,
    strengthRise: 0.15,
    strengthDecay: 0.01,
    idleStrength: 0.5,
    idleSpeed: 0.15,
    zoom: 1.4,
    maxPixelRatio: 2,
    ...options,
  }

  const gl =
    canvas.getContext("webgl", { alpha: false, premultipliedAlpha: false }) ||
    canvas.getContext("experimental-webgl", { alpha: false, premultipliedAlpha: false })
  if (!gl) return null

  const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER)
  if (!program) return null

  // Triangle plein écran : couvre tout le clip-space avec un seul triangle
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

  // --- Curseur : position cible mise à jour par les events, tout le lissage
  // (position -> vélocité -> intensité) se fait dans la render loop. Doit
  // exister AVANT tout appel possible à renderFrame() (donc avant la gestion
  // de la texture, tout en bas). ---
  const targetMouse = { x: 0.5, y: 0.5 }
  const smoothedMouse = { x: 0.5, y: 0.5 }
  const prevMouse = { x: 0.5, y: 0.5 }
  const rawVelocity = { x: 0, y: 0 }
  const smoothedVelocity = { x: 0, y: 0 }
  let strength = 0
  let pointerActive = false

  // Temps accumulé à partir des dt réels (jamais le timestamp absolu de rAF) :
  // quand l'IntersectionObserver arrête puis relance la loop, l'idle reprend
  // sans saut, exactement là où il s'était arrêté.
  let elapsedTime = 0

  let rect = footerEl.getBoundingClientRect()
  let rectDirty = false

  function updateTargetFromEvent(e) {
    const relX = (e.clientX - rect.left) / rect.width
    const relYFromTop = (e.clientY - rect.top) / rect.height
    targetMouse.x = relX
    targetMouse.y = 1 - relYFromTop // conversion vers la convention "y vers le haut" du shader
  }

  function onPointerEnter(e) {
    pointerActive = true
    updateTargetFromEvent(e)
  }
  function onPointerMove(e) {
    pointerActive = true
    updateTargetFromEvent(e)
  }
  function onPointerLeave() {
    pointerActive = false
  }

  footerEl.addEventListener("pointerenter", onPointerEnter)
  footerEl.addEventListener("pointermove", onPointerMove)
  footerEl.addEventListener("pointerleave", onPointerLeave)

  function markRectDirty() {
    rectDirty = true
  }
  window.addEventListener("resize", markRectDirty)
  window.addEventListener("scroll", markRectDirty, { passive: true })

  function resizeCanvas() {
    rect = footerEl.getBoundingClientRect()
    rectDirty = false
    const dpr = Math.min(window.devicePixelRatio || 1, config.maxPixelRatio)
    const width = Math.max(1, Math.round(rect.width * dpr))
    const height = Math.max(1, Math.round(rect.height * dpr))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
    }
  }
  resizeCanvas()

  const resizeObserver = new ResizeObserver(() => resizeCanvas())
  resizeObserver.observe(footerEl)

  // --- Render loop, actif uniquement quand le footer est visible ---
  let isVisible = false
  let rafId = null
  let lastTime = null
  const MAX_DT = 1 / 30 // borne les gros sauts (tab en pause, reprise après arrêt de la boucle, etc.)

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      const wasVisible = isVisible
      isVisible = entries[0].isIntersecting
      if (isVisible && !wasVisible && rafId === null) {
        lastTime = null // évite un dt géant calculé depuis le dernier arrêt de la boucle
        rafId = requestAnimationFrame(loop)
      }
    },
    { rootMargin: "0px" },
  )
  intersectionObserver.observe(footerEl)

  function renderFrame(dt) {
    // Protection avant toute division : dt invalide (NaN, 0, négatif) ou trop
    // grand (reprise après une pause) retombe sur une valeur nominale sûre.
    if (!Number.isFinite(dt) || dt <= 0) dt = 1 / 60
    dt = Math.min(dt, MAX_DT)

    elapsedTime += dt

    if (rectDirty) resizeCanvas()

    const posFactor = frameIndependentDamping(config.positionDamping, dt)
    smoothedMouse.x += (targetMouse.x - smoothedMouse.x) * posFactor
    smoothedMouse.y += (targetMouse.y - smoothedMouse.y) * posFactor

    // Vélocité normalisée par le temps (uv/seconde), pas par frame.
    rawVelocity.x = ((smoothedMouse.x - prevMouse.x) / dt) * config.velocityGain
    rawVelocity.y = ((smoothedMouse.y - prevMouse.y) / dt) * config.velocityGain
    prevMouse.x = smoothedMouse.x
    prevMouse.y = smoothedMouse.y

    const velFactor = frameIndependentDamping(config.velocityDamping, dt)
    smoothedVelocity.x += (rawVelocity.x - smoothedVelocity.x) * velFactor
    smoothedVelocity.y += (rawVelocity.y - smoothedVelocity.y) * velFactor

    const speed = Math.hypot(smoothedVelocity.x, smoothedVelocity.y)
    const targetStrength = pointerActive ? Math.min(speed * 6, 1) : 0
    const strengthDamping = strength < targetStrength ? config.strengthRise : config.strengthDecay
    const strengthFactor = frameIndependentDamping(strengthDamping, dt)
    strength += (targetStrength - strength) * strengthFactor

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
    gl.uniform2f(uniforms.uMouse, smoothedMouse.x, smoothedMouse.y)
    gl.uniform2f(uniforms.uVelocity, smoothedVelocity.x, smoothedVelocity.y)
    gl.uniform1f(uniforms.uStrength, strength)
    gl.uniform1f(uniforms.uRadius, config.radius)
    gl.uniform1f(uniforms.uTime, elapsedTime)
    gl.uniform1f(uniforms.uIdleStrength, config.idleStrength)
    gl.uniform1f(uniforms.uIdleSpeed, config.idleSpeed)
    gl.uniform1f(uniforms.uZoom, config.zoom)

    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  function loop(timestamp) {
    const dt = lastTime === null ? 1 / 60 : (timestamp - lastTime) / 1000
    lastTime = timestamp

    renderFrame(dt)
    rafId = isVisible ? requestAnimationFrame(loop) : null
  }

  // --- Texture : gérée EN DERNIER, une fois tout l'état ci-dessus prêt —
  // uploadTexture() peut s'exécuter de façon synchrone si l'image est déjà
  // en cache (imageEl.complete === true dès l'appel), et appelle directement
  // renderFrame(). ---
  function uploadTexture() {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageEl)
    imageResolution = [imageEl.naturalWidth || 1, imageEl.naturalHeight || 1]
    textureReady = true
    renderFrame(1 / 60) // premier rendu valide, pendant que le canvas est encore invisible
    canvas.style.opacity = "1"
  }

  if (imageEl.complete && imageEl.naturalWidth > 0) {
    uploadTexture()
  } else {
    imageEl.addEventListener("load", uploadTexture, { once: true })
  }

  function destroy() {
    if (rafId !== null) cancelAnimationFrame(rafId)
    intersectionObserver.disconnect()
    resizeObserver.disconnect()
    window.removeEventListener("resize", markRectDirty)
    window.removeEventListener("scroll", markRectDirty)
    footerEl.removeEventListener("pointerenter", onPointerEnter)
    footerEl.removeEventListener("pointermove", onPointerMove)
    footerEl.removeEventListener("pointerleave", onPointerLeave)
    imageEl.removeEventListener("load", uploadTexture)
    gl.deleteTexture(texture)
    gl.deleteBuffer(positionBuffer)
    gl.deleteProgram(program)
  }

  return { destroy }
}
