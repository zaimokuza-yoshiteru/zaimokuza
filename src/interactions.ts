import { useEffect } from 'react'

/**
 * 滚动 reveal：IntersectionObserver 给 .reveal 元素加 .visible，
 * CSS 侧是 opacity/translateY 过渡（threshold 0.15，只触发一次）。
 */
export function useRevealOnScroll() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            io.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' },
    )
    const observe = (root: ParentNode) => root.querySelectorAll('.reveal:not(.visible)').forEach((el) => io.observe(el))
    observe(document)
    // 追加作品和切换页面时，为新增节点注册一次性滚动动画。
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return
          if (node.matches('.reveal:not(.visible)')) io.observe(node)
          observe(node)
        })
        record.removedNodes.forEach((node) => {
          if (!(node instanceof Element)) return
          io.unobserve(node)
          node.querySelectorAll('.reveal').forEach((el) => io.unobserve(el))
        })
      }
    })
    mutations.observe(document.querySelector('main') ?? document.body, { childList: true, subtree: true })
    return () => { io.disconnect(); mutations.disconnect() }
  }, [])
}
