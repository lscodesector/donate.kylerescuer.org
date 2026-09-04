"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  10 · FAQ - o acordeão das cinco perguntas                            ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Porte de `clone-sites-antigos/site-antigo/10-faq.html`.
 *
 * ── Por que continua sendo `<details>` ────────────────────────────────────
 * Daria para trocar por `<div>` com `aria-expanded`, mas `<details>`/
 * `<summary>` já vem com o papel de acessibilidade certo, é focável pelo
 * teclado e abre mesmo se o JavaScript falhar. O CSS de `antiga.css` também
 * já é escrito para ele (`[open]`, `summary::after` virando `+` / `−`).
 *
 * ── A animação de altura ──────────────────────────────────────────────────
 * `<details>` nativo abre num salto - não há transição de altura de graça. O
 * original resolvia com a Web Animations API, medindo a altura fechada e a
 * aberta e animando entre as duas; o mesmo está aqui, em `ItemFaq`.
 *
 * Por isso o `open` **não** é passado como prop do React: quem escreve
 * `details.open` é o efeito, no fim da animação. Passar a prop faria o React
 * e a animação disputarem o mesmo atributo, e o resultado seria o acordeão
 * piscando aberto antes de animar.
 *
 * ── Um aberto por vez ─────────────────────────────────────────────────────
 * Do original: abrir uma fecha a que estava aberta. O estado é o índice
 * aberto (ou `null`), no componente de cima - é o que garante que não haja
 * dois "abertos" possíveis ao mesmo tempo.
 */

const DURACAO_MS = 300;

const PERGUNTAS: { pergunta: string; resposta: ReactNode }[] = [
  {
    pergunta: "Is my donation secure?",
    resposta: (
      <>
        Yes. Payments are processed securely through <strong>PayPal</strong>,
        one of the most trusted payment platforms in the world, with bank-level
        encryption. No card or banking data is ever stored on our site.
      </>
    ),
  },
  {
    pergunta: "Is there a minimum amount?",
    resposta: (
      <>
        <strong>Any amount is welcome.</strong> Every bit of help keeps the more
        than 400 lives that depend on Kyle going.
      </>
    ),
  },
  {
    pergunta: "Where exactly does the money go?",
    resposta: (
      <>
        Donations are directed toward direct animal care, things like{" "}
        <strong>food, rescues</strong>, veterinary treatment, medication, and
        shelter support. Kyle posts regular updates on Instagram.
      </>
    ),
  },
  {
    pergunta: "Who is SOS Animal Help?",
    resposta: (
      <>
        An animal protection organization that supports independent rescuers
        like Kyle. It receives the donations and distributes them with full
        traceability.
      </>
    ),
  },
  {
    pergunta: "Will I get a receipt for my donation?",
    resposta: (
      <>
        Yes. PayPal automatically emails you a receipt as soon as your donation
        is processed.
      </>
    ),
  },
];

function ItemFaq({
  pergunta,
  resposta,
  aberto,
  onAlternar,
}: {
  pergunta: string;
  resposta: ReactNode;
  aberto: boolean;
  onAlternar: () => void;
}) {
  const detalhesRef = useRef<HTMLDetailsElement>(null);
  const resumoRef = useRef<HTMLElement>(null);
  const respostaRef = useRef<HTMLDivElement>(null);
  const animacaoRef = useRef<Animation | null>(null);
  const primeira = useRef(true);

  useEffect(() => {
    const detalhes = detalhesRef.current;
    const resumo = resumoRef.current;
    const corpo = respostaRef.current;
    if (!detalhes || !resumo || !corpo) return;

    /* Na primeira passagem não há o que animar: só põe o estado inicial. */
    if (primeira.current) {
      primeira.current = false;
      detalhes.open = aberto;
      return;
    }

    animacaoRef.current?.cancel();

    const alturaInicial = detalhes.offsetHeight;
    /* Para medir o alvo o conteúdo precisa estar no layout - por isso abre
       antes de medir, mesmo quando o destino é fechado. */
    detalhes.open = true;
    const alturaFinal = aberto
      ? resumo.offsetHeight + corpo.offsetHeight
      : resumo.offsetHeight;

    detalhes.style.overflow = "hidden";
    const animacao = detalhes.animate(
      { height: [`${alturaInicial}px`, `${alturaFinal}px`] },
      { duration: DURACAO_MS, easing: "ease-out" },
    );
    animacaoRef.current = animacao;

    const finalizar = () => {
      detalhes.open = aberto;
      detalhes.style.height = "";
      detalhes.style.overflow = "";
      animacaoRef.current = null;
    };
    animacao.onfinish = finalizar;
    animacao.oncancel = () => {
      animacaoRef.current = null;
    };

    return () => {
      /* Desmontar no meio da animação não pode deixar o elemento preso numa
         altura intermediária. */
      animacaoRef.current?.cancel();
    };
  }, [aberto]);

  return (
    <details className="ln-faq-item" ref={detalhesRef}>
      <summary
        ref={resumoRef}
        onClick={(e) => {
          /* Sem isto o navegador abriria/fecharia sozinho, e a animação
             começaria de uma altura que já mudou. */
          e.preventDefault();
          onAlternar();
        }}
      >
        {pergunta}
      </summary>
      <div className="ln-faq-answer" ref={respostaRef}>
        {resposta}
      </div>
    </details>
  );
}

export default function Faq() {
  const [aberto, setAberto] = useState<number | null>(null);

  return (
    <section className="ln-section cp-faq-section ln-section-anchor" id="faq">
      <div className="ln-card">
        <div className="ln-card-inner">
          <div className="ln-section-title">
            <div
              className="ln-section-icon"
              style={{ background: "rgba(191, 5, 33, 0.08)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#BF0521" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" strokeLinecap="round" />
              </svg>
            </div>
            <span>Frequently asked questions</span>
          </div>

          <div className="ln-faq-list">
            {PERGUNTAS.map((item, i) => (
              <ItemFaq
                key={item.pergunta}
                pergunta={item.pergunta}
                resposta={item.resposta}
                aberto={aberto === i}
                onAlternar={() => setAberto((atual) => (atual === i ? null : i))}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
