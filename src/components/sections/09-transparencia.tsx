"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
  type SVGProps,
} from "react";
import { formatUSDCurto } from "@/lib/format";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  09 · TRANSPARÊNCIA - para onde vai cada real                         ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Bloco isolado: a conta mensal, os números da rede, a contagem animada e a
 * cabeça de seção moram aqui. De fora entra só `formatUSDCurto`, que é a mesma
 * formatação de dinheiro do checkout - dois formatos de real na mesma página
 * é o tipo de detalhe que faz a pessoa reler o valor.
 */

/* ─────────────────────────────────────────────────── conteúdo do bloco ──── */

const copyTransparencia = {
  eyebrow: "Transparency",
  title: "Full transparency",
  lead: "See where every dollar raised in the campaign goes:",
  costsCaption: "Monthly costs",
  totalLabel: "Total needed",
};

/**
 * ⚠️ CONFERIR ANTES DE PUBLICAR ⚠️
 *
 * A conta mensal dos abrigos, em dólares - os cinco itens da tabela
 * "Monthly costs" da campanha em produção, com os mesmos valores. A soma dá
 * **$48,587**.
 *
 * ⚠️ Ela **não** é a meta: a meta são os $50.000 redondos de `campaign.goal`.
 * A folga entre os dois é de propósito e está anotada lá.
 *
 * O total é somado a partir dos itens (`monthlyCostsTotal`), então a linha final
 * nunca fica fora de sincronia com a lista. **Número em dinheiro só continua
 * verdadeiro se alguém revisar.**
 */
const monthlyCosts = {
  items: [
    { label: "Food for the animals", cents: 1_421_300, dot: "bg-action" },
    { label: "Vet visits and surgeries", cents: 1_674_200, dot: "bg-warning" },
    { label: "Shelter rent", cents: 984_500, dot: "bg-donate" },
    { label: "Medication", cents: 512_700, dot: "bg-progress" },
    { label: "Utilities and upkeep", cents: 266_000, dot: "bg-ink-300" },
  ],
};

const monthlyCostsTotal = monthlyCosts.items.reduce(
  (sum, item) => sum + item.cents,
  0,
);

/**
 * ⚠️ CONFERIR ANTES DE PUBLICAR ⚠️
 *
 * Os números da campanha. Cada um é sustentado por outra parte desta mesma
 * página - se um deles deixar de ser, tire o item da lista em vez de arredondar.
 *
 *   +400 vidas    é o número que a campanha publica ("400+ animais dependem
 *                 de cada doação"); a soma das fichas dos cinco abrigos dá 514,
 *                 então o "+" é conservador de propósito.
 *   5 abrigos     os cinco listados em `shelters`, com nome e endereço.
 *   4 estados     SP, MG, BA e ES - os estados desses cinco abrigos.
 *
 * `value` é número, e não texto, porque ele é contado do zero na tela (ver
 * `CountUp`). O que não é número vive em `prefix`/`suffix`.
 */
const impactNumbers = [
  {
    prefix: "+",
    value: 400,
    suffix: "",
    label: "lives sheltered",
    note: "Animals in the shelters Kyle follows.",
  },
  {
    prefix: "",
    value: 5,
    suffix: "",
    label: "shelters supported",
    note: "Each one with its name and address in the open.",
  },
  {
    prefix: "",
    value: 4,
    suffix: "",
    label: "states reached",
    note: "São Paulo, Minas Gerais, Bahia and Espírito Santo.",
  },
] as const;

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

const IconDollar = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 2v20" />
    <path d="M17 6.5c0-1.93-2.24-3.5-5-3.5s-5 1.57-5 3.5S9.24 10 12 10s5 1.57 5 3.5-2.24 3.5-5 3.5-5-1.57-5-3.5" />
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
 * `useLayoutEffect` no navegador, `useEffect` no servidor.
 *
 * O efeito precisa rodar **antes da pintura**: ele é quem zera o número para a
 * contagem começar do zero. Com `useEffect`, que roda depois, o navegador
 * chegava a pintar o valor final e só então voltava para zero - um piscar
 * visível em todo card. E `useLayoutEffect` puro avisa no console durante o
 * SSR, onde não existe pintura para acontecer antes. Daí a troca pela largura
 * do ambiente, e não por uma flag.
 */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Número que conta do zero até o valor quando entra na tela.
 *
 * O valor **final** é o que sai do servidor. Isso importa por dois motivos:
 * sem JavaScript o número aparece do mesmo jeito (o `<noscript>` do layout já
 * cuida do resto da página), e o que o Google lê é "400", não "0". Quem tem
 * JavaScript vê o zero só a partir do efeito de layout, antes da primeira
 * pintura - então na prática a contagem sempre começa do zero.
 *
 * `prefix` e `suffix` ficam fora da conta de propósito: o "+" de "+400" e o
 * "t" de "+20t" são rótulo, não número, e animá-los daria "2t, 7t, 13t…".
 *
 * Respeita `prefers-reduced-motion`: quem pediu menos movimento recebe o
 * número parado, sem contagem nenhuma.
 */
function CountUp({
  value,
  prefix = "",
  suffix = "",
  duration = 900,
  className = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  /** Duração da contagem, em milissegundos. Curta de propósito. */
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Navegador antigo ou quem pediu menos movimento: número parado no valor
    // final, que é o que já está na tela. Nada a fazer.
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setDisplay(0);

    let frame = 0;
    let inicio = 0;

    const passo = (agora: number) => {
      if (!inicio) inicio = agora;
      const t = Math.min(1, (agora - inicio) / duration);
      // easeOutCubic: sai rápido e desacelera no fim, então o número passa a
      // maior parte do tempo perto do valor final em vez de no meio do caminho.
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(eased * value));
      if (t < 1) frame = requestAnimationFrame(passo);
    };

    // Dispara uma vez, quando o card entra na tela - e não na montagem: os
    // cards da transparência estão bem abaixo da dobra, e a contagem toda
    // aconteceria antes de alguém chegar lá.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        frame = requestAnimationFrame(passo);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    // `tabular-nums`: sem isso cada dígito tem largura própria e o número
    // treme na horizontal durante a contagem inteira.
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {display.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

/**
 * Os números da rede - vidas, abrigos, ração entregue, castrações.
 *
 * Vive na seção de transparência, embaixo da conta mensal da rede: em cima
 * está o que o dinheiro precisa cobrir todo mês, aqui está o que ele já
 * cobriu. É a mesma pergunta respondida pelos dois lados.
 *
 * ── Por que não no hero ───────────────────────────────────────────────────
 * Já esteve lá, primeiro como barra de meta em reais e depois em card. Saiu
 * porque a primeira dobra tem altura para uma ideia só, e ela é o vídeo -
 * cada pixel gasto com número ali era pixel tirado dele. Aqui embaixo o
 * espaço não é disputado e o card pode ter o tamanho que ele merece.
 *
 * ── Por que card, e não uma fileira solta ─────────────────────────────────
 * Sem moldura, quatro pares de número e rótulo viram oito pedaços de texto
 * soltos: não dá para saber de olho qual rótulo é de qual número, e a linha
 * inteira lê como sobra de layout. A moldura é o que agrupa cada par e diz
 * "isto aqui são quatro coisas, não oito".
 *
 * Cada número conta do zero ao chegar na tela (ver `CountUp`).
 */
function ImpactStats() {
  // Lista vazia é estado válido: sem número confirmado, o bloco some inteiro
  // em vez de mostrar moldura vazia.
  if (!impactNumbers.length) return null;

  /*
   * As colunas seguem a quantidade de números, em vez de estarem fixas em
   * quatro. Com `sm:grid-cols-4` e três itens, o último ficava sozinho numa
   * célula de largura de card e a fileira lia como grade quebrada - e é
   * exatamente o que aconteceu quando a lista caiu de quatro para três na
   * virada para esta campanha. No celular continuam sendo duas colunas em
   * qualquer caso: três cards lado a lado em 360px não cabem.
   */
  const colunas =
    impactNumbers.length % 4 === 0
      ? "sm:grid-cols-4"
      : impactNumbers.length % 3 === 0
        ? "sm:grid-cols-3"
        : "sm:grid-cols-2";

  return (
    <ul className={`grid grid-cols-2 gap-3 sm:gap-4 ${colunas}`}>
      {impactNumbers.map((stat, i) => (
        <li
          key={stat.label}
          /* No celular são sempre duas colunas, então uma lista ímpar deixaria
             o último card sozinho e com metade da largura dos outros - a
             fileira lê como se faltasse um item. Ele passa a ocupar a linha
             inteira; a partir de `sm` a grade fecha certinha e isso não vale
             mais. */
          className={`flex flex-col items-center gap-1 rounded-md border border-ink-900/10 bg-surface p-4 text-center shadow ${
            impactNumbers.length % 2 === 1 && i === impactNumbers.length - 1
              ? "max-sm:col-span-2"
              : ""
          }`}
        >
          <CountUp
            value={stat.value}
            prefix={stat.prefix}
            suffix={stat.suffix}
            className="text-[clamp(1.511rem,1.209rem+1.116vw,2.093rem)] font-extrabold leading-none text-donate-text"
          />
          <span className="text-fs13 font-extrabold leading-tight text-ink-900">
            {stat.label}
          </span>
          <span className="text-fs12 leading-[1.4] text-ink-600">{stat.note}</span>
        </li>
      ))}
    </ul>
  );
}

/* ──────────────────────────────────────────────────────────── o bloco ──── */

/**
 * Para onde vai o dinheiro - a conta mensal da rede, em reais.
 *
 * É a seção da v1 reproduzida aqui: mesma cabeça (ícone de barras, título à
 * esquerda) e mesma tabela de duas colunas, rótulo à esquerda e valor à
 * direita. Foi decisão de campanha manter as duas versões idênticas nesta
 * parte - é a única seção da v2 que não usa a cabeça centralizada do resto da
 * página, e é por isso que `SectionHead` ainda aceita `icon` e `align`.
 *
 * Tabela, e não lista de cards: são pares rótulo/valor lidos em coluna, e é o
 * alinhamento à direita que deixa os valores comparáveis de relance.
 *
 * O total é somado dos itens (`monthlyCostsTotal`), então a linha final nunca
 * fica fora de sincronia com a lista acima.
 *
 * Bloco informativo, sem animação nos números: numa página que pede dinheiro,
 * número que se anima parece propaganda. Quem conta do zero é só o
 * `ImpactStats` logo abaixo, que fala de vidas, não de reais.
 */
export default function Transparencia() {
  return (
    <section id="transparencia" className="py-[clamp(2.5rem,6vh,4.5rem)]">
      {/* #ui:transparencia */}
      <div className="container-narrow flex max-w-[660px] flex-col gap-5">
        <SectionHead
          eyebrow={copyTransparencia.eyebrow}
          title={copyTransparencia.title}
          lead={copyTransparencia.lead}
          align="left"
        />

        <Reveal className="overflow-hidden rounded-md border border-ink-900/10 shadow">
          <table className="w-full border-collapse bg-surface text-left">
            {/* Só para leitor de tela: na tela, a linha de apoio da seção já
                explica de que custos a tabela está falando. */}
            <caption className="sr-only">{copyTransparencia.costsCaption}</caption>
            <tbody>
              {monthlyCosts.items.map((item) => (
                <tr key={item.label} className="border-b border-ink-900/[.07]">
                  <th scope="row" className="px-4 py-3 text-fs14 font-normal text-ink-600">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={`h-2 w-2 shrink-0 rounded-full ${item.dot}`}
                      />
                      {item.label}
                    </span>
                  </th>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-fs14 font-extrabold tabular-nums text-ink-900">
                    {formatUSDCurto(item.cents)}
                  </td>
                </tr>
              ))}

              <tr className="bg-surface-alt">
                <th scope="row" className="px-4 py-4 text-fs14 font-extrabold text-ink-900">
                  {copyTransparencia.totalLabel}
                </th>
                <td className="whitespace-nowrap px-4 py-4 text-right text-[clamp(0.93rem,0.837rem+0.372vw,1.163rem)] font-extrabold tabular-nums text-action">
                  {formatUSDCurto(monthlyCostsTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </Reveal>

        <ImpactStats />
      </div>
    </section>
  );
}
