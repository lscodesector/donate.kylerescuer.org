import { withBasePath } from "@/lib/base-path";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  07 · TRANSPARÊNCIA - a conta mensal e o documento de quem recebe     ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Porte de `clone-sites-antigos/site-antigo/07-transparencia.html`.
 * Sem estado e sem `<script>` no original - Server Component.
 *
 * ⚠️ **Os números são os do arquivo antigo, transcritos.** A soma das cinco
 * linhas dá exatamente o "Total needed" publicado ($48.587), então a tabela é
 * internamente consistente - mas ela é uma cópia daquela página, não uma
 * leitura de nenhuma fonte viva. Se a conta mudar, muda aqui.
 *
 * ⚠️ Note que este total ($48.587/mês) e a meta da campanha ($50.000, de
 * `lib/campaign.ts`) são números independentes que por acaso ficam perto.
 * Mexer num não mexe no outro.
 */

const CUSTOS = [
  { cor: "#d94050", item: "Food for the animals", valor: "$14,213" },
  { cor: "#f3b639", item: "Vet visits and surgeries", valor: "$16,742" },
  { cor: "#c8102e", item: "Shelter rent", valor: "$9,845" },
  { cor: "#18b85b", item: "Medication", valor: "$5,127" },
  { cor: "#6b7a90", item: "Utilities and upkeep", valor: "$2,660" },
] as const;

/**
 * O documento do EIN. O original apontava para o `wp-content/uploads`; o mesmo
 * arquivo já está em `public/documentos/`, e é o mesmo que `lib/config.ts`
 * publica na campanha atual.
 */
const EIN_DOC = "/documentos/ein-sos-animal-help.webp";

export default function Transparencia() {
  const doc = withBasePath(EIN_DOC);

  return (
    <section
      className="ln-section cp-transp-section ln-section-anchor"
      id="transparency"
    >
      <div className="ln-card">
        <div className="ln-card-inner">
          <div className="ln-section-title">
            <div
              className="ln-section-icon"
              style={{ background: "rgba(200, 16, 46, 0.08)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#C8102E" strokeWidth="2">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
            </div>
            <span>Full transparency</span>
          </div>

          <p className="ln-copy" style={{ marginBottom: 14 }}>
            See where every dollar raised in the campaign goes:
          </p>

          <div
            style={{
              borderRadius: 5,
              border: "1px solid rgba(229, 229, 229, 0.7)",
              overflow: "hidden",
            }}
          >
            <table className="ln-cost-table">
              <colgroup>
                <col />
                <col style={{ width: 110 }} />
              </colgroup>
              <thead>
                <tr>
                  <th colSpan={2}>Monthly costs</th>
                </tr>
              </thead>
              <tbody>
                {CUSTOS.map((custo) => (
                  <tr key={custo.item}>
                    <td>
                      <span
                        className="ln-cost-dot"
                        style={{ background: custo.cor }}
                      />
                      {custo.item}
                    </td>
                    <td>{custo.valor}</td>
                  </tr>
                ))}
                {/* A última linha é o total, e o CSS a destaca por
                    `tr:last-child` - por isso ela não pode ganhar irmãs
                    depois dela sem que o destaque mude de lugar. */}
                <tr>
                  <td>
                    <strong>Total needed</strong>
                  </td>
                  <td>$48,587</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="ln-doc-card">
            <div className="ln-doc-card__head">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <div>
                <div className="ln-doc-card__title">EIN · SOS Animal Help</div>
                <div className="ln-doc-card__sub">
                  Official US Employer Identification Number document
                </div>
              </div>
            </div>

            <a href={doc} target="_blank" rel="noopener">
              <img
                className="ln-doc-preview"
                src={doc}
                alt="SOS Animal Help EIN document"
                loading="lazy"
              />
            </a>

            <div className="ln-doc-card__footer">
              <div className="ln-doc-card__cnpj">
                EIN: <strong>41-4770760</strong>
              </div>
              <a
                className="ln-doc-button"
                href={doc}
                target="_blank"
                rel="noopener"
                style={{
                  minHeight: 40,
                  padding: "8px 14px",
                  fontSize: "0.8rem",
                  width: "auto",
                  borderRadius: 10,
                }}
              >
                View full document ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
