export default function SectionHeader({ title, count, level = 2 }: {
  title: string; count?: number; level?: 1 | 2
}) {
  const Heading = level === 1 ? 'h1' : 'h2'
  return (
    <div>
      <Heading className="section-title">
        {title}
        {count !== undefined && <span className="section-count font-mono-num text-[14px] font-normal tracking-normal text-text-secondary">{String(count).padStart(2, '0')}</span>}
      </Heading>
    </div>
  )
}
