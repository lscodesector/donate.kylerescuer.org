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
 * ║  03 · PROVA - a faixa de confiança                                    ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Bloco isolado: os cinco selos e os ícones deles moram aqui. Não importa
 * nada de fora - nem `lib/`.
 */

/* ─────────────────────────────────────────────────── conteúdo do bloco ──── */

/**
 * Prova rápida de confiança - faixa escaneável logo depois do hero.
 * Só afirmações que a própria página sustenta.
 */
const trustStrip = {
  title: "They cannot wait for treatment.",
  items: [
    { icon: "shield", label: "Verified nonprofit ID" },
    { icon: "home", label: "5 shelters supported" },
    { icon: "bowl", label: "Vet visits, tests and medication" },
    { icon: "card", label: "Card or PayPal" },
    { icon: "mail", label: "Support by email" },
  ],
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

const IconBowl = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2.5 12.5h19" />
    <path d="M3.2 12.5a8.8 8.8 0 0 0 17.6 0" />
    <path d="M12 12.5V7" />
    <path d="M9 8.2c0-1.4.9-2.6 2-2.9" />
    <path d="M15 8.2c0-1.4-.9-2.6-2-2.9" />
  </svg>
);

const IconCheck = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m5 13 4 4L19 7" />
  </svg>
);

const IconFile = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v5h5" />
  </svg>
);

const IconHome = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </svg>
);

/**
 * Cartão de crédito ou débito - o desenho do meio de pagamento que substituiu
 * o Pix nesta página.
 *
 * Traçado, e não a bandeira de ninguém: a página aceita o que o PayPal aceitar,
 * e desenhar a marca de uma bandeira específica prometeria uma lista que este
 * projeto não controla.
 */
const IconCard = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="M2.5 10h19" />
    <path d="M6 14.5h3" />
  </svg>
);

const IconShield = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const IconMail = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="2.8" y="5" width="18.4" height="14" rx="2" />
    <path d="m3.4 6.6 8.6 6 8.6-6" />
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

/* ──────────────────────────────────────────────────────────── o bloco ──── */

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const ICONS: Record<string, IconComponent> = {
  shield: IconShield,
  file: IconFile,
  mail: IconMail,
  card: IconCard,
  bowl: IconBowl,
  home: IconHome,
};

/**
 * Faixa curta de confiança, logo depois do hero.
 *
 * Vem cedo de propósito: a objeção "posso confiar nisso?" aparece no mesmo
 * instante em que a pessoa vê um pedido de dinheiro. São itens escaneáveis,
 * sem parágrafo - cada um é verificável em outro ponto da própria página.
 */
export default function Prova() {
  return (
    <section className="border-y border-ink-900/10 bg-surface py-6">
      {/* #ui:prova */}
      {/* Centralizada em qualquer largura: são cinco selos curtos numa faixa
          baixa, e centralizados eles lêem como um bloco só. Alinhados à
          esquerda, a última linha sobrava no meio da faixa. */}
      <div className="container-narrow flex max-w-[660px] flex-col items-center gap-3 text-center">
        <Reveal className="text-fs15 font-extrabold text-ink-900">{trustStrip.title}</Reveal>

        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {trustStrip.items.map((item) => {
            const Icon = ICONS[item.icon] ?? IconCheck;
            return (
              <li
                key={item.label}
                className="inline-flex items-center gap-1.5 text-fs13 font-semibold text-ink-600"
              >
                <Icon size={15} className="shrink-0 text-donate" />
                {item.label}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
