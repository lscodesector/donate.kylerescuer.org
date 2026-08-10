"use client";

import { useEffect, useState } from "react";
import { whatsappHref } from "@/content/v1/landing";
import { IconWhatsApp } from "./ui/Icons";

/**
 * Só o WhatsApp. O botão de doar que morava aqui saiu quando a barra fixa
 * entrou — dois botões de doação sobrepostos no mesmo canto competiam entre si
 * e cobriam o conteúdo.
 *
 * A altura acompanha a barra fixa: enquanto ela não aparece (topo da página) o
 * botão fica rente ao rodapé da janela, como qualquer flutuante; quando ela
 * entra, ele sobe o quanto basta para não ficar em cima dela — mais no celular,
 * onde a barra ocupa duas linhas.
 *
 * Antes a folga era fixa, calculada para a barra. No topo, onde a barra ainda
 * não existe, isso deixava o botão boiando alto no meio do nada.
 *
 * O limite (520px) é o mesmo de `StickyDonateBar`. Mudou lá, muda aqui.
 */
export function FloatingActions() {
  const [barVisible, setBarVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setBarVisible(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href={whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale conosco no WhatsApp"
      className={`fixed right-4 z-40 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_28px_-6px_rgba(37,211,102,.7)] transition-[bottom,transform] duration-200 hover:scale-105 md:right-6 ${
        barVisible ? "bottom-[148px] sm:bottom-[96px]" : "bottom-4 md:bottom-6"
      }`}
    >
      <IconWhatsApp size={28} />
    </a>
  );
}
