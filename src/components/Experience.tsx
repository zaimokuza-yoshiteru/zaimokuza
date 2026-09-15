import { profile } from '../data/profile'
import SectionHeader from './SectionHeader'

/** 工作与教育时间线：仅展示时间、身份和机构。 */
export default function Experience() {
  return (
    <section className="site-frame home-section">
      <div id="experience" className="section-heading scroll-mt-[40px]">
        <SectionHeader title={profile.experienceTitle} />
      </div>
      <div className="section-content experience-list">
        {profile.experience.map((e, i) => (
          <div
            key={i}
            className="reveal experience-row"
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            <div className="font-mono-num text-[13px] leading-[24px] text-text-secondary">{e.period}</div>
            <div>
              <h3 className="text-[16px] font-medium leading-[28px]">{e.org}</h3>
              <p className="mt-[4px] text-[14px] text-text-secondary">{e.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
