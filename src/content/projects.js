// Every project, written once. The descent uses `summary`; the portfolio page uses all of it.
// Fields: id (the page anchor), year, title, summary (two sentences at most), stack (what it was built with),
// overview, role, highlights, outcome, links ({ label, href }, local files included).
import { THESIS_REPORT } from './site.js'

export const PROJECTS = [
  {
    id: 'honours-thesis',
    year: '2026',
    title: 'Honours thesis: bubble analysis',
    summary:
      'My QUT honours thesis on measuring bubbles in high-speed water electrolyser video. I built a dataset of 37,388 audited labels and compared Mask R-CNN and StarDist models.',
    stack: 'PyTorch, Detectron2, TensorFlow, CVAT',
    overview:
      "Machine Learning for Bubble Analysis in Water Electrolysers, my honours thesis at QUT. Bubbles on the electrode block active area and reduce efficiency, so their size and coverage need measuring, but video at about 2,000 fps with tiny bubbles on a textured mesh can't be measured by hand. I built and tested a pipeline that outlines each bubble automatically, then checked which of its measurements can actually be trusted. Supervised by Dr Simon Denman and Assoc Prof Dezso Sera.",
    role:
      "Student researcher. I labelled frames in CVAT as one of three annotators, built the data and training pipeline (adapted from the research group's workflow), trained and evaluated every model, ran the measurement and annotator agreement analyses, and wrote the report.",
    highlights: [
      "Built the dataset from one high-speed recording: rebuilt the frames from the video, verified alignment, audited three annotators' CVAT polygon exports with every removal logged, and ended up with 37,388 bubble labels, split by whole sequences (about 67/17/17%) to avoid leakage",
      "Trained Mask R-CNN (Detectron2, PyTorch, ResNet-50 FPN, fine-tuned from COCO weights) at 0.74×, 1.5× and 2.0× input scale, StarDist from scratch in TensorFlow, and a hybrid of the two, making every choice on validation and testing each model once on a held-out test set",
      "Enlarging the input to 1.5× took Mask R-CNN's test mask AP from 40.4 at default resolution to 45.1 ± 0.2 over three seeds, with F1 0.80. StarDist reached 43.5 and the hybrid gave no real gain. 2.0× reached 46.7 from tighter outlines, with no more bubbles found",
      "The 1.5× model found 94-100% of bubbles above 25 px, and overlap wasn't the limit: for 20 px and up, recall was 94% isolated, 97% touching and 96% overlapping. Below 15 px every model found almost nothing",
      "Gas coverage and Sauter mean diameter came out within about 3% of the labels, so those are reliable. Bubble count ran about 20% low and mean diameter about 20% high, because the missed bubbles are numerous but tiny, so those two aren't",
      "Measured how much people agree: counts differed by 28% on identical frames, and annotators agreed with each other at F1 about 0.68 while the model agreed with each at about 0.75. Below 10 px only 20% of one person's labels were confirmed by another, against about 96% at 25-40 px",
      "Also tried classical background subtraction. It gave about 5× contrast on bubbles, but thresholding produced fragments rather than separate bubbles, so it can't replace instance segmentation",
    ],
    outcome:
      "Ran from February to October 2026, with the report submitted in October. On this recording the model can be trusted for coverage and Sauter mean diameter, but not for counts or mean diameter. The small-bubble limit lines up with where people stop agreeing, which is strong evidence, not proof, that the labels are part of the problem, so a consistent labelling rule is the top next step. Everything here comes from one recording, so I don't claim it generalises beyond that.",
    links: [{ label: 'Read the report (PDF)', href: THESIS_REPORT }],
  },
  {
    id: 'uav-payload',
    year: '2026',
    title: 'UAV air quality and target detection payload',
    summary:
      'A 364 g drone payload that monitors air quality, reads pressure gauges and drills soil samples, built by a team of five. I was project manager and air quality lead.',
    stack: 'Raspberry Pi 5, Python, MQTT, I2C, SPI',
    overview:
      "A QUT team project to build a drone payload for inspecting a plant where GPS isn't available. It monitors air quality for gas leaks, reads pressure gauges and valve states with a camera, and drills a soil sample when the conditions call for it, all in 364 g. The payload is split into four subsystems (air quality, target detection, web dashboard, and enclosure and drill) that run on one Raspberry Pi 5 and had to work together as one unit.",
    role:
      'Project manager and air quality lead in a five-person team. I ran the planning, schedule and weekly meetings, led the systems engineering across all four subsystems, and wrote the air quality sensor and display software.',
    highlights: [
      'Defined the interfaces and communication standards between the four subsystems, so each one talks to the others through a single MQTT broker on the Pi and could be built and tested on its own',
      "Verified the integrated payload against the customer's requirements, linking each requirement to the test or demonstration that proved it",
      'Wrote embedded Python on a Raspberry Pi 5 to sample temperature, humidity, pressure, light and gas over I2C every second, correcting the temperature reading for heat from the CPU and holding back gas readings until the sensor has warmed up',
      'Streamed telemetry over MQTT to the ground station dashboard, while logging every sample on the Pi so no data is lost if the network drops',
      "Built an SPI LCD controller that shows the Pi's IP address, live sensor data and the latest detection images, switched remotely from the dashboard or with a hand wave over the proximity sensor",
    ],
    outcome:
      'Delivered in October 2026 at 364 g, 46 g under the 410 g limit and within the $600 budget. The payload flew in the final acceptance test, sending live air quality data and target detections to the ground station.',
    links: [],
  },
  {
    id: 'this-website',
    year: '2026',
    title: 'This website',
    summary:
      'A portfolio built from scratch in React, with a scroll-driven three-dimensional descent as the front door.',
    stack: 'React, Vite, three.js, React Three Fiber, Framer Motion',
    overview:
      "I wanted a portfolio that didn't look like every other template, so I built this one from the ground up. The original site is a retro-styled React page with an interactive project timeline. The descent came later: a scroll-driven trip from deep space down to a moon, drawn entirely from flat-shaded geometry with a printed-poster look.",
    role:
      'Sole designer and developer. I owned every decision, from the design language and component architecture to the scene, the theming and the deployment setup.',
    highlights: [
      'Built the descent as real three-dimensional geometry in three.js, lit by one sun and shaded in three flat tones, so every planet, moon, mountain and building follows the same rules',
      'Drew the skills as real constellations from star catalogue positions, and made them react to the pointer in the opening view',
      'Kept it usable: a skip-to-page mode, reduced-motion support, a fallback when WebGL is missing, and a layout that works from phones to wide screens',
      "Kept the original site's timeline, which has separate desktop and mobile interaction models and full keyboard navigation",
    ],
    outcome:
      "Live at allensaji.com and still changing as I add projects. It's the first place I point recruiters and collaborators to.",
    links: [
      { label: 'Source on GitHub', href: 'https://github.com/unholypot/personal-website' },
      { label: 'allensaji.com', href: 'https://allensaji.com' },
    ],
  },
  {
    id: 'cloud-background-removal',
    year: '2025',
    title: 'Cloud background removal system',
    summary:
      'A background removal platform on AWS, built as two independent microservices joined by an asynchronous queue with retry logic and fault isolation.',
    stack: 'AWS (ECS Fargate, SQS, S3, Cognito, RDS), Node.js, Docker, PostgreSQL',
    overview:
      'A full-stack cloud project built as part of CAB432 Cloud Computing at QUT, where I wanted to explore and implement an application starting from scratch using the full range of available AWS services. The result is a background removal service split across two independent containerised services.',
    role:
      'Sole developer responsible for the architecture, async pipeline, ML integration, and full AWS deployment across EC2 and ECS Fargate.',
    highlights: [
      'Split the platform into two independent containerised services: a stateless API tier and an ML processing tier, each with its own ECS Fargate task definition and resources tuned to its workload',
      'Built an asynchronous SQS pipeline to decouple user uploads from ML inference, so the API returns immediately while workers pull jobs independently; implemented retry logic with a Dead Letter Queue to isolate failing jobs after three attempts',
      'Integrated a neural network background removal model into the processor service, with job status tracked through PostgreSQL on RDS so the frontend can poll for completion without holding open connections to the processing tier',
      'Secured the platform with AWS Cognito authentication and served all images through S3 pre-signed URLs, so image data flows directly between the browser and S3 without ever touching the API servers, keeping the compute tier stateless and horizontally scalable',
      'Deployed the frontend on EC2 and the backend services behind an Application Load Balancer with HTTPS and a custom domain, with ECS auto-scaling policies driving task count based on CPU utilisation',
    ],
    outcome:
      'A working distributed system that handled the full pipeline end-to-end and gave me hands-on experience with production AWS architecture and queue-based processing patterns.',
    links: [{ label: 'Source on GitHub', href: 'https://github.com/unholypot/BG_ERASER' }],
  },
  {
    id: 'solar-inverter',
    year: '2025',
    title: 'Solar inverter analysis',
    summary:
      'Reverse-engineered a commercial 5 kW grid-tied solar inverter and modelled its boost converter and full-bridge stage in LTspice and MATLAB to analyse efficiency, ripple and switching.',
    stack: 'LTspice, MATLAB',
    overview:
      "A detailed engineering analysis of a commercial 5 kW grid-tied solar PV inverter. Working with a partner, we reverse-engineered the inverter's internal architecture from physical measurements and datasheet specifications, then reconstructed and simulated both of its power conversion stages. The project focused on modelling the DC-DC boost converter, designing the single-phase full-bridge DC-AC inverter stage, and evaluating converter efficiency, switching behaviour, and output waveform quality using simulation tools.",
    role:
      'Power electronics analysis and simulation. I contributed to inverter architecture reverse engineering, LTspice circuit modelling, MATLAB-based analysis, and design of efficiency improvements.',
    highlights: [
      'Reverse-engineered the internal architecture of a commercial 5 kW grid-tied PV inverter from physical measurements and datasheet specifications',
      'Modelled the DC-DC boost converter in LTspice and MATLAB, validating theoretical ripple and duty cycle calculations against simulation',
      'Designed the full-bridge inverter stage using sinusoidal pulse-width modulation to push switching noise above the audible range, selecting a suitably rated IGBT and sizing the output filter to meet grid voltage and waveform quality requirements',
      'Estimated stage efficiency after accounting for inductor, switching, and capacitor losses',
      'Proposed a snubber circuit to significantly reduce switching losses in the boost MOSFET, and identified synchronous rectification as a further efficiency improvement path',
    ],
    outcome:
      'Developed validated simulation models of both the boost converter and full-bridge inverter stages, and identified concrete design improvements, including a snubber circuit and synchronous rectification, to reduce switching losses and improve overall efficiency.',
    links: [],
  },
]

export const projectById = (id) => PROJECTS.find((p) => p.id === id)
