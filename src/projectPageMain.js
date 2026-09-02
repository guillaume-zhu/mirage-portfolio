import './styles/project-page.css'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'
import { initProjectHero } from './projectHero'

document.addEventListener('DOMContentLoaded', async () => {
  gsap.registerPlugin(ScrollTrigger)

  const lenisEasing = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
  const lenis = new Lenis({
    duration: 2.0,
    easing: lenisEasing,
    direction: 'vertical',
    smooth: true,
    touchMultiplier: 1.5,
  })

  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)

  // Attendu avant tout, comme sur About : la mesure de géométrie du Hero
  // (offsetTop/offsetHeight) doit se faire avec Gloock déjà chargé, sinon
  // les valeurs (headingHeight notamment) seraient fausses.
  await document.fonts.ready

  initProjectHero(gsap, ScrollTrigger)

  ScrollTrigger.refresh()
})
