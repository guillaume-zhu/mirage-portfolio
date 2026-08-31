// Hero de la page About : anneau d'images en orbite 3D autour d'un texte
// central, repris aussi fidèlement que possible de /references/about/hero
// ("mwg_effect106"). Le moteur original (placement radial sin/cos, tilt
// souris/tactile, contre-rotation, auto-rotation 12s, boost molette avec
// reset 120ms) est conservé tel quel.
//
// Adaptations Mirage : (1) le scroll de page n'est plus bloqué, un
// ScrollTrigger pin fini (heroScrollDistance) maintient juste la scène à
// l'écran ; (2) le texte central est intégré dans le même contexte 3D que
// les cards (voir .about-hero-text) pour profiter de la profondeur déjà
// produite par rotateX(90) + preserve-3d, plutôt que d'inventer un système
// de profondeur séparé — voir le commentaire sur textEl dans renderTilt().

export function initAboutHero(gsap, ScrollTrigger) {
  const root = document.querySelector(".about-hero")
  if (!root) return

  const mediasContainer = root.querySelector(".about-hero-medias")
  const medias = root.querySelectorAll(".about-hero-media")
  const textEl = root.querySelector(".about-hero-text")

  const baseAngles = Array.from({ length: medias.length }, (_, i) => (i / medias.length) * Math.PI * 2)

  const DESKTOP_MEDIA_VW = 10.7
  const MOBILE_MEDIA_VW = 27

  let mediaVw = DESKTOP_MEDIA_VW
  let layout

  function getLayout() {
    const w = window.innerWidth
    const h = window.innerHeight
    const scale = mediaVw / DESKTOP_MEDIA_VW
    return {
      w,
      h,
      scale,
      radiusDivisor: 2.8 / scale, // plus petit = rayon plus grand = images plus espacées
      minDivisor: 2.2 / scale,
      wheelRadiusFactor: 0.12 / scale,
      translateZ: -26 * scale,
    }
  }

  const transform = { rotateX: 90, rotateY: 0, rotateZ: 0, translateX: 0, translateY: 0 }
  const autoOffset = { value: 0 }
  const wheelOffset = { value: 0 }
  const wheelIntensity = { value: 0 }

  function renderTilt() {
    const { translateX, translateY, rotateX, rotateY, rotateZ } = transform
    const { translateZ } = layout
    mediasContainer.style.transform =
      `translate3d(${translateX}vw, ${translateY}vw, ${translateZ}vw) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`
    medias.forEach((el) => {
      gsap.set(el, { rotationX: -rotateX, rotationY: -rotateY, rotation: -rotateZ })
    })
    // Le texte partage le même contexte 3D que les cards (voir CSS) et ne
    // reçoit jamais de x/y : il reste donc exactement au centre de rotation
    // (une rotation ne déplace pas son propre pivot), à la profondeur médiane
    // de l'anneau. Seule la contre-rotation le garde lisible/à plat.
    gsap.set(textEl, { rotationX: -rotateX, rotationY: -rotateY, rotation: -rotateZ })
  }

  function updateScene() {
    root.style.perspective = `${100 + wheelIntensity.value * 30}vw`
    const offset = autoOffset.value + wheelOffset.value
    const { w, radiusDivisor, minDivisor, wheelRadiusFactor } = layout
    const radius = w / Math.max(minDivisor, radiusDivisor - wheelIntensity.value * wheelRadiusFactor)
    medias.forEach((el, i) => {
      const angle = offset + baseAngles[i]
      gsap.set(el, { x: Math.sin(angle) * radius, y: Math.cos(angle) * radius })
    })
  }

  const tilt = { duration: 0.8, ease: "power3" }
  const setRotateX = gsap.quickTo(transform, "rotateX", tilt)
  const setRotateY = gsap.quickTo(transform, "rotateY", tilt)
  const setRotateZ = gsap.quickTo(transform, "rotateZ", { ...tilt, onUpdate: renderTilt })
  const setWheelIntensity = gsap.quickTo(wheelIntensity, "value", {
    duration: 1.3,
    ease: "power2.out",
    onUpdate: updateScene,
  })
  const setWheelOffset = gsap.quickTo(wheelOffset, "value", { duration: 0.5, ease: "power2", onUpdate: updateScene })

  let wheelSpeed = 0
  let wheelResetTimer

  function applyTilt(clientX, clientY) {
    const { w, h } = layout
    setRotateY((clientX / w) * 50 - 25)
    setRotateX((clientY / h) * 40 - 20 + 90)
    setRotateZ(-(clientX / w) * 10 + 5)
  }

  function handleMouseMove(e) {
    applyTilt(e.clientX, e.clientY)
  }

  function handleTouchMove(e) {
    if (!e.touches?.[0]) return
    applyTilt(e.touches[0].clientX, e.touches[0].clientY)
  }

  function applyScroll(delta) {
    wheelSpeed += delta / 20
    setWheelOffset(wheelSpeed * 0.017)
    setWheelIntensity(Math.abs(delta) / 12)
    clearTimeout(wheelResetTimer)
    wheelResetTimer = setTimeout(() => setWheelIntensity(0), 120)
  }

  function handleWheel(e) {
    applyScroll(e.deltaY)
  }

  const autoTween = gsap.to(autoOffset, {
    value: Math.PI * 2,
    duration: 12,
    repeat: -1,
    ease: "none",
    onUpdate: updateScene,
  })

  const mm = gsap.matchMedia()
  mm.add("(max-width: 768px)", () => {
    mediaVw = MOBILE_MEDIA_VW
  })
  mm.add("(min-width: 769px)", () => {
    mediaVw = DESKTOP_MEDIA_VW
  })

  layout = getLayout()
  renderTilt()
  updateScene()

  root.addEventListener("mousemove", handleMouseMove)
  root.addEventListener("touchstart", handleTouchMove, { passive: true })
  root.addEventListener("touchmove", handleTouchMove, { passive: true })
  // Écouteur wheel natif, SANS preventDefault : le scroll de page (Lenis)
  // continue normalement en parallèle du boost de rotation/radius/perspective
  // ci-dessus — les deux réagissent au même événement, simultanément.
  root.addEventListener("wheel", handleWheel)

  // --- Pin fini (seule vraie adaptation structurelle) : la scène doit
  // occuper une place réelle dans une page scrollable, contrairement à la
  // référence qui bloque le scroll et tourne à l'infini. Le pin ne fait que
  // maintenir la scène à l'écran ; il ne pilote rien du moteur ci-dessus. ---
  const heroScrollDistance = 1.8 // multiplicateur de window.innerHeight, à ajuster après test visuel

  const heroST = ScrollTrigger.create({
    trigger: root,
    start: "top top",
    end: () => "+=" + window.innerHeight * heroScrollDistance,
    pin: true,
  })

  // Le texte est visible dès le départ (plus de reveal d'opacité scrubé) —
  // sa lisibilité au-dessus des images est assurée par mix-blend-mode:
  // difference (voir about.css), pas par une temporisation.

  function destroy() {
    autoTween.kill()
    clearTimeout(wheelResetTimer)
    root.removeEventListener("mousemove", handleMouseMove)
    root.removeEventListener("touchstart", handleTouchMove)
    root.removeEventListener("touchmove", handleTouchMove)
    root.removeEventListener("wheel", handleWheel)
    mm.revert()
    heroST.kill()
  }

  return { destroy }
}
