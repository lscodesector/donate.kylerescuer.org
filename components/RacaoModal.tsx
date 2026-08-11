"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { copy, formatBRL, rationTiers } from "@/content/landing";
import { useScrollLock } from "@/lib/scroll-lock";
import { CHECKOUT_EVENT } from "./checkout/checkout-bus";
import { DonateTierButton } from "./checkout/DonateTierButton";
import { DONATION_MODAL_EVENT } from "./DonationModal";
import { MonthlyDonateButton } from "./MonthlyDonateButton";
import { IconBowl, IconClose, IconHeart, IconRepeat } from "./ui/Icons";

/**
 * Evento que abre a grade de faixas de ração. Mesmo desenho do modal mensal:
 * evento de janela, e não contexto React, porque quem dispara é um botão
 * dentro de seções que são Server Components.
 */
export const RACAO_MODAL_EVENT = "sos:abrir-racao";

export function openRacaoModal() {
  window.dispatchEvent(new Event(RACAO_MODAL_EVENT));
}

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  A grade de faixas de ração - agora em modal, não em seção            ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * É a antiga `components/sections/Racao.tsx` inteira: os seis cartões com foto
 * do saco, valor, quantos animais alimenta e por quantos dias, mais o bloco de
 * doação mensal no fim. O conteúdo não mudou - mudou o lugar.
 *
 * O motivo é que a página virou institucional. Uma vitrine de seis preços no
 * meio dela empurrava para baixo o que a pessoa veio ler (quem é a
 * organização, quem recebe a ajuda, dá para confiar) e transformava a página
 * num checkout com texto em volta. Aqui a grade continua a um clique de
 * distância de qualquer CTA da página, e só aparece para quem já decidiu doar.
 *
 * ── Três modais, uma pilha ────────────────────────────────────────────────
 * `z-[60]`, como o modal mensal, e abaixo do checkout (`z-[70]`): a ordem é
 * escolher faixa → checkout. Este modal se fecha sozinho quando qualquer um
 * dos outros dois abre - dois modais empilhados com trava de rolagem cada um
 * é o caminho curto para a página voltar ao topo sozinha.
 */
export function RacaoModal() {
  const [aberto, setAberto] = useState(false);
  const fecharRef = useRef<HTMLButtonElement>(null);
  const gatilhoRef = useRef<HTMLElement | null>(null);

  const fechar = useCallback(() => {
    setAberto(false);
    gatilhoRef.current?.focus();
  }, []);

  useScrollLock(aberto);

  useEffect(() => {
    const onAbrir = () => {
      gatilhoRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setAberto(true);
    };
    window.addEventListener(RACAO_MODAL_EVENT, onAbrir);
    return () => window.removeEventListener(RACAO_MODAL_EVENT, onAbrir);
  }, []);

  /*
   * Sai de cena quando o checkout ou o modal mensal assumem. Fechar sem
   * devolver o foco de propósito: quem manda no foco agora é o modal que
   * acabou de abrir, e roubá-lo de volta para o botão que ficou embaixo tiraria
   * o teclado de dentro do checkout.
   */
  useEffect(() => {
    const onOutroModal = () => setAberto(false);
    window.addEventListener(CHECKOUT_EVENT, onOutroModal);
    window.addEventListener(DONATION_MODAL_EVENT, onOutroModal);
    return () => {
      window.removeEventListener(CHECKOUT_EVENT, onOutroModal);
      window.removeEventListener(DONATION_MODAL_EVENT, onOutroModal);
    };
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    window.addEventListener("keydown", onKey);
    fecharRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [aberto, fechar]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-night/70 anim-fade-in sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) fechar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="racao-titulo"
        className="anim-fade-up flex max-h-[92dvh] w-full max-w-[620px] flex-col overflow-hidden rounded-t-lg bg-surface shadow-xl sm:rounded-lg"
      >
        {/* ── Cabeçalho, fora do scroll ──────────────────────────────── */}
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-ink-900/10 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-donate/10 text-donate">
              <IconBowl size={22} />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-accent">
                {copy.racao.eyebrow}
              </span>
              <h2
                id="racao-titulo"
                className="text-[17px] font-extrabold leading-tight text-ink-900"
              >
                {copy.racao.title}
              </h2>
            </div>
          </div>

          <button
            ref={fecharRef}
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-surface-alt text-ink-600 transition-colors hover:bg-ink-900/10"
          >
            <IconClose size={20} />
          </button>
        </header>

        {/* ── Corpo (a única parte que rola) ─────────────────────────── */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <p className="text-[14px] leading-[1.55] text-ink-600">
            {copy.racao.lead}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {rationTiers.map((tier) => (
              <div
                key={tier.id}
                className={`relative flex flex-col rounded-md border bg-surface shadow ${
                  tier.popular ? "border-donate ring-2 ring-donate/30" : "border-ink-900/10"
                }`}
              >
                {tier.popular && (
                  <span className="absolute left-1/2 top-3 z-10 max-w-[calc(100%-24px)] -translate-x-1/2 truncate rounded-full bg-donate px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] text-donate-ink shadow">
                    Mais escolhido
                  </span>
                )}

                {/* Quadrado, branco e `object-contain`, como na antiga seção:
                    as fotos são embalagens em pé recortadas em fundo branco, e
                    `cover` cortaria o saco pelo topo e pela base. */}
                <div className="relative aspect-square w-full overflow-hidden rounded-t-md bg-white">
                  {tier.image ? (
                    <Image
                      src={tier.image.src}
                      alt={tier.image.alt}
                      fill
                      sizes="(min-width: 640px) 280px, 45vw"
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 border-2 border-dashed border-ink-900/15 text-ink-300">
                      <IconBowl size={24} />
                      <span className="px-2 text-center text-[11px] font-semibold leading-tight">
                        Foto do saco de {tier.kg}kg
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col items-center gap-1.5 p-3 text-center">
                  <span className="text-[clamp(1.125rem,1rem+0.6vw,1.5rem)] font-extrabold leading-[1.1] text-ink-900">
                    {formatBRL(tier.priceCents)}
                  </span>

                  <span className="text-[12px] font-extrabold uppercase tracking-[0.05em] text-accent">
                    {tier.kg} kg de ração
                  </span>

                  <p className="text-[12px] leading-[1.45] text-ink-600">
                    Alimenta aproximadamente{" "}
                    <strong className="font-semibold text-ink-900">
                      {tier.animals} animais
                    </strong>{" "}
                    por cerca de{" "}
                    <strong className="font-semibold text-ink-900">
                      {tier.days} dias
                    </strong>
                    .
                  </p>

                  {/* O clique daqui dispara o `CHECKOUT_EVENT`, que abre o
                      checkout e fecha este modal no mesmo instante (ver o
                      efeito lá em cima). */}
                  <DonateTierButton
                    tier={tier}
                    className="mt-auto inline-flex min-h-[46px] w-full items-center justify-center gap-1.5 rounded-sm bg-donate px-2 text-[14px] font-extrabold uppercase tracking-[0.02em] text-donate-ink transition-colors hover:bg-donate-hover"
                  >
                    <IconHeart size={15} />
                    Doar {tier.kg}kg
                  </DonateTierButton>
                </div>
              </div>
            ))}
          </div>

          {/* Doação mensal: a única coisa que a grade de faixas não cobre, e
              por isso ela continua colada nela - aqui dentro, e não solta na
              página. É um dos três lugares em que a recorrência é oferecida,
              junto com o destaque do menu de frentes e o "Doar todo mês" do
              rodapé; os três abrem o mesmo modal. */}
          <div className="mt-4 flex flex-col gap-3 rounded-md border border-ink-900/10 bg-surface-alt p-4">
            <div className="flex flex-col gap-1">
              <h3 className="flex items-center gap-2 text-[16px] font-extrabold text-ink-900">
                <IconRepeat size={18} className="shrink-0 text-accent" />
                {copy.mensal.title}
              </h3>
              <p className="text-[13px] leading-[1.55] text-ink-600">
                {copy.mensal.text}
              </p>
            </div>

            {/* `causeId` marca que a recorrência que sai daqui é a da ração -
                é a frente que a pessoa já escolheu ao abrir este modal. */}
            <MonthlyDonateButton
              causeId="racao"
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-action px-5 text-[14px] font-extrabold uppercase tracking-[0.02em] text-white transition-colors hover:bg-action-hover"
            >
              <IconHeart size={16} />
              {copy.mensal.cta}
            </MonthlyDonateButton>
          </div>
        </div>
      </div>
    </div>
  );
}
