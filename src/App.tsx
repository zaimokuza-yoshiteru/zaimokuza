import Nav from './components/Nav'
import Hero from './components/Hero'
import Projects from './components/Projects'
import Experience from './components/Experience'
import Footer from './components/Footer'
import CustomCursor from './components/CustomCursor'
import HeroInvert from './components/HeroInvert'
import { useRevealOnScroll } from './interactions'

export default function App() {
  useRevealOnScroll()
  return (
    <div className="flex min-h-full flex-col">
      <Nav />
      {/* 自定义光标作用区（nav/footer 保留系统光标） */}
      <main className="cursor-hidden-zone flex-1">
        <Hero />
        <Projects />
        <Experience />
      </main>
      <Footer />
      <HeroInvert />
      <CustomCursor />
    </div>
  )
}
