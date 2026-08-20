"use client";

import NextImage, { type ImageProps } from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
  type SVGProps,
} from "react";
import { withBasePath } from "@/lib/base-path";
import { cnpjDocument, org, whatsappHref } from "@/lib/config";
import { openDocumentoModal } from "@/lib/modais";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  12 · DOCUMENTAÇÃO - quem está por trás da campanha                   ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Bloco isolado: o cartão do documento, os canais e os ícones moram aqui.
 *
 * ⚠️ CNPJ, e-mail, endereço e WhatsApp **não** descem para cá: eles vêm de
 * `lib/config`, e são os mesmos que as páginas legais e o checkout publicam.
 * Uma cópia aqui seria um CNPJ que um dia não bate com o do recibo.
 */

/* ─────────────────────────────────────────────────── conteúdo do bloco ──── */

const copyDocumentacao = {
  eyebrow: "Documentação",
  title: "Antes de doar, confira quem está por trás da campanha",
  lead: "Transparência também significa facilitar o acesso às informações da organização que recebe as doações.",
};

/**
 * Avaliação do Google - DESATIVADA porque não há dado confirmado.
 *
 * Exibir nota e número de avaliações inventados numa página de doação é enganar
 * quem doa, então o card não é renderizado enquanto `enabled` for `false`.
 */
const googleReviews = {
  enabled: false,
  rating: 0,
  reviewCount: 0,
  href: "",
};

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

const IconFile = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v5h5" />
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

const IconStar = ({ size = 20, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable={false}
    {...rest}
  >
    <path d="m12 2.6 2.9 6.2 6.7.7-5 4.6 1.4 6.7L12 17.7 5.9 20.8l1.4-6.7-5-4.6 6.7-.7L12 2.6Z" />
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
 * Revelação ao entrar na viewport. Sem biblioteca: IntersectionObserver +
 * uma classe CSS. Dispara uma vez e desconecta.
 *
 * O estado começa em `false` nos dois lados - servidor e cliente. Já esteve
 * começando em `typeof IntersectionObserver === 'undefined'`, que no servidor
 * dá `true` e no navegador dá `false`: o HTML saía com `data-visible="true"` e
 * a hidratação reclamava do atributo que não batia. Como o React não corrige
 * atributo divergente, o elemento ficava preso no estado "já revelado" e a
 * animação inteira não acontecia.
 *
 * Quem cobre o caso de JavaScript desligado é o `<noscript>` do layout, que
 * força `.reveal` a ficar visível - a lógica de exibir sem JS é do CSS, não
 * deste componente.
 */
function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
  id,
  style,
}: {
  children: ReactNode;
  delay?: 0 | 1 | 2 | 3;
  as?: "div" | "section" | "li" | "article";
  className?: string;
  id?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Navegador sem IntersectionObserver: mostra tudo. A escrita é direta no
    // DOM, e não `setVisible`, porque chamar setState no corpo do efeito
    // dispara uma renderização em cascata (e a regra de lint que a proíbe).
    if (typeof IntersectionObserver === "undefined") {
      node.dataset.visible = "true";
      return;
    }

    /*
     * Já dentro da primeira tela quando a página carrega: revela na hora, sem
     * passar pelo observer.
     *
     * O `rootMargin` abaixo tira 12% da borda de baixo da área de detecção
     * para o bloco só acender quando já entrou de verdade na tela - o que é o
     * comportamento certo para quem está rolando, e o errado para quem acabou
     * de chegar. Numa janela de 800px, esses 12% viram uma faixa morta de
     * 96px: o botão de doar do hero caía dentro dela, nunca intersectava, e
     * ficava em `opacity: 0` até a pessoa rolar - numa dobra em que ele já
     * estava visível o tempo todo, só que transparente.
     *
     * A comparação é com `window.innerHeight` puro, sem a margem, porque a
     * pergunta aqui é outra: não é "já entrou o bastante ao rolar?", é "está
     * na tela agora?".
     */
    if (node.getBoundingClientRect().top < window.innerHeight) {
      node.dataset.visible = "true";
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const delayClass = delay ? `reveal-delay-${delay}` : "";

  return (
    <Tag
      // @ts-expect-error: ref polimórfico entre div/section/li/article
      ref={ref}
      id={id}
      style={style}
      data-visible={visible}
      className={`reveal ${delayClass} ${className}`}
    >
      {children}
    </Tag>
  );
}

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

/**
 * Cabeça de seção: eyebrow, título e linha de apoio.
 *
 * ── O padrão da página é sem ícone e centralizado ─────────────────────────
 * O ícone em quadrado colorido e o alinhamento à esquerda saíram de todas as
 * seções: o ícone não dizia nada que o título já não dissesse e, alinhado à
 * esquerda, empurrava o texto criando uma margem diferente da do conteúdo logo
 * abaixo. Uma página com dez seções alinhadas do mesmo jeito lê como uma coisa
 * só. Por isso os defaults são estes - quem não passa nada recebe o padrão.
 *
 * `icon` e `align` existem para a exceção: hoje só a seção de transparência,
 * que reproduz o layout da v1 (ícone de barras + título à esquerda, sobre a
 * tabela de custos). Antes de usar em outra seção, vale lembrar que cada uso
 * é uma cabeça a menos alinhada com o resto da página.
 *
 * O conteúdo *abaixo* da cabeça continua livre para alinhar como fizer
 * sentido - e a maioria alinha à esquerda a partir de `sm`.
 */
function SectionHead({
  icon: Icon,
  eyebrow,
  title,
  lead,
  align = "center",
  className = "",
}: {
  icon?: IconComponent;
  eyebrow?: string;
  title: ReactNode;
  lead?: string;
  align?: "left" | "center";
  className?: string;
}) {
  const centered = align === "center";

  return (
    <Reveal
      className={`flex flex-col gap-3 ${centered ? "items-center text-center" : ""} ${className}`}
    >
      {/* Centralizado, o ícone fica acima do título (coluna); à esquerda, ele
          fica ao lado (linha) - é o que o layout da v1 desenha. */}
      <div className={`flex gap-3 ${centered ? "flex-col items-center" : "items-center"}`}>
        {Icon && (
          <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-sm bg-accent-soft text-accent">
            <Icon size={22} />
          </span>
        )}

        <div className={`flex flex-col gap-1 ${centered ? "items-center" : ""}`}>
          {eyebrow && (
            <p className="text-fs13 font-extrabold uppercase tracking-[0.12em] text-accent">
              {eyebrow}
            </p>
          )}
          <h2 className="text-[clamp(1.279rem,0.977rem+1.209vw,1.976rem)] font-extrabold leading-[1.15] text-ink-900">
            {title}
          </h2>
        </div>
      </div>

      {lead && (
        <p
          className={`max-w-[62ch] text-fs16 leading-[1.6] text-ink-600 ${centered ? "mx-auto" : ""}`}
        >
          {lead}
        </p>
      )}
    </Reveal>
  );
}

/**
 * Cartão CNPJ: o documento em si, não só o número.
 *
 * Client component só por causa do popup - sem JavaScript o `<a>` continua
 * levando à imagem sozinha (`withBasePath(cnpjDocument.src)`), que é o
 * comportamento de antes.
 */
function DocumentoCard() {
  return (
    <div className="relative overflow-hidden rounded-md border border-ink-900/10 bg-surface shadow">
      <div className="flex flex-col items-center gap-3 border-b border-ink-900/[.07] p-4 text-center sm:items-start sm:text-left">
        <div className="flex flex-col">
          <span className="text-fs14 font-extrabold text-ink-900">{cnpjDocument.title}</span>
          <span className="text-fs12 text-ink-600">{cnpjDocument.subtitle}</span>
          <span className="mt-1 text-fs13 font-semibold tabular-nums text-ink-900">
            CNPJ {org.cnpj}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => openDocumentoModal()}
        aria-label="Ver documento do cartão CNPJ"
        className="relative block aspect-[16/11] w-full overflow-hidden bg-surface"
      >
        <Image
          src={cnpjDocument.src}
          alt={cnpjDocument.alt}
          fill
          sizes="(min-width: 640px) 620px, 92vw"
          className="object-cover object-top"
        />
      </button>

      <a
        href={withBasePath(cnpjDocument.src)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          openDocumentoModal();
        }}
        className="flex min-h-[48px] items-center justify-center gap-2 border-t border-ink-900/10 px-4 text-fs13 font-extrabold text-accent transition-colors hover:bg-surface-alt sm:justify-start"
      >
        <IconFile size={15} />
        Ver documento
      </a>

      <a
        href={withBasePath(cnpjDocument.src)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          openDocumentoModal();
        }}
        aria-label="Ver documento do cartão CNPJ"
        className="absolute inset-0 z-10 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── o bloco ──── */

/**
 * Documentação e canais oficiais.
 *
 * O card de avaliação do Google só aparece quando `googleReviews.enabled` for
 * `true` - enquanto não houver nota e número confirmados, ele fica fora da
 * interface. Publicar avaliação inventada numa página de doação é enganar quem
 * doa, e não é algo que se conserta depois.
 */
export default function Documentacao() {
  return (
    <section id="documentacao" className="surface-alt py-[clamp(2.5rem,6vh,4.5rem)]">
      {/* #ui:documentacao */}
      <div className="container-narrow flex max-w-[660px] flex-col gap-5">
        <SectionHead
          eyebrow={copyDocumentacao.eyebrow}
          title={copyDocumentacao.title}
          lead={copyDocumentacao.lead}
        />

        {/* Cartão CNPJ: o documento em si, não só o número.
            O arquivo é a página A4 inteira (1600×2264) e mais de um terço dela
            embaixo é papel em branco - a moldura recorta a faixa útil e ancora
            no topo, onde estão o brasão, o número e a razão social. Abre num
            popup por cima da página (`DocumentoModal`), não numa aba nova -
            ver `DocumentoCard`. */}
        <Reveal>
          <DocumentoCard />
        </Reveal>

        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-full flex-col items-center gap-1 rounded-md border border-ink-900/10 bg-surface p-4 text-center shadow transition-colors hover:border-donate/50 sm:items-start sm:text-left"
          >
            <span className="flex items-center gap-2 text-fs12 font-extrabold uppercase tracking-[0.06em] text-accent">
              <IconWhatsApp size={16} />
              WhatsApp
            </span>
            <span className="text-fs14 font-semibold text-ink-900">{org.whatsappDisplay}</span>
            <span className="text-fs12 leading-[1.4] text-ink-600">
              Fale diretamente com nossa equipe.
            </span>
            <span className="mt-auto pt-2 text-fs13 font-extrabold text-donate-text">
              Falar no WhatsApp
            </span>
          </a>

          <a
            href={`mailto:${org.email}`}
            className="flex h-full flex-col items-center gap-1 rounded-md border border-ink-900/10 bg-surface p-4 text-center shadow transition-colors hover:border-donate/50 sm:items-start sm:text-left"
          >
            <span className="flex items-center gap-2 text-fs12 font-extrabold uppercase tracking-[0.06em] text-accent">
              <IconMail size={16} />
              E-mail
            </span>
            {/* `break-words` e não `break-all`: só quebra quando não cabe, e no
                lugar certo. */}
            <span className="break-words text-fs13 font-semibold leading-[1.35] text-ink-900">
              {org.email}
            </span>
            <span className="text-fs12 leading-[1.4] text-ink-600">
              Dúvidas, informações e prestação de contas.
            </span>
            {/* O card inteiro já é o `mailto:`, mas sem esta linha ele era o
                único dos três sem chamada visível - só o endereço escrito,
                que se lê como informação e não como "clique aqui". `span`, e
                não `button`: um botão de verdade dentro do link seria
                interativo dentro de interativo. */}
            <span className="mt-auto flex items-center gap-1.5 pt-2 text-fs13 font-extrabold text-donate-text">
              <IconMail size={15} className="shrink-0" />
              Enviar e-mail
            </span>
          </a>

          <a
            href={org.mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-full flex-col items-center gap-1 rounded-md border border-ink-900/10 bg-surface p-4 text-center shadow transition-colors hover:border-donate/50 sm:items-start sm:text-left sm:col-span-2"
          >
            <span className="flex items-center gap-2 text-fs12 font-extrabold uppercase tracking-[0.06em] text-accent">
              <IconPin size={16} />
              Endereço
            </span>
            <address className="text-fs14 not-italic leading-[1.5] text-ink-900">
              {org.address.line1}
              <br />
              {org.address.line2}, {org.address.city} · {org.address.zip}
            </address>
            <span className="mt-auto pt-2 text-fs13 font-extrabold text-donate-text">
              Ver localização
            </span>
          </a>

          {/* Só entra quando houver dado real - ver `googleReviews`. */}
          {googleReviews.enabled && (
            <a
              href={googleReviews.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full flex-col items-center gap-1 rounded-md border border-ink-900/10 bg-surface p-4 text-center shadow transition-colors hover:border-donate/50 sm:items-start sm:text-left sm:col-span-2"
            >
              <span className="flex items-center gap-2 text-fs12 font-extrabold uppercase tracking-[0.06em] text-accent">
                <IconStar size={16} />
                Avaliação no Google
              </span>
              <span className="text-fs14 font-semibold text-ink-900">
                {googleReviews.rating.toFixed(1)} · {googleReviews.reviewCount} avaliações
              </span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
