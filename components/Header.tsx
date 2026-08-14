"use client";

import { Img as Image } from "@/components/ui/Img";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DOAR_HREF, org } from "@/content/landing";
import { MonthlyDonateButton } from "./MonthlyDonateButton";
import { openDonationModal } from "./DonationModal";
import { useScrollLock } from "@/lib/scroll-lock";
import {
  IconArrowUpRight,
  IconChart,
  IconClock,
  IconClose,
  IconFile,
  IconHeart,
  IconHome,
  IconMenu,
  IconPaw,
  IconQuestion,
  IconUsers,
} from "./ui/Icons";

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
  { href: "#missao", label: "A história", icon: IconPaw },
  { href: "#abrigos", label: "Abrigos", icon: IconHome },
  { href: DOAR_HREF, label: "Doar agora", icon: IconHeart },
  { href: "#transparencia", label: "Transparência", icon: IconChart },
  { href: "#atualizacoes", label: "Atualizações", icon: IconClock },
  { href: "#depoimentos", label: "Depoimentos", icon: IconUsers },
  { href: "#duvidas", label: "Dúvidas", icon: IconQuestion },
  { href: "#documentacao", label: "Canais e documentação", icon: IconFile },
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

  /*
   * Aberto, o menu é uma **gaveta**: trava a rolagem do fundo e Esc fecha.
   *
   * O clique fora não precisa mais de um ouvinte global - quem recebe é o véu
   * que cobre a tela inteira (ver o `onMouseDown` dele lá embaixo). O ouvinte
   * antigo comparava o alvo com o `<header>`, e a gaveta agora vive **fora**
   * dele: qualquer clique dentro do próprio menu contaria como "clique fora"
   * e o fecharia na cara de quem ia usá-lo.
   */
  useScrollLock(menuOpen);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  /* A barra fixa. Sai como variável, e não direto no `return`, porque a gaveta
     do menu precisa ser irmã dela e não filha - ver o aviso sobre empilhamento
     logo abaixo. */
  const barra = (
    <header
      className={`sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color] duration-200 ${
        scrolled || menuOpen
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
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
          aria-controls="menu-principal"
          className="flex h-[44px] w-[44px] items-center justify-center rounded-sm text-ink-900 transition-colors hover:bg-surface-alt"
        >
          {menuOpen ? <IconClose size={24} /> : <IconMenu size={24} />}
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
            src="/caio/logo-caio.webp"
            alt={org.name}
            width={160}
            height={160}
            priority
            className="h-[68px] w-[68px] shrink-0 object-contain"
          />
        </Link>

        {/*
          ── O botão fixo da barra chama a **mensal** ────────────────────────
          Ele é o CTA que acompanha a pessoa a página inteira, e a doação que
          sustenta os abrigos é a que se repete: sabendo com quanto contar, a
          organização compra ração em quantidade em vez de esperar a próxima
          campanha. Abre a tela de valor **travada** na mensal - sem a aba da
          doação única, que o rótulo aqui não prometeu (ver
          `MonthlyDonateButton`). Quem quer doar uma vez tem o "doar agora" da
          barra fixa, do hero e do fim da página.

          "Apadrinhe", uma palavra só: o convite é assumir um animal, não fazer
          mais uma transação - e cabe em qualquer largura sem encolher a fonte.
          O rótulo por extenso da recorrência ("Apadrinhe todo mês") fica no
          menu lateral, onde há espaço para a linha inteira.

          A cor é o amarelo `--sos-monthly` (#F3B639), e não o verde de doação:
          o apadrinhamento é o único pedido que se repete todo mês, e agora ele
          tem uma cor só dele em toda a página. Tinta preta por cima - branco
          sobre este amarelo é ilegível (ver o token em `globals.css`).
        */}
        <MonthlyDonateButton className="inline-flex h-[44px] shrink-0 items-center justify-center justify-self-end gap-2 whitespace-nowrap rounded-full bg-monthly px-4 text-fs14 font-extrabold text-monthly-ink shadow transition-colors hover:bg-monthly-hover sm:px-5">
          <IconHeart size={16} />
          Apadrinhe
        </MonthlyDonateButton>
      </div>

    </header>
  );

  return (
    <>
      {barra}

      {/*
        ── A gaveta, e não mais um painel pendurado na barra ──────────────────
        Ela entra pela **esquerda**, ocupa a altura inteira da janela e cobre o
        resto da página com um véu desfocado. Já foi uma tela inteira (virava um
        segundo site por cima do primeiro) e depois um painel que descia colado
        na barra, com a página viva em volta - e era esse "em volta" o problema:
        oito âncoras, dois botões e a página inteira competindo pela atenção na
        mesma tela.

        ⚠️ Ela vive **fora** do `<header>`, e não por acaso: o cabeçalho é
        `sticky z-40`, o que abre um contexto de empilhamento próprio - lá
        dentro, nenhum `z-index` da gaveta conseguiria passar por cima da barra
        fixa de doação, que também é 40. Aqui fora ela é 50: acima das duas,
        abaixo dos modais de doação (60) e de checkout (70).
      */}
      {menuOpen && (
        <>
          {/*
            O véu. `backdrop-blur` é o pedido central deste desenho: o fundo não
            some, ele sai de foco - a pessoa continua sabendo que a campanha
            está ali atrás, e nada nela é legível o bastante para disputar com o
            menu. `bg-night/45` por cima do desfoque, porque desfocar sem
            escurecer deixa texto claro ainda saltando.
          */}
          <div
            className="fixed inset-0 z-50 bg-night/45 backdrop-blur-[8px] anim-fade-in"
            onMouseDown={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          <nav
            id="menu-principal"
            aria-label="Menu principal"
            className="anim-slide-in-left fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[min(86vw,340px)] flex-col border-r border-ink-900/10 bg-surface shadow-[8px_0_40px_-12px_rgba(20,17,15,.35)]"
          >
            {/* Topo: a marca e o X, como no exemplo de referência. */}
            <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
              <Link
                href="#topo"
                onClick={() => setMenuOpen(false)}
                aria-label={`${org.name} - início`}
                className="flex min-w-0 items-center"
              >
                <Image
                  src="/caio/logo-caio.webp"
                  alt={org.name}
                  width={160}
                  height={160}
                  className="h-[52px] w-[52px] shrink-0 object-contain"
                />
              </Link>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Fechar menu"
                className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] text-[#6b6b6b] transition-colors hover:bg-ink-900/10"
              >
                <IconClose size={20} />
              </button>
            </div>

            {/*
              A lista rola sozinha (`flex-1` + `overflow-y-auto`): num celular
              deitado são oito itens mais os dois botões, e o que precisa ficar
              sempre alcançável é o pedido de doação, não o topo da lista.
            */}
            <ul className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain border-t border-ink-900/10">
              {NAV.map(({ href, label, icon: Icon }) => (
                <li key={href} className="border-b border-ink-900/[.07]">
                  {/*
                    A barrinha vermelha que acende na borda esquerda no hover é
                    o detalhe do exemplo que você mandou - lá ela é azul porque
                    a marca é azul; aqui ela é o vermelho do Caio. Feita com
                    `before:`, e não com um `<span>`: é decoração pura e não
                    tem por que existir no DOM para um leitor de tela.
                  */}
                  <Link
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="relative flex min-h-[54px] items-center gap-3 px-4 text-fs15 font-extrabold text-ink-900 transition-colors before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:scale-y-0 before:bg-action before:transition-transform hover:bg-surface-alt hover:before:scale-y-100 focus-visible:bg-surface-alt"
                  >
                    <Icon size={19} className="shrink-0 text-action" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Os dois botões e a assinatura ficam colados na base, fora da
                rolagem: são eles que a gaveta existe para oferecer. */}
            <div className="flex shrink-0 flex-col gap-2 border-t border-ink-900/10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              {/* O mesmo pedido do botão da barra e, como ele, **só** a mensal:
                  a tela abre travada na recorrência (`somenteMensal`), sem a
                  aba de doação única. Aqui o `MonthlyDonateButton` não serve:
                  ele não tem como também fechar a gaveta.

                  Aqui o rótulo diz "todo mês" por extenso, e na barra não: este
                  botão tem a largura da gaveta inteira, e quem abriu o menu
                  parou para escolher - vale gastar a palavra que promete
                  exatamente o que a próxima tela vai oferecer. */}
              <a
                href={DOAR_HREF}
                onClick={(e) => {
                  setMenuOpen(false);
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
                    return;
                  e.preventDefault();
                  openDonationModal({ freq: "mensal", somenteMensal: true });
                }}
                className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-monthly px-5 text-fs15 font-extrabold text-monthly-ink shadow transition-colors hover:bg-monthly-hover"
              >
                <IconHeart size={18} />
                Apadrinhe todo mês
              </a>

              {/* O único destino fora desta página, e por isso ele fica depois
                  do pedido de doação e em contorno: quem abriu o menu para doar
                  encontra o botão verde primeiro. Aba nova pelo mesmo motivo -
                  a campanha continua aberta atrás. Ver `org.humanHelp`. */}
              <a
                href={org.humanHelp.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-ink-900/[.12] bg-surface px-5 text-fs15 font-extrabold text-ink-900 transition-colors hover:border-action hover:text-action"
              >
                {org.humanHelp.label}
                <IconArrowUpRight size={16} className="shrink-0" />
              </a>

              <p className="pt-1 text-fs12 leading-[1.4] text-ink-600">
                <span className="font-extrabold text-action">{org.name}</span>
                <br />
                Levando ajuda a quem não tem voz.
              </p>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
