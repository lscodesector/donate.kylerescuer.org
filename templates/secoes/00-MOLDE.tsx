/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  NN · NOME DA SEÇÃO - o que ela responde, em uma linha                ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Este é o **molde de qualquer seção nova**. Copie, renomeie para
 * `NN-nome.tsx` (o número é a posição na página) e preencha.
 *
 * Bloco isolado: o texto, os ícones e os utilitários de desenho moram aqui
 * dentro. De fora só entram `@/lib` - dado de campanha, formatação, gatilhos
 * de modal. Ele **não** importa outra seção nem uma pasta de UI compartilhada.
 * Ver `ESTRUTURA.md` para o porquê.
 *
 * ── A ordem dentro do arquivo ─────────────────────────────────────────────
 * Sempre a mesma, e as réguas de comentário separam as quatro partes:
 *
 *   1. conteúdo do bloco   o texto, em objetos `const` no topo
 *   2. ícones              os SVGs que só esta seção usa
 *   3. utilitários         Reveal, SectionHead - copiados do template
 *   4. o bloco             o `export default`
 *
 * Uma seção que não precisa de ícone simplesmente não tem a parte 2.
 */

"use client"; /* ← só se a seção tiver estado, efeito ou onClick. Sem isso,
                    ela é Server Component e não manda JS nenhum para o
                    navegador - que é o padrão preferido. */

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
  type SVGProps,
} from "react";

/* ─────────────────────────────────────────────────── conteúdo do bloco ──── */

/**
 * Todo o texto da seção, num objeto só.
 *
 * Fica no topo do arquivo, e não espalhado pelo JSX, porque é isto que muda
 * de campanha para campanha - e quem for trocar a redação não deveria precisar
 * ler o layout para achar a frase.
 */
const copy = {
  eyebrow: "",
  title: "",
  lead: "",
} as const;

const itens = [
  { title: "", text: "", icon: "check" },
] as const;

/* ─────────────────────────────────────────────────────────── ícones ──── */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/** Os atributos comuns. O spread de `rest` vem por último, para o chamador
    poder sobrescrever qualquer padrão. Catálogo em `componentes/Icons.tsx`. */
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

const ICONES = { check: IconCheck } as const;

/* ────────────────────────────────────────────── utilitários do bloco ──── */

/**
 * Revelação ao entrar na viewport. Copiado de `componentes/Reveal.tsx` - o
 * arquivo lá tem os comentários completos sobre as duas armadilhas que este
 * código resolve (hidratação e a faixa morta do `rootMargin`).
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

    if (typeof IntersectionObserver === "undefined") {
      node.dataset.visible = "true";
      return;
    }

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
 * Cabeça de seção. Copiado de `componentes/SectionHead.tsx`.
 *
 * O padrão é **sem ícone e centralizado** - é o que faz dez seções lerem como
 * uma coisa só. `icon` e `align` existem para a exceção; cada uso é uma cabeça
 * a menos alinhada com o resto da página.
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
 * O que esta seção faz, e a decisão de desenho que ela carrega.
 *
 * ⚠️ O `id` precisa existir se algum item do menu apontar para ele. Item de
 * menu que rola para lugar nenhum é o defeito que ninguém testa e todo mundo
 * encontra.
 */
export default function Molde() {
  return (
    /*
     * O respiro vertical é sempre `py-[clamp(2.5rem,6vh,4.5rem)]`. A única
     * exceção da página é o CTA final, que fecha e usa `clamp(3rem,7vh,5rem)`.
     *
     * O fundo alterna: uma seção `bg-surface` (o padrão, pode omitir), a
     * seguinte `surface-alt`.
     */
    <section id="" className="py-[clamp(2.5rem,6vh,4.5rem)]">
      {/* #ui:nome-do-bloco  ← o marcador que a skill `editar` procura.
          Mantenha o nome igual ao do arquivo, e não remova. */}

      {/* `container-narrow` dá a folga lateral; `max-w-[660px]` é a medida de
          leitura da página. Os dois juntos, sempre. */}
      <div className="container-narrow flex max-w-[660px] flex-col gap-5">
        <SectionHead eyebrow={copy.eyebrow} title={copy.title} lead={copy.lead} />

        {/* A grade quebra em `sm`. Abaixo disso, uma coluna. */}
        <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {itens.map((item, i) => {
            const Icon = ICONES[item.icon as keyof typeof ICONES];
            return (
              /* `delay={(i % 3)}`: a fileira acende da esquerda para a direita
                 e a fileira seguinte recomeça, em vez de a página inteira
                 escalonar até o último card. */
              <Reveal
                key={item.title}
                as="li"
                delay={(i % 3) as 0 | 1 | 2}
                /* `h-full` porque está numa grade: sem ele os cards da fileira
                   ficam com alturas diferentes. */
                className="flex h-full flex-col gap-3 rounded-md border border-ink-900/10 bg-surface p-4"
              >
                <span className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Icon size={24} />
                </span>

                <div className="flex flex-col gap-1">
                  <h3 className="text-fs15 font-extrabold leading-tight text-ink-900">
                    {item.title}
                  </h3>
                  <p className="text-fs13 leading-[1.5] text-ink-600">{item.text}</p>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
