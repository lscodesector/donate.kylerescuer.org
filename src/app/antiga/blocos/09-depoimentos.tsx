"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { withBasePath } from "@/lib/base-path";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  09 · DEPOIMENTOS - os cinco protetores falando por si, em vídeo      ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Porte de `clone-sites-antigos/site-antigo/09-depoimentos.html` - o bloco
 * com mais comportamento de toda a página.
 *
 * ── Duas grades, não uma ──────────────────────────────────────────────────
 * Abaixo de 768px é **um** vídeo por vista, em 9/16, e o trilho anda de 100%
 * em 100%. A partir de 768px são **três** lado a lado, com 30px de intervalo,
 * e aí o trilho anda em pixels - porque com intervalo entre os slides a conta
 * em porcentagem erra por um intervalo a cada passo. É por isso que a largura
 * de cada slide é calculada em JS: `(largura do carrossel - 2 intervalos) / 3`.
 *
 * ── A volta infinita só existe no celular ─────────────────────────────────
 * O clone do primeiro slide serve à rolagem infinita de uma coluna. Com três
 * na tela, um clone só não fecha a volta (faltariam dois), então o desktop usa
 * o embrulho simples (`% TOTAL`). Os dois comportamentos são do original.
 *
 * ── Os vídeos ─────────────────────────────────────────────────────────────
 * Um tocando por vez: dar play num pausa os outros. Eles nascem com
 * `preload="none"` para não competir com o VSL do topo, e só depois que a
 * página inteira carrega é que começam a bufferizar, escalonados de 300 em
 * 300ms - assim quem rolar até aqui encontra o vídeo já adiantado em vez de
 * começar do zero. Tudo isso é do original, e o motivo está lá em comentário.
 *
 * Os arquivos vinham do `wp-content/uploads`; os mesmos cinco já estão em
 * `public/caio/depoimentos/`.
 */

const DEPOIMENTOS = [
  {
    video: "/caio/depoimentos/joana.mp4",
    poster: "/caio/depoimentos/joana.webp",
    legenda: "Joana · SOS Joana Darc · 200 animals",
  },
  {
    video: "/caio/depoimentos/salvecao.mp4",
    poster: "/caio/depoimentos/salvecao.webp",
    legenda: "Andrezza · Save Dog Shelter · 92 animals",
  },
  {
    video: "/caio/depoimentos/milena.mp4",
    poster: "/caio/depoimentos/milena.webp",
    legenda: "Milena · Millie Home · 74 animals",
  },
  {
    video: "/caio/depoimentos/siulsan.mp4",
    poster: "/caio/depoimentos/siulsan.webp",
    legenda: "Siulsan · Susan Pet Rescue · 53 dogs",
  },
  {
    video: "/caio/depoimentos/rose.mp4",
    poster: "/caio/depoimentos/rose.webp",
    legenda: "Rose · Rose's Shelter · 95 animals",
  },
] as const;

const TOTAL = DEPOIMENTOS.length;
const TRANSICAO_MS = 400;
const LIMIAR_ARRASTO = 44;
const LIMIAR_DIRECAO = 6;
/** O mesmo `gap: 30px` que o CSS aplica no trilho a partir de 768px. */
const INTERVALO = 30;

export default function Depoimentos() {
  const [pos, setPos] = useState(0);
  const [ativo, setAtivo] = useState(0);
  const [semAnimacao, setSemAnimacao] = useState(false);
  const [arrasto, setArrasto] = useState(0);
  const [arrastando, setArrastando] = useState(false);
  /** Quantos cabem na vista: 3 no desktop, 1 no celular. */
  const [porVista, setPorVista] = useState(1);
  const [larguraCarrossel, setLarguraCarrossel] = useState(0);
  /** Índice do vídeo tocando agora, ou `null`. É ele que esconde o overlay. */
  const [tocando, setTocando] = useState<number | null>(null);

  const carrosselRef = useRef<HTMLDivElement>(null);
  const videosRef = useRef<(HTMLVideoElement | null)[]>([]);
  const pulando = useRef(false);
  const inicio = useRef({ x: 0, y: 0 });
  const direcao = useRef<"indefinida" | "horizontal" | "vertical">("indefinida");

  const desktop = porVista > 1;

  /* Mede o carrossel e decide a grade. `ResizeObserver` em vez do
     `window.addEventListener("resize")` do original: pega também mudança de
     largura que não vem da janela (barra de rolagem aparecendo, zoom). */
  useEffect(() => {
    const no = carrosselRef.current;
    if (!no) return;

    const medir = () => {
      setPorVista(window.innerWidth >= 768 ? 3 : 1);
      setLarguraCarrossel(no.offsetWidth);
    };

    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(no);
    window.addEventListener("resize", medir);
    return () => {
      obs.disconnect();
      window.removeEventListener("resize", medir);
    };
  }, []);

  const larguraSlide = desktop
    ? Math.floor((larguraCarrossel - INTERVALO * 2) / 3)
    : 0;
  const passoPx = larguraSlide + INTERVALO;

  /** Pausa tudo que estiver tocando - chamado a cada troca de slide. */
  const pausarTudo = useCallback(() => {
    for (const v of videosRef.current) v?.pause();
    setTocando(null);
  }, []);

  const irPara = (indice: number) => {
    if (pulando.current) return;
    pausarTudo();
    setPos(indice);
    setAtivo(indice);
  };

  const proximo = () => {
    if (pulando.current) return;
    pausarTudo();

    /* Desktop: embrulho simples - ver o comentário do topo. */
    if (desktop) {
      const seguinte = (pos + 1) % TOTAL;
      setPos(seguinte);
      setAtivo(seguinte);
      return;
    }

    if (pos === TOTAL - 1) {
      pulando.current = true;
      setPos(TOTAL);
      setAtivo(0);
      window.setTimeout(() => {
        setSemAnimacao(true);
        setPos(0);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            setSemAnimacao(false);
            pulando.current = false;
          }),
        );
      }, TRANSICAO_MS + 30);
      return;
    }
    setPos(pos + 1);
    setAtivo(pos + 1);
  };

  const anterior = () => irPara((pos - 1 + TOTAL) % TOTAL);

  /**
   * Buffer em segundo plano, depois que o resto da página terminou de
   * carregar. Escalonado para os cinco não disputarem banda de uma vez, com
   * a mesma rede de segurança de 6s do original caso o evento `load` demore.
   */
  useEffect(() => {
    let feito = false;
    const bufferizar = () => {
      if (feito) return;
      feito = true;
      videosRef.current.slice(0, TOTAL).forEach((v, i) => {
        if (!v) return;
        window.setTimeout(() => {
          v.preload = "auto";
          v.load();
        }, i * 300);
      });
    };

    if (document.readyState === "complete") {
      bufferizar();
      return;
    }
    window.addEventListener("load", bufferizar);
    const rede = window.setTimeout(bufferizar, 6000);
    return () => {
      window.removeEventListener("load", bufferizar);
      window.clearTimeout(rede);
    };
  }, []);

  const encerrarArrasto = (clientX: number, clientY: number) => {
    if (!arrastando) return;
    setArrastando(false);
    setArrasto(0);

    if (direcao.current === "horizontal") {
      const diferenca = inicio.current.x - clientX;
      if (Math.abs(diferenca) > LIMIAR_ARRASTO) {
        if (diferenca > 0) proximo();
        else anterior();
        return;
      }
    }

    /* Toque curto no celular liga/desliga o vídeo da vez - do original. */
    const foiToque =
      Math.abs(inicio.current.x - clientX) < 10 &&
      Math.abs(inicio.current.y - clientY) < 10;
    if (foiToque && !desktop) {
      const v = videosRef.current[pos];
      if (v) {
        if (v.paused) void v.play();
        else v.pause();
      }
    }
  };

  const transform = desktop
    ? `translateX(${-(pos * passoPx) + arrasto}px)`
    : `translateX(calc(-${pos * 100}% + ${arrasto}px))`;

  return (
    <section className="cp-dep-section ln-section-anchor" id="testimonials">
      <div className="cp-dep__wrap">
        <h2 className="cp-dep__title">
          Testimonials from the <em>shelters Kyle helps</em>
        </h2>

        <div
          className="cp-dep-carousel"
          ref={carrosselRef}
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest(".cp-dep-btn")) return;
            setArrastando(true);
            inicio.current = { x: e.clientX, y: e.clientY };
            direcao.current = "indefinida";
          }}
          onPointerMove={(e) => {
            if (!arrastando) return;
            const dx = e.clientX - inicio.current.x;
            const dy = e.clientY - inicio.current.y;

            if (
              direcao.current === "indefinida" &&
              (Math.abs(dx) > LIMIAR_DIRECAO || Math.abs(dy) > LIMIAR_DIRECAO)
            ) {
              direcao.current =
                Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
              if (direcao.current === "horizontal") {
                e.currentTarget.setPointerCapture(e.pointerId);
              } else {
                setArrastando(false);
                setArrasto(0);
                return;
              }
            }

            if (direcao.current !== "horizontal") return;
            setArrasto(dx);
          }}
          onPointerUp={(e) => encerrarArrasto(e.clientX, e.clientY)}
          onPointerCancel={() => {
            setArrastando(false);
            setArrasto(0);
          }}
        >
          <div
            className="cp-dep-track"
            style={{
              transform,
              transition: semAnimacao || arrastando ? "none" : undefined,
            }}
          >
            {[...DEPOIMENTOS, DEPOIMENTOS[0]].map((dep, i) => {
              const numero = (i % TOTAL) + 1;
              return (
                <div
                  className="cp-dep-slide"
                  key={i}
                  style={
                    /* No desktop a largura vem daqui; no celular o CSS já
                       manda (`flex: 0 0 100%`) e o inline sai de cena. */
                    desktop && larguraSlide > 0
                      ? { minWidth: larguraSlide, flex: `0 0 ${larguraSlide}px` }
                      : undefined
                  }
                >
                  <video
                    className="cp-dep-video"
                    ref={(el) => {
                      videosRef.current[i] = el;
                    }}
                    src={withBasePath(dep.video)}
                    poster={withBasePath(dep.poster)}
                    playsInline
                    preload="none"
                    onPlay={() => {
                      for (const [j, v] of videosRef.current.entries()) {
                        if (j !== i) v?.pause();
                      }
                      setTocando(i);
                    }}
                    onPause={() => setTocando((t) => (t === i ? null : t))}
                    onEnded={() => setTocando((t) => (t === i ? null : t))}
                  />
                  <div
                    className={`cp-dep-play-overlay${tocando === i ? " hidden" : ""}`}
                    onClick={() => void videosRef.current[i]?.play()}
                  >
                    <button className="cp-dep-play-btn" type="button" aria-label="Play">
                      <svg viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  </div>
                  <span className="cp-dep-slide-num">
                    {numero} / {TOTAL}
                  </span>
                  <div className="cp-dep-slide-caption">{dep.legenda}</div>
                </div>
              );
            })}
          </div>

          <button
            className="cp-dep-btn cp-dep-btn--prev"
            type="button"
            onClick={anterior}
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            className="cp-dep-btn cp-dep-btn--next"
            type="button"
            onClick={proximo}
            aria-label="Next"
          >
            ›
          </button>
        </div>

        <div className="cp-dep-dots">
          {DEPOIMENTOS.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`cp-dep-dot${i === ativo % TOTAL ? " active" : ""}`}
              aria-label={`Slide ${i + 1}`}
              onClick={() => irPara(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
