import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  fadeUp,
  staggerContainer,
  staggerItem,
  prefersReducedMotion,
} from "../utils/motion";

const FULL_NAME = "Allen Saji";
const TYPING_SPEED = 90; // ms per character

function Profile() {
  const [displayed, setDisplayed] = useState(
    prefersReducedMotion ? FULL_NAME : ""
  );
  const [done, setDone] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(FULL_NAME.slice(0, i));
      if (i === FULL_NAME.length) {
        clearInterval(id);
        setDone(true);
      }
    }, TYPING_SPEED);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="profile">
      <motion.div
        className="section__text"
        variants={staggerContainer(0.1)}
        initial="hidden"
        animate="visible"
      >
        <motion.p className="section__text__p1" variants={fadeUp}>
          Hello, I'm
        </motion.p>
        <motion.h1 className="title" variants={fadeUp}>
          {displayed}
          {!prefersReducedMotion && (
            <span
              className={`typewriter-cursor${
                done ? " typewriter-cursor--blink" : ""
              }`}
            >|
            </span>
          )}
        </motion.h1>
        <motion.p className="section__text__p2" variants={fadeUp}>
          Computer &amp; Software Systems Engineering Student
        </motion.p>
        <motion.div className="status-row" variants={staggerContainer(0.08)}>
          <motion.div className="status-pill" variants={staggerItem}>
            <span className="badge-dot"></span>
            <span className="status-label">Currently:</span> Working on side projects
          </motion.div>
          <motion.div className="status-pill" variants={staggerItem}>
            Open to internships &amp; graduate roles
          </motion.div>
        </motion.div>
        <motion.div
          className="btn-container"
          variants={staggerContainer(0.1)}
        >
          <motion.button
            className="btn btn-color-2"
            variants={staggerItem}
            onClick={() => window.open("https://unholypot.github.io/resume")}
          >
            Download CV
          </motion.button>
          <motion.button
            className="btn btn-color-1"
            variants={staggerItem}
            onClick={() => {
              window.location.href = "/#contact";
            }}
          >
            Contact Info
          </motion.button>
        </motion.div>
        <motion.div id="socials-container" variants={staggerContainer(0.12)}>
          <motion.a
            variants={staggerItem}
            href="https://www.linkedin.com/in/allensaji012/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="/assets/linkedin.png"
              alt="My LinkedIn profile"
              className="icon"
            />
          </motion.a>
          <motion.a
            variants={staggerItem}
            href="https://github.com/unholypot"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="/assets/github.png"
              alt="My GitHub profile"
              className="icon"
            />
          </motion.a>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default Profile;
