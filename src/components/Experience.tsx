import { profile } from '../data/profile'
import SectionHeader from './SectionHeader'

/** 工作与教育合并成一份履历，每行两项；小屏堆叠成单列。 */
export default function Experience() {
  return (
    <section className="site-frame experience-section" aria-label={profile.experienceTitle}>
      <div id="experience" className="scroll-mt-[var(--nav-h)]">
        <SectionHeader title={profile.experienceTitle} count={profile.experience.length} />
      </div>
      <ol className="experience-list">
        {profile.experience.map((entry, index) => (
          <li key={`${entry.org}-${entry.period}`} className="experience-entry reveal" style={{ transitionDelay: `${index * 60}ms` }}>
            <p className="experience-head">
              <span className="experience-kind font-mono-num">{profile.experienceKinds[entry.kind]}</span>
              <span className="experience-date font-mono-num">{entry.period}</span>
            </p>
            <h3 className="experience-org">{entry.org}</h3>
            <p className="experience-role">{entry.role}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
