import { useEffect, useState, type RefObject } from 'react'

/** 按标题越过阅读位置的顺序定位章节，长章节中途仍保持当前项。 */
export function useActiveSection(container: RefObject<HTMLElement | null>, content?: string) {
  const [activeId, setActiveId] = useState<string>()

  useEffect(() => {
    const article = container.current
    if (!article) return
    let frame = 0

    const update = () => {
      frame = 0
      // Markdown 更新时可能重建标题节点，每次读取当前 DOM。
      const headings = Array.from(article.querySelectorAll<HTMLElement>('.article-prose h2[id]'))
      const readingLine = Math.min(160, window.innerHeight * 0.25)
      let current: string | undefined
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top > readingLine) break
        current = heading.id
      }
      // 最后一节较短时，也能在到达页底后成为当前章节。
      if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = headings[headings.length - 1]?.id
      }
      setActiveId(current)
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    // 草图加载和代码语言切换会改变正文高度，同步重新定位。
    const resizeObserver = new ResizeObserver(schedule)
    resizeObserver.observe(article)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      resizeObserver.disconnect()
      window.cancelAnimationFrame(frame)
    }
  }, [container, content])

  return activeId
}
