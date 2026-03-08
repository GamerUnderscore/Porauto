

let tl = gsap.timeline({ paused: false });

const up = -500
const down = 0
const right = 1000
width = 500
tl
    .to("#a", { y: up, yPercent: 0, duration: 2 }, 1)
    .to(".pince", { y: up, yPercent: 0, duration: 2 }, "<")

    .to("#a", { x: right, xPercent: -100, duration: 2 })
    .to(".pince", { x: right - 90, xPercent: 100, duration: 2 }, "<")

    .to("#a", { y: down, yPercent: 0, duration: 2 })
    .to(".pince", { y: down, yPercent: 0, duration: 2 }, "<")