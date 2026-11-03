import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fadeUp,
  staggerContainer,
  staggerItem,
  defaultViewport,
} from "../utils/motion";

/* ── REDUCED MOTION ─────────────────────────────────────── */
const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── ANIMATION VARIANTS ─────────────────────────────────── */
/* Hover preview: lighter, faster */
const previewVariants = {
  hidden: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: prefersReducedMotion ? 0.01 : 0.18, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    y: prefersReducedMotion ? 0 : -6,
    transition: { duration: prefersReducedMotion ? 0.01 : 0.14, ease: [0.25, 0.1, 0.25, 1] },
  },
};

/* Full detail panel: deliberate, stable */
const panelVariants = {
  hidden: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: prefersReducedMotion ? 0.01 : 0.25,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    y: prefersReducedMotion ? 0 : -10,
    transition: {
      duration: prefersReducedMotion ? 0.01 : 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

/* ── TIMELINE DATA ──────────────────────────────────────────
   Edit this array to add / remove / reorder entries.
   Fields:
     year        – displayed on the timeline node
     title       – card heading
     description – short summary shown on the collapsed card
     tags        – array of tech / category labels
     overview    – detailed project overview for the expanded panel
     role        – what you did / your contribution
     highlights  – array of key technical bullet points
     outcome     – optional result or status string
     links       – { github, liveDemo, report } — set to null to hide
   ────────────────────────────────────────────────────────── */
const timelineEntries = [
  {
    year: "2026",
    title: "Honours Thesis: Bubble Analysis",
    description:
      "My QUT honours thesis on measuring bubbles in high-speed water electrolyser video. I built a dataset of 37,388 audited bubble labels, compared Mask R-CNN and StarDist models, and got gas coverage and Sauter mean diameter to within about 3% of the labels.",
    tags: ["Research", "Computer Vision", "PyTorch", "Detectron2", "TensorFlow", "Instance Segmentation"],
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
    links: { github: null, liveDemo: null, report: "/assets/Allen_Saji_Honours_Thesis_Report.pdf" },
  },
  {
    year: "2026",
    title: "Portfolio Website",
    description:
      "A fully custom portfolio site with a retro-inspired design system and an interactive project timeline that adapts to how you're browsing — built from scratch with no UI framework.",
    tags: ["React", "Vite", "Framer Motion", "CSS"],
    overview:
      "The site you're reading right now. I wanted a portfolio that didn't look like every other Tailwind templates, so I built this one from the ground up. The goal was to make something that felt personal, loaded fast, and actually showed off the kind of frontend work I enjoy doing.",
    role:
      "Sole designer and developer. I owned every decision, from the design language and component architecture to the timeline interaction model, theming system, and deployment setup.",
    highlights: [
      "Built a custom CSS design-token system powering synchronized light and dark themes, with a pre-hydration script that applies the saved theme before React mounts so there's no flash of wrong theme on page load",
      "Engineered this project timeline component with distinct desktop and mobile interaction models, click-to-expand panels with hover previews on desktop, independent tap-to-toggle cards on mobile — that adapt seamlessly as the viewport changes",
      "Built a shared animation system on top of Framer Motion for scroll reveals, staggered transitions, and panel animations, with full support for users who prefer reduced motion",
    ],
    outcome:
      "Live at allensaji.com and continuously updated as I develop new projects. It's my primary presence online and the place I point recruiters and collaborators to first.",
    links: { github: "https://github.com/unholypot/personal-website", liveDemo: "https://allensaji.com", report: null },
  },
  {
    year: "2025",
    title: "Cloud Background Removal System",
    description:
      "A cloud-native background removal platform built on AWS as two independent microservices — a stateless API tier and an ML processing tier — connected by an asynchronous queue pipeline with retry logic and fault isolation.",
    tags: ["AWS", "ECS Fargate", "SQS", "Node.js", "Docker", "PostgreSQL"],
    overview:
      "A full-stack cloud project built as part of CAB432 Cloud Computing at QUT, where I wanted to explore and implement an application starting from scratch using the full range of available AWS services. The result is a background removal service split across two independent containerised services.",
    role:
      "Sole developer responsible for the architecture, async pipeline, ML integration, and full AWS deployment across EC2 and ECS Fargate.",
    highlights: [
      "Split the platform into two independent containerised services, a stateless API tier and an ML processing tier each with its own ECS Fargate task definition and resources tuned to its workload",
      "Built an asynchronous SQS pipeline to decouple user uploads from ML inference, so the API returns immediately while workers pull jobs independently; implemented retry logic with a Dead Letter Queue to isolate failing jobs after three attempts",
      "Integrated a neural network background removal model into the processor service, with job status tracked through PostgreSQL on RDS so the frontend can poll for completion without holding open connections to the processing tier",
      "Secured the platform with AWS Cognito authentication and served all images through S3 pre-signed URLs, so image data flows directly between the browser and S3 without ever touching the API servers — keeping the compute tier stateless and horizontally scalable",
      "Deployed the frontend on EC2 and the backend services behind an Application Load Balancer with HTTPS and a custom domain, with ECS auto-scaling policies driving task count based on CPU utilisation",
    ],
    outcome:
      "A working distributed system that handled the full pipeline end-to-end and gave me hands-on experience with production AWS architecture and queue-based processing patterns.",
    links: { github: "https://github.com/unholypot/BG_ERASER", liveDemo: null, report: null },
  },
  {
    year: "2025",
    title: "Solar Inverter Analysis",
    description:
      "Reverse-engineered a commercial 5 kW grid-tied solar PV inverter and modelled both its DC-DC boost converter and single-phase full-bridge DC-AC stage in LTspice and MATLAB to analyse efficiency, ripple behaviour, and switching performance.",
    tags: ["LTspice", "MATLAB", "Power Electronics", "Simulation"],
    overview:
      "A detailed engineering analysis of a commercial 5 kW grid-tied solar PV inverter. Working with a partner, we reverse-engineered the inverter's internal architecture from physical measurements and datasheet specifications, then reconstructed and simulated both of its power conversion stages. The project focused on modelling the DC-DC boost converter, designing the single-phase full-bridge DC-AC inverter stage, and evaluating converter efficiency, switching behaviour, and output waveform quality using simulation tools.",
    role:
      "Power electronics analysis and simulation — contributed to inverter architecture reverse engineering, LTspice circuit modelling, MATLAB-based analysis, and design of efficiency improvements.",

    highlights: [
    "Reverse-engineered the internal architecture of a commercial 5 kW grid-tied PV inverter from physical measurements and datasheet specifications",
    "Modelled the DC-DC boost converter in LTspice and MATLAB, validating theoretical ripple and duty cycle calculations against simulation",
    "Designed the full-bridge inverter stage using sinusoidal pulse-width modulation to push switching noise above the audible range, selecting a suitably rated IGBT and sizing the output filter to meet grid voltage and waveform quality requirements",
    "Estimated stage efficiency after accounting for inductor, switching, and capacitor losses",
    "Proposed a snubber circuit to significantly reduce switching losses in the boost MOSFET, and identified synchronous rectification as a further efficiency improvement path"
    ],
    outcome:
       "Developed validated simulation models of both the boost converter and full-bridge inverter stages, and identified concrete design improvements — including a snubber circuit and synchronous rectification — to reduce switching losses and improve overall efficiency.",
    links: { github: null, liveDemo: null, report: null },
  },
  {
    year: "2024",
    title: "Elevator System Simulation",
    description:
      "Built a multi-component elevator simulator in C for Linux using POSIX shared memory, multithreading, and TCP/IP sockets.",
    tags: ["C", "Linux", "POSIX", "TCP/IP"],
    overview:
      "A systems programming project simulating a networked multi-floor elevator controller. Multiple processes communicate over TCP/IP and share state via POSIX shared memory — modelling real-time concurrent operation.",
    role:
      "Sole developer — designed the system architecture and implemented all components: controller, simulator, display, and network layer.",
    highlights: [
      "POSIX shared memory for inter-process state synchronisation",
      "POSIX threads and mutexes for concurrent floor-request handling",
      "TCP/IP socket communication between elevator controller and display process",
      "Graceful shutdown and signal handling across all processes",
    ],
    outcome:
      "Fully functional simulator with deterministic scheduling and clean resource cleanup on exit.",
    links: { github: null, liveDemo: null, report: null },
  },
  {
    year: "2023",
    title: "C# Mission Planner",
    description:
      "Developed a text-based mission planner in C# (.NET 6.0) with pathfinding to determine the shortest and safest route through a grid-based map.",
    tags: ["C#", ".NET", "Algorithms"],
    overview:
      "A console-based mission planning tool that reads a grid map, identifies threats and safe zones, and uses pathfinding to compute the optimal route for a mission agent.",
    role:
      "Sole developer — designed the data model, implemented the pathfinding algorithm, and built the text-based display renderer.",
    highlights: [
      "Weighted A* pathfinding accounting for terrain cost and threat proximity",
      "Custom map parser supporting variable grid sizes and obstacle definitions",
      "Clear ASCII console rendering of the map, path, and mission summary",
      "Modular design separating map loading, pathfinding, and display layers",
    ],
    outcome:
      "Successfully found optimal routes across all provided test maps, including edge cases with enclosed zones.",
    links: { github: "https://github.com/unholypot/CAB201-Project", liveDemo: null, report: null },
  },
];

/* ── COMPACT HOVER PREVIEW PANEL ───────────────────────── */
function PreviewPanel({ entry }) {
  return (
    <div className="timeline-preview-panel">
      <div className="timeline-detail-section">
        <h4 className="timeline-detail-section-title">Overview</h4>
        <p className="timeline-preview-overview">{entry.overview}</p>
      </div>
      {entry.role && (
        <div className="timeline-detail-section">
          <h4 className="timeline-detail-section-title">What I Did</h4>
          <p className="timeline-preview-role">{entry.role}</p>
        </div>
      )}
    </div>
  );
}

/* ── DETAIL PANEL COMPONENT ─────────────────────────────── */
function DetailPanel({ entry }) {
  const { github, liveDemo, report } = entry.links ?? {};
  const hasLinks = github || liveDemo || report;

  return (
    <div className="timeline-detail-panel">
      <h4 className="timeline-detail-section-title">Overview</h4>

      {entry.overview && (
        <p className="timeline-detail-overview">{entry.overview}</p>
      )}

      {entry.role && (
        <div className="timeline-detail-section">
          <h4 className="timeline-detail-section-title">What I Did</h4>
          <p className="timeline-detail-text">{entry.role}</p>
        </div>
      )}

      {entry.highlights?.length > 0 && (
        <div className="timeline-detail-section">
          <h4 className="timeline-detail-section-title">Key Highlights</h4>
          <ul className="timeline-detail-list">
            {entry.highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      {entry.outcome && (
        <div className="timeline-detail-section">
          <h4 className="timeline-detail-section-title">Outcome</h4>
          <p className="timeline-detail-text">{entry.outcome}</p>
        </div>
      )}

      <div className="timeline-detail-links">
        {github && (
          <a
            href={github}
            className="timeline-detail-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            ↗ GitHub
          </a>
        )}
        {liveDemo && (
          <a
            href={liveDemo}
            className="timeline-detail-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            ↗ Live Demo
          </a>
        )}
        {report && (
          <a
            href={report}
            className="timeline-detail-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            ⊞ Read the report
          </a>
        )}
        {!hasLinks && (
          <span className="timeline-detail-btn timeline-detail-btn--muted">
            No external links available
          </span>
        )}
      </div>
    </div>
  );
}

/* ── MAIN TIMELINE COMPONENT ────────────────────────────── */
function Timeline() {
  // ── Desktop: click-locked full panel (one at a time) ──
  const [desktopOpenId, setDesktopOpenId] = useState(null);
  // ── Desktop: hover compact floating preview ────────────
  const [hoverPreviewId, setHoverPreviewId] = useState(null);
  // ── Mobile: independent per-card toggle (object map) ──
  const [mobileOpenIds, setMobileOpenIds] = useState({});

  // ── Breakpoint: matches CSS @media (max-width: 1200px) ─
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 1200
  );

  const hoverTimer = useRef(null);
  const cardRefs = useRef({});
  const panelRefs = useRef({});

  // Sync isMobile with viewport changes
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1200px)");
    const handler = (e) => {
      setIsMobile(e.matches);
      if (e.matches) {
        clearTimeout(hoverTimer.current);
        setDesktopOpenId(null);
        setHoverPreviewId(null);
      } else {
        setMobileOpenIds({});
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Desktop: close full panel when clicking outside card + panel
  useEffect(() => {
    if (!desktopOpenId) return;
    const handleDocClick = (e) => {
      const card = cardRefs.current[desktopOpenId];
      const panel = panelRefs.current[desktopOpenId];
      if (!card?.contains(e.target) && !panel?.contains(e.target)) {
        setDesktopOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [desktopOpenId]);

  // Hover handlers — desktop only, card element only
  const startHover = (title) => {
    if (isMobile) return;
    clearTimeout(hoverTimer.current);
    setHoverPreviewId(title);
  };

  const endHover = () => {
    if (isMobile) return;
    hoverTimer.current = setTimeout(() => setHoverPreviewId(null), 120);
  };

  // Desktop click — one open at a time, clicking same card closes it
  const handleDesktopClick = (title) => {
    setDesktopOpenId((prev) => (prev === title ? null : title));
    clearTimeout(hoverTimer.current);
    setHoverPreviewId(null);
  };

  // Mobile tap — each card independently toggled
  const handleMobileToggle = (title) => {
    setMobileOpenIds((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <motion.section
      id="projects"
      variants={staggerContainer(0.15)}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
    >
      <motion.p className="section__text__p1" variants={fadeUp}>
        Browse My Recent
      </motion.p>
      <motion.h2 className="title" variants={fadeUp}>
        Projects
      </motion.h2>

      <motion.div className="timeline" variants={fadeUp}>
        {timelineEntries.map((entry, index) => {
          const isLeft = index % 2 === 0;
          const uid = `${entry.year}-${entry.title}`;

          // Desktop derived state
          const isDesktopOpen = desktopOpenId === entry.title;
          // Hover preview only shows when no full panel is open for this card
          const isHoverPreview = !isMobile && hoverPreviewId === entry.title && !isDesktopOpen;
          const desktopCardActive = isDesktopOpen || isHoverPreview;

          // Mobile derived state
          const isMobileOpen = isMobile && !!mobileOpenIds[entry.title];

          // Combined for card styling / dot
          const isCardActive = isMobile ? isMobileOpen : desktopCardActive;

          const cardEl = (
            <div
              ref={(el) => { cardRefs.current[entry.title] = el; }}
              className={`timeline-card${isCardActive ? " timeline-card--expanded" : ""}`}
              role="button"
              tabIndex={0}
              aria-expanded={isMobile ? isMobileOpen : isDesktopOpen}
              aria-label={`${entry.title} — ${(isMobile ? isMobileOpen : isDesktopOpen) ? "collapse" : "expand"} details`}
              onClick={() =>
                isMobile
                  ? handleMobileToggle(entry.title)
                  : handleDesktopClick(entry.title)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  isMobile
                    ? handleMobileToggle(entry.title)
                    : handleDesktopClick(entry.title);
                }
              }}
              onMouseEnter={!isMobile ? () => startHover(entry.title) : undefined}
              onMouseLeave={!isMobile ? endHover : undefined}
            >
              <span className="timeline-year">{entry.year}</span>
              <h3 className="timeline-card-title">{entry.title}</h3>
              <p className="timeline-card-desc">{entry.description}</p>
              {entry.tags?.length > 0 && (
                <div className="timeline-tags">
                  {entry.tags.map((tag) => (
                    <span className="chip" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="timeline-card-expand-hint">
                <span
                  className={`timeline-card-chevron${
                    isCardActive ? " timeline-card-chevron--open" : ""
                  }`}
                >
                  {isMobile
                    ? isMobileOpen ? "▲ Collapse" : "▼ View Details"
                    : isDesktopOpen ? "▲ Collapse" : "▼ View Details"}
                </span>
              </div>
            </div>
          );

          const panelEl = (
            <div
              ref={(el) => { panelRefs.current[entry.title] = el; }}
              style={{ position: "relative" }}
            >
              {/* Desktop: compact floating hover preview — does not affect flow */}
              <AnimatePresence>
                {isHoverPreview && (
                  <motion.div
                    key={`preview-${uid}`}
                    className="timeline-preview-wrapper"
                    variants={previewVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onMouseEnter={() => startHover(entry.title)}
                    onMouseLeave={endHover}
                  >
                    <PreviewPanel entry={entry} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Desktop: full clicked-open panel — renders in normal flow */}
              <AnimatePresence>
                {isDesktopOpen && (
                  <motion.div
                    key={`detail-${uid}`}
                    variants={panelVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <DetailPanel entry={entry} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mobile: full panel, independent per-card */}
              <AnimatePresence>
                {isMobileOpen && (
                  <motion.div
                    key={`mobile-${uid}`}
                    variants={panelVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <DetailPanel entry={entry} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );

          return (
            <motion.div
              key={uid}
              className={`timeline-row${
                isLeft ? " timeline-row--left" : " timeline-row--right"
              }`}
              variants={staggerItem}
            >
              {/* Left column */}
              <div className="tl-col tl-col--left">
                {isLeft ? cardEl : panelEl}
              </div>

              {/* Center: timeline marker */}
              <div className="tl-center">
                <span
                  className={`timeline-node-dot${
                    isCardActive ? " timeline-node-dot--active" : ""
                  }`}
                />
              </div>

              {/* Right column */}
              <div className="tl-col tl-col--right">
                {isLeft ? panelEl : cardEl}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.section>
  );
}

export default Timeline;
