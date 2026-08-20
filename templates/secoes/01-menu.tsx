/* ═══ TEMPLATE · REFERÊNCIA VIVA ══════════════════════════════════════
 *
 * Este arquivo é a seção **como ela está no ar**, copiada sem edição de
 * `doe.caioprotetor`. Ele serve para duas coisas:
 *
 *   1. copiar a estrutura para o site novo e trocar só o conteúdo;
 *   2. consultar o porquê de cada decisão - os comentários abaixo registram
 *      o que já foi tentado e não funcionou, que é a parte que se perde.
 *
 * O texto e as imagens são da campanha do Caio: **troque-os**. O desenho,
 * as medidas e as classes são o padrão da rede: **não troque**.
 * ═══════════════════════════════════════════════════════════════════════ */

"use client";

import NextImage, { type ImageProps } from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type SVGProps } from "react";
import { withBasePath } from "@/lib/base-path";
import { DOAR_HREF, org } from "@/lib/config";
import { openDonationModal } from "@/lib/modais";
import { useScrollLock } from "@/lib/scroll-lock";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  01 · MENU - a barra fixa do topo e a gaveta                          ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Bloco isolado: os ícones, o envelope de imagem e o botão de compartilhar
 * moram aqui dentro. De fora só entram dado de campanha (`lib/config`) e o
 * gatilho do modal de doação (`lib/modais`).
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
    ...rest,
  };
}

const IconArrowUpRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 17 17 7" />
    <path d="M8 7h9v9" />
  </svg>
);

const IconDollar = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 2v20" />
    <path d="M17 6.5c0-1.93-2.24-3.5-5-3.5s-5 1.57-5 3.5S9.24 10 12 10s5 1.57 5 3.5-2.24 3.5-5 3.5-5-1.57-5-3.5" />
  </svg>
);

const IconClock = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const IconClose = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const IconFile = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v5h5" />
  </svg>
);

const IconHeart = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8Z" />
  </svg>
);

const IconHome = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </svg>
);

const IconMenu = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

const IconPaw = ({ size = 20, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable={false}
    {...rest}
  >
    <ellipse cx="7" cy="8.2" rx="2.1" ry="2.7" />
    <ellipse cx="12" cy="6.4" rx="2.1" ry="2.8" />
    <ellipse cx="17" cy="8.2" rx="2.1" ry="2.7" />
    <ellipse cx="19.6" cy="13.2" rx="1.9" ry="2.3" />
    <ellipse cx="4.4" cy="13.2" rx="1.9" ry="2.3" />
    <path d="M12 12.2c2.8 0 5.2 2 5.2 4.4 0 2-1.6 3.2-3.4 3.2-.8 0-1.3-.3-1.8-.3s-1 .3-1.8.3c-1.8 0-3.4-1.2-3.4-3.2 0-2.4 2.4-4.4 5.2-4.4Z" />
  </svg>
);

const IconQuestion = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9.2" />
    <path d="M9.6 9.4a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.6" />
    <path d="M12 17.1h.01" />
  </svg>
);

const IconUsers = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
    <path d="M16 3.1a4 4 0 0 1 0 7.8" />
  </svg>
);

const IconCheck = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m5 13 4 4L19 7" />
  </svg>
);

const IconShare = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
  </svg>
);

/**
 * `next/image` com o `basePath` do build prefixado no `src`.
 *
 * ⚠️ Com `images.unoptimized: true` (obrigatório num export estático - ver
 * `next.config.ts`), o `next/image` passa o `src` adiante sem tocar nele. É
 * comportamento documentado: o prefixo de `basePath` só acontece na URL do
 * otimizador (`/_next/image?url=…`), e sem otimizador não há essa URL para
 * prefixar. Sem este envelope, publicado em `doe.caioprotetor.org/v2`, toda
 * imagem apontaria para a raiz do domínio - que é outro site (WordPress) - e
 * simplesmente não carregaria.
 *
 * Só cobre `src` em string, que é o único formato usado aqui.
 */
function Image({ src, ...props }: ImageProps) {
  const prefixado = typeof src === "string" ? withBasePath(src) : src;
  return <NextImage src={prefixado} {...props} />;
}

/**
 * O botão de compartilhar da barra fixa.
 *
 * ── Por que ele ocupa o lugar do pedido de doação ──────────────────────────
 * A barra é o único elemento que acompanha a pessoa a página inteira, e o
 * pedido de dinheiro já está em toda parte: na dobra (`Hero`), na barra da
 * base depois dos primeiros 520px de rolagem (`StickyDonateBar`), na seção de
 * doação e no fechamento. O que não estava em lugar nenhum da campanha era o
 * convite para levá-la adiante - e é ele que traz gente que a campanha sozinha
 * não alcança.
 *
 * ── Três caminhos, na ordem do que funciona melhor ─────────────────────────
 * 1. `navigator.share`: a folha nativa do sistema, com WhatsApp, Instagram e
 *    o resto do aparelho já dentro. É o caminho de quase todo celular, que é
 *    de onde vem quase toda a visita desta campanha.
 * 2. Copiar o link, com o botão avisando "Link copiado!" por dois segundos -
 *    o desktop do Firefox, por exemplo, não tem a folha nativa.
 * 3. WhatsApp em aba nova, se até a área de transferência estiver barrada
 *    (acontece em `http://` e em navegador antigo). É o último recurso porque
 *    escolhe a rede pela pessoa - mas um botão que não faz nada é pior.
 *
 * `AbortError` não é erro: é a pessoa fechando a folha nativa. Nesse caso o
 * botão fica quieto, sem cair para o passo seguinte - copiar um link que ela
 * acabou de decidir não compartilhar seria desfazer a escolha dela.
 */
function ShareButton({ className }: { className?: string }) {
  const [copiado, setCopiado] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* O aviso some sozinho depois de 2s. O `clearTimeout` na saída existe para o
     caso de o componente ser desmontado antes disso (a navegação para as
     páginas legais, por exemplo). */
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const avisarCopiado = () => {
    setCopiado(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopiado(false), 2000);
  };

  const compartilhar = async () => {
    /* Sem `hash` nem `search`: o link que a pessoa manda tem que abrir a
       campanha no topo, e não na âncora em que ela parou de ler nem com os
       parâmetros de campanha (`utm_*`) de quem a trouxe até aqui colados. */
    const url = `${window.location.origin}${window.location.pathname}`;
    const texto =
      "O Caio leva ração, remédio e veterinário a mais de 400 animais em cinco abrigos. Dá uma olhada:";

    if (navigator.share) {
      try {
        await navigator.share({ title: "Caio Protetor", text: texto, url });
        return;
      } catch (erro) {
        if ((erro as Error)?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${texto} ${url}`);
      avisarCopiado();
    } catch {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  };

  return (
    /*
     * Só o ícone: a barra fixa tem 44px de altura e três peças disputando a
     * largura do celular (hambúrguer, logo e este botão), e o rótulo escrito
     * era o que apertava a marca no centro. O desenho de dois nós ligados já é
     * o símbolo de compartilhar em todo sistema.
     *
     * Sem texto na tela, o nome do botão passa a ser o `aria-label` - sem ele
     * o leitor de tela anuncia só "botão". O aviso de link copiado vira o
     * visto no lugar do ícone e um `sr-only` com `aria-live`, que é como quem
     * não vê a troca do desenho fica sabendo dela.
     */
    <button
      type="button"
      onClick={compartilhar}
      aria-label={copiado ? "Link copiado" : "Compartilhar a campanha"}
      title="Compartilhar a campanha"
      className={className}
    >
      {copiado ? <IconCheck size={18} /> : <IconShare size={18} />}
      <span className="sr-only" aria-live="polite">
        {copiado ? "Link copiado!" : ""}
      </span>
    </button>
  );
}

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
  { href: "#transparencia", label: "Transparência", icon: IconDollar },
  { href: "#atualizacoes", label: "Atualizações", icon: IconClock },
  { href: "#depoimentos", label: "Depoimentos", icon: IconUsers },
  { href: "#duvidas", label: "Dúvidas", icon: IconQuestion },
  { href: "#documentacao", label: "Canais e documentação", icon: IconFile },
];

export default function Menu() {
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
          ── O botão fixo da barra convida a **compartilhar** ────────────────
          Era o pedido da doação mensal, e ele saiu daqui: dinheiro a campanha
          já pede na dobra, na barra da base (`StickyDonateBar`), na seção de
          doação e no fechamento - e continua pedindo dentro desta gaveta, no
          botão verde logo abaixo. O que não existia em canto nenhum era o
          convite para levar a campanha adiante, que é o que traz gente nova.

          Redondo, só o ícone e com os mesmos 44px do hambúrguer do outro lado:
          as duas pontas da barra viram peças do mesmo tamanho e a logo fica
          com o centro inteiro. Em contorno, e não em cor cheia, porque
          compartilhar não disputa com doar. Ver `ShareButton` para os três
          caminhos que ele tenta (folha nativa, copiar o link, WhatsApp).
        */}
        <ShareButton className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center justify-self-end rounded-full border-2 border-ink-900/[.12] bg-surface text-ink-900 transition-colors hover:border-action hover:text-action" />
      </div>

    </header>
  );

  return (
    <>
      {/* #ui:menu */}
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
                    className="relative flex min-h-[50px] items-center gap-3 px-4 text-fs15 font-extrabold text-ink-900 transition-colors before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:scale-y-0 before:bg-action before:transition-transform hover:bg-surface-alt hover:before:scale-y-100 focus-visible:bg-surface-alt"
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
              {/* Com o botão da barra virando "compartilhar", este é o único
                  pedido de doação do cabeçalho - e ele pede **só** a mensal: a
                  tela abre travada na recorrência (`somenteMensal`), sem a aba
                  de doação única. Aqui o `MonthlyDonateButton` não serve: ele
                  não tem como também fechar a gaveta.

                  O rótulo gasta a palavra "todo mês" porque este botão tem a
                  largura da gaveta inteira, e quem abriu o menu parou para
                  escolher: vale prometer exatamente o que a próxima tela vai
                  oferecer. Quem quer doar uma vez tem o "Doar agora" da lista
                  logo acima, o do hero e o da barra da base.

                  É a mesma frase e a mesma pintura do botão que fecha a página
                  (`FinalCta`): vermelho de marca, maiúsculas e a patinha branca
                  (`IconPaw` - `fill="currentColor"` herda o branco de
                  `text-action-ink` sozinho). Dois pedidos iguais, com a mesma
                  cara, leem como o mesmo pedido; antes este era verde e dizia
                  outra coisa. Uma medida abaixo do outro (`text-fs14`) porque
                  a gaveta tem 340px no máximo, e a frase em maiúsculas não
                  pode quebrar linha. */}
              <a
                href={DOAR_HREF}
                onClick={(e) => {
                  setMenuOpen(false);
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
                    return;
                  e.preventDefault();
                  openDonationModal({ freq: "mensal", somenteMensal: true });
                }}
                className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-action px-5 text-fs14 font-extrabold uppercase tracking-[0.03em] text-action-ink shadow transition-colors hover:bg-action-hover"
              >
                <IconPaw size={18} />
                Quero ajudar todo mês
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
                <IconHome size={16} className="shrink-0 text-action" />
                CONHEÇA A SOS ANIMAL HELP
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
