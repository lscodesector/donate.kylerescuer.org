"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { IconArrowLeft, IconArrowRight } from "./Icons";

/**
 * Fileira de cards que rola na horizontal, com setas de navegação.
 *
 * A rolagem em si continua sendo do navegador (`overflow-x` + `scroll-snap`),
 * não do JavaScript: arrasto, roda do mouse, teclado e leitor de tela seguem
 * funcionando exatamente como funcionavam, e sem JavaScript a fileira continua
 * rolável - o que some são só as setas, que são atalho, não a única saída.
 *
 * Este componente é cliente para que a seção que o usa não precise ser: ela
 * passa os `<li>` já renderizados no servidor como `children`.
 *
 * ── Sobre o passo ─────────────────────────────────────────────────────────
 * Cada clique anda a largura de **um card**, lida do DOM (primeiro filho +
 * `column-gap`) em vez de fixada num número. Os cards mudam de largura no
 * `sm`, e um passo fixo erraria o alvo em uma das duas larguras - com o
 * `scroll-snap` no meio, o erro vira um card meio cortado na borda.
 *
 * ── Sobre as setas ────────────────────────────────────────────────────────
 * Elas desligam sozinhas nas pontas e o par inteiro some quando não há o que
 * rolar (poucos cards numa tela larga). Seta acesa que não leva a lugar nenhum
 * é pior do que seta nenhuma.
 */
export function CardsCarousel({
  children,
  label,
  className = "",
}: {
  children: ReactNode;
  /** Nome da fileira para leitores de tela - vai nos rótulos das setas. */
  label: string;
  /** Classes do trilho (largura, padding, sangria). */
  className?: string;
}) {
  const trilho = useRef<HTMLUListElement>(null);
  // `transbordou` começa `true` para o par de setas já sair no HTML do
  // servidor: a lista que usa isto tem dez cards e sempre transborda, e
  // começar em `false` faria as setas aparecerem depois, empurrando o
  // conteúdo abaixo delas.
  const [nav, setNav] = useState({ voltar: false, avancar: true, transbordou: true });

  const medir = useCallback(() => {
    const el = trilho.current;
    if (!el) return;
    const fim = el.scrollWidth - el.clientWidth;
    setNav({
      // 1px de tolerância: com zoom ou larguras fracionárias o `scrollLeft`
      // para a meio pixel do fim, e a seta ficaria acesa sem ter para onde ir.
      voltar: el.scrollLeft > 1,
      avancar: el.scrollLeft < fim - 1,
      transbordou: fim > 1,
    });
  }, []);

  useEffect(() => {
    const el = trilho.current;
    if (!el) return;

    medir();
    el.addEventListener("scroll", medir, { passive: true });

    // O trilho muda de largura sem a janela mudar de tamanho (a fonte carrega,
    // uma imagem entra), então `resize` na janela não bastaria.
    const observer = new ResizeObserver(medir);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", medir);
      observer.disconnect();
    };
  }, [medir]);

  const andar = (direcao: 1 | -1) => {
    const el = trilho.current;
    if (!el) return;

    const card = el.firstElementChild as HTMLElement | null;
    const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
    const passo = card ? card.offsetWidth + gap : el.clientWidth;

    // `scrollBy` não olha `prefers-reduced-motion` sozinho - quem pediu menos
    // movimento recebe o salto direto, sem a animação de rolagem.
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: passo * direcao, behavior: reduzido ? "auto" : "smooth" });
  };

  const botao =
    "flex h-[44px] w-[44px] items-center justify-center rounded-full border-2 border-ink-900/15 bg-surface text-ink-900 transition-colors hover:border-action hover:text-action disabled:cursor-not-allowed disabled:border-ink-900/10 disabled:text-ink-300 disabled:hover:border-ink-900/10";

  return (
    <>
      <ul ref={trilho} className={className}>
        {children}
      </ul>

      {nav.transbordou && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => andar(-1)}
            disabled={!nav.voltar}
            aria-label={`${label}: ver anteriores`}
            className={botao}
          >
            <IconArrowLeft size={20} />
          </button>

          <button
            type="button"
            onClick={() => andar(1)}
            disabled={!nav.avancar}
            aria-label={`${label}: ver próximos`}
            className={botao}
          >
            <IconArrowRight size={20} />
          </button>
        </div>
      )}
    </>
  );
}
