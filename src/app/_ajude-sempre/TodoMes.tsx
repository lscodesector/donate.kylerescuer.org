"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type SVGProps,
} from "react";
import { campaign } from "@/lib/campaign";
import { checkoutItemFor, openCheckout } from "@/lib/checkout-bus";
import { donationAmountsMensal } from "@/lib/config";
import { formatBRLCurto, formatBRLInteiro } from "@/lib/format";
import { openDonationModal } from "@/lib/modais";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  M · TODO MÊS - o pedido de recorrência, com a escada junto           ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * O bloco que só existe em `/ajude-sempre`. Ele ocupa, na ordem da página, o
 * lugar em que a raiz põe o "Pix direto" (bloco 05) - e é a troca que define
 * a página: chave Pix solta é pagamento de uma vez, e numa página que pede
 * recorrência ela seria o atalho para a pessoa fazer justamente a outra coisa.
 *
 * Bloco isolado, como todos: o texto, a escada, os ícones e a revelação ao
 * rolar moram aqui. De fora entram só `@/lib` - os valores da mensal, os
 * números da campanha, a formatação de dinheiro e o gatilho do modal.
 *
 * ── O que ele responde, na ordem ──────────────────────────────────────────
 *   1. por que **todo mês**, e não uma vez - a conta que volta em trinta dias
 *   2. quanto, com três degraus e o que cada um sustenta
 *   3. as três objeções da recorrência - controle, cancelamento, cobrança
 *
 * O passo 3 vem depois do botão de propósito: quem já decidiu não precisa ler,
 * e quem parou no botão parou por causa de uma dessas três.
 */

/* ─────────────────────────────────────────────────── conteúdo do bloco ──── */

const copyTodoMes = {
  eyebrow: "Por que todo mês",
  title: "A fome não acontece uma vez. A conta do abrigo também não.",
  lead: "Uma doação única salva um mês. A doação que se repete é o que deixa o Caio combinar a ração de novembro em outubro, marcar a cirurgia para a semana que vem e olhar o aluguel sem medo.",
  escadaTitle: "Escolha quanto você consegue por mês",
  /* O botão que **não** pula a tela de valores: os três degraus acima vão
     direto para o checkout, e este é o caminho de quem não se viu em nenhum
     deles. O rótulo diz isso - "com outros valores" é a única coisa que
     separa este clique dos três de cima, e sem essa metade ele leria como um
     quarto degrau sem preço. */
  cta: "Faça a diferença com outros valores",
};

/**
 * A faixa vermelha - o mesmo pedido, lido por dia.
 *
 * ⚠️ **O valor não é escrito aqui, e a divisão é declarada na tela.** "R$ 1
 * por dia" é `degrauPopular` dividido por 30, calculado na renderização: se a
 * escada de `lib/config.ts` mudar, a faixa acompanha em vez de anunciar um
 * número que a tela seguinte não tem.
 *
 * ⚠️ **A linha `mes` é o preço, não uma explicação.** Ela já foi um parágrafo
 * ("São R$ 30 por mês, numa cobrança só. Não é cobrado todo dia…") e saiu por
 * ser prosa demais para o lugar. O que **não** pode sair é a cifra mensal: sem
 * ela a faixa anuncia um preço por dia para uma cobrança que é mensal, e a
 * pessoa lê "R$ 1" e autoriza um débito de R$ 30. Duas palavras bastam; zero,
 * não.
 */
const copyPorDia = {
  eyebrow: "Uma doação de",
  /** Sufixo do número grande. O número em si vem da escada, não daqui. */
  unidade: "por dia",
  /** `{valor}` é trocado na renderização - o número sai da escada. */
  mes: "{valor} por mês",
  cta: "Quero doar {porDia} por dia",
};

/**
 * Os três degraus que a página oferece na tela, antes do modal.
 *
 * ⚠️ Os valores **não são escritos aqui**: eles são lidos de
 * `donationAmountsMensal` (`lib/config.ts`), que é a mesma escada que o modal
 * desenha. Escrever "R$ 30" neste arquivo seria criar um segundo lugar em que
 * o valor da campanha mora, e o dia em que a escada mudasse esta página
 * anunciaria um valor que a tela seguinte não tem.
 *
 * São três, e não os nove do modal, porque aqui eles não são uma grade de
 * escolha - são o exemplo que dá tamanho ao pedido. A escolha inteira está a
 * um toque, na tela que qualquer um dos três abre.
 *
 * ── Sobre o que cada linha diz ────────────────────────────────────────────
 * Elas nomeiam **a que parte da conta** o valor vai, e nenhuma promete
 * quantidade: "X refeições por mês" seria um número que esta página não tem
 * como comprovar, num lugar em que ela está pedindo dinheiro. As linhas da
 * conta são as mesmas da tabela de custos que a seção de transparência
 * publica logo abaixo - ração, consultas e cirurgias, aluguel dos abrigos.
 */
/**
 * O degrau que a campanha aponta como o mais escolhido - R$ 30 hoje.
 *
 * Sai da lista, e não de um número escrito aqui: é ele que a faixa vermelha
 * lê por dia e é ele que o degrau do meio destaca. Se o `popular` mudar de
 * valor em `lib/config.ts`, os dois mudam juntos.
 */
const degrauPopular =
  donationAmountsMensal.find((a) => a.popular) ?? donationAmountsMensal[1]!;

/**
 * Em quantos dias a mensalidade é dividida para virar "por dia".
 *
 * 30, e não 30,44 (a média do ano): é o número que qualquer pessoa refaz de
 * cabeça a partir da cifra mensal que está na mesma faixa. Com 30, R$ 30 dá
 * exatamente R$ 1 e R$ 15 dá exatamente R$ 0,50 - a divisão fecha redonda nos
 * dois valores que a página oferece, que é o que faz a leitura por dia valer a
 * pena.
 */
const DIAS_DO_MES = 30;

/** A mensalidade lida por dia, em centavos. */
function porDia(cents: number) {
  return Math.round(cents / DIAS_DO_MES);
}

const degraus = [
  {
    cents: donationAmountsMensal[0]!.cents,
    label: "Entra na ração do mês",
    text: "O primeiro dos cinco itens da conta, e o que acaba antes do fim do mês quando falta.",
  },
  {
    /* O degrau do meio é o marcado como `popular` na escada da campanha - o
       mesmo selo que o modal desenha, e o mesmo valor que a faixa vermelha
       lê por dia. Ver `degrauPopular`. */
    cents: degrauPopular.cents,
    label: "Ajuda a manter o tratamento",
    text: "Consultas, remédios e cirurgia são a maior linha da conta dos abrigos - e a que não espera.",
    destaque: true,
  },
  {
    cents: donationAmountsMensal[3]!.cents,
    label: "Segura o aluguel do abrigo",
    text: "Foi a conta que quase fechou o Salve Cão. Porta aberta é o que todo o resto depende.",
  },
];

/**
 * As três objeções da recorrência, respondidas onde elas aparecem.
 *
 * ⚠️ Cada resposta precisa continuar verdadeira no checkout. "Cancele quando
 * quiser" é o Pix Automático do Banco Central: o mandato é cancelado pelo app
 * do próprio banco, sem depender de alguém desta campanha responder. Se um dia
 * a recorrência mudar de meio de pagamento, é esta lista que se revisa antes de
 * qualquer outra coisa - promessa de cancelamento é a que vira reclamação.
 */
const objecoes = [
  {
    icon: "shield" as const,
    title: "Você cancela quando quiser",
    text: "A autorização fica no app do seu banco, junto com as outras. Cancelar é lá, em dois toques, sem pedir para ninguém.",
  },
  {
    icon: "calendar" as const,
    title: "É o mesmo dia, todo mês",
    text: "O valor que você escolheu, na data em que a primeira doação foi feita. Nada muda sozinho.",
  },
  {
    icon: "receipt" as const,
    title: "Quem recebe tem CNPJ",
    text: "A SOS Animal Help, com o cartão da Receita publicado nesta mesma página, logo abaixo.",
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

const IconShield = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const IconCalendar = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 11h18" />
  </svg>
);

const IconReceipt = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2Z" />
    <path d="M9 8h6M9 12h6" />
  </svg>
);

const ICONES = {
  shield: IconShield,
  calendar: IconCalendar,
  receipt: IconReceipt,
};

/**
 * A patinha branca do pedido mensal - mesmo desenho de `IconPaw` em
 * `01-menu.tsx`, `02-hero.tsx`, `14-cta-final.tsx` e `16-flutuante.tsx`.
 * `fill="currentColor"` herda o branco de `text-action-ink` sozinho.
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

/* ────────────────────────────────────────────── utilitários do bloco ──── */

/**
 * Revelação ao entrar na viewport. Sem biblioteca: IntersectionObserver +
 * uma classe CSS. Dispara uma vez e desconecta. É o mesmo `Reveal` dos outros
 * blocos - cada bloco carrega o seu, que é a regra da página (ver
 * `docs/UI-MAP.md`).
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

    if (typeof IntersectionObserver === "undefined") {
      node.dataset.visible = "true";
      return;
    }

    /* Já dentro da primeira tela quando a página carrega: revela na hora, sem
       passar pelo observer - o `rootMargin` negativo abaixo cria uma faixa
       morta na base da janela, e um bloco que nasce dentro dela nunca
       intersecta. Ver o comentário longo em `07-doar.tsx`. */
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
 * Cabeça de seção: eyebrow, título e linha de apoio - sem ícone e
 * centralizada, que é o padrão de todas as seções da página.
 */
function SectionHead({
  eyebrow,
  title,
  lead,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: string;
}) {
  return (
    <Reveal className="flex flex-col items-center gap-3 text-center">
      <div className="flex flex-col gap-1">
        {eyebrow && (
          <p className="text-fs13 font-extrabold uppercase tracking-[0.12em] text-accent">
            {eyebrow}
          </p>
        )}
        <h2 className="text-[clamp(1.279rem,0.977rem+1.209vw,1.976rem)] font-extrabold leading-[1.15] text-ink-900">
          {title}
        </h2>
      </div>

      {lead && (
        <p className="mx-auto max-w-[62ch] text-fs16 leading-[1.6] text-ink-600">
          {lead}
        </p>
      )}
    </Reveal>
  );
}

/* ──────────────────────────────────────────────────────────── o bloco ──── */

/**
 * A conta que dá tamanho ao pedido: quantas doações de ticket médio, todo mês,
 * fecham a meta da campanha.
 *
 * ⚠️ **É divisão, não estatística.** Os dois números vêm de `lib/campaign.ts`
 * (`goal` é a mesma soma da tabela de custos que a seção de transparência
 * publica; `avgTicket` é o ticket médio que a campanha já usa), e a conta é
 * feita aqui na frente de quem lê. Nenhum dos dois é "quantas pessoas doam
 * hoje" - essa informação esta página não tem, e o texto não a insinua.
 *
 * A conta é feita no corpo do componente, e não em `useMemo`: são duas
 * constantes de build divididas uma pela outra, e o resultado é o mesmo no
 * servidor e no navegador - sem risco de divergência de hidratação.
 */
function ContaDaMeta() {
  const apoiadores = Math.ceil(campaign.goal / campaign.avgTicket);

  return (
    <Reveal
      delay={1}
      className="flex flex-col gap-2 rounded-md border border-donate/25 bg-donate/[.07] p-4 text-center sm:p-5"
    >
      <p className="text-fs15 leading-[1.6] text-ink-900">
        Os cinco abrigos custam{" "}
        <strong className="font-extrabold">
          {formatBRLInteiro(campaign.goal)} por mês
        </strong>
        . Nessa conta,{" "}
        <strong className="font-extrabold text-donate-text tabular-nums">
          {apoiadores.toLocaleString("pt-BR")} pessoas
        </strong>{" "}
        doando {formatBRLCurto(campaign.avgTicket * 100)} todo mês fecham a conta
        inteira - e ela para de ser refeita do zero em cada trinta dias.
      </p>
    </Reveal>
  );
}

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  A FAIXA VERMELHA - o mesmo pedido, lido por dia                      ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Vermelho cheio, e é o único bloco da página inteira que grita: `bg-action`
 * com o número em branco, e o botão invertido (branco com texto vermelho) por
 * cima. Os outros CTAs da página são vermelhos **sobre** fundo claro; aqui a
 * relação se inverte, e é isso que faz a faixa saltar de uma página que, fora
 * ela, é toda creme e branca.
 *
 * ── O que ela é, e o que ela não é ────────────────────────────────────────
 * Ela **não** é um quarto degrau. É o mesmo R$ 30 do degrau do meio, dito de
 * outro jeito - e vai para o mesmo checkout, com o mesmo `valorDireto`. Quem
 * clica aqui e quem clica no degrau de R$ 30 chegam na mesma tela, com o mesmo
 * valor. Por isso ela vem **antes** da escada: é a leitura mais fácil do
 * pedido, e a escada logo abaixo é para quem quiser outro tamanho.
 *
 * ⚠️ Ver `copyPorDia` para o porquê da linha do "numa cobrança só". Ela é a
 * parte não negociável desta faixa.
 */
function FaixaPorDia() {
  const centsMes = degrauPopular.cents;
  const centsDia = porDia(centsMes);
  const valorDia = formatBRLCurto(centsDia);

  return (
    <Reveal delay={1} className="overflow-hidden rounded-md bg-action text-action-ink">
      <div className="flex flex-col items-center gap-3 px-4 py-5 text-center sm:px-6">
        <p className="text-fs12 font-extrabold uppercase tracking-[0.16em] text-action-ink/75">
          {copyPorDia.eyebrow}
        </p>

        {/* O número e a unidade numa linha só, alinhados pela base: o valor é
            o que a pessoa lê primeiro, e "por dia" é a legenda dele - não uma
            segunda informação do mesmo tamanho. */}
        <p className="flex flex-wrap items-baseline justify-center gap-x-3">
          <span className="text-[clamp(2.093rem,1.628rem+1.86vw,3.023rem)] font-extrabold leading-none tracking-[-0.01em]">
            {valorDia}
          </span>
          <span className="text-[clamp(1.046rem,0.93rem+0.465vw,1.279rem)] font-extrabold uppercase leading-none tracking-[0.04em] text-action-ink/85">
            {copyPorDia.unidade}
          </span>
        </p>

        {/* ⚠️ A cifra mensal, sem a qual a faixa vira um preço por dia para
            uma cobrança que não é diária. Ver `copyPorDia`. */}
        <p className="text-fs13 font-semibold text-action-ink/85">
          {copyPorDia.mes.replace("{valor}", formatBRLCurto(centsMes))}
        </p>

        {/* Invertido: branco com texto vermelho. É o mesmo destino do degrau
            de R$ 30 - mesmo checkout, mesmo `valorDireto`. */}
        <button
          type="button"
          onClick={() =>
            openCheckout(
              checkoutItemFor({
                amountCents: centsMes,
                mensal: true,
                somenteMensal: true,
                valorDireto: true,
              }),
            )
          }
          className="inline-flex min-h-[56px] w-full max-w-[420px] items-center justify-center gap-2.5 text-balance rounded-full bg-surface px-5 py-3 text-center text-[clamp(0.93rem,0.883rem+0.279vw,1.046rem)] font-extrabold uppercase leading-tight tracking-[0.03em] text-action transition-colors hover:bg-surface-alt sm:px-8"
        >
          <IconPaw size={19} className="shrink-0" />
          {copyPorDia.cta.replace("{porDia}", valorDia)}
        </button>
      </div>
    </Reveal>
  );
}

/**
 * O bloco inteiro.
 *
 * O `id` é `todo-mes` e não `doar`: `DOAR_HREF` (`#doar`) continua sendo o
 * bloco 07, que nesta página abre em modo mensal - o cabeçalho, o hero e o
 * rodapé apontam para lá, e ter duas âncoras disputando o mesmo nome quebraria
 * a navegação sem JavaScript.
 */
export default function TodoMes() {
  return (
    <section id="todo-mes" className="surface-alt py-[clamp(2.5rem,6vh,4.5rem)]">
      {/* #ui:todo-mes */}
      <div className="container-narrow flex max-w-[660px] flex-col gap-[clamp(1.5rem,4vh,2.25rem)]">
        <SectionHead
          eyebrow={copyTodoMes.eyebrow}
          title={copyTodoMes.title}
          lead={copyTodoMes.lead}
        />

        <ContaDaMeta />

        {/* A leitura mais fácil do pedido, antes da escada - ver
            `FaixaPorDia`. Ela não é um quarto degrau: é o mesmo R$ 30 do
            degrau do meio, dito por dia. */}
        <FaixaPorDia />

        {/* ── A escada ──────────────────────────────────────────────────
            Três botões de verdade, e cada um vai **direto para o checkout**,
            pulando a tela de valores.

            ── Por que o pulo ────────────────────────────────────────────
            O valor já está escrito no botão que a pessoa clicou. Abrir uma
            grade de nove degraus depois disso é pedir de novo uma decisão já
            tomada, e no meio do caminho oferecer oito respostas diferentes da
            que ela acabou de dar. Quem não se viu em nenhum dos três tem o
            botão logo abaixo, que é o que abre a grade inteira.

            O checkout recebe `valorDireto`, e é ele que faz a etapa de dados
            mostrar o valor com um botão de aumentá-lo: quem pulou a tela de
            valores nunca viu o número numa tela de conferência, e é lá que
            ele reaparece. Ver `CheckoutItem.valorDireto`.

            Não é uma grade de seleção: não há estado aqui, não há "escolhido"
            nenhum para guardar - o clique já é o passo seguinte.

            Empilhados no celular e em três colunas a partir de `sm`: o valor
            é o que precisa ser lido primeiro, e ele é a linha maior de cada
            cartão. */}
        <div className="flex flex-col gap-3">
          <Reveal className="text-center">
            <h3 className="text-fs16 font-extrabold text-ink-900">
              {copyTodoMes.escadaTitle}
            </h3>
          </Reveal>

          <div className="grid gap-3 sm:grid-cols-3">
            {degraus.map((degrau, i) => (
              <Reveal key={degrau.cents} delay={(i % 3) as 0 | 1 | 2}>
                <button
                  type="button"
                  onClick={() =>
                    openCheckout(
                      checkoutItemFor({
                        amountCents: degrau.cents,
                        mensal: true,
                        somenteMensal: true,
                        valorDireto: true,
                      }),
                    )
                  }
                  className={`flex h-full w-full flex-col items-center gap-1.5 rounded-md border-2 bg-surface p-4 text-center transition-colors ${
                    degrau.destaque
                      ? "border-action hover:bg-action/[.06]"
                      : "border-ink-900/[.12] hover:border-donate hover:bg-donate/[.05]"
                  }`}
                >
                  <span className="text-[clamp(1.279rem,1.116rem+0.651vw,1.628rem)] font-extrabold leading-none text-ink-900 tabular-nums">
                    {formatBRLCurto(degrau.cents)}
                  </span>
                  <span className="text-fs12 font-semibold uppercase tracking-[0.06em] text-ink-600">
                    por mês
                  </span>
                  <span className="mt-1 text-fs14 font-extrabold leading-[1.3] text-ink-900">
                    {degrau.label}
                  </span>
                  <span className="text-fs12 leading-[1.5] text-ink-600">
                    {degrau.text}
                  </span>
                </button>
              </Reveal>
            ))}
          </div>
        </div>

        {/* O botão que não pede valor nenhum: para quem não se viu em nenhum
            dos três e quer ir direto para a grade inteira. Mesma pintura do
            pedido mensal em todo o resto do site - vermelho de marca e
            patinha branca. */}
        <Reveal delay={2} className="flex flex-col items-center gap-4">
          {/*
            ⚠️ **Sem `whitespace-nowrap`**, que é o padrão dos outros CTAs da
            página - e a exceção tem motivo: este rótulo é o mais longo do
            site. "FAÇA A DIFERENÇA COM OUTROS VALORES" em maiúsculas pede
            ~286px só de texto, e numa tela de 320px sobram ~240px dentro do
            botão. Com `nowrap` ele não descia para a segunda linha: estourava
            a borda, e as últimas letras saíam do vermelho.

            Nos outros botões o respiro lateral resolve (ver o comentário em
            `07-doar.tsx`); aqui nem `px-0` resolveria. Então ele quebra, e o
            `min-h` deixa de ser a altura e passa a ser o piso: `py-3` dá a
            folga da segunda linha, e `text-balance` reparte as duas em vez de
            deixar uma longa e outra com duas palavras.

            ⚠️ São **duas linhas em qualquer largura**, e não só no celular: o
            botão está preso em `max-w-[420px]`, então a medida dele não cresce
            com a tela e a frase nunca ganha espaço para fechar em uma. É de
            propósito - o mesmo botão, com a mesma cara, do celular ao desktop.
            Quem quiser a linha única aqui precisa afrouxar o `max-w`, e aí ele
            fica mais largo que os três degraus logo acima.
          */}
          <button
            type="button"
            onClick={() => openDonationModal({ freq: "mensal", somenteMensal: true })}
            className="inline-flex min-h-[60px] w-full max-w-[420px] items-center justify-center gap-2.5 text-balance rounded-full bg-action px-5 py-3 text-center text-[clamp(0.93rem,0.883rem+0.279vw,1.046rem)] font-extrabold uppercase leading-tight tracking-[0.03em] text-action-ink transition-colors hover:bg-action-hover sm:px-8"
          >
            <IconPaw size={20} className="shrink-0" />
            {copyTodoMes.cta}
          </button>

          {/* As três objeções, depois do botão: quem já decidiu não precisa
              lê-las, e quem parou aqui parou por causa de uma delas. */}
          <ul className="grid w-full gap-3 sm:grid-cols-3">
            {objecoes.map(({ icon, title, text }) => {
              const Icon = ICONES[icon];
              return (
                <li key={title} className="flex flex-col items-center gap-1.5 text-center">
                  <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-donate/10 text-donate">
                    <Icon size={17} />
                  </span>
                  <span className="text-fs13 font-extrabold text-ink-900">{title}</span>
                  <span className="text-fs12 leading-[1.5] text-ink-600">{text}</span>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
