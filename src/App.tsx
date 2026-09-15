import Nav from './components/Nav'
import Hero from './components/Hero'
import Projects from './components/Projects'
import Experience from './components/Experience'
import Footer from './components/Footer'
import CustomCursor from './components/CustomCursor'
import HeroInvert from './components/HeroInvert'
import { useRevealOnScroll } from './interactions'
import Blog from './components/Blog'
import { profile } from './data/profile'

const BlogArticle = lazy(() => import('./components/BlogArticle'))

export default function App() {
  const [hash, setHash] = useState(window.location.hash)
  const blogPage = hash === '#/blog' || hash.startsWith('#/blog/')
  const slug = hash.startsWith('#/blog/') ? hash.slice('#/blog/'.length) : ''
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  useLayoutEffect(() => {
    // 路由更新后再定位首页锚点，兼容浏览器前进、后退和深链接刷新。
    if (blogPage || !hash) window.scrollTo(0, 0)
    else document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [hash, blogPage])
  useEffect(() => {
    const post = profile.blog.posts.find((entry) => encodeURIComponent(entry.slug) === slug)
    document.title = blogPage ? `${post?.title ?? profile.blog.archiveTitle} · Zaimokuza` : 'Zaimokuza'
  }, [blogPage, slug])
  useRevealOnScroll()
  return (
    <div className="flex min-h-full flex-col">
      <Nav blogPage={blogPage} />
      {/* 自定义光标作用区（nav/footer 保留系统光标） */}
      <main className="cursor-hidden-zone flex-1">
        {blogPage ? (slug ? <Suspense fallback={<p className="article-loading" role="status">{profile.articleUI.loading}</p>}><BlogArticle key={slug} slug={slug} /></Suspense> : <Blog archive />) : <>
          <Hero />
          <Blog />
          <Projects />
          <Experience />
        </>}
      </main>
      <Footer />
      {!blogPage && <HeroInvert />}
      <CustomCursor />
    </div>
  )
}
import { lazy, Suspense, useEffect, useLayoutEffect, useState } from 'react'
