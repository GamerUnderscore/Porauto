

let tl = gsap.timeline({ paused: false });

const up = -500
const down = 0
const right = 1000
width = 500
tl
    .to(".loading-container", { width: "25%", duration: 2, ease: "expo" }, 0)
    .to("#loading-bar", { width: "100%", duration: 2, ease: "expo" }, 1)
