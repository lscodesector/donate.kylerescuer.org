"use client";

import NextImage, { type ImageProps } from "next/image";
import Link from "next/link";
import { type ReactNode, type SVGProps } from "react";
import { withBasePath } from "@/lib/base-path";
import { DOAR_HREF, org } from "@/lib/config";
import {
  useShelterEmail,
  useShelterFacebook,
  useShelterInstagram,
} from "@/lib/hooks/use-shelter-phone";
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
  "Bringing emergency veterinary help to SP, ES, MG and BA with the support of SOS Animal Help and of people like you. That is 500+ lives depending on vet visits, tests and medication.";

/**
 * Os abrigos, **só nome e link** - a lista do rodapé.
 *
 * ⚠️ É uma segunda cópia: a lista de verdade, com fotos, endereço, CNPJ e
 * ficha, é conteúdo do bloco 06 (`sections/06-abrigos.tsx`). O rodapé não a
 * importa porque bloco não importa bloco - então **abrigo novo entra nos dois
 * arquivos**, e abrigo que sai também. Se as duas listas divergirem, o rodapé
 * é quem fica publicando link para abrigo que a página não mostra mais.
 *
 * Cada um aponta para o site próprio quando tem um, e para o Instagram quando
 * não tem. Quem não tem nenhum dos dois fica de fora em vez de virar link
 * morto - é o caso do Rose's Shelter, que a campanha não publica.
 */
const ABRIGOS_LINKS = [
  { label: "Susan Pet Rescue", href: "https://siulsanresgate.org/" },
  { label: "SOS Joana Darc", href: "https://sosjoanadarc.org/" },
  { label: "Save Dog Shelter", href: "https://salvecaoabrigo.org/" },
  { label: "Millie Home", href: "https://www.instagram.com/milenaefernanda.ong/" },
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

/* ────────────────────────────────────────────── utilitários do bloco ──── */

/**
 * `next/image` com o `basePath` do build prefixado no `src`.
 *
 * ⚠️ Com `images.unoptimized: true` (obrigatório num export estático - ver
 * `next.config.ts`), o `next/image` passa o `src` adiante sem tocar nele. É
 * comportamento documentado: o prefixo de `basePath` só acontece na URL do
 * otimizador (`/_next/image?url=…`), e sem otimizador não há essa URL para
 * prefixar. Sem este envelope, publicado em `donate.kylerescuer.org/v2`, toda
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
    label: "Help",
    links: [
      { label: "Donate now", href: DOAR_HREF },
      /*
       * "Doar todo mês" é o único item destas listas que **não** é link: não há
       * âncora de recorrência na página (a decisão "de quanto em quanto tempo"
       * acontece no modal), então ele abre a tela de valor travada na mensal -
       * o mesmo destino do botão da barra fixa e do fechamento da página. Ver
       * `MonthlyDonateButton`.
       */
      { label: "Donate every month", action: "mensal" as const },
    ],
  },
  {
    label: "Shelters",
    /* A lista, e o aviso sobre ela ser uma segunda cópia, estão em
       `ABRIGOS_LINKS`, no topo deste arquivo. */
    links: ABRIGOS_LINKS,
  },
  {
    label: "Campaign",
    links: [
      { label: "Transparency", href: "#transparencia" },
      { label: "Updates", href: "#atualizacoes" },
      { label: "Contact", href: "#documentacao" },
    ],
  },
  {
    label: "Legal",
    /* As três políticas ficam no site institucional da campanha
       (`kylerescuer.org`), não aqui: este projeto é só a página de doação. */
    links: org.policies,
  },
];

/** As redes da campanha - todas com perfil publicado e conferido. */
const SOCIALS = [
  { label: "Instagram", href: org.instagramHref, Icon: IconInstagram },
  { label: "Facebook", href: org.facebookHref, Icon: IconFacebook },
  { label: "Email", href: `mailto:${org.email}`, Icon: IconMail },
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
  const instagramHref = useShelterInstagram();
  const facebookHref = useShelterFacebook();
  const email = useShelterEmail();
  /* WhatsApp, Instagram, Facebook e e-mail saem do abrigo em foco, não das
     constantes: os hooks moram em `lib/`, compartilhados com o rodapé da raiz.
     Portado de lá junto com o fix que tornou o Instagram dinâmico - este arquivo
     é uma cópia da campanha de remédios, então correção em
     `components/sections/15-footer` não chega aqui sozinha. Ver o comentário
     sobre o preço da duplicação em `app/urgencia-remedios/page.tsx`. */
  const socials = SOCIALS.map((social) => {
    if (social.label === "Email") {
      return { ...social, href: `mailto:${email}` };
    }
    if (social.label === "Instagram") {
      return { ...social, href: instagramHref };
    }
    if (social.label === "Facebook") {
      return { ...social, href: facebookHref };
    }
    return social;
  });

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
              quebrada. A campanha do Kyle tem os três perfis publicados, então
              agora ela tem o que uma barra precisa para existir.
            */}
            <ul className="flex items-center gap-3">
              {socials.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${org.name} on ${label}`}
                    className="flex h-[44px] w-[44px] items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/40 hover:text-white"
                  >
                    <Icon size={18} />
                  </a>
                </li>
              ))}
            </ul>

            <div className="flex flex-col items-start gap-2 text-fs14 text-white/60">
              {/* O CNPJ é o de quem **recebe** - a SOS Animal Help -, e é por
                  isso que o nome dela aparece escrito ao lado dele. O Kyle é
                  protetor independente e não tem CNPJ próprio nesta campanha. */}
              <p className="flex items-center gap-2">
                <IconShield size={16} className="shrink-0" />
                <span>
                  {org.supporter} · EIN{" "}
                  <span className="tabular-nums">{org.cnpj}</span>
                </span>
              </p>

              <a
                href={`mailto:${email}`}
                className="flex min-h-[44px] items-center gap-2 transition-colors hover:text-white"
              >
                <IconMail size={16} className="shrink-0" />
                <span className="break-all">{email}</span>
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
            © {new Date().getFullYear()} {org.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
