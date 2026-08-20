"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
  type SVGProps,
} from "react";
import { withBasePath } from "@/lib/base-path";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  11 · DEPOIMENTOS - quem recebe, falando por si                       ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Bloco isolado: os cinco vídeos, o carrossel, a cabeça de seção e os ícones
 * moram aqui. De fora entra só o `basePath` do build, porque `<video>` não
 * passa pelo `next/image` e o caminho precisa do prefixo na mão.
 */

/* ─────────────────────────────────────────────────── conteúdo do bloco ──── */

/** "Depoimentos" - os vídeos gravados pelos próprios abrigos. */
const copyDepoimentos = {
  eyebrow: "Depoimentos",
  title: "Quem recebe, falando por si",
  /* Sem `lead`: os cinco vídeos logo abaixo já mostram cinco protetores de
     cinco abrigos, cada um com nome e cidade na legenda. A linha só narrava
     em texto o que a fileira mostra em vídeo. */
};

/**
 * Depoimentos - os vídeos gravados pelos próprios protetores.
 *
 * Os arquivos foram baixados da campanha para `/public/caio/depoimentos/` (ver
 * o motivo em `historiaPhotos`). São ~52 MB somados, e é por isso que o
 * componente usa `preload="none"`: nenhum byte de vídeo é baixado antes de a
 * pessoa apertar o play - o que aparece na tela é o `poster`, que pesa ~30 KB.
 */
const depoimentos = [
  {
    id: "joana",
    src: "/caio/depoimentos/joana.mp4",
    poster: "/caio/depoimentos/joana.webp",
    name: "Joana",
    shelter: "SOS Joana Darc",
    detail: "200 animais · Santa Luzia, MG",
  },
  {
    id: "salvecao",
    src: "/caio/depoimentos/salvecao.mp4",
    poster: "/caio/depoimentos/salvecao.webp",
    name: "Andrezza",
    shelter: "Abrigo Salve Cão",
    detail: "92 animais · Floresta Azul, BA",
  },
  {
    id: "milena",
    src: "/caio/depoimentos/milena.mp4",
    poster: "/caio/depoimentos/milena.webp",
    name: "Milena",
    shelter: "Casa da Mili",
    detail: "74 animais · Tambaú, SP",
  },
  {
    id: "siulsan",
    src: "/caio/depoimentos/siulsan.mp4",
    poster: "/caio/depoimentos/siulsan.webp",
    name: "Siulsan",
    shelter: "Siulsan Resgate",
    detail: "53 cães · Tatuí, SP",
  },
  {
    id: "rose",
    src: "/caio/depoimentos/rose.mp4",
    poster: "/caio/depoimentos/rose.webp",
    name: "Rose",
    shelter: "Abrigo Dona Rose",
    detail: "95 animais · Serra, ES",
  },
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

const IconArrowLeft = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </svg>
);

const IconArrowRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
    <path d="m13 5 7 7-7 7" />
  </svg>
);

const IconPlay = ({ size = 20, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable={false}
    {...rest}
  >
    <path d="M8.4 5.6a1 1 0 0 1 1.52-.85l8.2 5.1a1.2 1.2 0 0 1 0 2.04l-8.2 5.1a1 1 0 0 1-1.52-.85V5.6Z" />
  </svg>
);

/* ────────────────────────────────────────────── utilitários do bloco ──── */

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
 * Fileira de cards que rola na horizontal, com setas de navegação.
 *
 * A rolagem em si continua sendo do navegador (`overflow-x` + `scroll-snap`),
 * não do JavaScript: arrasto, roda do mouse, teclado e leitor de tela seguem
 * funcionando exatamente como funcionavam, e sem JavaScript a fileira continua
 * rolável - o que some são só as setas, que são atalho, não a única saída.
 *
 * Este componente é cliente para que a seção que o usa não precise ser: ela
 * passa os `<li>` já renderizados no servidor como `children`.
 *
 * ── Sobre o passo ─────────────────────────────────────────────────────────
 * Cada clique anda a largura de **um card**, lida do DOM (primeiro filho +
 * `column-gap`) em vez de fixada num número. Os cards mudam de largura no
 * `sm`, e um passo fixo erraria o alvo em uma das duas larguras - com o
 * `scroll-snap` no meio, o erro vira um card meio cortado na borda.
 *
 * ── Sobre as setas ────────────────────────────────────────────────────────
 * Elas desligam sozinhas nas pontas e o par inteiro some quando não há o que
 * rolar (poucos cards numa tela larga). Seta acesa que não leva a lugar nenhum
 * é pior do que seta nenhuma.
 */
function CardsCarousel({
  children,
  label,
  className = "",
}: {
  children: ReactNode;
  /** Nome da fileira para leitores de tela - vai nos rótulos das setas. */
  label: string;
  /** Classes do trilho (largura, padding, sangria). */
  className?: string;
}) {
  const trilho = useRef<HTMLUListElement>(null);
  // `transbordou` começa `true` para o par de setas já sair no HTML do
  // servidor: a lista que usa isto tem dez cards e sempre transborda, e
  // começar em `false` faria as setas aparecerem depois, empurrando o
  // conteúdo abaixo delas.
  const [nav, setNav] = useState({ voltar: false, avancar: true, transbordou: true });

  const medir = useCallback(() => {
    const el = trilho.current;
    if (!el) return;
    const fim = el.scrollWidth - el.clientWidth;
    setNav({
      // 1px de tolerância: com zoom ou larguras fracionárias o `scrollLeft`
      // para a meio pixel do fim, e a seta ficaria acesa sem ter para onde ir.
      voltar: el.scrollLeft > 1,
      avancar: el.scrollLeft < fim - 1,
      transbordou: fim > 1,
    });
  }, []);

  useEffect(() => {
    const el = trilho.current;
    if (!el) return;

    medir();
    el.addEventListener("scroll", medir, { passive: true });

    // O trilho muda de largura sem a janela mudar de tamanho (a fonte carrega,
    // uma imagem entra), então `resize` na janela não bastaria.
    const observer = new ResizeObserver(medir);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", medir);
      observer.disconnect();
    };
  }, [medir]);

  const andar = (direcao: 1 | -1) => {
    const el = trilho.current;
    if (!el) return;

    const card = el.firstElementChild as HTMLElement | null;
    const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
    const passo = card ? card.offsetWidth + gap : el.clientWidth;

    // `scrollBy` não olha `prefers-reduced-motion` sozinho - quem pediu menos
    // movimento recebe o salto direto, sem a animação de rolagem.
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: passo * direcao, behavior: reduzido ? "auto" : "smooth" });
  };

  const botao =
    "flex h-[44px] w-[44px] items-center justify-center rounded-full border-2 border-ink-900/15 bg-surface text-ink-900 transition-colors hover:border-action hover:text-action disabled:cursor-not-allowed disabled:border-ink-900/10 disabled:text-ink-300 disabled:hover:border-ink-900/10";

  return (
    <>
      <ul ref={trilho} className={className}>
        {children}
      </ul>

      {nav.transbordou && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => andar(-1)}
            disabled={!nav.voltar}
            aria-label={`${label}: ver anteriores`}
            className={botao}
          >
            <IconArrowLeft size={20} />
          </button>

          <button
            type="button"
            onClick={() => andar(1)}
            disabled={!nav.avancar}
            aria-label={`${label}: ver próximos`}
            className={botao}
          >
            <IconArrowRight size={20} />
          </button>
        </div>
      )}
    </>
  );
}

/* ──────────────────────────────────────────────────────────── o bloco ──── */

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  "Depoimentos" - os vídeos gravados pelos próprios protetores         ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Cinco vídeos, um por abrigo, na mesma fileira que rola dos outros carrosséis
 * da página (`CardsCarousel`). Esta seção ocupa o lugar da fileira de logos de
 * parceiros do site institucional: ali os logos ainda eram marcadores
 * "COLOCAR LOGOS AQUI", e aqui há cinco pessoas com nome, abrigo e cidade
 * dizendo o que receberam. É a mesma prova social, só que verificável.
 *
 * ── Nenhum byte de vídeo baixa sozinho ────────────────────────────────────
 * Os cinco arquivos somam ~52 MB. `preload="none"` garante que o navegador não
 * toque neles até alguém apertar o play: o que carrega de cara é só o `poster`
 * (~30 KB cada). Sem isso, esta seção sozinha pesaria mais que a página inteira.
 *
 * ── Um tocando por vez ────────────────────────────────────────────────────
 * Dar play num vídeo pausa o que estiver tocando. Cinco áudios ao mesmo tempo
 * numa fileira que rola é o tipo de coisa que só acontece por descuido, e a
 * pessoa não teria como saber qual dos cinco parar.
 *
 * O `<video>` recebe `controls` só **depois** do primeiro play: antes disso a
 * barra do navegador competiria com a capa e com o botão redondo, que é o que
 * diz "isto é um vídeo". Depois que ele começa, quem manda é a barra.
 */
export default function Depoimentos() {
  /* O vídeo que está tocando, só para pausar o anterior. É `ref` e não estado
     porque trocar o vídeo corrente não muda nada na tela por si só. */
  const tocandoRef = useRef<HTMLVideoElement | null>(null);
  const [iniciados, setIniciados] = useState<string[]>([]);

  /* Chamado pelo `onPlay` do próprio `<video>`, e não pelo clique: assim vale
     também para quem der play pelos controles nativos ou pelo teclado. */
  const aoTocar = (id: string, video: HTMLVideoElement) => {
    if (tocandoRef.current && tocandoRef.current !== video) {
      tocandoRef.current.pause();
    }
    tocandoRef.current = video;
    setIniciados((atual) => (atual.includes(id) ? atual : [...atual, id]));
  };

  return (
    <section id="depoimentos" className="py-[clamp(2.5rem,6vh,4.5rem)]">
      {/* #ui:depoimentos */}
      <div className="container-narrow flex max-w-[660px] flex-col gap-6">
        {/* Sem `lead`: os cinco vídeos logo abaixo já dizem em vídeo o que a
            linha de apoio dizia em texto - cinco protetores, cinco abrigos. */}
        <SectionHead
          eyebrow={copyDepoimentos.eyebrow}
          title={copyDepoimentos.title}
        />

        {/*
          As margens negativas fazem a fileira sangrar até a borda da tela; o
          padding generoso (bem maior que o resto da página) é o que sobra pro
          card ficar centralizado com uma tira do vizinho à mostra dos dois
          lados, em vez de grudado na margem esquerda - que era só o card
          seguinte espiando à direita, sem par no lado de cá.
        */}
        <CardsCarousel
          label={copyDepoimentos.title}
          className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-12 pb-2 sm:px-16 md:-mx-8"
        >
          {depoimentos.map((item) => {
            const iniciado = iniciados.includes(item.id);

            return (
              <li
                key={item.id}
                className="flex w-[260px] shrink-0 snap-center flex-col overflow-hidden rounded-md border border-ink-900/10 bg-surface shadow sm:w-[300px]"
              >
                <div className="relative aspect-[9/16] bg-ink-900">
                  {/*
                    `poster` é o que aparece antes do play. `playsInline` impede
                    o iOS de abrir o vídeo em tela cheia sozinho, que tiraria a
                    pessoa da página no meio da leitura.
                  */}
                  <video
                    src={withBasePath(item.src)}
                    poster={withBasePath(item.poster)}
                    preload="none"
                    playsInline
                    controls={iniciado}
                    onPlay={(e) => aoTocar(item.id, e.currentTarget)}
                    className="h-full w-full object-cover"
                  />

                  {/* Some no primeiro play e não volta: dali em diante quem
                      manda são os controles nativos, que estão por baixo. */}
                  {!iniciado && (
                    <button
                      type="button"
                      aria-label={`Reproduzir o depoimento de ${item.name}, do ${item.shelter}`}
                      onClick={(e) => {
                        const video =
                          e.currentTarget.parentElement?.querySelector("video");
                        void video?.play();
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-ink-900/20 transition-colors hover:bg-ink-900/30"
                    >
                      <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-surface/95 text-action shadow">
                        {/* Três pixels para a direita: o triângulo do play tem
                            o peso todo de um lado e, centrado de verdade,
                            parece torto dentro do círculo. */}
                        <IconPlay size={24} className="ml-[3px]" />
                      </span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-0.5 p-4">
                  <p className="text-fs15 font-extrabold leading-tight text-ink-900">
                    {item.name}
                  </p>
                  <p className="text-fs13 font-semibold text-accent">
                    {item.shelter}
                  </p>
                  <p className="text-fs12 leading-[1.4] text-ink-600">
                    {item.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </CardsCarousel>
      </div>
    </section>
  );
}
