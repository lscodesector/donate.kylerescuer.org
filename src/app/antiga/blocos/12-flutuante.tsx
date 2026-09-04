"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getCampaignServerSnapshot,
  getCampaignSnapshot,
  subscribeCampaign,
} from "@/lib/campaign";
import { org, whatsappWith } from "@/lib/config";
import { formatUSD } from "@/lib/format";
import { useShelterPhone } from "@/lib/hooks/use-shelter-phone";
import { openDonationModal } from "@/lib/modais";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  12 · BARRA FLUTUANTE - o atalho para doar, colado na base            ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Porte de `clone-sites-antigos/site-antigo/flexbox/flutuante.html`.
 *
 * ⚠️ **`flexbox/modal-doacao.html` é byte a byte este mesmo arquivo** - o
 * nome promete um modal que ele não contém. O clone não tem modal de doação
 * nenhum: o CTA só disparava `cp:openDonation`, e nada escutava. Aqui o mesmo
 * clique abre o modal do projeto (blocos 17/18), que é o fluxo que cobra.
 *
 * ── Aparece depois de 30% da página ───────────────────────────────────────
 * Mesma conta do original: `scrollY / (altura total - altura da janela)`. O
 * `MutationObserver` que o original usava para manter o botão do WhatsApp em
 * sincronia com a barra não veio junto - os dois leem o mesmo estado agora,
 * então não há o que sincronizar.
 *
 * ── Uma correção em cima do original ──────────────────────────────────────
 * O script antigo escrevia a porcentagem como `pct + "% da meta"` - em
 * português, no meio de uma página inteiramente em inglês. Era resíduo da
 * versão brasileira. Aqui está `% of goal`, igual ao que o hero já mostrava
 * na mesma tela.
 */

export default function Flutuante() {
  const estado = useSyncExternalStore(
    subscribeCampaign,
    getCampaignSnapshot,
    getCampaignServerSnapshot,
  );
  const [visivel, setVisivel] = useState(false);
  const telefone = useShelterPhone();

  useEffect(() => {
    const aoRolar = () => {
      const rolavel =
        document.documentElement.scrollHeight - window.innerHeight;
      /* Página curta demais para rolar: sem divisão por zero, e a barra
         simplesmente não aparece - o original dividia mesmo assim e
         terminava com `NaN > 0.3`, que é `false`. Mesmo resultado, sem o
         valor inválido no meio. */
      const proporcao = rolavel > 0 ? window.scrollY / rolavel : 0;
      setVisivel(proporcao > 0.3);
    };

    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
    };
  }, []);

  const classeVisivel = visivel ? " is-visible" : "";
  const whatsapp = whatsappWith(org.whatsappMessage, telefone);

  return (
    <>
      <div
        id="cpStickyBar"
        className={classeVisivel.trim()}
        role="complementary"
        aria-label="Donation bar"
      >
        <div className="cp-sticky-inner">
          <div className="cp-sticky-info">
            <div className="cp-sticky-top">
              <span className="cp-sticky-raised">
                {estado ? formatUSD(estado.raised * 100) : "—"}
              </span>
              <span className="cp-sticky-goal">
                <span className="cp-sticky-goal-val">
                  {estado ? `of ${formatUSD(estado.goal * 100)}` : " "}
                </span>
              </span>
            </div>
            <div className="cp-sticky-progress">
              <div
                className="cp-sticky-progress-fill"
                style={{ width: `${estado?.percent ?? 0}%` }}
              />
            </div>
            <div className="cp-sticky-footer">
              <span className="cp-sticky-pct">
                {estado ? `${estado.percent}% of goal` : " "}
              </span>
              <span className="cp-sticky-supporters">
                <span className="cp-sticky-dot" aria-hidden="true" />
                <span>{estado ? `${estado.supporters} supporters` : " "}</span>
              </span>
            </div>
          </div>

          <div className="cp-sticky-cta-wrap">
            {/* O botão do WhatsApp é posicionado em relação ao "Donate Now" -
                mesma borda direita. Ver `.cp-wa-float` em `antiga.css`. */}
            <div className={`cp-wa-float${classeVisivel}`} id="cpWaFloat">
              <a
                className="cp-wa-label"
                href={whatsapp}
                target="_blank"
                rel="noopener"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                Contact Us
              </a>
              <a
                className="cp-wa-btn"
                href={whatsapp}
                target="_blank"
                rel="noopener"
                aria-label="Chat on WhatsApp"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>

            <button
              className="cp-sticky-cta"
              type="button"
              onClick={() => openDonationModal()}
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              Donate Now
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
