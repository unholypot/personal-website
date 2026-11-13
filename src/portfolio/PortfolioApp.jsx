import { useEffect, useState } from 'react'
import { ABOUT } from '../content/about.js'
import { PROJECTS } from '../content/projects.js'
import { PROFILE, ROUTES } from '../content/site.js'
import { SKILLS } from '../content/skills.js'
import ConstellationFigure from './ConstellationFigure.jsx'

const readTheme = () => (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light')

// Opens the project a link points at (the page uses #project-id) and brings it into view.
function useHashOpen() {
  useEffect(() => {
    const open = () => {
      const target = document.getElementById(window.location.hash.slice(1))
      if (!target) return
      if (target.tagName === 'DETAILS') target.open = true
      target.scrollIntoView({ block: 'start' })
    }
    open()
    window.addEventListener('hashchange', open)
    return () => window.removeEventListener('hashchange', open)
  }, [])
}

export default function PortfolioApp() {
  const [theme, setTheme] = useState(readTheme)
  useHashOpen()

  const flip = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem('pf-theme', next)
    } catch {
      /* the choice just will not be remembered */
    }
    setTheme(next)
  }

  return (
    <>
      <a className="skip-link" href="#work">Skip to the projects</a>
      <header className="bar">
        <a className="bar-name" href="#top">{PROFILE.name}</a>
        <nav aria-label="Sections">
          <a href="#work">Work</a>
          <a href="#skills">Skills</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="bar-end">
          <a href={ROUTES.descent}>The descent</a>
          <button type="button" onClick={flip} aria-pressed={theme === 'dark'}>
            {theme === 'dark' ? 'Day mode' : 'Night mode'}
          </button>
        </div>
      </header>

      <main id="top">
        <section className="intro">
          <h1>{PROFILE.name}</h1>
          <p className="intro-role">
            {PROFILE.role} at {PROFILE.school}. {PROFILE.standing}
          </p>
          <p className="intro-open">{PROFILE.availability}.</p>
          <p className="intro-links">
            <a className="button" href={PROFILE.cv}>Download CV</a>
            <a href={`mailto:${PROFILE.email}`}>Email</a>
            <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href={PROFILE.github} target="_blank" rel="noopener noreferrer">GitHub</a>
          </p>
        </section>

        <section id="work" className="block" aria-labelledby="work-title">
          <h2 id="work-title">Work</h2>
          <ol className="projects">
            {PROJECTS.map((p) => (
              <li key={p.id}>
                <details id={p.id}>
                  <summary>
                    <span className="project-year">{p.year}</span>
                    <span className="project-head">
                      <span className="project-title">{p.title}</span>
                      <span className="project-summary">{p.summary}</span>
                      <span className="project-stack">Built with {p.stack}</span>
                    </span>
                  </summary>
                  <div className="project-body">
                    <p>{p.overview}</p>
                    <h3>What I did</h3>
                    <p>{p.role}</p>
                    <h3>Details</h3>
                    <ul>
                      {p.highlights.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                    <h3>Outcome</h3>
                    <p>{p.outcome}</p>
                    {p.links.length > 0 && (
                      <p className="project-links">
                        {p.links.map((l) => (
                          <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>
                        ))}
                      </p>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ol>
        </section>

        <section id="skills" className="block" aria-labelledby="skills-title">
          <h2 id="skills-title">Skills</h2>
          <p className="block-note">
            The same five constellations as in the descent, drawn from the real positions of their stars.
          </p>
          <ul className="skills">
            {SKILLS.map((group) => (
              <li key={group.id}>
                <ConstellationFigure chart={group.constellation} />
                <div>
                  <h3>{group.name}</h3>
                  <p className="skills-tagline">{group.tagline}</p>
                  <p>{group.items.join(', ')}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section id="about" className="block" aria-labelledby="about-title">
          <h2 id="about-title">About</h2>
          <div className="prose">
            {ABOUT.paragraphs.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </div>
        </section>

        <section id="contact" className="block" aria-labelledby="contact-title">
          <h2 id="contact-title">Contact</h2>
          <p className="prose">{PROFILE.availability}. The quickest way to reach me is email.</p>
          <p className="contact-email">
            <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
          </p>
          <p className="intro-links">
            <a className="button" href={PROFILE.cv}>Download CV</a>
            <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href={PROFILE.github} target="_blank" rel="noopener noreferrer">GitHub</a>
          </p>
        </section>
      </main>

      <footer className="foot">
        <p>Allen Saji, 2026. Built with React and three.js.</p>
        <p>
          <a href={ROUTES.descent}>Back to the descent</a>
        </p>
      </footer>
    </>
  )
}
