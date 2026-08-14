"use client";

import type { ReactNode } from "react";
import { DOAR_HREF } from "@/content/landing";
import { openDonationModal } from "./DonationModal";

/**
 * O botão "Quero doar" genérico: abre direto a tela de valor (`DonationModal`).
 *
 * É um `<a href="#racao">` de verdade: sem JavaScript o link leva ao bloco de
 * doação da página, que explica o que acontece e traz os canais da equipe.
 * Existe como componente próprio para que as seções que o usam continuem sendo
 * Server Components; a aparência vem toda de `className`.
 */
export function DonateMenuButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={DOAR_HREF}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        openDonationModal();
      }}
      className={className}
    >
      {children}
    </a>
  );
}
