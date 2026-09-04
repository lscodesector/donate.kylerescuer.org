/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  08 · ATUALIZAÇÕES - a linha do tempo, inclusive o que deu errado     ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Porte de `clone-sites-antigos/site-antigo/08-timeline.html`.
 * Sem estado e sem `<script>` no original - Server Component.
 *
 * A ordem é do mais recente para o mais antigo, e as bolinhas dizem o quê:
 *
 *   `--gold`    o marco atual (a campanha no ar)
 *   `--filled`  aconteceu
 *   sem modificador  o item mais antigo, em cinza
 *
 * ⚠️ A âncora desta seção é `#atualizacoes` - em português, diferente de
 * todas as outras (`#story`, `#shelters`, `#impact`...). É assim no arquivo de
 * origem, e foi mantida: nenhum link do menu ou do rodapé aponta para ela, e
 * trocar por `#updates` quebraria qualquer link externo que já exista.
 */

const ITENS = [
  {
    marcador: "ln-tl-dot--gold",
    data: "Jun 2026 · Campaign launched",
    titulo: "Kyle's story reached the internet",
    texto: (
      <>
        Over 1,000 shares in 24 hours, but still far from what&apos;s needed to
        support the 400+ animals in the shelters.{" "}
        <strong>Your help makes a difference.</strong>
      </>
    ),
  },
  {
    marcador: "ln-tl-dot--filled",
    data: "May 2026 · Crisis in Minas Gerais",
    titulo: "Save Dog Shelter nearly closed over unpaid rent",
    texto: (
      <>
        Kyle negotiated a 30-day extension. 92 animals depended on that
        decision. With donors&apos; help, the shelter stayed open.
      </>
    ),
  },
  {
    marcador: "ln-tl-dot--filled",
    data: "Mar 2026",
    titulo: "20 animals didn't make it this year",
    texto: (
      <>
        Due to medicine and food not arriving in time. Every life lost is a
        battle that could have been won with enough resources.
      </>
    ),
  },
  {
    marcador: "",
    data: "Dec 2025",
    titulo: "Local government denies support for the 3rd time",
    texto: (
      <>
        Kyle keeps fighting to secure donations. With no public funding, the
        campaign is the only alternative.
      </>
    ),
  },
] as const;

export default function Timeline() {
  return (
    <section className="ln-section cp-tl-section ln-section-anchor" id="atualizacoes">
      <div className="ln-card">
        <div className="ln-card-inner">
          <div className="ln-section-title">
            <div
              className="ln-section-icon"
              style={{ background: "rgba(200, 16, 46, 0.08)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#BF0521" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span>Updates</span>
          </div>

          <div className="ln-timeline">
            {ITENS.map((item) => (
              <div className="ln-tl-item" key={item.data}>
                <div
                  className={`ln-tl-dot${item.marcador ? ` ${item.marcador}` : ""}`}
                  aria-hidden="true"
                />
                <p className="ln-tl-date">{item.data}</p>
                <p className="ln-tl-name">{item.titulo}</p>
                <p className="ln-tl-text">{item.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
