import { img } from '../data.js'

export default function Footer() {
  return (
    <footer id="enquire" className="footer">
      <div className="wrap">
        <p className="kicker mono"><span>05</span><span>Enquire</span></p>
        <h2 className="serif foot-title">Private viewings<br /><em>begin spring 2027.</em></h2>
        <div className="foot-grid">
          <div>
            <p className="mono f-k">Sales gallery</p>
            <p>Ķīpsalas iela · Riga<br />By appointment</p>
          </div>
          <div>
            <p className="mono f-k">Contact</p>
            <p><a href="mailto:hello@strata.example">hello@strata.example</a><br />+371 0000 0000</p>
          </div>
          <div>
            <p className="mono f-k">Architecture</p>
            <p>Studio Ainava<br />Landscape — Atelier Bērzs</p>
          </div>
          <a className="btn btn-dark" href="mailto:hello@strata.example?subject=STRATA%20private%20viewing">Request a private viewing</a>
        </div>
        {/* the case behind the concept — the one link a visitor of the portfolio should not miss */}
        <a className="foot-btc" href="/behind-the-case">
          <span className="foot-btc-img" aria-hidden="true"><img src={img('hero', 1400)} alt="" loading="lazy" /></span>
          <span className="foot-btc-body">
            <span className="mono foot-btc-k">Behind the case</span>
            <span className="serif foot-btc-t">How STRATA was designed,{" "}<em>layer by layer.</em></span>
            <span className="foot-btc-d">The concept, the design system and the process behind this site.</span>
          </span>
          <span className="mono foot-btc-go">Read the case <span className="foot-btc-arrow" aria-hidden="true">→</span></span>
        </a>
        <div className="foot-base mono">
          <span className="wordmark">STRATA</span>
          <span>A concept project — the building, names, figures and prices are fictional. Visuals generated with AI.</span>
          <span>56°57′11″ N · 24°05′06″ E</span>
        </div>
      </div>
    </footer>
  )
}
