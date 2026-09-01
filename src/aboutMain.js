import './styles/about.css'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'
import { initAboutHero } from './aboutHero'
import { initAboutApproach } from './aboutApproach'

document.addEventListener('DOMContentLoaded', () => {
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
})
