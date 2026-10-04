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
        <div className="foot-base mono">
          <span className="wordmark">STRATA</span>
          <span>A concept project — the building, names, figures and prices are fictional. Visuals generated with AI. <a className="foot-case" href="/behind-the-case">Behind the case →</a></span>
          <span>56°57′11″ N · 24°05′06″ E</span>
        </div>
      </div>
    </footer>
  )
}
