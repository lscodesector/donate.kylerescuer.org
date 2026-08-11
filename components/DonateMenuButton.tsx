"use client";

import type { ReactNode } from "react";
import { RACAO_HREF } from "@/content/landing";
import { openCausasModal } from "./CausasModal";

/**
 * O botão "Quero doar" genérico: abre o menu de frentes (`CausasModal`).
 *
 * A diferença para o `RacaoDonateButton` é o rótulo de quem chama. Botão que
 * diz **"doar ração"** vai direto para a grade de kg - a pessoa já escolheu a
 * frente ao ler o botão. Botão que diz só **"doar"** passa pelo menu, porque
 * doar sem destino é uma decisão vaga e é o destino que faz alguém decidir.
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
      href={RACAO_HREF}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        openCausasModal();
      }}
      className={className}
    >
      {children}
    </a>
  );
}
