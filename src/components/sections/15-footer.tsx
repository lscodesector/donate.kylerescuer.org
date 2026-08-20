"use client";

import NextImage, { type ImageProps } from "next/image";
import Link from "next/link";
import { type ReactNode, type SVGProps } from "react";
import { withBasePath } from "@/lib/base-path";
import { DOAR_HREF, org, showPixSection, whatsappHref } from "@/lib/config";
import { openDonationModal, type DonationIntent } from "@/lib/modais";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  15 · FOOTER - rodapé, links e selos                                  ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Bloco isolado: o texto da marca, os quatro grupos de links, as redes e os
 * ícones moram aqui. De fora vêm os dados da organização (`lib/config`), que
 * o rodapé publica com o mesmo CNPJ das páginas legais e do recibo.
 */

/* ─────────────────────────────────────────────────── conteúdo do bloco ──── */

const copyFooterAbout =
  "Resgatando vidas em SP, ES, MG e BA com o apoio da SOS Animal Help e de pessoas como você. São 400+ animais que dependem de cada doação.";

/**
 * Os abrigos, **só nome e link** - a lista do rodapé.
 *
 * ⚠️ É uma segunda cópia: a lista de verdade, com fotos, endereço, CNPJ e
 * ficha, é conteúdo do bloco 05 (`sections/05-abrigos.tsx`). O rodapé não a
 * importa porque bloco não importa bloco - então **abrigo novo entra nos dois
 * arquivos**, e abrigo que sai também. Se as duas listas divergirem, o rodapé
 * é quem fica publicando link para abrigo que a página não mostra mais.
 *
 * Cada um aponta para o site próprio quando tem um, e para o Instagram quando
 * não tem. Quem não tem nenhum dos dois fica de fora em vez de virar link
 * morto - é o caso do Abrigo Dona Rose, que a campanha não publica.
 */
const ABRIGOS_LINKS = [
  { label: "Siulsan Resgate", href: "https://siulsanresgate.org/" },
  { label: "SOS Joana Darc", href: "https://sosjoanadarc.org/" },
  { label: "Abrigo Salve Cão", href: "https://salvecaoabrigo.org/" },
  { label: "Casa da Mili", href: "https://www.instagram.com/milenaefernanda.ong/" },
];

/* ─────────────────────────────────────────────────────────── ícones ──── */

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

const IconFacebook = ({ size = 20, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable={false}
    {...rest}
  >
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
  </svg>
);

const IconInstagram = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="3.8" />
    <path d="M17.2 6.8h.01" />
  </svg>
);

const IconMail = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="2.8" y="5" width="18.4" height="14" rx="2" />
    <path d="m3.4 6.6 8.6 6 8.6-6" />
  </svg>
);

const IconPin = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconShield = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const IconWhatsApp = ({ size = 28, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable={false}
    {...rest}
  >
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.65-1.24-1.46-1.38-1.71-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.14.17-.24.25-.41.09-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.23.24-.86.84-.86 2.05s.88 2.38 1 2.54c.13.17 1.74 2.66 4.21 3.73.59.25 1.05.4 1.4.52.59.19 1.13.16 1.55.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
  </svg>
);

/* ────────────────────────────────────────────── utilitários do bloco ──── */

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
 * Botão que abre o modal de doação **mensal**, e só ela.
 *
 * É o CTA que pula o menu de frentes: todo o resto (cabeçalho, hero, abrigos,
 * impacto, fechamento) aponta para `DOAR_HREF` e passa pelo "escolha onde
 * ajudar". Este já sabe a resposta da outra pergunta - a frequência.
 *
 * ── Mensal do rótulo ao Pix ───────────────────────────────────────────────
 * `somenteMensal` trava a tela que ele abre: sem as abas de frequência, com a
 * escada da mensal e terminando no checkout de recorrência. Antes ele só
 * *marcava* a aba mensal, e a doação única ficava a um toque - um botão escrito
 * "quero doar todo mês" que abre uma tela oferecendo outra coisa é o tipo de
 * desencontro que faz a pessoa desistir no meio. Quem quer doar uma vez tem os
 * botões de "doar agora" espalhados pela página inteira.
 *
 * Existe como componente próprio para que a seção que o usa continue sendo
 * Server Component: só este botão vira cliente, e não a seção inteira. A
 * aparência vem toda de `className` - aqui não há estilo próprio de propósito.
 */
function MonthlyDonateButton({
  className,
  children,
  /** A frente que a doação recorrente vai financiar. Sem ela, é a rede toda. */
  causeId,
}: {
  className?: string;
  children: ReactNode;
  causeId?: DonationIntent["causeId"];
}) {
  return (
    <button
      type="button"
      onClick={() =>
        openDonationModal({ causeId, freq: "mensal", somenteMensal: true })
      }
      className={className}
    >
      {children}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────── o bloco ──── */

/**
 * Os quatro grupos de links, na ordem em que entram na grade 2×2 da direita:
 *
 *   Ajude (3)            │ Abrigos (até 5)
 *   Campanha (2)         │ Legal (3)
 *
 * A ordem é escolhida para as linhas fecharem parelhas: os dois grupos altos
 * em cima, os dois curtos embaixo. Invertendo qualquer par, uma coluna fica com
 * um buraco no meio.
 */
const COLUMNS = [
  {
    label: "Ajude",
    links: [
      { label: "Doar agora", href: DOAR_HREF },
      /*
       * "Doar todo mês" é o único item destas listas que **não** é link: não há
       * âncora de recorrência na página (a decisão "de quanto em quanto tempo"
       * acontece no modal), então ele abre a tela de valor travada na mensal -
       * o mesmo destino do botão da barra fixa e do fechamento da página. Ver
       * `MonthlyDonateButton`.
       */
      { label: "Doar todo mês", action: "mensal" as const },
      /* Só entra se a seção existir: com `showPixSection` em `false` a âncora
         `#pix` não é renderizada e o link levaria a lugar nenhum. */
      ...(showPixSection ? [{ label: "Doar via Pix", href: "#pix" }] : []),
    ],
  },
  {
    label: "Abrigos",
    /* A lista, e o aviso sobre ela ser uma segunda cópia, estão em
       `ABRIGOS_LINKS`, no topo deste arquivo. */
    links: ABRIGOS_LINKS,
  },
  {
    label: "Campanha",
    links: [
      { label: "Transparência", href: "#transparencia" },
      { label: "Atualizações", href: "#atualizacoes" },
      { label: "Contato", href: "#documentacao" },
    ],
  },
  {
    label: "Legal",
    /* As três políticas ficam no site institucional da campanha
       (`caioprotetor.org`), não aqui: este projeto é só a página de doação. */
    links: org.policies,
  },
];

/** As redes da campanha - todas com perfil publicado e conferido. */
const SOCIALS = [
  { label: "Instagram", href: org.instagramHref, Icon: IconInstagram },
  { label: "Facebook", href: org.facebookHref, Icon: IconFacebook },
  { label: "WhatsApp", href: whatsappHref, Icon: IconWhatsApp },
];

/**
 * Rodapé em duas colunas: marca à esquerda, links à direita.
 *
 * ── O que estava quebrado ─────────────────────────────────────────────────
 * Não eram duas colunas, eram cinco. A grade externa era
 * `[minmax(0,320px)_1fr]` e a interna abria em `lg:grid-cols-4`, então em
 * 1024px o `1fr` que sobrava era dividido por quatro: ~110px por coluna, com
 * "Política de Privacidade" quebrando em três linhas. Em `md` era pior - o
 * mesmo `1fr` valia ~336px e ainda segurava duas colunas.
 *
 * O segundo problema era de alinhamento. O bloco da marca centralizava até
 * `md` e os links até `sm`: entre 640px e 768px um estava centralizado e o
 * outro à esquerda, na mesma linha. O rodapé de copyright virava em `md`, um
 * terceiro ponto de virada. Agora tudo troca em `sm`, de uma vez só.
 *
 * ── Como fica ─────────────────────────────────────────────────────────────
 *   celular    tudo empilhado, **tudo alinhado à esquerda**
 *   sm  640px  os links abrem em 2 subcolunas
 *   md  768px  as duas colunas de verdade - marca | links
 *
 * A divisão é meio a meio (`md:grid-cols-2`), o que dá ~456px por coluna no
 * container de 1040px: espaço de sobra para o texto da marca (42ch) e para os
 * links caberem numa linha cada.
 *
 * ── Por que nada centraliza mais ──────────────────────────────────────────
 * No celular, marca, texto, contato e copyright centralizavam e os quatro
 * grupos de links não - o rodapé tinha dois eixos ao mesmo tempo, e o olho
 * batia na quebra na metade dele. Agora existe uma margem esquerda só, do
 * logo até o copyright, em qualquer largura. É também o que casa com o resto
 * da página: as listas e as fichas já leem alinhadas à esquerda.
 */
export default function Footer() {
  return (
    /* `pb` reservado para a barra fixa de doação, que fica ancorada no rodapé
       da janela e cobriria as últimas linhas daqui. Encolheu quando o botão
       flutuante do WhatsApp saiu da página: a folga era para os dois. */
    <footer id="contato" className="bg-graphite pb-[112px] text-white md:pb-[96px]">
      {/* #ui:footer */}
      <div aria-hidden="true" className="h-[3px] w-full bg-action" />

      <div className="container-narrow flex flex-col gap-12 pt-16">
        <div className="grid gap-12 text-left md:grid-cols-2 md:gap-16">
          {/* Coluna 1 - marca, o que a organização é e como falar com ela. */}
          <div className="flex flex-col items-start gap-6">
            <Image
              src="/caio/logo-caio.webp"
              alt={org.name}
              width={160}
              height={160}
              className="h-[72px] w-auto object-contain"
            />

            <p className="max-w-[42ch] text-fs15 leading-[1.65] text-white/60">
              {copyFooterAbout}
            </p>

            {/*
              A barra de redes voltou.

              Ela tinha saído do rodapé do site institucional porque sobrava um
              ícone só, o do WhatsApp - barra de redes com um item lê como barra
              quebrada. A campanha do Caio tem os três perfis publicados, então
              agora ela tem o que uma barra precisa para existir.
            */}
            <ul className="flex items-center gap-3">
              {SOCIALS.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${org.name} no ${label}`}
                    className="flex h-[44px] w-[44px] items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/40 hover:text-white"
                  >
                    <Icon size={18} />
                  </a>
                </li>
              ))}
            </ul>

            <div className="flex flex-col items-start gap-2 text-fs14 text-white/60">
              {/* O CNPJ é o de quem **recebe** - a SOS Animal Help -, e é por
                  isso que o nome dela aparece escrito ao lado dele. O Caio é
                  protetor independente e não tem CNPJ próprio nesta campanha. */}
              <p className="flex items-center gap-2">
                <IconShield size={16} className="shrink-0" />
                <span>
                  {org.supporter} · CNPJ{" "}
                  <span className="tabular-nums">{org.cnpj}</span>
                </span>
              </p>

              <a
                href={`mailto:${org.email}`}
                className="flex min-h-[44px] items-center gap-2 transition-colors hover:text-white"
              >
                <IconMail size={16} className="shrink-0" />
                <span className="break-all">{org.email}</span>
              </a>

              <address className="flex items-start gap-2 not-italic leading-[1.5]">
                <IconPin size={16} className="mt-0.5 shrink-0" />
                <span>
                  {org.address.line1} - {org.address.line2}, {org.address.city}
                </span>
              </address>
            </div>
          </div>

          {/* Coluna 2 - os quatro grupos de links, em grade 2×2.
              `content-start` para os grupos encostarem no topo da célula: sem
              ele o grupo curto de uma linha fica flutuando no meio da altura
              que o grupo alto ao lado criou. */}
          <div className="grid content-start gap-8 sm:grid-cols-2 sm:gap-x-6">
            {COLUMNS.map((column) => (
              <nav key={column.label} aria-label={column.label}>
                <p className="mb-4 text-fs12 font-extrabold uppercase tracking-[0.14em] text-white">
                  {column.label}
                </p>
                <ul className="flex flex-col gap-2">
                  {column.links.map((link) => {
                    const estilo =
                      "block py-1 text-left text-fs15 leading-[1.4] text-white/65 transition-colors hover:text-white";

                    /* O item que abre modal em vez de navegar - hoje só o
                       "Doar todo mês" (ver o comentário em `COLUMNS`). */
                    if ("action" in link) {
                      return (
                        <li key={link.label}>
                          <MonthlyDonateButton className={estilo}>
                            {link.label}
                          </MonthlyDonateButton>
                        </li>
                      );
                    }

                    /* Os abrigos apontam para o Instagram de cada um, que é
                       outro site: eles precisam abrir em aba nova e com `rel`,
                       ao contrário das âncoras internas. */
                    const external = link.href.startsWith("http");
                    return (
                      <li key={link.href + link.label}>
                        <Link
                          href={link.href}
                          {...(external
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                          className={estilo}
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* À esquerda em qualquer largura, como o resto do rodapé. */}
        <div className="border-t border-white/10 pt-6 text-left text-fs13 leading-[1.6] text-white/50">
          {/* Os links legais já estão na coluna "Legal" - repetir aqui só
              duplicaria o mesmo destino duas vezes na mesma tela. */}
          <p>
            © {new Date().getFullYear()} {org.name}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
