// The skills, in five groups, each shown as a real constellation. `constellation` names the star
// chart it uses (see starCharts.js). Everything listed is something already on the main site or
// plain from the projects.
export const SKILLS = [
  {
    id: 'languages',
    constellation: 'orion',
    name: 'Languages',
    tagline: "Languages I've written code in",
    items: ['Python', 'C', 'C++', 'C#', 'JavaScript', 'HTML / CSS'],
  },
  {
    id: 'coding-tools',
    constellation: 'scorpius',
    name: 'Coding tools',
    tagline: 'What I build software with',
    items: ['React', 'Vite', 'Node.js', 'Docker', 'AWS', 'PostgreSQL', 'Linux / WSL', 'REST APIs'],
  },
  {
    id: 'engineering',
    constellation: 'crux',
    name: 'Engineering',
    tagline: 'What I design and build',
    items: ['Embedded systems', 'Raspberry Pi', 'PCB design', 'Power electronics', 'DC-DC converters', 'UART / SPI / I2C', 'MQTT', 'Hardware debugging'],
  },
  {
    id: 'ml',
    constellation: 'ursa-major',
    name: 'Machine learning',
    tagline: 'What I train and test models with',
    items: ['PyTorch', 'TensorFlow / Keras', 'Detectron2', 'Mask R-CNN', 'StarDist', 'CVAT'],
  },
  {
    id: 'design',
    constellation: 'cassiopeia',
    name: 'Design and simulation',
    tagline: 'What I model and draw with',
    items: ['MATLAB / Simulink', 'LTspice', 'KiCad', 'Eagle', 'AutoCAD'],
  },
]
