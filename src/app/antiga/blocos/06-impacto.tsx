/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  06 · IMPACTO - "sem apoio" contra "com você"                         ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Porte de `clone-sites-antigos/site-antigo/06-impacto.html`.
 *
 * O original não tinha `<script>` nenhum, e este bloco também não tem estado:
 * fica como Server Component, sem `"use client"` - HTML puro no export, zero
 * JavaScript enviado ao navegador por conta desta seção.
 *
 * Os seis cartões são três "sem" e três "com", nessa ordem, e o contraste é o
 * argumento inteiro da seção. As cores (vermelho para a falta, verde para a
 * presença) vêm de `.ln-impact-card--sem` / `--com` em `antiga.css`.
 */

const ICONE_X = (
  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
);

const ICONE_CHECK = (
  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
);

const CARTOES = [
  {
    tipo: "sem",
    forte: "Without support,",
    texto: " food runs out before the end of the month and the animals go hungry",
  },
  {
    tipo: "sem",
    forte: "Without resources,",
    texto: " illnesses get worse because there's no money for treatment",
  },
  {
    tipo: "sem",
    forte: "Without donors,",
    texto:
      " shelters close their doors and the animals end up back on the streets",
  },
  {
    tipo: "com",
    forte: "With you,",
    texto: " no animal goes to sleep hungry or uncared for",
  },
  {
    tipo: "com",
    forte: "With you,",
    texto:
      " treatments and surgeries happen exactly when the animals need them most",
  },
  {
    tipo: "com",
    forte: "With you,",
    texto: " shelters stay standing and every life has a home",
  },
] as const;

export default function Impacto() {
  return (
    <section className="ln-section cp-impact-section ln-section-anchor" id="impact">
      <div className="ln-card">
        <div className="ln-card-inner">
          <div className="ln-section-title">
            <div
              className="ln-section-icon"
              style={{ background: "rgba(191, 5, 33, 0.08)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#BF0521" strokeWidth="2">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <span>The impact of your donation</span>
          </div>

          <div className="ln-divider" style={{ marginTop: 0 }} />

          <div className="ln-impact-list">
            {CARTOES.map((cartao, i) => (
              <div
                key={i}
                className={`ln-impact-card ln-impact-card--${cartao.tipo}`}
              >
                <div className="ln-impact-card__icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {cartao.tipo === "sem" ? ICONE_X : ICONE_CHECK}
                  </svg>
                </div>
                <p className="ln-impact-card__text">
                  <strong>{cartao.forte}</strong>
                  {cartao.texto}
                </p>
              </div>
            ))}
          </div>

          <div className="ln-copy" style={{ marginBottom: 16 }}>
            <p>
              Every donation, no matter how small, is the difference between an
              animal having a chance or not.{" "}
              <strong>Kyle can&apos;t do this alone.</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
