"use client";

import { useEffect, useState } from "react";
import { RACAO_HREF } from "@/content/landing";
import { IconBowl, IconHeart } from "./ui/Icons";

/**
 * Barra fixa no rodapé da janela: o atalho permanente para a seção de ração.
 *
 * Só aparece depois que a pessoa passa da primeira dobra. Na dobra o CTA já
 * está na tela em tamanho grande, e uma barra por cima dele só tiraria espaço
 * de leitura; a partir do momento em que ele sai de vista, ela vira o atalho
 * para doar de qualquer ponto da página.
 *
 * ── O que saiu daqui ──────────────────────────────────────────────────────
 * A barra de meta ("R$ 18.500 de R$ 58.000", "236 apoiadores") ocupava duas
 * linhas com números que a página não tinha ligados em nenhuma fonte real.
 * Numa barra que fica na tela o tempo todo, isso é o dado mais visto do site
 * inteiro — e o mais caro de manter honesto. No lugar ficou uma linha só, que
 * repete o que a página vende, e o botão que leva até lá.
 */
export function StickyDonateBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-900/10 bg-surface/97 shadow-[0_-4px_20px_rgba(20,17,15,.1)] backdrop-blur anim-fade-up">
      {/* A folga de 84px à direita saiu junto com o botão flutuante do
          WhatsApp, que era quem cairia em cima do botão de doar. Sem ele, a
          barra usa a largura inteira e o CTA fica mais largo. */}
      <div className="container-narrow flex max-w-[860px] flex-col gap-2 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:gap-4">
        <p className="flex min-w-0 flex-1 items-center gap-2 text-[13px] font-extrabold leading-tight text-ink-900 sm:text-[14px]">
          <IconBowl size={18} className="shrink-0 text-donate" />
          <span className="min-w-0">
            Mais de 400 animais esperam o pote cheio hoje.
          </span>
        </p>

        <a
          href={RACAO_HREF}
          className="inline-flex min-h-[48px] w-full shrink-0 items-center justify-center gap-2 rounded-full bg-donate px-5 text-[14px] font-extrabold uppercase tracking-[0.03em] text-donate-ink shadow transition-colors hover:bg-donate-hover sm:w-auto sm:px-8 sm:text-[15px]"
        >
          <IconHeart size={17} />
          Doar ração
        </a>
      </div>
    </div>
  );
}
