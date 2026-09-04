"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  getCampaignServerSnapshot,
  getCampaignSnapshot,
  subscribeCampaign,
} from "@/lib/campaign";
import { formatUSD } from "@/lib/format";
import { openDonationModal } from "@/lib/modais";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  03 · HERO - o título, o VSL e o contador                             ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Porte de `clone-sites-antigos/site-antigo/03-hero.html`.
 *
 * ── O contador não foi copiado ────────────────────────────────────────────
 * O original lia `window.CP_CONFIG`, um objeto que `02-ajustar-valores.html`
 * montava com um gerador pseudoaleatório semeado pelo dia. `lib/campaign.ts`
 * **é** esse mesmo cálculo, com as mesmas constantes - conferido linha a
 * linha. Ler de lá em vez de copiar o script evita o pior defeito possível
 * aqui: as duas páginas da mesma campanha mostrando números diferentes no
 * mesmo dia.
 *
 * ⚠️ Como no resto do projeto, o número **não vem do gateway** - ele é
 * calculado a partir da data. Ver o aviso no topo de `lib/campaign.ts`.
 *
 * ── O vídeo é o mesmo player da campanha viva ─────────────────────────────
 * O id do embed (`6a6377b0031b3f35da8c0570`) é byte a byte o que
 * `components/sections/02-hero.tsx` já usa - o site antigo e o atual sempre
 * apontaram para o mesmo VSL. O `VturbTeardown` abaixo é o mesmo cuidado
 * documentado lá: o embed não aborta o próprio hls.js quando sai do DOM.
 */

const PLAYER_ID = "vid-6a6377b0031b3f35da8c0570";
const PLAYER_SRC =
  "https://scripts.converteai.net/25b0cdcd-2b93-4910-aa45-91b9a6275957/players/6a6377b0031b3f35da8c0570/v4/player.js";

/**
 * Desmonta o player quando o React tira o elemento do DOM.
 *
 * Cópia deliberada do `VturbTeardown` de `components/sections/02-hero.tsx`:
 * a convenção dos blocos deste projeto é não importar de outro bloco, e o
 * comportamento é curto o bastante para viver nos dois lugares. Ver o
 * comentário longo de lá para o porquê de cada passo.
 */
function useVturbTeardown(playerId: string) {
  useEffect(() => {
    return () => {
      const tenta = (fn: () => void) => {
        try {
          fn();
        } catch {
          /* teardown é best-effort */
        }
      };

      /* O `as` é o mesmo de `components/sections/02-hero.tsx`: o elemento é um
         `HTMLElement` comum para o TypeScript, e é o runtime do SmartPlayer
         que pendura `destroy`/`dispose` nele (ver `types/vturb.d.ts`). */
      const el = document.getElementById(playerId) as
        | (HTMLElement & VturbDisposable)
        | null;
      const runtime = window.smartplayer;
      for (const alvo of [el, runtime?.[playerId], runtime?.instances?.[playerId]]) {
        tenta(() => alvo?.destroy?.());
        tenta(() => alvo?.dispose?.());
      }

      for (const v of Array.from(
        el?.querySelectorAll<HTMLVideoElement>("video") ?? [],
      )) {
        tenta(() => v.pause());
        tenta(() => {
          v.removeAttribute("src");
          v.querySelectorAll("source").forEach((s) => s.remove());
        });
        tenta(() => v.load());
      }

      tenta(() => el?.replaceChildren());
    };
  }, [playerId]);
}

export default function Hero() {
  const estado = useSyncExternalStore(
    subscribeCampaign,
    getCampaignSnapshot,
    getCampaignServerSnapshot,
  );

  const barraRef = useRef<HTMLDivElement>(null);
  const [larguraBarra, setLarguraBarra] = useState(0);

  useVturbTeardown(PLAYER_ID);

  /* O script do embed é injetado no `<head>`, como no original. Não usa
     `next/script` porque o player espera ser o dono do seu ciclo de vida. */
  useEffect(() => {
    if (document.querySelector(`script[src="${PLAYER_SRC}"]`)) return;
    const s = document.createElement("script");
    s.src = PLAYER_SRC;
    s.async = true;
    s.fetchPriority = "high";
    document.head.appendChild(s);
  }, []);

  /**
   * A barra só enche quando entra na viewport - é o efeito do original
   * (IntersectionObserver, `threshold: 0.2`, dispara uma vez e desconecta).
   * Sem isso a animação de 1,5s aconteceria fora da tela e a pessoa veria a
   * barra já cheia.
   */
  useEffect(() => {
    const no = barraRef.current;
    if (!no || !estado) return;

    let disparou = false;
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas[0]?.isIntersecting && !disparou) {
          disparou = true;
          setLarguraBarra(estado.percent);
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(no);
    return () => obs.disconnect();
  }, [estado]);

  return (
    <section className="hv-section ln-section-anchor" id="home">
      <div className="vA-wrap">
        <div className="vA-prehead">
          <h1 className="vA-h1">
            <span style={{ fontWeight: 600 }}>A desperate rescuer!</span>
            <br />
            <em>
              400 little ones suffering every day. Help Kyle bring relief before
              it&apos;s too late.
            </em>
          </h1>
        </div>

        <div className="vA-vid-section">
          <div className="vA-vid-inner">
            <vturb-smartplayer
              id={PLAYER_ID}
              style={{ display: "block", margin: "0 auto", width: "100%" }}
            >
              <div
                className="vturb-player-placeholder"
                style={{
                  position: "relative",
                  width: "100%",
                  padding: "78.14761215629522% 0 0",
                  zIndex: 0,
                  backgroundColor: "black",
                }}
              />
            </vturb-smartplayer>
          </div>
        </div>

        <div className="vA-content">
          <div className="vA-counter">
            <div className="vA-counter__row">
              {/* `—` enquanto o estado não existe: no servidor ele é `null`
                  de propósito, para o HTML congelado do export não sair com
                  um número do dia do build (ver `lib/campaign.ts`). */}
              <span className="vA-counter__amount">
                {estado ? formatUSD(estado.raised * 100) : "—"}
              </span>
              <span className="vA-counter__goal-val">
                {estado ? formatUSD(estado.goal * 100) : "—"}
              </span>
            </div>
            <div className="vA-counter__labels">
              <span className="vA-counter__raised-lbl">Raised</span>
              <span className="vA-counter__goal-lbl">Goal</span>
            </div>
            <div className="vA-counter__bar-wrap">
              <div
                ref={barraRef}
                className="vA-counter__bar"
                role="progressbar"
                aria-valuenow={estado?.percent ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Campaign goal progress"
                style={{ width: `${larguraBarra}%` }}
              />
            </div>
            <div className="vA-counter__footer">
              <span className="vA-counter__pct">
                {estado ? `${estado.percent}% of goal reached` : " "}
              </span>
              <span className="vA-counter__supporters">
                <span className="vA-counter__dot" aria-hidden="true" />
                <span>{estado ? `${estado.supporters} supporters` : " "}</span>
              </span>
            </div>
          </div>

          <div className="vA-btns">
            {/*
              O original disparava `cp:openDonation`, um evento que nada no
              clone escutava - o botão não abria nada. Aqui ele abre o modal
              de doação do projeto, que é o fluxo que cobra de verdade.
            */}
            <button
              className="vA-cta-pri"
              type="button"
              onClick={() => openDonationModal()}
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              I Want To Help Now
            </button>
          </div>

          <p className="vA-secure">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 3L4 6V12C4 16.4 7.4 20.5 12 22C16.6 20.5 20 16.4 20 12V6L12 3Z"
                fill="#18b85b"
              />
              <path
                d="M9 12L11 14L15 10"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            100% secure and verified project
          </p>
        </div>
      </div>
    </section>
  );
}
