"use client";

import type { ReactNode } from "react";
import { openDonationModal } from "./DonationModal";

/**
 * Botão que abre o modal de doação.
 *
 * Existe para que seções que são Server Components (hero, impacto, fechamento)
 * continuem sendo servidor: só este botão vira cliente, e não a seção inteira.
 * A aparência vem toda de `className` — aqui não há estilo próprio de propósito,
 * porque cada lugar da página tem o seu.
 */
export function DonateButton({
  className,
  children,
  freq = "unica",
}: {
  className?: string;
  children: ReactNode;
  /** Abre o modal já na aba de doação mensal. */
  freq?: "unica" | "mensal";
}) {
  return (
    <button type="button" onClick={() => openDonationModal(freq)} className={className}>
      {children}
    </button>
  );
}
