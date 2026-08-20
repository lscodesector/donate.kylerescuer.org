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

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type SVGProps,
} from "react";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  07 · COMO FUNCIONA - os três passos                                  ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Bloco isolado: os três passos, o selo e os ícones moram aqui. Não importa
 * nada de fora.
 */

/* ─────────────────────────────────────────────────── conteúdo do bloco ──── */

const copyComoFunciona = {
  eyebrow: "Como funciona",
  title: "Três passos, menos de um minuto",
  seal: "Doação 100% segura",
  steps: [
    {
      icon: "bowl",
      title: "Você escolhe quanto doar",
      text: "Escolha um dos valores ou digite o que o seu coração mandar. Não existe valor mínimo.",
    },
    {
      icon: "pix",
      title: "Faz o pagamento via Pix",
      text: "O código é gerado na hora, sem sair desta página. Pagamento rápido, seguro e direto para o CNPJ da SOS Animal Help.",
    },
    /* Quem entrega e quem presta contas é a **organização**, não o Caio: ele
       é quem visita os abrigos e mostra a realidade deles, e a SOS Animal
       Help é quem recebe a doação, faz o repasse e publica o comprovante no
       app. Trocar os dois de lugar num texto que fala de dinheiro é o tipo de
       imprecisão que vira desconfiança. */
    {
      icon: "heart",
      title: "A SOS Animal Help leva a ajuda até o abrigo",
      text: "A doação vira ração, remédio e veterinário nos abrigos que o Caio acompanha - e a SOS Animal Help publica os comprovantes no app.",
    },
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

const IconHeart = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8Z" />
  </svg>
);

/**
 * A marca do Pix como ela é distribuída - os quatro braços do losango, em
 * traçado cheio, transcrita do SVG oficial (SVG Repo) para componente: inline
 * ela herda a cor do texto (`currentColor`) e não custa uma requisição.
 *
 * O `.svg` de origem morava em `public/` e saiu de lá: servido, ele era um
 * arquivo publicado que nenhuma tela pedia - os dois `path` abaixo são o
 * arquivo inteiro, caractere por caractere.
 *
 * ⚠️ **É a única marca do Pix da página.** Havia um segundo desenho aqui, o
 * `IconPix` - um losango simplificado, redesenhado à mão, que as listas e os
 * selos usavam enquanto o checkout usava este. Dois desenhos diferentes para a
 * mesma marca, na mesma página, e o antigo não era o arquivo oficial. Ele saiu;
 * todo lugar que mostra o Pix aponta para cá.
 */
const IconPixMark = ({ size = 20, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
    focusable={false}
    {...rest}
  >
    <path d="M11.917 11.71a2.046 2.046 0 0 1-1.454-.602l-2.1-2.1a.4.4 0 0 0-.551 0l-2.108 2.108a2.044 2.044 0 0 1-1.454.602h-.414l2.66 2.66c.83.83 2.177.83 3.007 0l2.667-2.668h-.253zM4.25 4.282c.55 0 1.066.214 1.454.602l2.108 2.108a.39.39 0 0 0 .552 0l2.1-2.1a2.044 2.044 0 0 1 1.453-.602h.253L9.503 1.623a2.127 2.127 0 0 0-3.007 0l-2.66 2.66h.414z" />
    <path d="m14.377 6.496-1.612-1.612a.307.307 0 0 1-.114.023h-.733c-.379 0-.75.154-1.017.422l-2.1 2.1a1.005 1.005 0 0 1-1.425 0L5.268 5.32a1.448 1.448 0 0 0-1.018-.422h-.9a.306.306 0 0 1-.109-.021L1.623 6.496c-.83.83-.83 2.177 0 3.008l1.618 1.618a.305.305 0 0 1 .108-.022h.901c.38 0 .75-.153 1.018-.421L7.375 8.57a1.034 1.034 0 0 1 1.426 0l2.1 2.1c.267.268.638.421 1.017.421h.733c.04 0 .079.01.114.024l1.612-1.612c.83-.83.83-2.178 0-3.008z" />
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

/**
 * Os três passos, logo **depois** do pedido.
 *
 * Trocou de lugar com `DoarAgora`: o argumento e o botão vêm primeiro, e estes
 * três passos ficam para quem chegou até o fim do pedido sem clicar. Quem trava
 * ali não trava por desconfiar da causa - trava por não saber se o clique leva
 * a um formulário longo, a um cadastro ou a um boleto, e é essa dúvida que os
 * passos respondem.
 *
 * Sem CTA próprio: o botão está logo acima, na seção do pedido. Um segundo aqui
 * só dividiria o clique com ele.
 *
 * ── Layout ────────────────────────────────────────────────────────────────
 * No celular os passos empilham em linhas de ícone + texto (o número fica no
 * canto do ícone), e a partir de `sm` viram três colunas. É a mesma informação
 * nos dois: nada some no mobile.
 */

const ICONES = {
  bowl: IconBowl,
  /* A marca oficial do Pix (ver `IconPixMark`), e não um losango simplificado:
     no cartão que fala do pagamento, o desenho que a pessoa reconhece do app
     do banco vale mais que um ícone parecido. O emblema redondo verde continua
     igual - muda só o traço de dentro. */
  pix: IconPixMark,
  heart: IconHeart,
} as const;

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="surface-alt py-[clamp(2.5rem,6vh,4.5rem)]">
      {/* #ui:como-funciona */}
      <div className="container-narrow flex max-w-[660px] flex-col gap-[clamp(1.25rem,3.5vh,2rem)]">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="rule-accent text-fs13 font-extrabold uppercase tracking-[0.12em] text-accent">
            {copyComoFunciona.eyebrow}
          </p>
          <h2 className="text-[clamp(1.279rem,0.977rem+1.209vw,1.976rem)] font-extrabold leading-[1.15] text-ink-900">
            {copyComoFunciona.title}
          </h2>

          {/* Selo em pílula verde: é a objeção que este bloco responde, e ela
              vale mais lida de relance do que dentro de um parágrafo. */}
          <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-donate/10 px-3 py-1.5 text-fs13 font-extrabold text-donate-text">
            <IconShield size={15} className="shrink-0" />
            {copyComoFunciona.seal}
          </p>
        </div>

        <ol className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {copyComoFunciona.steps.map((step, i) => {
            const Icon = ICONES[step.icon as keyof typeof ICONES];
            return (
              <Reveal
                key={step.title}
                as="li"
                delay={(i % 3) as 0 | 1 | 2}
                className="flex items-start gap-3 rounded-md border border-ink-900/10 bg-surface p-4 sm:flex-col sm:items-center sm:gap-2.5 sm:text-center"
              >
                {/* Ícone e número no mesmo elemento: o número é a ordem do
                    passo e o ícone é o assunto dele - separados, viravam dois
                    enfeites disputando a mesma linha. */}
                <span className="relative flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-donate/10 text-donate">
                  <Icon size={24} />
                  <span
                    aria-hidden="true"
                    className="absolute -right-1 -top-1 flex h-[20px] w-[20px] items-center justify-center rounded-full bg-donate text-fs11 font-extrabold text-donate-ink"
                  >
                    {i + 1}
                  </span>
                </span>

                <div className="flex flex-col gap-1">
                  <h3 className="text-fs15 font-extrabold leading-tight text-ink-900">
                    {step.title}
                  </h3>
                  <p className="text-fs13 leading-[1.5] text-ink-600">{step.text}</p>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
