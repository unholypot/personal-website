// The words at each of the five stops, built from the shared content in src/content.
// `window` is when the caption shows, in scroll progress: [starts fading in, fully shown,
// starts fading out, gone]. Each is timed to when its subject is actually on screen.
import { ABOUT } from '../../content/about.js'
import { PROFILE, ROUTES, THESIS_REPORT } from '../../content/site.js'

export const STOPS = [
  {
    id: 'deep-space',
    window: [0, 0, 0.05, 0.09],
    kicker: 'Engineering student at QUT',
    title: PROFILE.name,
    body: 'Software on one side, electrical on the other. Scroll to begin the descent.',
  },
  {
    id: 'approach',
    window: [0.19, 0.215, 0.265, 0.285],
    kicker: 'About me',
    title: 'Where software meets electrical',
    body: `I'm in my final year at QUT, graduating early 2027, on the Dean's List. I like the parts of engineering where code and circuits overlap, and most of my best projects live there.`,
  },
  {
    id: 'entry',
    window: [0.43, 0.46, 0.56, 0.59],
    kicker: 'Honours thesis, 2026',
    title: 'Teaching a model to count bubbles',
    body: 'I trained models to outline bubbles in high-speed electrolyser video, then checked which measurements can be trusted. Gas coverage came out within about 3% of the labels.',
    links: [{ label: 'Read the report', href: THESIS_REPORT }],
  },
  {
    id: 'low-flight',
    window: [0.69, 0.72, 0.8, 0.83],
    kicker: 'Two projects from my degree',
    title: 'Built with a team, and built alone',
    body: 'A 364 g drone payload that I managed with a team of five, and a background removal service on AWS that I built on my own, from the queue to the deployment.',
    links: [
      { label: 'The drone payload', href: `${ROUTES.portfolio}#uav-payload` },
      { label: 'The cloud service', href: `${ROUTES.portfolio}#cloud-background-removal` },
    ],
  },
  {
    id: 'landing',
    window: [0.94, 0.975, 1, 1],
    kicker: 'Away from the desk',
    title: "When I'm not building",
    body: `${ABOUT.offTheClock} I'm looking for internships and graduate roles, and the rest of my work is in the portfolio.`,
    links: [
      { label: 'Full portfolio', href: ROUTES.portfolio },
      { label: 'Download CV', href: PROFILE.cv },
      { label: 'Email', href: `mailto:${PROFILE.email}` },
      { label: 'LinkedIn', href: PROFILE.linkedin },
      { label: 'GitHub', href: PROFILE.github },
    ],
  },
]
