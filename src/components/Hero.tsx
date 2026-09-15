import { profile } from '../data/profile'
import HeroParticles from './HeroParticles'

export default function Hero() {
  return (
    <section className="home-hero">
      <div className="site-frame hero-layout">
        <header className="hero-identity hero-fade-in">
          <p className="hero-greeting">{profile.heroGreeting}</p>
          <h1>{profile.heroName}</h1>
        </header>
        <HeroParticles />
      </div>
    </section>
  )
}
