// Section Numbers : trois états (chiffre + légende) qui se succèdent via un
// flip 3D, repris aussi fidèlement que possible de /references/about/numbers
// ("mwg_effect053"). SplitText n'est pas nécessaire : nos deux "lignes" par
// état (chiffre, légende) sont écrites en dur dans le HTML plutôt que
// découpées à l'exécution, mais reçoivent exactement le même traitement
// (.line / .line-inner, rotationY, stagger, easing) que la référence.
//
// Seule simplification structurelle : un unique ScrollTrigger (pin+scrub)
// au lieu des deux triggers dupliqués (pin séparé + master) de la référence
// — même plomberie déjà utilisée pour aboutApproach.js.

export function initAboutNumbers(gsap, ScrollTrigger) {
  const root = document.querySelector(".about-numbers")
  if (!root) return

  const states = root.querySelectorAll(".about-numbers-state")
  const lines = Array.from(states).map((state) => state.querySelectorAll(".about-numbers-line"))

  lines.forEach((stateLines, i) => {
    if (i > 0) gsap.set(stateLines, { rotationY: 90 })
  })

  const numbersScrollDistance = 2.5 // multiplicateur de window.innerHeight, à ajuster après test visuel

  const master = gsap.timeline({
    scrollTrigger: {
      trigger: root,
      start: "top top",
      end: () => "+=" + window.innerHeight * numbersScrollDistance,
      pin: true,
      scrub: true,
    },
  })

  lines.forEach((currentLines, i) => {
    const nextLines = lines[i + 1]
    if (!nextLines) return

    master.to(currentLines, { rotationY: -90, stagger: 0.07, duration: 1, ease: "back.inOut(1)" })
    master.to(nextLines, { rotationY: 0, stagger: 0.07, duration: 1, ease: "back.inOut(1)" }, "<")
  })

  function destroy() {
    master.scrollTrigger?.kill()
    master.kill()
  }

  return { destroy }
}
