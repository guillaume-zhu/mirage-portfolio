// Hero commun aux pages Project (générique — aucune logique spécifique à un
// projet). Aucun pin : le déplacement vertical de .project-hero-heading et
// .project-hero-media est entièrement piloté par GSAP (y), compensant la
// dérive naturelle de .project-hero (non pinnée) sur heroScrollDistance ×
// window.innerHeight. Mesures Figma (149:144 / 149:149 / 149:205) : la
// taille/le radius de l'image sont déjà à leur valeur finale à Frame 2,
// alors que sa position continue de monter jusqu'à Frame 3 — d'où
// width/height/borderRadius sur 0→0.8 / 0.6→0.8, et y sur 0→1.

export function initProjectHero(gsap, ScrollTrigger) {
  const section = document.querySelector(".project-hero")
  if (!section) return

  const heading = section.querySelector(".project-hero-heading")
  const label = section.querySelector(".project-hero-label")
  const titleEl = section.querySelector(".project-hero-title")
  const media = section.querySelector(".project-hero-media")

  // xPercent explicite : évite tout conflit entre un transform:translateX(-50%)
  // statique en CSS et les y/scale que GSAP pilote ensuite sur les mêmes
  // éléments (important pour media, dont la width change pendant le scroll).
  gsap.set([heading, media], { xPercent: -50 })

  // Split lettre par lettre en préservant les <br> du HTML (même logique que
  // .expertise-title dans animations.js) : chaque page Project décide de ses
  // retours à la ligne, ce module les respecte.
  const titleLetters = []
  const titleLines = titleEl.innerHTML.split(/<br\s*\/?>/i)
  titleEl.innerHTML = ""
  titleLines.forEach((line, lineIndex) => {
    line
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .forEach((word) => {
        if (!word) return
        const wordSpan = document.createElement("span")
        wordSpan.className = "project-hero-word"
        word.split("").forEach((char) => {
          const letterSpan = document.createElement("span")
          letterSpan.textContent = char
          letterSpan.className = "project-hero-letter"
          wordSpan.appendChild(letterSpan)
          titleLetters.push(letterSpan)
        })
        titleEl.appendChild(wordSpan)
        titleEl.appendChild(document.createTextNode(" "))
      })
    if (lineIndex < titleLines.length - 1) titleEl.appendChild(document.createElement("br"))
  })

  // Lève le filet anti-flash CSS (.project-hero-heading{opacity:0}) : à partir
  // d'ici, la visibilité est intégralement pilotée par l'intro ci-dessous.
  gsap.set(heading, { opacity: 1 })
  gsap.set(label, { opacity: 0, y: 20 })
  gsap.set(titleLetters, { opacity: 0, y: 30 })

  const introTl = gsap.timeline({ delay: 0.4 })
  introTl.to(label, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.25)
  introTl.to(
    titleLetters,
    {
      keyframes: {
        "0%": { y: 30, opacity: 0 },
        "50%": { y: -6, opacity: 1, ease: "power2.out" },
        "75%": { y: 2, ease: "power1.inOut" },
        "100%": { y: 0, ease: "power1.out" },
      },
      stagger: 0.02,
    },
    0.8,
  )

  const heroScrollDistance = 1 // multiplicateur de window.innerHeight — premier test, ajustable

  // Timeline normalisée sur une durée totale de 1 : Frame 3 = progress 1.
  const scrollTl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => "+=" + window.innerHeight * heroScrollDistance,
      scrub: 1,
      invalidateOnRefresh: true, // force le recalcul des valeurs fonctionnelles ci-dessous au refresh/resize
    },
  })

  // offsetTop/offsetHeight : géométrie locale stable de heading/media relative
  // à .project-hero (position:relative), indépendante de la position de
  // scroll — contrairement à getBoundingClientRect(). Valeurs fonctionnelles :
  // réévaluées à chaque invalidate() (déclenché par invalidateOnRefresh).
  scrollTl.to(media, { width: () => window.innerWidth, height: () => window.innerHeight, duration: 0.8 }, 0)
  scrollTl.to(media, { borderRadius: 0, duration: 0.2 }, 0.6)
  scrollTl.to(
    media,
    { y: () => heroScrollDistance * window.innerHeight - media.offsetTop, duration: 1 },
    0,
  )
  scrollTl.to(
    heading,
    {
      y: () => heroScrollDistance * window.innerHeight - heading.offsetTop - heading.offsetHeight,
      scale: 0.8,
      duration: 1,
    },
    0,
  )

  function destroy() {
    introTl.kill()
    scrollTl.scrollTrigger?.kill()
    scrollTl.kill()
  }

  return { destroy }
}
