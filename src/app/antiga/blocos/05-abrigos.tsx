"use client";

import { useRef, useState } from "react";
import { withBasePath } from "@/lib/base-path";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  05 · ABRIGOS - o slider dos cinco abrigos que o Kyle atende          ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Porte de `clone-sites-antigos/site-antigo/05-projetos.html`.
 *
 * Mesma mecânica do carrossel do bloco 04 (clone do primeiro slide para a
 * volta invisível, arrasto como estado), com duas diferenças que vêm do
 * original e foram mantidas:
 *
 *   sem avanço automático   aqui a pessoa lê no ritmo dela; o de fotos gira
 *                           sozinho porque é ilustração, este é conteúdo.
 *   trava de direção        o arrasto só vira troca de slide se o movimento
 *                           for mais horizontal que vertical. Sem isso, rolar
 *                           a página com o dedo em cima do slider arrastaria
 *                           o slider em vez de rolar - defeito clássico em
 *                           celular, e o original já tinha a proteção.
 */

const ABRIGOS = [
  {
    nome: "Susan Pet Rescue",
    img: "/caio/abrigos/siulsan-resgate.webp",
    texto:
      "53 rescued dogs. Receives monthly support for food, medication and veterinary surgeries.",
  },
  {
    nome: "SOS Joana Darc",
    img: "/caio/abrigos/sos-joana-darc.webp",
    texto:
      "200 animals, focused on cats rescued from abuse. Relies entirely on donations to keep running.",
  },
  {
    nome: "Save Dog Shelter",
    img: "/caio/abrigos/abrigo-salve-cao.webp",
    texto:
      "92 animals. Nearly closed in May over unpaid rent. Still open thanks to monthly donations.",
  },
  {
    nome: "Millie Home",
    img: "/caio/abrigos/casa-da-mili.webp",
    texto:
      "74 rescued dogs and cats. Millie keeps the shelter running with volunteers and monthly donations for food and vet care.",
  },
  {
    nome: "Rose's Shelter",
    img: "/caio/abrigos/abrigo-dona-rose.webp",
    texto:
      "Rose cares for 95 animals. With no public support, she relies entirely on donations to keep the shelter standing.",
  },
] as const;

const TOTAL = ABRIGOS.length;
const TRANSICAO_MS = 420;
const LIMIAR_ARRASTO = 44;
/** Movimento mínimo para decidir se o gesto é horizontal ou vertical. */
const LIMIAR_DIRECAO = 6;

export default function Abrigos() {
  const [pos, setPos] = useState(0);
  const [ativo, setAtivo] = useState(0);
  const [semAnimacao, setSemAnimacao] = useState(false);
  const [arrasto, setArrasto] = useState(0);
  const [arrastando, setArrastando] = useState(false);

  const pulando = useRef(false);
  const inicio = useRef({ x: 0, y: 0 });
  const direcao = useRef<"indefinida" | "horizontal" | "vertical">("indefinida");

  const irPara = (indice: number) => {
    if (pulando.current) return;
    setPos(indice);
    setAtivo(indice);
  };

  const proximo = () => {
    if (pulando.current) return;
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
    irPara(pos + 1);
  };

  const anterior = () => irPara((pos - 1 + TOTAL) % TOTAL);

  const encerrarArrasto = (clientX: number) => {
    if (!arrastando) return;
    setArrastando(false);
    setArrasto(0);
    if (direcao.current !== "horizontal") return;
    const diferenca = inicio.current.x - clientX;
    if (Math.abs(diferenca) > LIMIAR_ARRASTO) {
      if (diferenca > 0) proximo();
      else anterior();
    }
  };

  return (
    <section className="cp-proj-section ln-section-anchor" id="shelters">
      <div className="cp-proj__wrap">
        <div className="cp-proj__head">
          <div>
            <h2 className="cp-proj__title">
              Shelters <em>Kyle helps</em>
            </h2>
          </div>
        </div>

        <div className="cp-sl-outer">
          <div
            className={`cp-sl-track${arrastando ? " is-dragging" : ""}`}
            style={{
              transform: `translateX(calc(-${pos * 100}% + ${arrasto}px))`,
              transition: semAnimacao || arrastando ? "none" : undefined,
            }}
            onDragStart={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              if (pulando.current) return;
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
                  /* Gesto vertical: solta o slider e deixa a página rolar. */
                  setArrastando(false);
                  setArrasto(0);
                  return;
                }
              }

              if (direcao.current !== "horizontal") return;
              setArrasto(dx);
            }}
            onPointerUp={(e) => encerrarArrasto(e.clientX)}
            onPointerCancel={() => {
              setArrastando(false);
              setArrasto(0);
            }}
          >
            {[...ABRIGOS, ABRIGOS[0]].map((abrigo, i) => (
              <div className="cp-slide" key={i}>
                <img
                  className="cp-slide-img"
                  src={withBasePath(abrigo.img)}
                  alt={abrigo.nome}
                  loading={i === 0 ? undefined : "lazy"}
                  draggable={false}
                />
                <div className="cp-slide__body">
                  <h3 className="cp-slide__name">{abrigo.nome}</h3>
                  <p className="cp-slide__desc">{abrigo.texto}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            className="cp-sl-btn cp-sl-btn--prev"
            type="button"
            onClick={anterior}
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            className="cp-sl-btn cp-sl-btn--next"
            type="button"
            onClick={proximo}
            aria-label="Next"
          >
            ›
          </button>
        </div>

        <div className="cp-sl-dots">
          {ABRIGOS.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`cp-sl-dot${i === ativo ? " active" : ""}`}
              aria-label={`Slide ${i + 1}`}
              onClick={() => irPara(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
