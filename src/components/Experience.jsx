import { motion } from "framer-motion";
import {
  fadeUp,
  staggerContainer,
  defaultViewport,
} from "../utils/motion";

const domains = [
  {
    index: "01",
    title: "Software & Dev",
    skills: [
      "Python",
      "C / C++ / C#",
      "JavaScript",
      "HTML / CSS",
      "React",
      "Vite",
      "Docker",
    ],
  },
  {
    index: "02",
    title: "Engineering & Embedded",
    skills: [
      "DC-DC Converters",
      "PV Inverter Modelling",
      "PCB Design & Layout",
      "Embedded Systems",
      "UART / SPI / I2C",
      "Hardware Debugging",
    ],
  },
  {
    index: "03",
    title: "Tools, Cloud & ML",
    skills: [
      "MATLAB / Simulink",
      "LTspice",
      "AWS",
      "Linux / WSL",
      "PyTorch",
      "Detectron2",
      "TensorFlow / Keras",
      "REST APIs",
      "AutoCAD / KiCad / Eagle",
    ],
  },
];

function Experience() {
  return (
    <motion.section
      id="experience"
      variants={staggerContainer(0.1)}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
    >
      <motion.p className="section__text__p1" variants={fadeUp}>
        Tools and technologies I use across software, embedded systems, and engineering projects.
      </motion.p>
      <motion.h2 className="title" variants={fadeUp}>
        Skills &amp; Tools
      </motion.h2>
      <motion.div className="skills-domains" variants={staggerContainer(0.12)}>
        {domains.map((domain) => (
          <motion.div key={domain.index} className="skills-domain" variants={fadeUp}>
            <div className="skills-domain-header">
              <span className="skills-domain-index">{domain.index}</span>
              <h2 className="skills-domain-title">{domain.title}</h2>
            </div>
            <ul className="skills-list">
              {domain.skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}

export default Experience;
