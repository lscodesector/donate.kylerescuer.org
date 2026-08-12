"use client";

import type { ReactNode } from "react";
import { openDonationModal, type DonationIntent } from "./DonationModal";

/**
 * Botão que abre o modal de doação mensal.
 *
 * É o CTA que pula o menu de frentes: todo o resto (cabeçalho, hero, abrigos,
 * impacto, fechamento) aponta para `DOAR_HREF` e passa pelo "escolha onde
 * ajudar". Este já sabe a resposta da outra pergunta - a frequência -, então
 * abre o modal de valor direto, com a mensal marcada.
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
      onClick={() => openDonationModal({ causeId, freq: "mensal" })}
      className={className}
    >
      {children}
    </button>
  );
}
