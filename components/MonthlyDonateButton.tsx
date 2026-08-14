"use client";

import type { ReactNode } from "react";
import { openDonationModal, type DonationIntent } from "./DonationModal";

/**
 * Botão que abre o modal de doação **mensal**, e só ela.
 *
 * É o CTA que pula o menu de frentes: todo o resto (cabeçalho, hero, abrigos,
 * impacto, fechamento) aponta para `DOAR_HREF` e passa pelo "escolha onde
 * ajudar". Este já sabe a resposta da outra pergunta - a frequência.
 *
 * ── Mensal do rótulo ao Pix ───────────────────────────────────────────────
 * `somenteMensal` trava a tela que ele abre: sem as abas de frequência, com a
 * escada da mensal e terminando no checkout de recorrência. Antes ele só
 * *marcava* a aba mensal, e a doação única ficava a um toque - um botão escrito
 * "quero doar todo mês" que abre uma tela oferecendo outra coisa é o tipo de
 * desencontro que faz a pessoa desistir no meio. Quem quer doar uma vez tem os
 * botões de "doar agora" espalhados pela página inteira.
 *
 * Existe como componente próprio para que a seção que o usa continue sendo
 * Server Component: só este botão vira cliente, e não a seção inteira. A
 * aparência vem toda de `className` - aqui não há estilo próprio de propósito.
 */
export function MonthlyDonateButton({
  className,
  children,
  /** A frente que a doação recorrente vai financiar. Sem ela, é a rede toda. */
  causeId,
}: {
  className?: string;
  children: ReactNode;
  causeId?: DonationIntent["causeId"];
}) {
  return (
    <button
      type="button"
      onClick={() =>
        openDonationModal({ causeId, freq: "mensal", somenteMensal: true })
      }
      className={className}
    >
      {children}
    </button>
  );
}
