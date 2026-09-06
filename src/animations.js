import gsap from "gsap"
import ScrollTrigger from "gsap/ScrollTrigger"
import Lenis from "@studio-freight/lenis"

export function initAnimations(pendingHash) {
  // --- CONFIGURATION ---
  gsap.registerPlugin(ScrollTrigger)

  // Confort de scroll tactile : sous 1100px on raccourcit uniquement la DISTANCE
  // DE SCROLL des scènes pinnées (les timelines visuelles sont inchangées).
  // >=1100 -> 1 : distances Desktop mathématiquement identiques.
  const getResponsiveScrollFactor = () => {
    if (window.innerWidth < 640) return 0.8
    if (window.innerWidth < 1100) return 0.85
    return 1
  }

  // Init Lenis (Heavy Inertia)
  const lenisEasing = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
  const lenis = new Lenis({
    duration: 2.0, // Slower, more weight
    easing: lenisEasing,
    direction: "vertical",
    smooth: true,
    touchMultiplier: 1.5, // Less sensitive
  })

  // Sync Lenis <-> ScrollTrigger
  lenis.on("scroll", ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)

  // --- NAVIGATION ANCRE (header) ---
  // Certaines cibles (#footer) vivent dans un conteneur pinné et transformé :
  // leur position réelle de scroll ne peut pas être lue depuis le DOM. Les
  // modules d'animation enregistrent ici un résolveur -> position de scroll (px).
  const anchorResolvers = {}

  const scrollToAnchor = (hash, opts) => {
    const resolver = anchorResolvers[hash]
    if (resolver) {
      lenis.scrollTo(resolver(), opts)
      return true
    }
    const target = document.querySelector(hash)
    if (!target) return false
    lenis.scrollTo(target, opts)
    return true
  }

  // Les liens vers une ancre de la page courante défilent en douceur via Lenis ;
  // les liens vers une autre page (ex. /#works depuis about.html) suivent la
  // navigation native, et l'ancre est rejouée au chargement ci-dessous.
  document.querySelectorAll('a[href*="#"]').forEach((link) => {
    const url = new URL(link.href, window.location.href)
    if (url.pathname !== window.location.pathname || !url.hash || url.hash === "#") return

    link.addEventListener("click", (e) => {
      e.preventDefault()
      if (scrollToAnchor(url.hash)) history.pushState(null, "", url.hash)
    })
  })

  // Logo -> home tout en haut. Sur la home même, on évite le rechargement et on
  // remonte en douceur via Lenis.
  const logoLink = document.querySelector(".site-header .logo")
  if (logoLink) {
    logoLink.addEventListener("click", (e) => {
      const url = new URL(logoLink.href, window.location.href)
      if (url.pathname !== window.location.pathname) return // vers la home depuis une autre page
      e.preventDefault()
      lenis.scrollTo(0)
      history.pushState(null, "", url.pathname)
    })
  }

  // --- ANIMATIONS: HERO ---
  const siteHeader = document.querySelector(".site-header")

  if (siteHeader) {
    const enableHeaderBlend = () => {
      // Le blanc est ici la couleur technique de difference : sur le fond
      // clair suivant, son rendu rejoint presque le noir de fin de transition.
      gsap.set(siteHeader, {
        color: "var(--c-white)",
        mixBlendMode: "difference",
      })
    }

    const disableHeaderBlend = () => {
      gsap.set(siteHeader, {
        color: "var(--c-black)",
        mixBlendMode: "normal",
      })
    }

    gsap
      .timeline({
        scrollTrigger: {
          trigger: "#hero",
          // La transition couvre le passage de la limite basse de la Hero
          // depuis le bas du header jusqu'à son bord supérieur.
          start: () => `bottom ${siteHeader.offsetHeight}px`,
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true,
          onLeave: enableHeaderBlend,
          onEnterBack: disableHeaderBlend,
          // Couvre aussi un chargement dont le scroll est restauré sous la Hero.
          onRefresh: (self) => {
            if (self.progress === 1) enableHeaderBlend()
          },
        },
      })
      .to(siteHeader, { color: "var(--c-black)", ease: "none" }, 0)
  }

  // Setup initial
  gsap.set(".hero-center-img", { xPercent: -50, yPercent: -50, scale: 1.1, filter: "blur(10px)" })
  gsap.set(".hero-center-container", { scale: 0, opacity: 0 })
  gsap.set(".hero-logo-img", { y: 100, opacity: 0, filter: "blur(20px)" })

  // Intro Timeline (Slow & Sequenced)
  const tlHero = gsap.timeline({ defaults: { ease: "power4.out" } })

  // 1. Background clears up slowly
  tlHero.fromTo(
    ".hero-bg-img",
    { scale: 1.2, filter: "blur(20px)" },
    { scale: 1, filter: "blur(0px)", duration: 3, ease: "power2.out" },
    0,
  )

  // 2. Blob appears (Organic expansion)
  tlHero.to(
    ".hero-center-container",
    { scale: 1, opacity: 1, duration: 2.5, ease: "elastic.out(0.8, 0.5)" },
    0.5,
  )
  tlHero.to(
    ".hero-center-img",
    { scale: 1, filter: "blur(0px)", duration: 2.5, ease: "power3.out" },
    0.5,
  )

  // 3. Logo floats in (Dreamy)
  // clearProps:"filter" : une fois l'intro terminée, retire le filter inline
  // (bloqué à "blur(0px)" par GSAP) pour laisser le CSS reprendre la main
  // (filter: url(#liquid-distortion)) — sinon la distorsion SVG au hover
  // reste techniquement pilotée mais invisible, l'image n'utilisant plus
  // cette référence.
  tlHero.to(
    ".hero-logo-img",
    { y: 0, opacity: 1, filter: "blur(0px)", duration: 2, ease: "power3.out", clearProps: "filter" },
    1.2,
  )

  // Parallaxe Scroll (Subtle)
  gsap.to(".hero-bg-img", {
    yPercent: 20,
    ease: "none",
    scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
  })
  gsap.to(".hero-center-container", {
    yPercent: 10,
    ease: "none",
    scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
  })
  gsap.to(".hero-logo-container", {
    yPercent: -30,
    opacity: 0,
    filter: "blur(10px)",
    ease: "none",
    scrollTrigger: { trigger: "#hero", start: "top top", end: "50% top", scrub: true },
  })

  // Hero Exit (Shrink & Round)
  gsap.to(".hero-bg-container", {
    scale: 0.96,
    borderRadius: "32px",
    ease: "power1.out",
    scrollTrigger: {
      trigger: "#hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  })

  // --- ANIMATIONS: BLOB (Interactive) ---
  const blob = document.querySelector("#blob-container")
  const blobImage = document.querySelector(".hero-center-img")
  const random = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)

  // Forme Sphérique Organique (30-70%) - Plus vive
  function getBlobShape() {
    const v = Array.from({ length: 8 }, () => random(50, 70)) // Stronger organic variation
    return `${v[0]}% ${v[1]}% ${v[2]}% ${v[3]}% / ${v[4]}% ${v[5]}% ${v[6]}% ${v[7]}%`
  }

  // Respiration (Lively)
  let blobTween = gsap.to(blob, {
    borderRadius: getBlobShape,
    duration: 2,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
    repeatRefresh: true,
  })

  // Interaction Souris
  if (blob) {
    const blobTurbulence = document.querySelector("#liquid-distortion-blob feTurbulence")
    const blobDisplacement = document.querySelector("#liquid-distortion-blob feDisplacementMap")

    // Linked Elements
    // const logoDisplacement = document.querySelector("#liquid-distortion feDisplacementMap");
    // const logoTurbulence = document.querySelector("#liquid-distortion feTurbulence");

    blob.addEventListener("mouseenter", () => {
      gsap.to(blobTween, { timeScale: 2, duration: 1, ease: "power2.out" })
      gsap.to(blob, { opacity: 0, duration: 0.6, ease: "power2.out" })

      // Liquid Effect (Blob)
      if (blobDisplacement && blobTurbulence) {
        gsap.to(blobDisplacement, { attr: { scale: 30 }, duration: 0.8, ease: "power2.out" })
        gsap.to(blobTurbulence, {
          attr: { baseFrequency: 0.05 },
          duration: 0.8,
          ease: "power2.out",
        })
      }
    })

    blob.addEventListener("mouseleave", () => {
      gsap.to(blobTween, { timeScale: 1, duration: 1, ease: "power2.out" })
      gsap.to(blob, { opacity: 1, duration: 0.6, ease: "power2.out" })
      gsap.to(blob, { rotationX: 0, rotationY: 0, duration: 1.2, ease: "power2.out" })
      gsap.to(blobImage, { x: 0, y: 0, duration: 1.2, ease: "power2.out" })

      // Reset Liquid (Blob)
      if (blobDisplacement && blobTurbulence) {
        gsap.to(blobDisplacement, {
          attr: { scale: 0 },
          duration: 1.2,
          ease: "elastic.out(1, 0.5)",
        })
        gsap.to(blobTurbulence, {
          attr: { baseFrequency: 0.01 },
          duration: 1.2,
          ease: "power2.out",
        })
      }
    })
    blob.addEventListener("mousemove", (e) => {
      const rect = blob.getBoundingClientRect()
      const xPos = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      const yPos = ((e.clientY - rect.top) / rect.height - 0.5) * 2

      // Tilt Container (Fluid)
      gsap.to(blob, {
        rotationY: xPos * 5,
        rotationX: -yPos * 5,
        duration: 1.5,
        ease: "power2.out",
        overwrite: "auto",
      })
      // Lentille Liquide (Move image slightly)
      gsap.to(blobImage, {
        x: xPos * -20,
        y: yPos * -20,
        duration: 1,
        ease: "power2.out",
        overwrite: "auto",
      })
    })
  }

  // --- ANIMATIONS: CONCEPT (Scrollytelling Synchro) ---

  // 1. Préparation du Texte (Split par lettres, groupées par mot)
  const paragraph = document.getElementById("concept-text")
  let totalLetters = 0
  if (paragraph) {
    const textContent = paragraph.textContent.replace(/\s+/g, " ").trim()
    paragraph.innerHTML = ""

    const words = textContent.split(" ")
    words.forEach((word) => {
      if (!word) return
      const wordSpan = document.createElement("span")
      wordSpan.className = "word"
      word.split("").forEach((char) => {
        const letterSpan = document.createElement("span")
        letterSpan.textContent = char
        letterSpan.className = "letter"
        wordSpan.appendChild(letterSpan)
      })
      paragraph.appendChild(wordSpan)
      paragraph.appendChild(document.createTextNode(" ")) // Espace réel
    })
    totalLetters = document.querySelectorAll(".letter").length
  }

  // 2. Setup Images (Invisible + Bas)
  gsap.set(".image-card", { opacity: 0, y: 150, scale: 0.9 })

  // 3. Timeline Concept
  const conceptTl = gsap.timeline({
    scrollTrigger: {
      trigger: "#concept",
      start: "top top",
      // facteur 1 (>=1100) : "+=100%" === innerHeight -> Desktop identique
      end: () => "+=" + window.innerHeight * getResponsiveScrollFactor(),
      pin: true,
      scrub: 1.5,
    },
  })

  // A. Texte (Lecture, lettre par lettre)
  const letterDuration = 0.05
  const letterStagger = totalLetters > 1 ? (2.9 - letterDuration) / (totalLetters - 1) : 0
  const letterGrayInDuration = 0.08
  const letterGrayInLead = 0.12
  const letterGrayColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--c-inactive")
    .trim()

  // A.1 Pré-apparition douce en gris, juste avant le passage du dégradé
  conceptTl.to(
    ".letter",
    {
      color: letterGrayColor,
      stagger: letterStagger,
      duration: letterGrayInDuration,
      ease: "sine.inOut",
    },
    -letterGrayInLead,
  )

  conceptTl.to(
    ".letter",
    {
      color: "rgba(0,0,0,0)", // Transparent to reveal background gradient
      stagger: letterStagger,
      duration: letterDuration, // Short duration for "harder" edge
      ease: "power1.out",
    },
    0,
  )

  // B. Images (Apparition Stack Verticale - Sequenced)
  // Cards float up with slight rotation reset, taille et dispersion légèrement aléatoires

  // Card 1: Centre
  conceptTl.to(
    ".card-1",
    {
      opacity: 1,
      y: 0,
      x: 0,
      scale: gsap.utils.random(0.88, 1.12),
      duration: 0.5,
      ease: "power3.out",
    },
    0,
  )

  // Card 2: Gauche Haut
  conceptTl.to(
    ".card-2",
    {
      opacity: 1,
      y: -40,
      x: -60,
      scale: gsap.utils.random(0.88, 1.12),
      duration: 0.5,
      ease: "power3.out",
    },
    0.6,
  )

  // Card 3: Droite Bas
  conceptTl.to(
    ".card-3",
    {
      opacity: 1,
      y: 60,
      x: 80,
      scale: gsap.utils.random(0.88, 1.12),
      duration: 0.5,
      ease: "power3.out",
    },
    1.2,
  )

  // Card 4: Gauche Bas
  conceptTl.to(
    ".card-4",
    {
      opacity: 1,
      y: 80,
      x: -40,
      scale: gsap.utils.random(0.88, 1.12),
      duration: 0.5,
      ease: "power3.out",
    },
    1.8,
  )

  // Card 5: Centre Haut (Final)
  conceptTl.to(
    ".card-5",
    {
      opacity: 1,
      y: -80,
      x: 20,
      scale: gsap.utils.random(0.88, 1.12),
      duration: 0.5,
      ease: "power3.out",
    },
    2.4,
  )

  // Hold phase (court temps de pause pour observer la composition finale)
  conceptTl.to({}, { duration: 0.3 })

  // --- ANIMATIONS: IMAGE CARDS LIQUID HOVER ---
  const svgNS = "http://www.w3.org/2000/svg"
  const liquidDefs = document.getElementById("liquid-defs")

  document.querySelectorAll(".image-card").forEach((card, index) => {
    const img = card.querySelector("img")
    if (!img || !liquidDefs) return

    // Filtre dédié à cette carte (déformation indépendante par image)
    const filterId = `liquid-distortion-card-${index}`
    const filter = document.createElementNS(svgNS, "filter")
    filter.setAttribute("id", filterId)

    const turbulenceCard = document.createElementNS(svgNS, "feTurbulence")
    turbulenceCard.setAttribute("type", "fractalNoise")
    turbulenceCard.setAttribute("baseFrequency", "0.008")
    turbulenceCard.setAttribute("numOctaves", "2")
    turbulenceCard.setAttribute("result", "warp")

    const displacementCard = document.createElementNS(svgNS, "feDisplacementMap")
    displacementCard.setAttribute("xChannelSelector", "R")
    displacementCard.setAttribute("yChannelSelector", "G")
    displacementCard.setAttribute("scale", "0")
    displacementCard.setAttribute("in", "SourceGraphic")
    displacementCard.setAttribute("in2", "warp")

    filter.appendChild(turbulenceCard)
    filter.appendChild(displacementCard)
    liquidDefs.appendChild(filter)

    img.style.filter = `url(#${filterId})`

    card.addEventListener("mouseenter", () => {
      gsap.to(displacementCard, { attr: { scale: 14 }, duration: 0.9, ease: "power2.out" })
      gsap.to(turbulenceCard, { attr: { baseFrequency: 0.022 }, duration: 0.9, ease: "power2.out" })
      gsap.to(img, { scale: 1.06, duration: 0.9, ease: "power2.out" })
    })

    card.addEventListener("mouseleave", () => {
      gsap.to(displacementCard, { attr: { scale: 0 }, duration: 1, ease: "power2.out" })
      gsap.to(turbulenceCard, { attr: { baseFrequency: 0.008 }, duration: 1, ease: "power2.out" })
      gsap.to(img, { scale: 1, duration: 1, ease: "power2.out" })
    })
  })

  // --- ANIMATIONS: EXPERTISE (Intro > Phase 1 > Flip > Phase 2 > Outro) ---
  const expertiseRoot = document.querySelector("#expertise")
  if (expertiseRoot) {
    const expTitle = expertiseRoot.querySelector(".expertise-title")
    const expLead1 = expertiseRoot.querySelector(".expertise-lead-1")
    const expLead2 = expertiseRoot.querySelector(".expertise-lead-2")
    const expText = expertiseRoot.querySelector(".expertise-text")
    const expCardsA = expertiseRoot.querySelector(".expertise-cards-a")
    const expCardsB = expertiseRoot.querySelector(".expertise-cards-b")
    const expFacesA = expCardsA.querySelectorAll(".expertise-card")
    const expFacesB = expCardsB.querySelectorAll(".expertise-card")

    // Split lettre par lettre du grand titre (même logique que le titre de Clients),
    // en préservant les <br> qui séparent les 3 lignes.
    const expTitleLetters = []
    const expTitleLines = [] // lettres regroupées par ligne, pour un reveal ligne à ligne
    const expLines = expTitle.innerHTML.split(/<br\s*\/?>/i)
    expTitle.innerHTML = ""
    expLines.forEach((line, lineIndex) => {
      const lineLetters = []
      line
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .forEach((word) => {
          if (!word) return
          const wordSpan = document.createElement("span")
          wordSpan.className = "expertise-word"
          word.split("").forEach((char) => {
            const letterSpan = document.createElement("span")
            letterSpan.textContent = char
            letterSpan.className = "expertise-letter"
            wordSpan.appendChild(letterSpan)
            expTitleLetters.push(letterSpan)
            lineLetters.push(letterSpan)
          })
          expTitle.appendChild(wordSpan)
          expTitle.appendChild(document.createTextNode(" "))
        })
      if (lineLetters.length) expTitleLines.push(lineLetters)
      if (lineIndex < expLines.length - 1) expTitle.appendChild(document.createElement("br"))
    })

    // [COMMUN] Faces visibles (recto = cards 1/2, verso = cards 3/4), cf. mwg_effect056.
    // Helper utilisé par la seule branche Desktop (écrit .style.visibility en brut,
    // donc nettoyé manuellement au changement de breakpoint).
    function expSetFace(index) {
      expFacesA.forEach((f, i) => (f.style.visibility = i === index ? "visible" : "hidden"))
      expFacesB.forEach((f, i) => (f.style.visibility = i === index ? "visible" : "hidden"))
    }

    const mm = gsap.matchMedia()

    // ================================================================
    // DESKTOP (>=1100px) — logique existante, strictement identique.
    // (corps réindenté +2 uniquement : vérifiable via `git diff -w`)
    // ================================================================
    mm.add("(min-width: 1100px)", () => {
      // Décalage au repos : positions Figma (cartes de 317px, centres à ±168px sur 653px)
      const expOffset = 53 // xPercent

      // États initiaux (avant l'intro)
      gsap.set(expTitleLetters, { opacity: 0, y: 30 })
      gsap.set(expLead1, { opacity: 0, y: 30 })
      gsap.set(expLead2, { opacity: 0, y: 30 })
      gsap.set(expCardsA, { xPercent: -expOffset, opacity: 0, y: 40 })
      gsap.set(expCardsB, { xPercent: expOffset, opacity: 0, y: 40 })

      expSetFace(0)

      // --- 1. APPROCHE (avant le pin) : le contenu apparaît plus haut, descend jusqu'à
      // sa position centrée et se révèle — supprime le temps mort après #concept. ---
      gsap.set(".expertise-inner", { y: "-18vh" })

      const expApproachTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#expertise",
          start: "top bottom",
          end: "top top",
          scrub: true,
        },
      })

      // Le reveal est retardé : au début de l'approche le contenu est encore sous
      // l'écran, il ne doit se révéler qu'en entrant réellement dans le viewport.
      const expRevealStart = 3.0
      const expRevealSpan = 3.1 // du début du reveal à la fin de la dernière card
      const expApproachDuration = expRevealStart + expRevealSpan

      // La descente couvre toute l'approche : position centrée atteinte pile au pin.
      expApproachTl.to(
        ".expertise-inner",
        { y: "0vh", ease: "none", duration: expApproachDuration },
        0,
      )

      // Le titre se révèle ligne par ligne : chaque ligne démarre quand la précédente
      // est presque terminée (~68% de sa durée).
      const expLineDuration = 0.7
      const expLineStagger = 0.03
      let expLineStart = 0

      expTitleLines.forEach((lineLetters) => {
        expApproachTl.to(
          lineLetters,
          {
            keyframes: {
              "0%": { y: 30, opacity: 0 },
              "50%": { y: -6, opacity: 1, ease: "power2.out" },
              "75%": { y: 2, ease: "power1.inOut" },
              "100%": { y: 0, ease: "power1.out" },
            },
            stagger: expLineStagger,
            duration: expLineDuration,
          },
          expRevealStart + expLineStart,
        )

        const lineSpan = expLineDuration + (lineLetters.length - 1) * expLineStagger
        expLineStart += lineSpan * 0.68
      })

      // Cascade : titre -> corps, puis les cards enchaînent dès l'apparition du corps
      const expTween = (target, at) =>
        expApproachTl.to(
          target,
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
          expRevealStart + at,
        )

      expTween(expLead1, 2.35)
      expTween(expCardsA, 2.45)
      expTween(expCardsB, 2.6)

      // Bascule des faces au milieu exact du flip (t=0.9), rapportée à la durée
      // réelle de la timeline — sinon le seuil dérive et laisse un trou sans face visible.
      const expFlipMid = 0.9

      const expTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#expertise",
          start: "top top",
          end: "+=225%",
          pin: true,
          scrub: true,
          onUpdate: (self) => {
            expSetFace(self.progress * expTl.duration() < expFlipMid ? 0 : 1)
          },
        },
      })

      // Lien "Expertises" : #expertise est pinné et son contenu est translaté
      // pendant l'approche — on vise le début du pin, là où la section est calée
      // en haut de l'écran et centrée.
      anchorResolvers["#expertise"] = () => expTl.scrollTrigger.start

      // --- 2. PHASE 1 : hold (0 -> 0.4) ---
      expTl.to({}, { duration: 0.4 }, 0)

      // --- 3. FLIP (0.4 -> 1.4) — logique reprise de mwg_effect056 ---
      const expRx = (Math.random() - 0.5) * 40
      const expRz = (Math.random() - 0.5) * 40

      expTl.to(
        expCardsA,
        { xPercent: expOffset, rotateY: "+=180", duration: 1, ease: "power2.inOut" },
        0.4,
      )
      expTl.to(expCardsA, { z: -150, duration: 0.5, yoyo: true, repeat: 1, ease: "power2.inOut" }, 0.4)
      expTl.to(
        expCardsB,
        { xPercent: -expOffset, rotateY: "-=180", duration: 1, ease: "power2.inOut" },
        0.4,
      )
      expTl.to(expCardsB, { z: 150, duration: 0.5, yoyo: true, repeat: 1, ease: "power2.inOut" }, 0.4)
      expTl.to(
        [expCardsA, expCardsB],
        {
          rotateX: expRx,
          rotateZ: expRz,
          scale: 1.1,
          duration: 0.5,
          repeat: 1,
          yoyo: true,
          ease: "power2.in",
        },
        0.4,
      )

      // Cross-fade des paragraphes pendant le flip
      expTl.to(expLead1, { opacity: 0, y: -30, duration: 0.4, ease: "power2.in" }, 0.4)
      expTl.to(expLead2, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.9)

      // --- 4. PHASE 2 : hold (1.4 -> 1.8) ---
      expTl.to({}, { duration: 0.4 }, 1.4)

      // --- 5. OUTRO en cascade : textes, puis card de gauche, puis card de droite.
      // Après le flip, B est à gauche (xPercent -53) et A à droite (+53).
      //
      // Sortie partielle (0.45vh) : les éléments ne doivent PAS avoir quitté l'écran quand
      // le pin se libère, sinon une frame totalement vide s'intercale avant l'arrivée de
      // #works. Ils finissent d'être évacués par le scroll naturel de la section dépinnée —
      // c'est ce recouvrement qui rend la transition #works -> #clients fluide.
      //
      // La cascade vient des DÉPARTS décalés, mais les trois tweens se terminent au même
      // instant (fin du pin) : sinon chacun atteint sa position finale puis s'y fige
      // visiblement en attendant la fin du pin, l'un après l'autre.
      const expExitY = () => -(window.innerHeight * 0.45)
      const expOutroEnd = 2.54
      const expExit = (target, at) =>
        expTl.to(target, { y: expExitY, duration: expOutroEnd - at, ease: "power1.in" }, at)

      expExit(expText, 1.8)
      expExit(expCardsB, 1.92)
      expExit(expCardsA, 2.04)

      return () => {
        delete anchorResolvers["#expertise"]
        ;[...expFacesA, ...expFacesB].forEach((f) => (f.style.visibility = ""))
      }
    })

    // ================================================================
    // RESPONSIVE (<1100px) — pas de flip 3D. Reveal d'approche calé pile
    // sur le pin, puis pin court : hold état 1 -> crossfade -> hold état 2.
    // Chaque .expertise-cards est un SLOT à 2 faces superposées, la face
    // visible est pilotée en opacité (crossfade 1/2 -> 3/4).
    // ================================================================
    mm.add("(max-width: 1099px)", () => {
      gsap.set(expTitleLetters, { opacity: 0, y: 30 })
      gsap.set([expCardsA, expCardsB], { opacity: 0, y: 30 })
      gsap.set(expLead1, { opacity: 0, y: 30 })
      gsap.set(expLead2, { opacity: 0, y: 20 })
      gsap.set([expFacesA[0], expFacesB[0]], { opacity: 1 })
      gsap.set([expFacesA[1], expFacesB[1]], { opacity: 0 })

      // (a) Reveal d'approche (non pinné) — se termine exactement au début du pin.
      const respRevealTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#expertise",
          start: "top 78%",
          end: "top top",
          scrub: true,
        },
      })

      let respLineStart = 0
      expTitleLines.forEach((lineLetters) => {
        respRevealTl.to(
          lineLetters,
          {
            keyframes: {
              "0%": { y: 30, opacity: 0 },
              "60%": { y: -4, opacity: 1, ease: "power2.out" },
              "100%": { y: 0, ease: "power1.out" },
            },
            stagger: 0.03,
            duration: 0.6,
          },
          respLineStart,
        )
        respLineStart += 0.42
      })

      const respReveal = (target, at) =>
        respRevealTl.to(target, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, at)

      respReveal(expLead1, respLineStart + 0.1)
      respReveal(expCardsA, respLineStart + 0.15)
      respReveal(expCardsB, respLineStart + 0.25)

      // (b) Pin court : hold état 1 -> crossfade (faces + lead) -> hold état 2.
      // Distance de scroll = innerHeight * facteur responsive (confort tactile).
      const respTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#expertise",
          start: "top top",
          end: () => "+=" + window.innerHeight * getResponsiveScrollFactor(),
          pin: true,
          scrub: true,
        },
      })

      anchorResolvers["#expertise"] = () => respTl.scrollTrigger.start

      respTl.to({}, { duration: 0.35 }) // phase 1 hold

      respTl.to(
        [expFacesA[0], expFacesB[0]],
        { opacity: 0, y: -12, duration: 0.3, ease: "power1.inOut" },
        0.35,
      )
      respTl.fromTo(
        [expFacesA[1], expFacesB[1]],
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power1.inOut" },
        0.35,
      )
      respTl.to(expLead1, { opacity: 0, y: -20, duration: 0.28, ease: "power2.in" }, 0.35)
      respTl.fromTo(
        expLead2,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
        0.4,
      )

      respTl.to({}, { duration: 0.35 }) // phase 2 hold

      return () => {
        delete anchorResolvers["#expertise"]
      }
    })
  }

  // --- ANIMATIONS: LOGO LIQUID HOVER ---
  const logoImg = document.querySelector(".hero-logo-img")
  const turbulence = document.querySelector("#liquid-distortion feTurbulence")
  const displacement = document.querySelector("#liquid-distortion feDisplacementMap")

  if (logoImg && displacement && turbulence) {
    // Idle subtle movement
    // gsap.to(turbulence, {
    //     attr: { baseFrequency: 0.02 },
    //     duration: 10,
    //     repeat: -1,
    //     yoyo: true,
    //     ease: "sine.inOut"
    // });

    // Mouse move interaction (optional, follows mouse slightly)
    logoImg.addEventListener("mouseenter", () => {
      gsap.to(displacement, {
        attr: { scale: 40 }, // Distortion intensity
        duration: 1,
        ease: "power2.out",
      })
      gsap.to(turbulence, {
        attr: { baseFrequency: 0.05 },
        duration: 1,
        ease: "power2.out",
      })
    })

    logoImg.addEventListener("mouseleave", () => {
      gsap.to(displacement, {
        attr: { scale: 0 }, // Back to normal
        duration: 1.2,
        ease: "elastic.out(1, 0.5)",
      })
      gsap.to(turbulence, {
        attr: { baseFrequency: 0.01 },
        duration: 1.2,
        ease: "power2.out",
      })
    })

    // Keep mousemove for subtle parallax if needed, or remove. keeping simple.
    logoImg.addEventListener("mousemove", (e) => {
      const rect = logoImg.getBoundingClientRect()
      const xPos = (e.clientX - rect.left) / rect.width
      const yPos = (e.clientY - rect.top) / rect.height

      // Subtle shift of frequency based on position
      gsap.to(turbulence, {
        attr: { baseFrequency: 0.02 + xPos * 0.01 },
        duration: 0.5,
        overwrite: "auto",
      })
    })
  }

  // --- ANIMATIONS: WORKS (Hover Reveal) ---
  const workItems = document.querySelectorAll(".project-item")
  const previewLeft = document.querySelector("#preview-left-img")
  const previewRight = document.querySelector("#preview-right-img")
  const previewLeftContainer = document.querySelector(".work-preview-left")
  const previewRightContainer = document.querySelector(".work-preview-right")

  if (workItems.length > 0) {
    // Get the SVG defs to append filters to
    const svgDefs = document.querySelector("svg defs")

    // Apparition en chaîne (opacité + distorsion liquide), pilotée par le scroll
    gsap.set(".works-label", { opacity: 0, y: 30 })
    gsap.set(workItems, { opacity: 0, pointerEvents: "none" })
    const workDisplacements = []
    const workTurbulences = []

    workItems.forEach((item, index) => {
      const title = item.querySelector(".project-title")

      // 1. Create unique filter for this item
      const filterId = `liquid-text-${index}`
      const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter")
      filter.id = filterId

      // Turbulence (état initial = distordu, comme en fin de hover-in)
      const turbulence = document.createElementNS("http://www.w3.org/2000/svg", "feTurbulence")
      turbulence.setAttribute("type", "fractalNoise")
      turbulence.setAttribute("baseFrequency", "0.005")
      turbulence.setAttribute("numOctaves", "3")
      turbulence.setAttribute("result", "warp")

      // Displacement (état initial = distordu, comme en fin de hover-in)
      const displacement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "feDisplacementMap",
      )
      displacement.setAttribute("xChannelSelector", "R")
      displacement.setAttribute("yChannelSelector", "G")
      displacement.setAttribute("scale", "30")
      displacement.setAttribute("in", "SourceGraphic")
      displacement.setAttribute("in2", "warp")

      filter.appendChild(turbulence)
      filter.appendChild(displacement)
      if (svgDefs) svgDefs.appendChild(filter)

      // Apply filter to title
      if (title) title.style.filter = `url(#${filterId})`

      workDisplacements.push(displacement)
      workTurbulences.push(turbulence)

      // Le hover ne doit réagir que sur le nom du projet, pas sur toute la ligne
      // (les colonnes latérales et le vide de la grille sont exclus).
      const hoverTarget = title || item

      hoverTarget.addEventListener("mouseenter", () => {
        const imgLeft = item.querySelector(".project-img-left")?.getAttribute("src")
        const imgRight = item.querySelector(".project-img-right")?.getAttribute("src")

        if (previewLeft && imgLeft) previewLeft.src = imgLeft
        if (previewRight && imgRight) previewRight.src = imgRight

        // Animate In Images
        gsap.to([previewLeftContainer, previewRightContainer], {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: "power2.out",
          overwrite: "auto",
        })

        // Animate Text Distortion
        gsap.to(displacement, {
          attr: { scale: 30 },
          duration: 1,
          ease: "power2.out",
          overwrite: "auto",
        })
        gsap.to(turbulence, {
          attr: { baseFrequency: 0.005 },
          duration: 1,
          ease: "power2.out",
          overwrite: "auto",
        })
      })

      hoverTarget.addEventListener("mouseleave", () => {
        // Animate Out Images
        gsap.to([previewLeftContainer, previewRightContainer], {
          opacity: 0,
          scale: 0.95,
          duration: 0.4,
          ease: "power2.out",
          overwrite: "auto",
        })

        // Reset Text Distortion
        gsap.to(displacement, {
          attr: { scale: 0 },
          duration: 0.8,
          ease: "power2.out",
          overwrite: "auto",
        })
        gsap.to(turbulence, {
          attr: { baseFrequency: 0.02 },
          duration: 0.8,
          ease: "power2.out",
          overwrite: "auto",
        })
      })

      // Mouse move for subtle parallax on images?
      item.addEventListener("mousemove", (e) => {
        // Optional: Move images slightly based on cursor Y
        // const yPos = (e.clientY / window.innerHeight - 0.5) * 20;
        // gsap.to([previewLeftContainer, previewRightContainer], { y: `calc(-50% + ${yPos}px)`, duration: 0.5 });
      })
    })

    // Révélation d'un sous-ensemble de projets (opacité + fin de distorsion liquide)
    const worksRevealChain = (tl, from, to, at) => {
      const items = [...workItems].slice(from, to)
      const disps = workDisplacements.slice(from, to)
      const turbs = workTurbulences.slice(from, to)
      const opts = { stagger: 0.5, duration: 0.6, ease: "power2.out" }

      tl.to(items, { opacity: 1, pointerEvents: "auto", ...opts }, at)
      tl.to(disps, { attr: { scale: 0 }, ...opts }, at)
      tl.to(turbs, { attr: { baseFrequency: 0.02 }, ...opts }, at)
    }

    // --- APPROCHE (avant le pin) : le contenu apparaît plus haut, descend jusqu'à sa
    // position centrée, et la chaîne démarre déjà — sinon l'approche défile à vide
    // avec seulement le label à l'écran. ---
    const worksSplit = Math.ceil(workItems.length / 2)

    const worksMm = gsap.matchMedia()

    // ===== DESKTOP (>=1100px) — comportement actuel strictement identique =====
    // Approche (.works-inner -65vh -> 0, coordonnée avec l'outro Expertise Desktop)
    // + pin +=150% qui révèle la 2e moitié des projets.
    worksMm.add("(min-width: 1100px)", () => {
      gsap.set(".works-inner", { y: "-65vh" })

      const worksApproachTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#works",
          start: "top bottom",
          end: "top top",
          scrub: true,
        },
      })

      // La descente couvre toute l'approche : position centrée atteinte pile au pin.
      worksApproachTl.to(".works-inner", { y: "0vh", ease: "none", duration: 1.5 }, 0)
      worksApproachTl.to(".works-label", { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, 0)
      worksRevealChain(worksApproachTl, 0, worksSplit, 0.25)

      // Timeline pinnée : la chaîne se poursuit sur les projets restants
      const worksTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#works",
          start: "top top",
          end: "+=150%",
          pin: true,
          scrub: 1,
        },
      })

      worksRevealChain(worksTl, worksSplit, workItems.length, 0)
      worksTl.to({}, { duration: 0.3 })

      // Lien "Projets" : viser le DÉBUT du pin atterrit avec seulement la 1ère
      // moitié des projets révélée (l'autre moitié se révèle pendant le pin,
      // via worksRevealChain ci-dessus) — donne l'impression de ne pas avoir
      // quitté Expertise. On vise donc la FIN du pin (-1px, même technique que
      // #footer plus bas) : tous les projets sont alors révélés.
      anchorResolvers["#works"] = () => worksTl.scrollTrigger.end - 1

      return () => {
        delete anchorResolvers["#works"]
      }
    })

    // ===== RESPONSIVE (<1100px) — aucun pin =====
    // .works-inner reste en place ; l'approche (top 75% -> top top) révèle les
    // 4 projets + le label, puis la section poursuit son scroll vertical normal.
    // Aucun resolver #works : le fallback DOM de scrollToAnchor prend le relais.
    worksMm.add("(max-width: 1099px)", () => {
      gsap.set(".works-inner", { y: "0vh" })

      const worksApproachTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#works",
          start: "top 75%",
          end: "top top",
          scrub: true,
        },
      })

      worksApproachTl.to(".works-label", { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, 0)
      worksRevealChain(worksApproachTl, 0, workItems.length, 0.25)
    })
  }

  // --- ANIMATIONS: SCRATCH EFFECT ---
  workItems.forEach((item, index) => {
    const title = item.querySelector(".project-title")
    if (!title) return

    // 1. Create SVG Scratch
    const svgNS = "http://www.w3.org/2000/svg"
    const svg = document.createElementNS(svgNS, "svg")
    svg.setAttribute("class", "scratch-svg")
    // Position absolute over the text
    svg.style.position = "absolute"
    svg.style.top = "-20%"
    svg.style.left = "5%"
    svg.style.width = "70%"
    svg.style.height = "140%"
    svg.style.pointerEvents = "none"
    svg.style.zIndex = "10"
    svg.style.overflow = "visible"

    // Define Gradient
    const defs = document.createElementNS(svgNS, "defs")
    const gradient = document.createElementNS(svgNS, "linearGradient")
    const gradientId = `scratch-gradient-${index}`
    gradient.setAttribute("id", gradientId)
    gradient.setAttribute("x1", "0%")
    gradient.setAttribute("y1", "100%")
    gradient.setAttribute("x2", "100%")
    gradient.setAttribute("y2", "0%") // Approx 45 degrees

    // Stops alignés sur la palette (--c-red, --c-orange, --c-yellow, --c-rose)
    const stopsData = [
      { offset: "0%", color: "#A8131A" },
      { offset: "33%", color: "#C56C2C" },
      { offset: "66%", color: "#E9B523" },
      { offset: "100%", color: "#E7B3AD" },
    ]

    stopsData.forEach((s) => {
      const stop = document.createElementNS(svgNS, "stop")
      stop.setAttribute("offset", s.offset)
      stop.setAttribute("stop-color", s.color)
      gradient.appendChild(stop)
    })

    defs.appendChild(gradient)
    svg.appendChild(defs)

    // Generate random scratch path (curved/looped)
    const path = document.createElementNS(svgNS, "path")

    // Tighter viewbox for better control
    svg.setAttribute("viewBox", "0 0 200 60")
    svg.setAttribute("preserveAspectRatio", "none")

    // Generate points for a "looped" scribble
    // We'll use a series of Quadratic Bezier curves
    let d = "M0,30 "
    let x = 0
    let y = 30
    const width = 200
    const step = 50 // Much larger step for smoother, longer curves
    const amp = 20 // Reduced amplitude for subtler waves

    // Forward pass
    for (let i = 0; i <= width; i += step) {
      const nextX = i + step
      const nextY = 30 + (Math.random() - 0.5) * amp * 2

      if (i === 0) {
        // First curve needs explicit control point
        const cpX = (x + nextX) / 2
        const cpY = 30 - amp
        d += `Q${cpX},${cpY} ${nextX},${nextY} `
      } else {
        // Subsequent curves use T for smooth connection (auto-calculated control point)
        d += `T${nextX},${nextY} `
      }

      x = nextX
      y = nextY
    }

    // Backward pass (for density) - REMOVED for lighter look
    // A single pass is enough for a "light" scratch

    path.setAttribute("d", d)
    path.setAttribute("stroke", `url(#${gradientId})`) // Use the gradient
    path.setAttribute("stroke-width", "5.0") // Slightly thicker
    path.setAttribute("fill", "none")
    path.setAttribute("stroke-linecap", "round")
    path.setAttribute("stroke-linejoin", "round")

    svg.appendChild(path)
    title.appendChild(svg)

    // Prepare for draw animation
    const length = path.getTotalLength()

    path.style.strokeDasharray = length
    path.style.strokeDashoffset = length
    path.style.opacity = 0 // Start invisible

    // 2. Animate on Hover (uniquement sur le nom du projet)
    title.addEventListener("mouseenter", () => {
      gsap.to(path, {
        strokeDashoffset: 0,
        opacity: 1,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto",
      })
    })

    title.addEventListener("mouseleave", () => {
      gsap.to(path, {
        strokeDashoffset: length,
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
        overwrite: "auto",
      })
    })
  })

  // --- ANIMATIONS: CLIENTS (Horizontal Drift) ---
  const clientsRoot = document.querySelector("#clients")
  if (clientsRoot) {
    // Apparition du label + split par lettre du gros titre, à l'arrivée sur la section
    const clientsTitleLetters = []
    clientsRoot.querySelectorAll(".clients-title p").forEach((line) => {
      const textContent = line.textContent.replace(/\s+/g, " ").trim()
      line.innerHTML = ""

      const words = textContent.split(" ")
      words.forEach((word) => {
        if (!word) return
        const wordSpan = document.createElement("span")
        wordSpan.className = "clients-word"
        word.split("").forEach((char) => {
          const letterSpan = document.createElement("span")
          letterSpan.textContent = char
          letterSpan.className = "clients-letter"
          wordSpan.appendChild(letterSpan)
          clientsTitleLetters.push(letterSpan)
        })
        line.appendChild(wordSpan)
        line.appendChild(document.createTextNode(" "))
      })
    })

    gsap.set(".clients-label", { opacity: 0, y: 20 })
    gsap.set(clientsTitleLetters, { opacity: 0, y: 30 })
    gsap.set(".clients-intro-inner", { y: "-26vh" })

    const clientsIntroTl = gsap.timeline({
      scrollTrigger: {
        trigger: "#clients",
        start: "top bottom",
        end: "top top",
        scrub: true,
      },
    })

    clientsIntroTl.to(".clients-intro-inner", { y: "0vh", ease: "none", duration: 1.3 }, 0)
    clientsIntroTl.to(".clients-label", { opacity: 1, y: 0, ease: "power2.out" }, 0.25)
    clientsIntroTl.to(
      clientsTitleLetters,
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

    const clientsScene = document.querySelector(".clients-scene")
    const clientsCardsContainer = clientsRoot.querySelector(".clients-cards")
    const clientCards = clientsRoot.querySelectorAll(".client-card")
    // Mesures dynamiques : tout est recalculé à chaque ScrollTrigger.refresh()
    // (resize largeur/hauteur, orientation, franchissement 640/1100). Aucune
    // valeur métier changée (0.8 Mobile / 0.85 Tablet / 1 Desktop, hold 0.35).
    // getClientsDistance = distance GRAPHIQUE réelle du rail ; le facteur ne
    // raccourcit que la distance de SCROLL nécessaire pour la parcourir.
    const getClientsDistance = () => clientsCardsContainer.clientWidth - window.innerWidth
    const getScrollFactor = () => getResponsiveScrollFactor()
    const getDriftPhasePx = () => getClientsDistance() * getScrollFactor()
    const getCoverPhasePx = () => window.innerHeight * getScrollFactor()
    // Court hold : le pré-footer reste immobile, plein écran, avant que le footer
    // ne commence à monter par-dessus.
    const getFooterHoldPhasePx = () => window.innerHeight * 0.35 * getScrollFactor()
    const getFooterCoverPhasePx = () => window.innerHeight * getScrollFactor()

    // Pin unique pour toute la scène (drift horizontal + recouvrement pré-footer + hold + recouvrement footer)
    const sceneST = ScrollTrigger.create({
      trigger: clientsScene || "#clients",
      start: "top top",
      end: () =>
        "+=" +
        (getDriftPhasePx() + getCoverPhasePx() + getFooterHoldPhasePx() + getFooterCoverPhasePx()),
      pin: true,
    })

    // Positions dérivées du pin principal (seule source de vérité)
    const driftEnd = () => sceneST.start + getDriftPhasePx()
    const coverEnd = () => driftEnd() + getCoverPhasePx()
    const footerCoverStart = () => coverEnd() + getFooterHoldPhasePx()
    const footerCoverEnd = () => footerCoverStart() + getFooterCoverPhasePx()

    // Lien "Contact" : on vise la fin de l'animation d'entrée du footer, quand il
    // recouvre tout l'écran. Clamp de 1px pour rester dans la plage du pin.
    anchorResolvers["#footer"] = () => Math.max(0, footerCoverEnd() - 1)

    const clientsScrollTween = gsap.to(clientsCardsContainer, {
      x: () => -getClientsDistance(),
      ease: "none",
      scrollTrigger: {
        trigger: clientsScene || "#clients",
        start: () => sceneST.start,
        end: driftEnd,
        scrub: true,
        invalidateOnRefresh: true,
      },
    })

    // Recouvrement par le pré-footer, juste après le drift, sur ~100vh de scroll
    if (clientsScene && document.querySelector("#pre-footer")) {
      const coverScrollTrigger = {
        trigger: clientsScene,
        start: driftEnd,
        end: coverEnd,
        scrub: 1,
      }

      gsap.fromTo(
        "#pre-footer",
        { yPercent: 0 },
        { yPercent: -100, ease: "none", scrollTrigger: coverScrollTrigger },
      )

      // Panneau qui s'élargit : clip-path inset() piloté par la même progression
      // que la montée (driftEnd -> coverEnd), sans scaleX (pas de déformation du texte à venir).
      const preFooterClip = { insetX: 8, radius: 1.5 } // vw / rem

      function applyPreFooterClip() {
        gsap.set("#pre-footer", {
          clipPath:
            `inset(0 ${preFooterClip.insetX}vw 0 ${preFooterClip.insetX}vw ` +
            `round ${preFooterClip.radius}rem ${preFooterClip.radius}rem 0 0)`,
        })
      }
      applyPreFooterClip() // état initial (panneau étroit, coins arrondis)

      // Largeur et arrondi : atteignent leur valeur finale à ~80% de la phase
      // (la montée verticale, elle, continue sur 100% jusqu'à coverEnd)
      const preFooterWidthTrigger = {
        trigger: clientsScene,
        start: driftEnd,
        end: () => driftEnd() + 0.8 * getCoverPhasePx(),
        scrub: 1,
      }

      gsap.to(preFooterClip, {
        insetX: 0,
        ease: "none",
        scrollTrigger: preFooterWidthTrigger,
        onUpdate: applyPreFooterClip,
      })

      gsap.to(preFooterClip, {
        radius: 0,
        ease: "none",
        scrollTrigger: {
          trigger: clientsScene,
          start: () => driftEnd() + 0.6 * getCoverPhasePx(), // dès 60% de la hauteur du viewport recouvert
          end: () => driftEnd() + 0.8 * getCoverPhasePx(),
          scrub: 1,
        },
        onUpdate: applyPreFooterClip,
      })

      gsap.fromTo(
        ".clients-intro",
        { scale: 1 },
        { scale: 0.8, ease: "none", scrollTrigger: coverScrollTrigger },
      )

      // Petit label : opacité + translateY, révélé avant le gros texte
      gsap.set(".pre-footer-label", { opacity: 0, y: 30 })
      gsap.to(".pre-footer-label", {
        opacity: 1,
        y: 0,
        ease: "none",
        scrollTrigger: {
          trigger: clientsScene,
          start: () => driftEnd() + 0.5 * getCoverPhasePx(),
          end: () => driftEnd() + 0.68 * getCoverPhasePx(), // termine avant manifestRevealStart (0.7)
          scrub: 1,
        },
      })

      // Texte manifeste : split par lettre (adapté de la référence pre-footer),
      // révélé pendant que le pré-footer termine de recouvrir Clients.
      const manifestParagraphs = document.querySelectorAll(".pre-footer-manifest")
      if (manifestParagraphs.length > 0) {
        const manifestLetters = []

        // Découpe un texte en mots > lettres > span animé, ajoutés à `parent`.
        // `collector` (optionnel) reçoit aussi les spans créés, pour un traitement local (ex: dégradé).
        function splitIntoLetters(text, parent, collector) {
          text
            .replace(/\s+/g, " ")
            .trim()
            .split(" ")
            .forEach((word) => {
              if (!word) return
              const wordSpan = document.createElement("span")
              wordSpan.className = "pre-footer-word"
              word.split("").forEach((char) => {
                const letterSpan = document.createElement("span")
                letterSpan.className = "pre-footer-letter"
                const innerSpan = document.createElement("span")
                innerSpan.textContent = char
                letterSpan.appendChild(innerSpan)
                wordSpan.appendChild(letterSpan)
                manifestLetters.push(innerSpan)
                if (collector) collector.push(innerSpan)
              })
              parent.appendChild(wordSpan)
              parent.appendChild(document.createTextNode(" "))
            })
        }

        // Couleurs du dégradé du site, pour une interpolation directe par lettre
        // (color est indépendant du transform GSAP, contrairement à background-clip:text
        // qui ne peut pas peindre à travers des descendants transformés).
        const gradientColors = ["--c-red", "--c-orange", "--c-yellow", "--c-rose"].map((name) =>
          getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
        )
        const gradientAt = gsap.utils.interpolate(gradientColors)

        manifestParagraphs.forEach((manifest) => {
          // On garde les nœuds d'origine (texte normal + éventuel <span class="pre-footer-highlight">)
          // avant de vider le paragraphe, pour conserver le dégradé sur les mots surlignés.
          const originalNodes = Array.from(manifest.childNodes)
          manifest.innerHTML = ""

          originalNodes.forEach((node) => {
            if (
              node.nodeType === Node.ELEMENT_NODE &&
              node.classList.contains("pre-footer-highlight")
            ) {
              const highlightSpan = document.createElement("span")
              highlightSpan.className = "pre-footer-highlight"
              const highlightLetters = []
              splitIntoLetters(node.textContent, highlightSpan, highlightLetters)
              manifest.appendChild(highlightSpan)

              highlightLetters.forEach((letter, i) => {
                const t = highlightLetters.length > 1 ? i / (highlightLetters.length - 1) : 0
                letter.style.color = gradientAt(t)
              })
            } else {
              splitIntoLetters(node.textContent, manifest)
            }
          })
        })

        gsap.set(manifestLetters, { rotate: -88, xPercent: -20, opacity: 0 })

        // "haut du pré-footer" dérivé de coverScrollTrigger (position:absolute,
        // donc pas de trigger fiable sur #pre-footer lui-même) :
        // le reveal démarre plus tard dans le recouvrement (60% parcouru) et se
        // termine pile quand le pré-footer a fini de recouvrir Clients.
        const manifestRevealStart = () => driftEnd() + 0.7 * getCoverPhasePx()
        const manifestRevealEnd = coverEnd

        gsap.to(manifestLetters, {
          rotate: 0,
          xPercent: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.01,
          ease: "back.out(1.1)",
          scrollTrigger: {
            trigger: clientsScene,
            start: manifestRevealStart,
            end: manifestRevealEnd,
            scrub: 1,
          },
        })
        // Pas de disparition pour l'instant — prévue plus tard pour la transition
        // vers la section suivante, sur une plage à définir après #pre-footer.
      }
    }

    // Recouvrement du footer, après un court hold sur le pré-footer plein écran
    if (clientsScene && document.querySelector("#footer")) {
      const footerCoverScrollTrigger = {
        trigger: clientsScene,
        start: footerCoverStart,
        end: footerCoverEnd,
        scrub: 1,
      }

      gsap.fromTo(
        "#footer",
        { yPercent: 0 },
        { yPercent: -100, ease: "none", scrollTrigger: footerCoverScrollTrigger },
      )

      // Même système clip-path + objet JS + onUpdate que le pré-footer, objet dédié.
      const footerClip = { insetX: 8, radius: 1.5 } // vw / rem

      function applyFooterClip() {
        gsap.set("#footer", {
          clipPath:
            `inset(0 ${footerClip.insetX}vw 0 ${footerClip.insetX}vw ` +
            `round ${footerClip.radius}rem ${footerClip.radius}rem 0 0)`,
        })
      }
      applyFooterClip()

      const footerWidthTrigger = {
        trigger: clientsScene,
        start: footerCoverStart,
        end: () => footerCoverStart() + 0.8 * getFooterCoverPhasePx(),
        scrub: 1,
      }

      gsap.to(footerClip, {
        insetX: 0,
        ease: "none",
        scrollTrigger: footerWidthTrigger,
        onUpdate: applyFooterClip,
      })

      gsap.to(footerClip, {
        radius: 0,
        ease: "none",
        scrollTrigger: {
          trigger: clientsScene,
          start: () => footerCoverStart() + 0.6 * getFooterCoverPhasePx(),
          end: () => footerCoverStart() + 0.8 * getFooterCoverPhasePx(),
          scrub: 1,
        },
        onUpdate: applyFooterClip,
      })

      // Le contenu du pré-footer, désormais recouvert, rétrécit légèrement
      // (même traitement que .clients-intro pendant le recouvrement précédent).
      gsap.fromTo(
        ".pre-footer-content",
        { scale: 1 },
        { scale: 0.8, ease: "none", scrollTrigger: footerCoverScrollTrigger },
      )

      // Reveal en cascade du contenu du footer (opacité + translateY), déclenché
      // quand le footer a recouvert 50% de l'écran (moitié de la phase de cover).
      const footerRevealTargets = [".footer-logo", ".footer-signature", ".footer-nav", ".footer-right"]
      gsap.set(footerRevealTargets, { opacity: 0, y: 40 })

      const footerContentTl = gsap.timeline({
        scrollTrigger: {
          trigger: clientsScene,
          start: () => footerCoverStart() + 0.5 * getFooterCoverPhasePx(),
          end: footerCoverEnd,
          scrub: 1,
        },
      })

      footerRevealTargets.forEach((selector, i) => {
        footerContentTl.to(
          selector,
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
          i * 0.25,
        )
      })
    }

    // Orientation recalculée à chaque refresh (portrait -> 0.4, paysage -> 0.5).
    const getAmplitude = () => (window.innerWidth < window.innerHeight ? 0.4 : 0.5)

    clientCards.forEach((card, i) => {
      const sign = i % 2 === 0 ? 1 : -1
      const rotation = (Math.random() - 0.5) * 6

      gsap.fromTo(
        card,
        { rotation },
        {
          rotation: -rotation,
          y: () => sign * -getAmplitude() * window.innerHeight,
          yPercent: () => sign * 50,
          yoyo: true,
          repeat: 1,
          ease: "power1.inOut",
          scrollTrigger: {
            trigger: card,
            containerAnimation: clientsScrollTween,
            start: "left 90%",
            end: "right 10%",
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      )
      gsap.to(card, {
        scale: 1.25,
        yoyo: true,
        repeat: 1,
        ease: "back.inOut(3)",
        scrollTrigger: {
          trigger: card,
          containerAnimation: clientsScrollTween,
          start: "left 90%",
          end: "right 10%",
          scrub: true,
        },
      })
    })
  }

  // --- NAVIGATION ANCRE : arrivée cross-page (pendingHash) ---
  // Placé après TOUT le reste (conceptTl, expertise, worksTl, clients scene,
  // footer resolver...) pour garantir que anchorResolvers est complet. Attend
  // un état "page réellement prête" robuste, y compris si `load` est déjà
  // passé (readyState "complete"), puis force refresh + resize AVANT de
  // calculer et rejouer la destination — jamais avant, sinon lenis.limit
  // (recalculé par défaut avec 250ms de debounce) est encore l'ancienne
  // valeur et clampe silencieusement scrollTo() en dessous de la vraie cible.
  if (pendingHash) {
    const pageLoaded =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }))

    Promise.all([pageLoaded, document.fonts.ready]).then(() => {
      ScrollTrigger.refresh()
      lenis.resize()
      requestAnimationFrame(() => {
        scrollToAnchor(pendingHash, { immediate: true, force: true })
        ScrollTrigger.update()
        history.replaceState(null, "", window.location.pathname + window.location.search + pendingHash)
        history.scrollRestoration = "auto"
      })
    })
  }

  console.log("Mirage Studio: Refined Experience Loaded")
}
