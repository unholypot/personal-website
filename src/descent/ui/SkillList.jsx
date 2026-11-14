import { SKILLS } from '../../content/skills.js'

// The skills as plain text. In the animated view it is hidden from sight but read out by
// screen readers (the constellations are for the eye); in the plain page it is shown.
export default function SkillList({ visuallyHidden = false }) {
  return (
    <section className={visuallyHidden ? 'sr-only' : 'skill-list'} aria-labelledby="skill-list-title">
      <h2 id="skill-list-title">Skills, as constellations</h2>
      <ul>
        {SKILLS.map((skill) => (
          <li key={skill.id}>
            <strong>{skill.name}</strong>
            <span>{skill.items.join(', ')}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
