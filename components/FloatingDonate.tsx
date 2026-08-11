"use client";

import { useEffect, useState } from "react";
import { copy } from "@/content/landing";
import { openCausasModal } from "./CausasModal";
import { IconHeart } from "./ui/Icons";

/**
 * O botão de doar que acompanha a página inteira, flutuando no canto.
 *
 * ── O que ele substituiu ──────────────────────────────────────────────────
 * A `StickyDonateBar`: uma faixa colada na base da janela, com uma frase de
 * campanha à esquerda ("Mais de 400 animais esperam o pote cheio hoje") e o
 * botão à direita. Ela tomava a largura toda e uma faixa de altura em todas as
 * telas, e num site institucional - onde o miolo é texto e foto - isso é uma
 * tarja permanente por cima do que a pessoa veio ler. O botão redondo entrega
 * o mesmo atalho ocupando um canto.
 *
 * ── Ele não abre o checkout ───────────────────────────────────────────────
 * Abre o menu de frentes (`CausasModal`): "doar" sem destino é uma decisão
 * vaga, e é escolher onde a doação entra que faz alguém decidir. Os botões com
 * destino explícito na página ("Doar ração") continuam indo direto para a
 * grade de kg - o menu é para quem clicou em *doar*, não em *doar ração*.
 *
 * ── Quando aparece ────────────────────────────────────────────────────────
 * Depois da primeira dobra, como a barra fazia. Na dobra o CTA já está na tela
 * em tamanho grande, e um botão flutuante por cima dele seria o mesmo pedido
 * duas vezes na mesma tela.
 */
export function FloatingDonate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    /*
      `env(safe-area-inset-*)`: no iPhone a faixa do gesto de voltar para a
      tela inicial come os últimos ~34px da janela, e um botão fixo em
      `bottom: 20px` cai debaixo dela.

      `z-40` fica abaixo dos modais (55, 60 e 70) e do menu do cabeçalho (50):
      o botão não pode continuar flutuando por cima da própria tela que ele
      abriu.
    */
    <div
      className="fixed z-40 anim-fade-up"
      style={{
        right: "max(1rem, env(safe-area-inset-right))",
        bottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      <button
        type="button"
        onClick={() => openCausasModal()}
        className="inline-flex min-h-[56px] items-center justify-center gap-2.5 rounded-full bg-donate px-6 text-[15px] font-extrabold uppercase tracking-[0.03em] text-donate-ink shadow-[0_14px_34px_-10px_rgba(27,138,75,.75)] transition-colors hover:bg-donate-hover"
      >
        <IconHeart size={20} />
        {copy.causas.floatingCta}
      </button>
    </div>
  );
}
