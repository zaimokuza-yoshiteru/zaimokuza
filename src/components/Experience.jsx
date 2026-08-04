import { profile } from '../data/profile.js'
import { SectionHeader } from './Projects.jsx'

/** 经历时间线：左时间右内容的极简竖线结构，每段经历下含要点列表 */
export default function Experience() {
  return (
    <section className="mx-auto w-[calc(100%-56px)] max-w-[1260px] py-[48px] md:py-[64px]">
      <SectionHeader id="experience" title="经历" />
      <div className="mt-[36px] flex flex-col">
        {profile.experience.map((e, i) => (
          <div
            key={i}
            className="reveal grid gap-[4px] border-l border-black/10 py-[24px] pl-[28px] md:grid-cols-[180px_1fr] md:gap-[24px]"
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            <div className="font-mono-num text-[13px] leading-[24px] text-text-secondary">{e.period}</div>
            <div>
              <div className="text-[16px] font-medium">
                {e.role}
                <span className="ml-[10px] text-[14px] font-normal text-text-secondary">@ {e.org}</span>
              </div>
              {e.highlights?.length > 0 && (
                <div className="mt-[14px] flex flex-col gap-[14px]">
                  {e.highlights.map((h, j) => (
                    <div key={j}>
                      <div className="text-[14px] font-medium">
                        {h.title}
                        {h.period && (
                          <span className="ml-[10px] font-mono-num text-[12px] font-normal text-text-secondary">
                            {h.period}
                          </span>
                        )}
                      </div>
                      <p className="mt-[4px] text-[14px] leading-[24px] text-text-secondary">{h.detail}</p>
                      {h.tags?.length > 0 && (
                        <div className="mt-[8px] flex flex-wrap gap-[6px]">
                          {h.tags.map((t) => (
                            <span key={t} className="rounded-full bg-bg-section px-[8px] py-[2px] text-[12px] text-text-secondary">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
