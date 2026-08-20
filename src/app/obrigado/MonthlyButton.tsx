"use client";

import type { ReactNode } from "react";
import { openDonationModal } from "@/lib/modais";

/**
 * O pedido de recorrência desta tela, isolado num componente de cliente.
 *
 * `page.tsx` exporta `metadata` (SEO, `robots`) e por isso precisa continuar
 * Server Component - só este botão vira cliente, pelo mesmo motivo do resto
 * do site (ver `lib/modais.ts`): quem abre o modal de doação precisa de
 * `onClick`, e um Server Component não recebe callback.
 */
export function MonthlyButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => openDonationModal({ freq: "mensal", somenteMensal: true })}
      className={className}
    >
      {children}
    </button>
  );
}
