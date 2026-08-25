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
import { DOAR_HREF } from "@/lib/config";
import { openDonationModal } from "@/lib/modais";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  07 · DOAR - o argumento e o pedido                                   ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Bloco isolado: o contraste ("sem apoio" × "com você"), o botão e os ícones
 * moram aqui. De fora entram só a âncora de doação e o gatilho do modal.
 */

/* ─────────────────────────────────────────────────── conteúdo do bloco ──── */

/** O bloco de doação: o argumento (o contraste) e o pedido, num botão só. */
const copyDoar = {
  eyebrow: "Como ajudar",
  title:
    "Cada doação é a diferença entre um animal ter ou não ter uma chance",
  /* Sem `lead`: a linha que ficava aqui ("O Caio não consegue fazer isso
     sozinho...") dizia em outras palavras o que os dois cards logo abaixo
     mostram item a item, e a frase que fecha a seção (`impactCompare.closing`)
     repetia a primeira metade dela. Menos texto entre o título e o pedido. */
  cta: "Quero ajudar agora",
  seal: "Doação segura · Pix na hora · CNPJ verificado",
};

/**
 * O contraste que dá urgência: o que acontece sem apoio, e o que muda com você.
 *
 * São os seis cards da seção "O impacto da sua doação" da campanha, divididos
 * nos dois lados que eles já formavam lá (três "sem", três "com").
 *
 * Sem `title` e sem `intro`: o cabeçalho próprio ("O impacto da sua doação") e
 * a frase de abertura viraram um segundo título dentro de uma seção que já tem
 * o seu, e o contraste dos dois cards é auto-explicativo - "Sem apoio" contra
 * "Com você", lado a lado, não precisa ser apresentado.
 */
const impactCompare = {
  withoutTitle: "Sem apoio",
  without: [
    "A ração acaba antes do fim do mês e os animais passam fome.",
    "Doenças avançam porque não há dinheiro para tratamento.",
    "Abrigos fecham as portas e os animais voltam para as ruas.",
  ],
  withTitle: "Com você",
  with: [
    "Nenhum animal dorme com fome ou sem cuidado.",
    "Tratamentos e cirurgias acontecem quando os animais mais precisam.",
    "Os abrigos ficam de pé e cada vida tem um lar.",
  ],
  closing:
    "Cada doação, por menor que seja, é a diferença entre um animal ter ou não ter uma chance. O Caio não consegue fazer isso sozinho.",
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

const IconCheck = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m5 13 4 4L19 7" />
  </svg>
);

const IconClose = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const IconHeart = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8Z" />
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
 * O botão "Quero doar" genérico: abre direto a tela de valor (`DonationModal`).
 *
 * É um `<a href="#racao">` de verdade: sem JavaScript o link leva ao bloco de
 * doação da página, que explica o que acontece e traz os canais da equipe.
 * Existe como componente próprio para que as seções que o usam continuem sendo
 * Server Components; a aparência vem toda de `className`.
 */
function DonateMenuButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={DOAR_HREF}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        openDonationModal();
      }}
      className={className}
    >
      {children}
    </a>
  );
}

/* ──────────────────────────────────────────────────────────── o bloco ──── */

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  "Como ajudar" - o argumento e o pedido, numa seção só                ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * O argumento e o pedido no mesmo bloco, nesta ordem de leitura:
 *
 *   o pedido → o que acontece sem apoio → o que muda com você → o botão
 *
 * É o contraste da seção "O impacto da sua doação" da campanha, com os mesmos
 * seis itens divididos nos dois lados que eles já formavam lá. O vermelho vem
 * primeiro (é o estado atual) e o verde depois, na mesma cor do botão de doar:
 * a pessoa associa a saída à ação sem a página explicar.
 *
 * É **um botão só**, no fim, logo depois da frase que fecha o argumento ("Cada
 * doação, por menor que seja, é a diferença entre um animal ter ou não ter uma
 * chance"). Ele abre a tela de valor (`DonationModal`) direto, sem passar por
 * um menu de "onde ajudar" antes.
 *
 * O id é `doar` porque é o destino de `DOAR_HREF` - cabeçalho, hero, rodapé,
 * fechamento e o checkout sem JavaScript apontam todos para cá.
 */
export default function Doar() {
  return (
    <section id="doar" className="relative overflow-hidden py-[clamp(2.5rem,6vh,4.5rem)]">
      {/* #ui:doar */}
      {/* Foto de fundo bem apagada: dá matéria à seção sem competir com o
          conteúdo, que é o que interessa aqui. */}
      <div aria-hidden="true" className="absolute inset-0">
        <Image
          src="/caio/historia/caio-4.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-surface/92" />
      </div>

      <div className="container-narrow relative flex max-w-[660px] flex-col gap-[clamp(1.5rem,4vh,2.25rem)]">
        <SectionHead eyebrow={copyDoar.eyebrow} title={copyDoar.title} />

        {/* ── O contraste ──────────────────────────────────────────────
            Sem cabeçalho próprio: o título e a frase de abertura que abriam
            este bloco ("O impacto da sua doação" + o parágrafo da porção
            inteira) saíram - o `h2` da seção já está logo acima, e os dois
            cards dizem sozinhos o que dizem.

            Os dois cards, exatamente como eram: duas colunas lado a lado no
            desktop e empilhadas no celular, em vez de uma lista corrida de
            oito itens - o contraste é o argumento, e ele só existe se os dois
            lados forem lidos como blocos opostos.

            O vermelho vem primeiro (é o estado atual) e o verde depois, na
            mesma cor do botão de doar: a pessoa associa a saída à ação sem a
            página explicar. */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Reveal className="flex h-full flex-col gap-3 rounded-md border border-ink-900/[.08] bg-ink-900/[.03] p-4">
            <h3 className="flex items-center justify-center gap-2 text-fs14 font-extrabold text-ink-900 sm:justify-start">
              <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-action text-action-ink">
                <IconClose size={14} />
              </span>
              {impactCompare.withoutTitle}
            </h3>
            {/* No celular o item é uma frase centralizada e o ponto some: um
                marcador à esquerda de texto centralizado fica boiando fora da
                coluna. A partir de `sm` ele volta, e a lista lê como lista. */}
            <ul className="flex flex-col gap-2">
              {impactCompare.without.map((text) => (
                <li
                  key={text}
                  className="flex justify-center gap-2 text-center text-fs14 leading-[1.5] text-ink-600 sm:justify-start sm:text-left"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[7px] hidden h-1.5 w-1.5 shrink-0 rounded-full bg-action/60 sm:block"
                  />
                  {text}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal
            delay={1}
            className="flex h-full flex-col gap-3 rounded-md border border-donate/25 bg-donate/[.07] p-4"
          >
            <h3 className="flex items-center justify-center gap-2 text-fs14 font-extrabold text-ink-900 sm:justify-start">
              <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-donate text-donate-ink">
                <IconCheck size={14} />
              </span>
              {impactCompare.withTitle}
            </h3>
            <ul className="flex flex-col gap-2">
              {impactCompare.with.map((text) => (
                <li
                  key={text}
                  className="flex justify-center gap-2 text-center text-fs14 leading-[1.5] text-ink-600 sm:justify-start sm:text-left"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[7px] hidden h-1.5 w-1.5 shrink-0 rounded-full bg-donate/70 sm:block"
                  />
                  {text}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* A frase que fecha o argumento, e logo abaixo o único botão da
            seção. Juntos de propósito: é a frase que dá sentido ao clique. */}
        <Reveal delay={2} className="flex flex-col items-center gap-4 text-center">
          <p className="max-w-[62ch] text-fs15 font-semibold leading-[1.6] text-ink-900">
            {impactCompare.closing}
          </p>

          {/* `px-5` no celular: o rótulo nunca quebra linha (`whitespace-nowrap`),
              então o respiro lateral é o que decide se ele cabe numa tela de
              320px - com `px-8` fixo, "Quero ajudar agora" em maiúsculas
              estourava a largura em vez de descer para a segunda linha. */}
          <DonateMenuButton className="inline-flex min-h-[60px] w-full items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-donate px-5 text-[clamp(0.93rem,0.883rem+0.279vw,1.046rem)] font-extrabold uppercase tracking-[0.03em] text-donate-ink shadow-[0_12px_34px_-10px_rgba(27,138,75,.6)] transition-colors hover:bg-donate-hover sm:px-8">
            <IconHeart size={20} fill="currentColor" stroke="none" />
            {copyDoar.cta}
          </DonateMenuButton>

          {/* Linha de confiança, não um segundo CTA: é a última objeção
              ("é seguro?") respondida no ponto em que ela aparece. */}
          <p className="flex flex-wrap items-center justify-center gap-x-1.5 text-center text-fs12 font-semibold text-ink-600">
            <IconShield size={14} className="shrink-0 text-donate" />
            {copyDoar.seal}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
