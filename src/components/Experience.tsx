import { profile } from '../data/profile'
import SectionHeader from './SectionHeader'

/** 工作与教育作为页尾的个人资料并排展示，小屏顺序堆叠。 */
export default function Experience() {
  const work = profile.experience.filter((entry) => entry.kind === 'work')
  const education = profile.experience.filter((entry) => entry.kind === 'education')
  return (
    <section className="site-frame experience-section" aria-label={profile.experienceTitle}>
      <div id="experience" className="experience-work scroll-mt-[40px]">
        <SectionHeader title={profile.experienceTitle} />
        <ol className="experience-list">
          {work.map((entry, index) => (
            <li key={`${entry.org}-${entry.period}`} className="experience-entry reveal" style={{ transitionDelay: `${index * 60}ms` }}>
              <p className="experience-date font-mono-num">{entry.period}</p>
              <h3 className="experience-org">{entry.org}</h3>
              <p className="experience-role">{entry.role}</p>
            </li>
          ))}
        </ol>
      </div>
      {education.length > 0 && <div className="experience-education">
        <SectionHeader title={profile.educationTitle} />
        <ul className="experience-list">
          {education.map((entry) => (
            <li key={`${entry.org}-${entry.period}`} className="experience-entry reveal">
              <p className="experience-date font-mono-num">{entry.period}</p>
              <h3 className="experience-org">{entry.org}</h3>
              <p className="experience-role">{entry.role}</p>
            </li>
          ))}
        </ul>
      </div>}
    </section>
  )
}
