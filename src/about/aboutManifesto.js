// Section Manifesto : trois séquences en flux normal (aucun pin), reprenant
// aussi fidèlement que possible /references/about/about-manifesto
// ("mwg_effect097") : SplitText (lines, words) + redistribution horizontale
// initiale des mots sur la largeur du container, puis retour à x:0 au scroll.
//
// Comme la référence applique SplitText à TOUS les <p> de .content (y
// compris .title), le label et le grand texte partagent ICI exactement la
// même mécanique — un seul traitement, pas de duplication label/texte.
//
// La transition de couleur (cream/black/cream) sur .about-manifesto est un
// système entièrement indépendant : elle ne touche jamais aux mots.

export function initAboutManifesto(gsap, ScrollTrigger, SplitText) {
  const root = document.querySelector(".about-manifesto")
  if (!root) return

  gsap.registerPlugin(SplitText)

  const sequences = root.querySelectorAll(".about-manifesto-sequence")
  const splits = []
  const wordTweens = []

  function buildWordAnimations() {
    sequences.forEach((sequence) => {
      const container = sequence.querySelector(".about-manifesto-inner")
      // label + texte : mêmes <p>, même traitement (cf. mwg_effect097 sur .content p)
      const paragraphs = container.querySelectorAll("p")

      paragraphs.forEach((paragraph) => {
        const split = SplitText.create(paragraph, {
          type: "lines, words",
          linesClass: "about-manifesto-line",
          wordsClass: "about-manifesto-word",
        })
        splits.push(split)

        // Référentiel de redistribution = .about-manifesto-sequence (plus large
        // que .about-manifesto-inner), comme dans la référence où .container
        // (redistribution) est plus large que .content p (composition finale,
        // 60%). .about-manifesto-inner garde sa largeur Figma inchangée.
        const containerWidth = sequence.clientWidth
        const containerRect = sequence.getBoundingClientRect()

        split.lines.forEach((line) => {
          const words = line.querySelectorAll(".about-manifesto-word")
          const totalWordsWidth = Array.from(words).reduce((acc, w) => acc + w.getBoundingClientRect().width, 0)
          const gaps = words.length - 1
          const freeSpace = Math.max(containerWidth - totalWordsWidth, 0)
          const gapSize = gaps > 0 ? freeSpace / gaps : 0

          let targetLeft = 0
          words.forEach((word, index) => {
            const rect = word.getBoundingClientRect()
            const currentLeft = rect.left - containerRect.left
            gsap.set(word, { x: targetLeft - currentLeft })
            targetLeft += rect.width + (index < words.length - 1 ? gapSize : 0)
          })

          wordTweens.push(
            gsap.to(words, {
              x: 0,
              ease: "power2.out",
              scrollTrigger: { trigger: line, start: "top bottom", end: "top 60%", scrub: 0.2 },
            }),
          )
        })
      })
    })
  }

  function clearWordAnimations() {
    wordTweens.splice(0).forEach((tween) => {
      tween.scrollTrigger?.kill()
      tween.kill()
    })
    splits.splice(0).forEach((split) => split.revert())
  }

  buildWordAnimations()

  // Transition cream -> black -> cream : aucune constante de géométrie.
  // La couleur est une fonction pure de la position DOM réelle de
  // sequences[1]/sequences[2], sur la même fenêtre d'entrée que les mots
  // ("top bottom" -> "top 60%") : même position de scroll = même couleur,
  // dans les deux sens.
  const rootStyles = getComputedStyle(root)
  const cream = rootStyles.getPropertyValue("--c-bg").trim()
  const black = rootStyles.getPropertyValue("--c-black").trim()

  const setBackground = gsap.quickSetter(root, "backgroundColor")
  const setColor = gsap.quickSetter(root, "color")

  function getEntryProgress(sequence) {
    const top = sequence.getBoundingClientRect().top
    const start = window.innerHeight
    const end = window.innerHeight * 0.6
    return gsap.utils.clamp(0, 1, (start - top) / (start - end))
  }

  function updateManifestoColors() {
    const darkProgress = getEntryProgress(sequences[1])
    const lightProgress = getEntryProgress(sequences[2])

    if (lightProgress > 0) {
      setBackground(gsap.utils.interpolate(black, cream, lightProgress))
      setColor(gsap.utils.interpolate(cream, black, lightProgress))
    } else {
      setBackground(gsap.utils.interpolate(cream, black, darkProgress))
      setColor(gsap.utils.interpolate(black, cream, darkProgress))
    }
  }

  const colorScrollTrigger = ScrollTrigger.create({
    trigger: root,
    start: "top bottom",
    end: "bottom top",
    onUpdate: updateManifestoColors,
    onRefresh: updateManifestoColors,
  })
  updateManifestoColors() // état correct dès le premier paint, y compris si la page est restaurée en position intermédiaire

  let viewportWidth = window.innerWidth
  let resizeTimer

  function handleResize() {
    if (window.innerWidth === viewportWidth) return

    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      const nextWidth = window.innerWidth
      if (nextWidth === viewportWidth) return

      viewportWidth = nextWidth
      clearWordAnimations()
      buildWordAnimations()
      ScrollTrigger.refresh()
    }, 150)
  }

  window.addEventListener("resize", handleResize)

  function destroy() {
    clearTimeout(resizeTimer)
    window.removeEventListener("resize", handleResize)
    clearWordAnimations()
    colorScrollTrigger.kill()
  }

  return { destroy }
}
