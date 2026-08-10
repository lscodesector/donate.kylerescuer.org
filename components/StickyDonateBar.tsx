"use client";

import { useEffect, useState } from "react";
import { campaign, formatBRL } from "@/content/landing";
import { openDonationModal } from "./DonationModal";
import { IconHeart, IconUsers } from "./ui/Icons";

/**
 * Barra fixa no rodapé da janela: progresso da meta + botão de doar.
 *
 * Só aparece depois que a pessoa passa da primeira dobra. Na dobra o CTA já
 * está na tela em tamanho grande, e uma barra por cima dele só tiraria espaço
 * de leitura; a partir do momento em que ele sai de vista, ela vira o atalho
 * permanente para doar de qualquer ponto da página.
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

  const pct =
    campaign && campaign.goalCents > 0
      ? Math.min(100, (campaign.raisedCents / campaign.goalCents) * 100)
      : null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-900/10 bg-surface/97 shadow-[0_-4px_20px_rgba(20,17,15,.1)] backdrop-blur anim-fade-up">
      {/* `pr-[76px]` abre espaço para o botão do WhatsApp, que flutua no canto
          inferior direito e cairia em cima do botão de doar sem esta folga. */}
      <div className="container-narrow flex max-w-[860px] flex-col gap-2 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:gap-4 sm:pr-[84px]">
        {campaign && pct !== null && (
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-[clamp(0.9375rem,0.85rem+0.4vw,1.125rem)] font-extrabold leading-tight text-ink-900">
                {formatBRL(campaign.raisedCents)}
              </span>
              <span className="text-[12px] text-ink-600">
                de {formatBRL(campaign.goalCents)}
              </span>
            </div>

            <div
              role="progressbar"
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso da meta da campanha"
              className="h-[6px] w-full overflow-hidden rounded-full bg-ink-900/10"
            >
              <div className="h-full rounded-full bg-donate" style={{ width: `${pct}%` }} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-3 text-[11px] font-semibold">
              <span className="text-donate">{Math.round(pct)}% da meta</span>
              <span className="hidden items-center gap-1 text-ink-600 sm:inline-flex">
                <IconUsers size={12} />
                {campaign.supporters} apoiadores
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => openDonationModal()}
          className="inline-flex min-h-[48px] w-full shrink-0 items-center justify-center gap-2 rounded-full bg-donate px-5 text-[14px] font-extrabold uppercase tracking-[0.03em] text-donate-ink shadow transition-colors hover:bg-donate-hover sm:w-auto sm:px-8 sm:text-[15px]"
        >
          <IconHeart size={17} />
          Doar agora
        </button>
      </div>
    </div>
  );
}
