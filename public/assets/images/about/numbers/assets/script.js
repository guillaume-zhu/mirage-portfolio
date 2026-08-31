window.addEventListener("DOMContentLoaded", () => {

    /* LENIS SMOOTH SCROLL (OPTIONAL) */
    lenis = new Lenis({
        autoRaf: true,
    })
    /* LENIS SMOOTH SCROLL (OPTIONAL) */
    
    const root = document.querySelector('.mwg_effect053')
    const pinHeight = root.querySelector('.pin-height')
    const container = root.querySelector('.container')
    const paragraphs = root.querySelectorAll('.paragraphs')

    ScrollTrigger.create({
        trigger: pinHeight,
        start: 'top top',
        end: 'bottom bottom',
        pin: container,
    })

    const splits = Array.from(paragraphs).map(p => {
        const split = SplitText.create(p, { type: "lines", linesClass: "line" })
        split.lines.forEach(line => {
            line.innerHTML = `<div class="line-inner">${line.innerHTML}</div>`
        })
        return split
    })

    splits.forEach((split, i) => {
        if (i > 0) {
            gsap.set(split.lines, { rotationY: 90 })
        }
    })

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: pinHeight,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true
        }
    })

    splits.forEach((split, i) => {
        if (splits[i + 1]) {
            const currentLines = split.lines
            const nextLines = splits[i + 1].lines

            tl.to(currentLines, {
                rotationY: -90,
                stagger: 0.07,
                duration: 1,
                ease: 'back.inOut(1.5)'
            })
            
            tl.to(nextLines, {
                rotationY: 0,
                stagger: 0.07,
                duration: 1,
                ease: 'back.inOut(1.5)'
            }, "<")
        }
    })
})