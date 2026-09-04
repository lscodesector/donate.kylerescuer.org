"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
  type SVGProps,
} from "react";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  10 · ATUALIZAÇÕES - a linha do tempo da campanha                     ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Bloco isolado: as quatro entradas, a cabeça de seção e o ícone moram aqui.
 * Não importa nada de fora.
 */

/* ─────────────────────────────────────────────────── conteúdo do bloco ──── */

/** "Atualizações" - a linha do tempo da campanha. */
const copyAtualizacoes = {
  eyebrow: "Updates",
  title: "What has happened so far",
  lead: "This campaign did not start today, and not all of it is good news. This is the timeline exactly as it is.",
};

/**
 * A linha do tempo da campanha.
 *
 * ⚠️ **Nem toda entrada é boa notícia, e é assim de propósito.** Duas delas são
 * derrota (20 animais que não resistiram, prefeitura que negou apoio pela
 * terceira vez). Elas vêm da campanha original e ficam: uma linha do tempo em
 * que só há vitória é publicidade, não prestação de contas.
 *
 * `tone` decide a cor do marcador: `now` é a entrada atual (dourada), `done` é
 * o que já aconteceu com desfecho, `open` é o que ficou em aberto.
 */
const timeline = [
  {
    date: "Jun 2026 · Campaign launched",
    title: "Kyle story reached the internet",
    text: "More than 1,000 shares in 24 hours, but still far from what it takes to pay for the care of the 500+ animals in the shelters.",
    tone: "now" as const,
  },
  {
    date: "May 2026 · Crisis in Bahia",
    title: "Save Dog Shelter almost closed after a disease outbreak",
    text: "We did what it took to save more than 90 lives, but 22 died in the distemper outbreak - a battle lost for lack of vaccination before and veterinary care during.",
    tone: "done" as const,
  },
  {
    date: "Mar 2026",
    title: "20 animals did not make it this year",
    text: "For lack of help in time. Every life lost is a battle that could have been won with a vet visit, tests and medication in the first week.",
    tone: "done" as const,
  },
  {
    date: "Dec 2025",
    title: "City hall denied support for the 3rd time",
    text: "Kyle keeps fighting to bring in donations. With no public funding, this campaign is the only way left.",
    tone: "open" as const,
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

const IconClock = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
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

/* ──────────────────────────────────────────────────────────── o bloco ──── */

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  "Atualizações" - a linha do tempo da campanha                        ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Quatro entradas em ordem decrescente: a mais recente em cima, como em
 * qualquer diário de campanha. Vem depois da transparência porque as duas
 * respondem a mesma pergunta por ângulos diferentes - a tabela diz para onde o
 * dinheiro vai, esta seção diz o que aconteceu quando ele faltou.
 *
 * ── Nem toda entrada é boa notícia ────────────────────────────────────────
 * Duas delas são derrota (20 animais que não resistiram; a prefeitura que negou
 * apoio pela terceira vez), e isso é decisão de conteúdo, não descuido: linha do
 * tempo em que só há vitória é publicidade, não prestação de contas. Ver o aviso
 * em `timeline`, no arquivo de conteúdo.
 *
 * ── O desenho ─────────────────────────────────────────────────────────────
 * Um traço vertical contínuo com um marcador por entrada. O traço é um `::` no
 * `<li>` (a borda esquerda), e não um elemento próprio: assim ele acompanha a
 * altura do item sozinho, sem ninguém precisar medir nada. O último item corta
 * o traço (`last:border-transparent`) para a linha não sobrar pendurada abaixo
 * do último marcador.
 *
 * `tone` decide a cor do marcador, e as três só existem porque significam
 * coisas diferentes:
 *
 *   `now`   dourado e com halo - a entrada atual, onde a campanha está
 *   `done`  cheio - aconteceu e teve desfecho
 *   `open`  vazado - aconteceu e ficou em aberto
 */
const MARCADOR = {
  now: "bg-warning ring-4 ring-warning/20",
  done: "bg-action",
  open: "bg-surface ring-2 ring-inset ring-ink-300",
} as const;

export default function Atualizacoes() {
  return (
    <section id="atualizacoes" className="surface-alt py-[clamp(2.5rem,6vh,4.5rem)]">
      {/* #ui:atualizacoes */}
      <div className="container-narrow flex max-w-[660px] flex-col gap-6">
        <SectionHead
          icon={IconClock}
          eyebrow={copyAtualizacoes.eyebrow}
          title={copyAtualizacoes.title}
          lead={copyAtualizacoes.lead}
          align="left"
        />

        <ol className="flex flex-col">
          {timeline.map((item, i) => (
            <Reveal
              key={item.title}
              as="li"
              /* O escalonamento para no quarto item: `Reveal` só tem quatro
                 degraus de atraso, e uma lista maior que isso passaria a
                 receber `undefined`. */
              delay={Math.min(i, 3) as 0 | 1 | 2 | 3}
              /* `pb` no lugar de `gap`: o traço é a borda esquerda do próprio
                 item, então o espaço entre um e outro precisa estar *dentro*
                 dele - com `gap`, a linha ficaria picotada nos vãos. */
              className="relative border-l-2 border-ink-900/10 pb-7 pl-6 last:border-transparent last:pb-0"
            >
              {/* O marcador monta em cima da linha: metade da largura para a
                  esquerda (`-left-[7px]` para 12px de bolinha + 2px de traço). */}
              <span
                aria-hidden="true"
                className={`absolute -left-[7px] top-[6px] h-3 w-3 rounded-full ${MARCADOR[item.tone]}`}
              />

              <p className="text-fs12 font-extrabold uppercase tracking-[0.08em] text-accent">
                {item.date}
              </p>
              <h3 className="mt-1 text-fs16 font-extrabold leading-[1.3] text-ink-900">
                {item.title}
              </h3>
              <p className="mt-1.5 text-fs14 leading-[1.6] text-ink-600">
                {item.text}
              </p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
