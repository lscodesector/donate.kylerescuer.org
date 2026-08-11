"use client";

import type { ReactNode } from "react";
import { RACAO_HREF } from "@/content/landing";
import { openRacaoModal } from "./RacaoModal";

/**
 * O botão "Doar ração": abre o modal com as faixas de kg.
 *
 * É um `<a href="#racao">` de verdade, e não um `<button>`: sem JavaScript o
 * link ainda leva ao bloco de doação da página, que explica o que acontece e
 * traz os canais da equipe. Com JavaScript, o `onClick` cancela a rolagem e
 * abre a grade por cima - a pessoa não sai do lugar.
 *
 * Existe como componente próprio para que as seções que o usam continuem
 * sendo Server Components; a aparência vem toda de `className`.
 */
export function RacaoDonateButton({
  className,
  children,
  ariaLabel,
}: {
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <a
      href={RACAO_HREF}
      aria-label={ariaLabel}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        openRacaoModal();
      }}
      className={className}
    >
      {children}
    </a>
  );
}
