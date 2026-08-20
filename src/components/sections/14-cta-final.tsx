"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type SVGProps,
} from "react";
import { DOAR_HREF } from "@/lib/config";
import { openDonationModal, type DonationIntent } from "@/lib/modais";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  14 · CTA FINAL - o fechamento                                        ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Bloco isolado: a frase de fechamento, os dois botões e os ícones moram
 * aqui. De fora entram a âncora de doação e os gatilhos do modal.
 */

/* ─────────────────────────────────────────────────── conteúdo do bloco ──── */

const copyFinal = {
  /* Uma frase só, e ela é o `h2` da seção. O fechamento tinha duas linhas -
     "Abandonar esses animais não é uma opção." como título e esta como apoio
     -, e a primeira já é a última frase da história do Caio, dita alguns
     blocos acima. No fim da página o que falta não é repetir o argumento: é
     dizer o que a doação faz e apontar os dois botões. */
  title: "Sua doação hoje mantém mais de 400 animais vivos. Ajude agora!",
  /* "Escolher um valor", e não "quero ajudar agora": o botão abre a grade de
     valores, e o rótulo agora diz exatamente o que acontece no clique. */
  ctaPrimary: "Escolher um valor",
  /* Doação mensal, e não mais "tenho uma dúvida": no fechamento a pessoa já
     passou pelo FAQ, e o que falta oferecer é a doação que os abrigos podem
     planejar - não mais um desvio para tirar dúvida. */
  ctaSecondary: "Quero ajudar todo mês",
  seal: "Doação segura · CNPJ verificado",
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

const IconArrowRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
    <path d="m13 5 7 7-7 7" />
  </svg>
);

/**
 * A patinha branca do botão mensal - mesma identidade do "Quero ajudar todo
 * mês" da gaveta do menu e do hero (`IconPaw`, ver `01-menu.tsx`/`02-hero.tsx`
 * para o mesmo desenho). `fill="currentColor"` herda o branco de
 * `text-action-ink` sozinho, sem precisar de `className`.
 */
const IconPaw = ({ size = 20, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable={false}
    {...rest}
  >
    <ellipse cx="7" cy="8.2" rx="2.1" ry="2.7" />
    <ellipse cx="12" cy="6.4" rx="2.1" ry="2.8" />
    <ellipse cx="17" cy="8.2" rx="2.1" ry="2.7" />
    <ellipse cx="19.6" cy="13.2" rx="1.9" ry="2.3" />
    <ellipse cx="4.4" cy="13.2" rx="1.9" ry="2.3" />
    <path d="M12 12.2c2.8 0 5.2 2 5.2 4.4 0 2-1.6 3.2-3.4 3.2-.8 0-1.3-.3-1.8-.3s-1 .3-1.8.3c-1.8 0-3.4-1.2-3.4-3.2 0-2.4 2.4-4.4 5.2-4.4Z" />
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
 * Fechamento. A pessoa já viu o vídeo, as histórias, os valores e a
 * documentação - aqui só faltam os botões, sem nada disputando espaço com eles.
 *
 * ── Fundo branco, e não mais a foto escura ────────────────────────────────
 * A foto de fundo saiu junto com as duas camadas de véu que existiam só para
 * proteger o texto dela. Uma foto no fim da página competia com a decisão que
 * este bloco pede: a essa altura a pessoa já viu seis fotos do Caio e cinco
 * vídeos de protetores, e mais uma imagem aqui só divide a atenção com os dois
 * botões. No branco eles são a única coisa colorida da tela.
 *
 * ── Os dois botões são doação, e a diferença entre eles é a frequência ─────
 * Antes o segundo era "tenho uma dúvida antes de doar", que descia para o FAQ.
 * No fim da página a dúvida já passou - o FAQ está logo acima -, e mandar a
 * pessoa de volta para ler no exato momento em que ela decidiu é oferecer uma
 * saída no lugar de um caminho. Agora os dois pedem a doação: um agora, outro
 * todo mês.
 *
 * O mensal não é o "menor" dos dois: ele tem o mesmo tamanho, o mesmo peso e
 * cor cheia. O que os separa no fundo branco é a pintura - o "escolher um
 * valor" sai em contorno verde (a cor de doação da página) e o mensal em
 * vermelho cheio, que é o par de cores da marca.
 */
export default function CtaFinal() {
  return (
    <section className="bg-surface py-[clamp(3rem,7vh,5rem)]">
      {/* #ui:cta-final */}
      <div className="container-narrow flex max-w-[660px] flex-col gap-5">
        {/* Uma linha só, centralizada em qualquer largura, como as cabeças de
            seção. `max-w` em `ch` para a frase quebrar em duas linhas curtas no
            desktop em vez de atravessar a coluna inteira. */}
        <Reveal className="flex flex-col gap-4 text-center">
          <h2 className="mx-auto max-w-[24ch] text-balance text-[clamp(1.395rem,0.93rem+1.86vw,2.209rem)] font-extrabold leading-[1.15] text-ink-900">
            {copyFinal.title}
          </h2>

          {/*
            Lado a lado a partir de `md`, empilhados abaixo disso: são dois
            rótulos longos, e nenhum CTA da página quebra linha
            (`whitespace-nowrap`), então o que não couber estoura para fora do
            botão em vez de descer. Em `sm` (640px) sobravam ~280px por botão e
            "Quero ajudar todo mês" em maiúsculas passa disso numa tela alta,
            onde a fonte vai ao topo do `clamp`; em `md` são ~324px, com folga.
            `flex-1` + `basis-0` dá aos dois exatamente a mesma medida, para que
            nenhum pareça o principal.
          */}
          <div className="flex flex-col gap-3 md:flex-row">
            {/* Abre a tela de valor direto - é o que o rótulo promete. Sem
                JavaScript ele continua sendo um link para o bloco de doação. */}
            <DonateMenuButton className="inline-flex min-h-[56px] flex-1 basis-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-donate bg-surface px-6 text-center text-[clamp(0.872rem,1.488vh,0.988rem)] font-extrabold uppercase tracking-[0.03em] text-donate transition-colors hover:bg-donate hover:text-donate-ink">
              {copyFinal.ctaPrimary}
              <IconArrowRight size={20} className="shrink-0" />
            </DonateMenuButton>

            {/* Este abre a tela de valor travada na mensal: sem as abas de
                frequência e terminando no checkout de recorrência - ver
                `MonthlyDonateButton`. */}
            <MonthlyDonateButton className="inline-flex min-h-[56px] flex-1 basis-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-action px-6 text-center text-[clamp(0.872rem,1.488vh,0.988rem)] font-extrabold uppercase tracking-[0.03em] text-action-ink shadow-[0_10px_30px_-10px_rgba(191,5,33,.5)] transition-colors hover:bg-action-hover">
              <IconPaw size={20} className="shrink-0" />
              {copyFinal.ctaSecondary}
            </MonthlyDonateButton>
          </div>

          {/* A mesma linha de confiança que fecha a seção "Como ajudar", agora
              na pintura do fundo claro: cinza com o escudo verde, em vez do
              branco translúcido que ela usava sobre a foto. */}
          <p className="flex flex-wrap items-center justify-center gap-x-1.5 text-center text-fs12 font-semibold text-ink-600">
            <IconShield size={15} className="shrink-0 text-donate" />
            {copyFinal.seal}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
