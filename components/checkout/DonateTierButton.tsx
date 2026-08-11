"use client";

import type { ReactNode } from "react";
import { checkoutHref, formatBRL } from "@/content/landing";
import { openCheckout } from "./checkout-bus";

/**
 * O botão que abre o checkout de uma faixa de ração.
 *
 * É um `<a>` de verdade apontando para `/doar/<faixa>`, e não um `<button>`:
 * sem JavaScript o link leva para a página de checkout, que continua existindo
 * e funcionando. Com JavaScript, o `onClick` cancela a navegação e abre o
 * modal por cima da landing — a pessoa não sai do lugar.
 *
 * Os modificadores do navegador continuam valendo (Ctrl/Cmd/Shift/clique do
 * meio abrem em outra aba, como qualquer link): interceptar tudo faria um link
 * se comportar como algo que não é.
 *
 * Existe como componente próprio para que a seção de ração continue sendo
 * Server Component — só o botão vira cliente. A aparência vem toda de
 * `className`; aqui não há estilo próprio de propósito.
 */
export function DonateTierButton({
  tier,
  className,
  children,
}: {
  tier: {
    id: string;
    kg: number;
    priceCents: number;
    animals: number;
    days: number;
    image: { src: string; alt: string } | null;
  };
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={checkoutHref(tier.id)}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        openCheckout({
          kind: "racao",
          amountCents: tier.priceCents,
          title: `${tier.kg} kg de ração`,
          impact: `Alimenta cerca de ${tier.animals} animais por ${tier.days} dias.`,
          image: tier.image,
          txid: `RACAO${tier.kg}KG`,
        });
      }}
      /* O leitor de tela recebe a frase inteira; na tela o rótulo é curto
         ("Doar 5kg") e o preço já está no corpo do cartão, logo acima. */
      aria-label={`Doar ${tier.kg} kg de ração por ${formatBRL(tier.priceCents)}`}
      className={className}
    >
      {children}
    </a>
  );
}
