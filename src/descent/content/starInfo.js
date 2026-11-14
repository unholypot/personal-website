// What to say about a star when the pointer rests on it: its name, which constellation it belongs
// to, and (for the well-known ones) one true line about it. Stars that have only a Greek letter in
// the chart are named the way astronomers do, with the constellation's Latin genitive after it.
import { CHARTS } from './starCharts.js'

const GREEK = new Set(['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega'])

const NOTES = {
  'orion:Betelgeuse': "A red supergiant that marks Orion's shoulder.",
  'orion:Rigel': 'A blue supergiant, the brightest star in Orion.',
  'orion:Bellatrix': "Marks Orion's other shoulder.",
  'orion:Meissa': "Marks Orion's head.",
  'orion:Saiph': 'Marks one of Orion’s knees.',
  'orion:Alnitak': "One of the three stars of Orion's Belt.",
  'orion:Alnilam': "The middle star of Orion's Belt.",
  'orion:Mintaka': "One of the three stars of Orion's Belt.",
  'scorpius:Antares': "A red supergiant, the heart of the Scorpion.",
  'scorpius:Shaula': "One of the two stars of the Scorpion's stinger.",
  'scorpius:Lesath': "One of the two stars of the Scorpion's stinger.",
  'scorpius:Dschubba': "Marks the Scorpion's head.",
  'crux:Acrux': 'The brightest star in the Southern Cross.',
  'crux:Mimosa': 'A blue giant, the second brightest in the Cross.',
  'crux:Gacrux': 'A red giant at the top of the Cross.',
  'ursa-major:Dubhe': 'One of the Pointers: a line through it and Merak leads to the North Star.',
  'ursa-major:Merak': 'One of the Pointers: a line through it and Dubhe leads to the North Star.',
  'ursa-major:Mizar': 'A famous double star, with Alcor beside it.',
  'ursa-major:Alioth': 'The brightest star in the Big Dipper.',
  'ursa-major:Megrez': 'The faintest of the seven stars of the Dipper.',
  'ursa-major:Alkaid': 'The end of the Dipper’s handle.',
  'cassiopeia:Schedar': 'The brightest star in Cassiopeia.',
  'cassiopeia:Gamma': 'A star that varies in brightness.',
}

// { name, constellation, note } for star `index` of the chart named `chart` (a key of CHARTS).
export function starInfo(chart, index) {
  const data = CHARTS[chart]
  const star = data?.stars[index]
  if (!star) return null
  const name = GREEK.has(star.name) ? `${star.name} ${data.of}` : star.name
  return { name, constellation: data.name, note: NOTES[`${chart}:${star.name}`] ?? '' }
}

export const starNotes = NOTES
