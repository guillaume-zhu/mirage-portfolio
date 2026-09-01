import './styles/about.css'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'
import { initAboutHero } from './aboutHero'
import { initAboutApproach } from './aboutApproach'
import { initAboutNumbers } from './aboutNumbers'
import { createAboutNumbersWebGL } from './aboutNumbersWebGL'
import { initAboutManifesto } from './aboutManifesto'
import SplitText from 'gsap/SplitText'

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

  initAboutHero(gsap, ScrollTrigger)
  initAboutApproach(gsap, ScrollTrigger)
  initAboutNumbers(gsap, ScrollTrigger)

  const numbersEl = document.querySelector('.about-numbers')
  if (numbersEl) {
    createAboutNumbersWebGL(numbersEl)
  }

  // SplitText doit mesurer les mots avec Gloock déjà chargé, sinon la
  // découpe en lignes se fait sur les métriques du fallback ("serif") et
  // reste figée après coup — seul Manifesto attend ce signal.
  await document.fonts.ready

  initAboutManifesto(gsap, ScrollTrigger, SplitText)

  ScrollTrigger.refresh()
})
