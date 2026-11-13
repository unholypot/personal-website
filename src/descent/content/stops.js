// The words at each of the five stops. Project text is shortened from the main site's timeline.
// `window` is when the caption shows, in scroll progress: [starts fading in, fully shown,
// starts fading out, gone]. Each is timed to when its subject is actually on screen.
export const STOPS = [
  {
    id: 'deep-space',
    window: [0, 0, 0.05, 0.09],
    kicker: 'Engineering student at QUT',
    title: 'Allen Saji',
    body: 'Building across robotics, embedded systems and machine learning. Scroll to begin the descent.',
  },
  {
    id: 'approach',
    window: [0.19, 0.215, 0.265, 0.285],
    kicker: '2025',
    title: 'Solar Inverter Analysis',
    body: 'Reverse-engineered a commercial 5 kW grid-tied solar inverter and modelled its boost converter and full-bridge stage in LTspice and MATLAB to analyse efficiency, ripple and switching.',
  },
  {
    id: 'entry',
    window: [0.43, 0.46, 0.56, 0.59],
    kicker: '2025',
    title: 'Cloud Background Removal System',
    body: 'A background removal platform on AWS, built as two independent microservices joined by an asynchronous queue with retry logic and fault isolation.',
  },
  {
    id: 'low-flight',
    window: [0.69, 0.72, 0.8, 0.83],
    kicker: '2026',
    title: 'UAV Air Quality & Target Detection Payload',
    body: 'A 364 g drone payload that monitors air quality, reads pressure gauges and drills soil samples, built by a team of five. I was project manager and air quality lead.',
  },
  {
    id: 'landing',
    window: [0.94, 0.975, 1, 1],
    kicker: '2026',
    title: 'Honours Thesis: Bubble Analysis',
    body: 'My QUT honours thesis on measuring bubbles in high-speed water electrolyser video, with 37,388 audited labels and a comparison of Mask R-CNN and StarDist models.',
    links: [
      { label: 'Full portfolio', href: '/' },
      { label: 'Email', href: 'mailto:allensaji012@gmail.com' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/allensaji012/' },
      { label: 'GitHub', href: 'https://github.com/unholypot' },
    ],
  },
]
