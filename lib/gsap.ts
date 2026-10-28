import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

// Register plugins once. Loaded lazily by SiteMotion (dynamic import), so GSAP
// never delays the first paint.
gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }
