"use client";

import { useEffect, useRef, useState } from "react";
import { withBasePath } from "@/lib/base-path";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  04 · QUEM É O KYLE - o carrossel de fotos e a história               ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Porte de `clone-sites-antigos/site-antigo/04-quem-e-o-caio.html`.
 *
 * ── O carrossel ───────────────────────────────────────────────────────────
 * O original clonava o primeiro slide no fim do trilho e, ao chegar nele,
 * saltava de volta para o começo **sem** transição - é o truque clássico de
 * rolagem infinita, e ele está preservado aqui: a legenda `1 / 6` continua
 * batendo, e a volta não aparece na tela.
 *
 * O que mudou é como o arrasto é escrito. O original mexia em
 * `track.style.transform` a cada `pointermove`; aqui o deslocamento é estado
 * (`arrasto`, em px) e o transform sai calculado - React e DOM nunca disputam
 * o mesmo atributo, que é a origem do bug clássico de "o slide fica preso
 * depois do primeiro arrasto".
 *
 * ── As fotos ──────────────────────────────────────────────────────────────
 * O original apontava para o `wp-content/uploads` do WordPress. As mesmas seis
 * já estão em `public/caio/historia/` - servidas daqui, a página não depende
 * de um site que pode sair do ar.
 */

const FOTOS = [
  {
    src: "/caio/historia/caio-1.webp",
    legenda: "One rescuer. One mission. 400 lives that depend on your help.",
  },
  {
    src: "/caio/historia/caio-2.webp",
    legenda:
      "Kyle with the animals he cares for every day · food, medicine and love",
  },
  {
    src: "/caio/historia/caio-3.webp",
    legenda: "Every rescue is a second chance at life",
  },
  {
    src: "/caio/historia/caio-4.webp",
    legenda:
      "Shelters at their breaking point · animals waiting for urgent care",
  },
  {
    src: "/caio/historia/caio-5.webp",
    legenda:
      "Food, medicine and vet care · every donation goes straight to the animals",
  },
  {
    src: "/caio/historia/caio-6.webp",
    legenda: "400+ animals who would have no other chance without your support",
  },
] as const;

const TOTAL = FOTOS.length;
/** Igual ao `TRANS` do original - tem que casar com o `.38s` do CSS. */
const TRANSICAO_MS = 400;
const AUTO_MS = 4500;
/** Abaixo disto o arrasto conta como toque, não como troca de slide. */
const LIMIAR_ARRASTO = 44;

export default function QuemEOKyle() {
  /** Índice do transform. Pode chegar a `TOTAL` - que é o slide clonado. */
  const [pos, setPos] = useState(0);
  /** Índice da bolinha acesa. Nunca passa de `TOTAL - 1`. */
  const [ativo, setAtivo] = useState(0);
  const [semAnimacao, setSemAnimacao] = useState(false);
  const [arrasto, setArrasto] = useState(0);
  const [arrastando, setArrastando] = useState(false);

  const pulando = useRef(false);
  const inicioX = useRef(0);

  const irPara = (indice: number) => {
    if (pulando.current) return;
    setPos(indice);
    setAtivo(indice);
  };

  const proximo = () => {
    if (pulando.current) return;
    if (pos === TOTAL - 1) {
      /* Anda até o clone, acende a primeira bolinha, e só depois de a
         transição terminar volta ao slide 0 sem animar. */
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
    irPara(pos + 1);
  };

  const anterior = () => irPara((pos - 1 + TOTAL) % TOTAL);

  /* Avanço automático. Recriar o intervalo a cada mudança de `pos` é o que
     dá o mesmo efeito do `resetTimer()` do original: interagir adia a
     próxima troca em vez de ela cair logo depois do clique. */
  useEffect(() => {
    if (arrastando) return;
    const id = window.setInterval(proximo, AUTO_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, arrastando]);

  const aoSoltar = (clientX: number) => {
    if (!arrastando) return;
    setArrastando(false);
    setArrasto(0);
    const diferenca = inicioX.current - clientX;
    if (diferenca > LIMIAR_ARRASTO) proximo();
    else if (diferenca < -LIMIAR_ARRASTO) anterior();
  };

  return (
    <section className="ln-section cp-story-section ln-section-anchor" id="story">
      <div className="ln-card">
        <div className="ln-card-inner">
          <div className="ln-section-title">
            <div
              className="ln-section-icon"
              style={{ background: "rgba(200,16,46,0.08)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#BF0521" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
              </svg>
            </div>
            <span>Who is Kyle?</span>
          </div>

          <div
            className="ln-story-carousel"
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest(".ln-story-btn")) return;
              setArrastando(true);
              inicioX.current = e.clientX;
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!arrastando) return;
              setArrasto(e.clientX - inicioX.current);
            }}
            onPointerUp={(e) => aoSoltar(e.clientX)}
            onPointerCancel={() => {
              setArrastando(false);
              setArrasto(0);
            }}
          >
            <div
              className="ln-story-track"
              style={{
                transform: `translateX(calc(-${pos * 100}% + ${arrasto}px))`,
                transition: semAnimacao || arrastando ? "none" : undefined,
              }}
            >
              {/* Os seis slides + o clone do primeiro, que é o que faz a volta
                  ser invisível. Ver o comentário do topo. */}
              {[...FOTOS, FOTOS[0]].map((foto, i) => {
                const numero = (i % TOTAL) + 1;
                return (
                  <div className="ln-story-slide" key={i}>
                    <img
                      src={withBasePath(foto.src)}
                      alt={`Kyle Rescuer · photo ${numero}`}
                      loading={i === 0 ? undefined : "lazy"}
                      draggable={false}
                    />
                    <span className="ln-story-slide-num">
                      {numero} / {TOTAL}
                    </span>
                    <div className="ln-story-caption">{foto.legenda}</div>
                  </div>
                );
              })}
            </div>

            <button
              className="ln-story-btn ln-story-btn--prev"
              type="button"
              onClick={anterior}
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              className="ln-story-btn ln-story-btn--next"
              type="button"
              onClick={proximo}
              aria-label="Next photo"
            >
              ›
            </button>
          </div>

          <div className="ln-story-dots">
            {FOTOS.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`ln-story-dot${i === ativo ? " active" : ""}`}
                aria-label={`Photo ${i + 1}`}
                onClick={() => irPara(i)}
              />
            ))}
          </div>

          <div className="ln-copy">
            <p>
              My name is <strong>Kyle, I&apos;m an animal rescuer</strong>, and I
              make sure help reaches shelters caring for animals in critical
              condition.
            </p>
            <p>
              Through <strong>SOS Animal Help</strong>, I visit shelters that are{" "}
              <strong>at their breaking point</strong>, see firsthand what
              rescuers are up against, and bring financial support for food,
              medicine, vet care and urgent needs,{" "}
              <strong>so these animals get the chance to keep living.</strong>
            </p>
          </div>

          <blockquote className="cp-pull-quote">
            <strong>Hunger and debt:</strong> in recent months, donations have
            dropped sharply and the situation has gotten worse.{" "}
            <strong>22 lives have already been lost</strong>, and other animals
            are still sick, waiting for urgent care.
          </blockquote>

          <div className="ln-copy">
            <p>
              Even facing so much hardship, I can&apos;t turn my back. If we
              don&apos;t help now, many of these animals will keep suffering{" "}
              <strong>with no help, no food and no one to look out for them</strong>
              .
            </p>
            <p>
              <strong>Abandoning these animals is not an option...</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
