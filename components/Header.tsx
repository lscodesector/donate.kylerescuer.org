"use client";

import { Img as Image } from "@/components/ui/Img";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DOAR_HREF, org } from "@/content/landing";
import { openCausasModal } from "./CausasModal";
import { DonateMenuButton } from "./DonateMenuButton";
import { IconClose, IconHeart, IconMenu } from "./ui/Icons";

/*
 * O menu da campanha: o mesmo percurso da página, na mesma ordem em que as
 * seções aparecem. São os sete destinos do menu lateral de
 * `doe.caioprotetor.org`, apontando para as âncoras desta página.
 *
 * ⚠️ Todo item aqui precisa existir como `id` de seção em `app/page.tsx`. Item
 * de menu que rola para lugar nenhum é o defeito que ninguém testa e todo mundo
 * encontra - foi o que aconteceu com "Parceiros" e "Adotar", que continuaram
 * nesta lista depois de as seções saírem.
 */
const NAV = [
  { href: "#missao", label: "A história" },
  { href: "#abrigos", label: "Abrigos" },
  { href: DOAR_HREF, label: "Doar agora" },
  { href: "#transparencia", label: "Transparência" },
  { href: "#atualizacoes", label: "Atualizações" },
  { href: "#depoimentos", label: "Depoimentos" },
  { href: "#duvidas", label: "Dúvidas" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color] duration-200 ${
          scrolled
            ? "border-ink-900/10 bg-surface/95 shadow backdrop-blur"
            : "border-transparent bg-surface"
        }`}
      >
        {/*
          `1fr auto 1fr`: as duas pontas dividem igualmente a sobra, então a
          coluna do meio cai no centro exato da barra mesmo com o hambúrguer
          (44px) e o botão de doar (~110px) tendo larguras diferentes. Com
          `auto 1fr auto`, que estava aqui, a coluna central herdava todo o
          espaço restante e a logo ficava deslocada para a esquerda.
        */}
        <div className="container-narrow grid h-[var(--header-h)] grid-cols-[1fr_auto_1fr] items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            className="flex h-[44px] w-[44px] items-center justify-center rounded-sm text-ink-900 transition-colors hover:bg-surface-alt"
          >
            <IconMenu size={24} />
          </button>

          {/* A marca vive aqui, e não mais dentro do hero: a primeira dobra
              agora abre com a manchete, que é o que precisa ser lido primeiro. */}
          <Link
            href="#topo"
            aria-label={`${org.name} - início`}
            className="flex min-w-0 items-center justify-center"
          >
            {/* Só a marca, sem o nome escrito ao lado: a logo já traz o nome no
                próprio desenho, e repetir os dois deixava a barra apertada. Sem
                o texto, ela pode crescer e ocupar o centro sozinha. */}
            <Image
              src="/caio/logo-caio.png"
              alt={org.name}
              width={500}
              height={500}
              priority
              className="h-[68px] w-[68px] shrink-0 object-contain"
            />
          </Link>

          {/* Abre o menu de frentes ("escolha onde ajudar"): o rótulo aqui é
              "Quero doar", sem destino, e é o menu que dá um a ele. Sem
              JavaScript, o link continua descendo até o bloco de doação. */}
          <DonateMenuButton className="inline-flex h-[44px] shrink-0 items-center justify-center justify-self-end gap-2 whitespace-nowrap rounded-full bg-donate px-4 text-[14px] font-extrabold text-donate-ink shadow transition-colors hover:bg-donate-hover sm:px-6">
            <IconHeart size={16} />
            {/* No celular o rótulo encurta em vez de sumir: botão só com o
                coração não diz o que faz, e este é o CTA fixo da página. */}
            <span className="sm:hidden">Doar</span>
            <span className="hidden sm:inline">Quero doar</span>
          </DonateMenuButton>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-surface text-ink-900 anim-fade-in">
          <div className="container-narrow flex h-[var(--header-h)] shrink-0 items-center justify-between border-b border-ink-900/10">
            <span className="text-[16px] font-extrabold text-ink-900">{org.name}</span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Fechar menu"
              className="flex h-[44px] w-[44px] items-center justify-center rounded-sm text-ink-900 transition-colors hover:bg-surface-alt"
            >
              <IconClose size={24} />
            </button>
          </div>

          <nav aria-label="Menu principal" className="container-narrow flex-1 overflow-y-auto pb-16 pt-6">
            <ul className="flex flex-col">
              {NAV.map((item) => (
                <li key={item.href} className="border-b border-ink-900/[.07]">
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="block py-4 text-[19px] font-extrabold"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-6">
              {/* Fecha o menu e abre as frentes por cima da página. Aqui o
                  `DonateMenuButton` não serve: ele não tem como também fechar
                  o menu, e o menu aberto por trás de um modal é a camada a
                  mais que ninguém pediu. */}
              <a
                href={DOAR_HREF}
                onClick={(e) => {
                  setMenuOpen(false);
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
                    return;
                  e.preventDefault();
                  openCausasModal();
                }}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-donate px-8 text-[15px] font-extrabold text-donate-ink shadow"
              >
                <IconHeart size={18} />
                Quero doar
              </a>

              {/* Sem link de WhatsApp aqui: o botão flutuante já cobre o
                  contato, e o menu não precisa de um segundo caminho de saída. */}
              <Link
                href="#documentacao"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[44px] items-center gap-2 text-[15px] font-semibold text-ink-600"
              >
                Canais oficiais e documentação
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
