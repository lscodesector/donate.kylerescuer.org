"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getCampaignServerSnapshot,
  getCampaignSnapshot,
  subscribeCampaign,
} from "@/lib/campaign";
import { openCausasModal } from "./CausasModal";
import { IconHeart } from "./ui/Icons";

/**
 * A barra de doação colada na base da janela: contador à esquerda, botão à
 * direita.
 *
 * ── O que ela substitui ────────────────────────────────────────────────────
 * O botão redondo flutuante (`FloatingDonate`). Ele existia porque o site
 * institucional não tinha número de campanha para mostrar - "nossa missão" não
 * arrecada uma meta em reais. Esta campanha tem: arrecadado, meta, progresso e
 * apoiadores já aparecem na dobra (`CampaignProgress`, dentro do `Hero`), e
 * repeti-los aqui, sempre visíveis, é o que lembra quem está rolando a página
 * de que a meta ainda está em aberto - o próprio botão redondo não dizia isso.
 *
 * ── Por que os números não se repetem por acaso ────────────────────────────
 * Vêm da mesma fonte que a dobra (`lib/campaign.ts`, `useSyncExternalStore`):
 * o mesmo valor calculado uma vez e compartilhado, não duas contas separadas
 * que poderiam nunca bater a fração de segundo em que uma delas ainda não
 * corrigiu pelo relógio do servidor.
 *
 * ── Quando aparece ──────────────────────────────────────────────────────────
 * Depois da primeira dobra, como o botão que ela substitui: na dobra o
 * contador e o CTA já estão grandes na tela, e a barra por cima deles seria o
 * mesmo pedido duas vezes na mesma tela.
 */
export function StickyDonateBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const estado = useSyncExternalStore(
    subscribeCampaign,
    getCampaignSnapshot,
    getCampaignServerSnapshot,
  );

  if (!visible) return null;

  const brl = (valor: number) =>
    valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    });

  return (
    /* `env(safe-area-inset-bottom)`: no iPhone a faixa do gesto de voltar
       come os últimos ~34px da janela - sem o respiro, o botão fica embaixo
       dela. `z-40`: abaixo dos modais (55, 60, 70) e do menu (50), acima do
       resto da página. */
    <div
      className="fixed inset-x-0 bottom-0 z-40 anim-fade-up border-t border-ink-900/10 bg-surface/98 shadow-[0_-8px_24px_-8px_rgba(0,0,0,.12)] backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="container-narrow flex items-center gap-3 py-2.5 sm:gap-5 sm:py-3">
        {/* O contador encolhe (é `min-w-0` que permite) antes do botão -
            "Doar agora" não pode nunca quebrar linha ou sumir. */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2 text-[13px] sm:text-[14px]">
            <span className="font-extrabold text-ink-900 tabular-nums">
              {estado ? brl(estado.raised) : "—"}
            </span>
            <span className="whitespace-nowrap text-ink-600 tabular-nums">
              de {estado ? brl(estado.goal) : "—"}
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={estado?.percent ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresso da meta da campanha"
            className="h-[6px] w-full overflow-hidden rounded-full bg-ink-900/10"
          >
            <div
              className="h-full rounded-full bg-donate transition-[width] duration-700 ease-out"
              style={{ width: `${estado?.percent ?? 0}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[11px] font-semibold">
            <span className="text-donate">
              {estado ? `${estado.percent}% da meta` : " "}
            </span>
            <span className="inline-flex items-center gap-1 text-ink-600">
              <span
                aria-hidden="true"
                className="h-[5px] w-[5px] shrink-0 rounded-full bg-donate"
              />
              {estado ? `${estado.supporters} apoiadores` : " "}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openCausasModal()}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-full bg-donate px-4 text-[13px] font-extrabold uppercase tracking-[0.02em] text-donate-ink shadow-[0_8px_20px_-8px_rgba(27,138,75,.6)] transition-colors hover:bg-donate-hover sm:min-h-[48px] sm:px-6 sm:text-[14px]"
        >
          <IconHeart size={17} />
          Doar agora
        </button>
      </div>
    </div>
  );
}
