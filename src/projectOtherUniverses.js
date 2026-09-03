// Section "Autres univers", générique aux 4 pages Project.
//
// Deux pistes indépendantes, communiquant uniquement via activeProjectIndex :
// - IDLE (noir) : fenêtre circulaire à 5 emplacements fixes (-2..+2). Un
//   changement d'actif fait glisser les 5 emplacements d'UN cran ; seul celui
//   qui sort entièrement du cadre est recyclé (contenu réassigné + repositionné
//   sans transition, invisible). Aucune carte visible ne change d'identité ni
//   ne traverse l'écran.
// - DRAG (cream) : exactement 3 cartes (previous/active/next), rail flex
//   naturel, sans clone, sans boucle, bornées entre première et dernière
//   carte centrée. Purement visuel (aucun <a>, pointer-events:none — le drag
//   est observé sur root, ce rail n'a jamais besoin de recevoir les events).
//
// Layout (tailles, radius, IDLE_STEP, position des labels) vient de Figma
// (149:183). Gap du rail drag (5px) vient de MWG 111, non spécifié par Figma
// pour cet état. Mode natif (<=900px, hover:none, pointer:coarse) : rail
// .project-other-track d'origine, aucune mécanique desktop créée.

import Observer from "gsap/Observer"

export function initProjectOtherUniverses(gsap, ScrollTrigger) {
  const root = document.querySelector(".project-other-universes")
  if (!root) return

  gsap.registerPlugin(Observer)

  const container = root.querySelector(".project-other-container")
  const sourceTrack = root.querySelector(".project-other-track")
  const labelIdle = root.querySelector(".project-other-label--idle")
  const labelDrag = root.querySelector(".project-other-label--drag")
  const sourceCards = sourceTrack ? Array.from(sourceTrack.querySelectorAll(".project-other-card")) : []
  if (!container || !sourceTrack || !labelIdle || !labelDrag || sourceCards.length !== 3) return

  const projects = sourceCards.map((el) => ({
    href: el.getAttribute("href"),
    title: el.dataset.projectTitle || "",
    src: el.querySelector("img")?.getAttribute("src") || "",
  }))

  const mm = gsap.matchMedia()

  // Mode natif : .project-other-track (source) redevient le rail réel via
  // le CSS de la media query correspondante — aucun DOM généré ici.
  mm.add("(max-width: 900px), (hover: none), (pointer: coarse)", () => {
    container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2
  })

  mm.add("(min-width: 901px) and (hover: hover) and (pointer: fine)", () => {
    const EASE = "expo.inOut"
    const TRANSITION_DURATION = 0.6
    const ACTIVE_SCALE = 520 / 442 // ≈ 1.17647, mesuré Figma (149:183)
    const IDLE_STEP_RATIO = 883.5 / 1728 // écart centre-à-centre mesuré Figma
    const DRAG_THRESHOLD = 6

    const mod3 = (n) => ((n % 3) + 3) % 3
    const step = () => window.innerWidth * IDLE_STEP_RATIO

    let activeProjectIndex = Math.floor((projects.length - 1) / 2) // = 1
    let isPressed = false
    let isDragging = false
    let isIdleTransitioning = false
    let isReturning = false
    let dragDistance = 0

    // --- IDLE TRACK : 5 emplacements à rôle fixe -2..+2 ---
    const idleTrack = document.createElement("div")
    idleTrack.className = "project-other-idle-track"
    container.appendChild(idleTrack)

    const idleSlots = [-2, -1, 0, 1, 2].map((role) => {
      const el = sourceCards[0].cloneNode(true)
      idleTrack.appendChild(el)
      return { el, role }
    })

    function applySlotContent(slot) {
      const p = mod3(activeProjectIndex + slot.role)
      slot.el.setAttribute("href", projects[p].href)
      slot.el.dataset.projectTitle = projects[p].title
      const img = slot.el.querySelector("img")
      if (img) img.src = projects[p].src
    }

    function applySlotA11y(slot) {
      const nearVisible = Math.abs(slot.role) <= 1
      if (nearVisible) {
        slot.el.removeAttribute("aria-hidden")
        slot.el.removeAttribute("tabindex")
      } else {
        slot.el.setAttribute("aria-hidden", "true")
        slot.el.setAttribute("tabindex", "-1")
      }
    }

    idleSlots.forEach((slot) => {
      applySlotContent(slot)
      applySlotA11y(slot)
    })

    function layoutIdleSlot(slot, { animate = true, onSettled } = {}) {
      const vars = { x: slot.role * step(), scale: slot.role === 0 ? ACTIVE_SCALE : 1 }
      if (!animate) {
        gsap.set(slot.el, vars)
        onSettled?.()
        return
      }
      gsap.to(slot.el, {
        ...vars,
        ease: EASE,
        duration: TRANSITION_DURATION,
        onComplete: () => {
          if (Math.abs(slot.role) > 2) {
            slot.role -= Math.sign(slot.role) * 5
            applySlotContent(slot)
            applySlotA11y(slot)
            gsap.set(slot.el, { x: slot.role * step(), scale: 1 })
          }
          onSettled?.()
        },
      })
    }

    function updateIdleLabel() {
      gsap.to(labelIdle, {
        autoAlpha: 0,
        duration: 0.3,
        ease: EASE,
        onComplete: () => {
          labelIdle.textContent = projects[activeProjectIndex].title
          gsap.to(labelIdle, { autoAlpha: 1, duration: 0.3, ease: EASE })
        },
      })
    }

    // revealLabel:false (reverse FLIP drag→idle) prépare le texte du nouvel
    // actif sans jamais rendre labelIdle visible — le reveal appartient alors
    // au switch final (maybeFinishReturn), pas à shiftIdle lui-même.
    function shiftIdle(delta, onComplete, { revealLabel = true } = {}) {
      if (delta === 0) return
      isIdleTransitioning = true
      activeProjectIndex = mod3(activeProjectIndex + delta)
      idleSlots.forEach((slot) => {
        slot.role -= delta
        applySlotA11y(slot)
      })
      let pending = idleSlots.length
      idleSlots.forEach((slot) => {
        layoutIdleSlot(slot, {
          onSettled: () => {
            pending -= 1
            if (pending === 0) {
              isIdleTransitioning = false
              onComplete?.()
            }
          },
        })
      })
      if (revealLabel) {
        updateIdleLabel()
      } else {
        gsap.killTweensOf(labelIdle)
        labelIdle.textContent = projects[activeProjectIndex].title
        gsap.set(labelIdle, { autoAlpha: 0 })
      }
    }

    // --- DRAG TRACK : exactement 3 cartes, rail flex naturel ---
    const dragTrack = document.createElement("div")
    dragTrack.className = "project-other-drag-track"
    container.appendChild(dragTrack)

    const dragCards = [0, 1, 2].map(() => {
      const el = document.createElement("div")
      el.className = "project-other-drag-card"
      el.innerHTML = '<img alt="" draggable="false" />'
      dragTrack.appendChild(el)
      return el
    })

    let incrTick = 0
    let mediaCenters = []
    let lastCenteredIndex = -1
    let dragMorphTween = null
    let returnMorphTween = null

    function syncDragCenters() {
      mediaCenters = dragCards.map((el) => el.offsetLeft + el.offsetWidth / 2)
    }

    function findClosest() {
      if (mediaCenters.length !== dragCards.length) syncDragCenters()
      const halfVw = window.innerWidth / 2
      const left = dragTrack.getBoundingClientRect().left
      let best = 0
      let bestDist = Infinity
      for (let i = 0; i < dragCards.length; i++) {
        const d = Math.abs(left + mediaCenters[i] - halfVw)
        if (d < bestDist) { bestDist = d; best = i }
      }
      return best
    }

    const firstCenterX = () => {
      const el = dragCards[0]
      return -el.offsetLeft + window.innerWidth / 2 - el.offsetWidth / 2
    }
    const lastCenterX = () => {
      const el = dragCards[dragCards.length - 1]
      return -el.offsetLeft + window.innerWidth / 2 - el.offsetWidth / 2
    }

    // quickTo n'est jamais tué : populateDragTrack le resynchronise via
    // gsap.set + xTo(x, x), jamais via killTweensOf.
    const xTo = gsap.quickTo(dragTrack, "x", {
      duration: 0.4,
      ease: "power4",
      onUpdate: () => {
        if (!isPressed) return
        const closest = findClosest()
        if (closest !== lastCenteredIndex) {
          lastCenteredIndex = closest
          labelDrag.textContent = projects[mod3(activeProjectIndex - 1 + closest)].title
        }
      },
    })

    function populateDragTrack() {
      ;[-1, 0, 1].forEach((offset, i) => {
        const p = mod3(activeProjectIndex + offset)
        dragCards[i].querySelector("img").src = projects[p].src
      })
      syncDragCenters()
      const centerEl = dragCards[1]
      const centerX = -centerEl.offsetLeft + window.innerWidth / 2 - centerEl.offsetWidth / 2
      gsap.set(dragTrack, { x: centerX })
      xTo(centerX, centerX)
      incrTick = centerX
    }

    // FLIP idle → drag : les 3 dragCards démarrent superposées pixel pour
    // pixel aux idle slots -1/0/+1 qu'elles remplacent (First = rect idle
    // avant repositionnement, Last = rect drag naturelle une fois le rail
    // centré), puis se détendent vers leur repos (x:0,y:0,scale:1). Le switch
    // idle↔drag (classList "is-dragging") reste instantané : c'est ce tween
    // qui porte la continuité visuelle, plus le crossfade opacity.
    function beginDrag() {
      const idleVisible = [-1, 0, 1].map((r) => idleSlots.find((s) => s.role === r))
      const idleRectsBefore = idleVisible.map((s) => s.el.getBoundingClientRect())

      populateDragTrack()

      dragCards.forEach((el, i) => {
        const from = idleRectsBefore[i]
        const to = el.getBoundingClientRect()
        const deltaX = (from.left + from.width / 2) - (to.left + to.width / 2)
        const deltaY = (from.top + from.height / 2) - (to.top + to.height / 2)
        const scale = from.width / to.width
        gsap.set(el, { x: deltaX, y: deltaY, scale })
      })

      isDragging = true
      root.classList.add("is-dragging")
      lastCenteredIndex = 1
      labelDrag.textContent = projects[activeProjectIndex].title
      gsap.set(labelDrag, { visibility: "visible" })
      gsap.to(labelIdle, { autoAlpha: 0, duration: 0.3, ease: EASE })
      gsap.to(labelDrag, { autoAlpha: 1, duration: 0.3, ease: EASE, delay: 0.1 })

      dragMorphTween?.kill()
      dragMorphTween = gsap.to(dragCards, { x: 0, y: 0, scale: 1, duration: 0.4, ease: EASE })
    }

    const obs = Observer.create({
      target: root,
      type: "pointer,touch",
      preventDefault: false,
      onPress: () => {
        if (isIdleTransitioning || isReturning) return
        isPressed = true
        dragDistance = 0
      },
      onChange: (e) => {
        if (!isPressed) return
        dragDistance += Math.abs(e.deltaX)
        if (!isDragging && dragDistance > DRAG_THRESHOLD) beginDrag()
        if (isDragging) {
          const a = firstCenterX()
          const b = lastCenterX()
          const minX = Math.min(a, b)
          const maxX = Math.max(a, b)
          incrTick = gsap.utils.clamp(minX, maxX, incrTick + e.deltaX)
          xTo(incrTick)
        }
      },
      onRelease: () => {
        if (!isPressed) return
        isPressed = false
        if (isDragging) {
          isDragging = false
          // "is-dragging" reste actif : le drag track reste la couche
          // visible tant que le reverse FLIP et le buffer idle ne sont pas
          // TOUS DEUX prêts (cf. maybeFinishReturn) — sinon l'idle réapparaît
          // un instant dans son ancien ordre avant le shift.
          isReturning = true
          dragMorphTween?.kill() // conserve la position visuelle courante
          dragMorphTween = null

          gsap.to(labelDrag, { autoAlpha: 0, duration: 0.3, ease: EASE })

          const closest = findClosest() // 0=previous, 1=current, 2=next
          const delta = closest === 0 ? -1 : closest === 2 ? 1 : 0
          const finalActiveIndex = mod3(activeProjectIndex + delta)
          const containerRect = container.getBoundingClientRect()
          const targetCenterY = containerRect.top + containerRect.height / 2

          let reverseMorphDone = false
          let idleReady = delta === 0

          // Switch DOM final : atteint seulement quand les dragCards sont
          // exactement sur leur cible idle ET que le buffer est prêt — le
          // reveal du label idle appartient désormais entièrement à cette
          // étape (jamais avant), pour tous les cas de delta.
          function maybeFinishReturn() {
            if (!reverseMorphDone || !idleReady) return
            root.classList.remove("is-dragging")
            gsap.set(dragCards, { x: 0, y: 0, scale: 1 })
            gsap.to(labelIdle, { autoAlpha: 1, duration: 0.3, ease: EASE })
            isReturning = false
            returnMorphTween = null
          }

          // Reverse FLIP par identité de projet (pas par ancien rôle idle) :
          // chaque dragCard rejoint la géométrie idle du projet qu'elle
          // affiche réellement, calculée depuis sa position visuelle
          // courante (dragTrack.x reste figé, seuls les transforms enfants
          // compensent).
          returnMorphTween?.kill()
          returnMorphTween = gsap.timeline({
            onComplete: () => {
              reverseMorphDone = true
              maybeFinishReturn()
            },
          })
          dragCards.forEach((el, i) => {
            const projectIndex = mod3(activeProjectIndex - 1 + i)
            const diff = mod3(projectIndex - finalActiveIndex)
            const finalRole = diff === 2 ? -1 : diff
            const targetCenterX = containerRect.left + containerRect.width / 2 + finalRole * step()
            const targetScale = finalRole === 0 ? ACTIVE_SCALE : 1

            const rect = el.getBoundingClientRect()
            const currentX = Number(gsap.getProperty(el, "x")) || 0
            const currentY = Number(gsap.getProperty(el, "y")) || 0

            returnMorphTween.to(el, {
              x: currentX + (targetCenterX - (rect.left + rect.width / 2)),
              y: currentY + (targetCenterY - (rect.top + rect.height / 2)),
              scale: targetScale,
              duration: TRANSITION_DURATION,
              ease: EASE,
            }, 0)
          })

          if (delta !== 0) {
            shiftIdle(
              delta,
              () => {
                idleReady = true
                maybeFinishReturn()
              },
              { revealLabel: false },
            )
          }
        }
      },
    })

    function handleCardClick(e) {
      const link = e.target.closest(".project-other-card")
      if (!link) return
      if (dragDistance > DRAG_THRESHOLD) e.preventDefault()
    }
    root.addEventListener("click", handleCardClick)

    function handleResize() {
      idleSlots.forEach((slot) => layoutIdleSlot(slot, { animate: false }))
      syncDragCenters()
    }
    window.addEventListener("resize", handleResize)

    // État initial (sans animation) + préparation de l'intro
    idleSlots.forEach((slot) => layoutIdleSlot(slot, { animate: false }))
    labelIdle.textContent = projects[activeProjectIndex].title
    gsap.set(labelIdle, { autoAlpha: 0 })

    const activeSlot = idleSlots.find((s) => s.role === 0)
    const neighborSlots = idleSlots.filter((s) => Math.abs(s.role) === 1)
    gsap.set([activeSlot.el, ...neighborSlots.map((s) => s.el)], { autoAlpha: 0 })
    gsap.set(activeSlot.el, { scale: 1.05 })
    gsap.set(neighborSlots.map((s) => s.el), { scale: 0.85 })

    let introTl = null
    function playIntro() {
      introTl = gsap.timeline()
      introTl.to(activeSlot.el, { autoAlpha: 1, scale: ACTIVE_SCALE, ease: "back.out(1.3)", duration: 0.4, delay: 0.3 }, 0)
      introTl.to(neighborSlots.map((s) => s.el), { autoAlpha: 1, scale: 1, ease: "back.out(1.3)", duration: 0.4, delay: 0.3 }, 0)
      introTl.to(labelIdle, { autoAlpha: 1, duration: 0.8, ease: "power4.inOut", delay: 0.7 }, 0)
    }

    const introSt = ScrollTrigger.create({
      trigger: root,
      start: "top 25%", // recalé pour le cover Testimonial→Autres univers : ~75% du cover parcouru, premier test
      once: true,
      onEnter: playIntro,
    })

    return () => {
      introSt.kill()
      obs.kill()
      introTl?.kill()
      dragMorphTween?.kill()
      returnMorphTween?.kill()
      isReturning = false
      gsap.killTweensOf(idleSlots.map((s) => s.el).concat(dragCards, [labelIdle, labelDrag]))
      root.removeEventListener("click", handleCardClick)
      window.removeEventListener("resize", handleResize)
      root.classList.remove("is-dragging")
      idleTrack.remove()
      dragTrack.remove()
    }
  })

  function destroy() {
    mm.revert()
  }

  return { destroy }
}
