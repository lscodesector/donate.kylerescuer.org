"use client";

import type { ReactNode } from "react";
import { openDonationModal } from "./DonationModal";

/**
 * Botão que abre o modal de doação mensal.
 *
 * É o **único** CTA da página que não vai para a seção de ração: todo o resto
 * (cabeçalho, hero, abrigos, impacto, barra fixa, fechamento) aponta para
 * `RACAO_HREF`, porque a doação avulsa desta página se escolhe por faixa de
 * kg. A mensal não tem faixa de kg — ela é um valor que se repete —, então
 * ela é a exceção que abre o modal.
 *
 * Existe como componente próprio para que a seção que o usa continue sendo
 * Server Component: só este botão vira cliente, e não a seção inteira. A
 * aparência vem toda de `className` — aqui não há estilo próprio de propósito.
 */
export function MonthlyDonateButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={() => openDonationModal()} className={className}>
      {children}
    </button>
  );
}
