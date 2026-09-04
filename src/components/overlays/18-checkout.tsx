"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from "react";
import {
  CHECKOUT_EVENT,
  setCheckoutOpen,
  suppressNextBackIntercept,
  type CheckoutItem,
} from "@/lib/checkout-bus";
import {
  checkoutFee,
  donationAmountsMensal,
  donationAmountsUnica,
  feeCentsFor,
  org,
  whatsappWith,
} from "@/lib/config";
import { formatUSDCurto, isValidPhoneBR, maskPhoneBR } from "@/lib/format";
import { GiveWpCheckout } from "@/components/payments/givewp-checkout";
import { openDonationModal } from "@/lib/modais";
import { givewp } from "@/lib/payments/givewp";
import { payments } from "@/lib/payments/lusa";
import {
  clearLeadId,
  sendInitiateCheckoutToNest,
  trackDonationPaid,
  trackInitiateCheckout,
  type LeadTracking,
} from "@/lib/payments/tracking";
import { useScrollLock } from "@/lib/scroll-lock";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  18 · CHECKOUT - dados, pagamento e confirmação                       ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Bloco isolado no que é desenho: os ícones e as cinco etapas moram aqui.
 *
 * ⚠️ **Zona crítica.** Nada do que decide dinheiro desce para este arquivo:
 * o `clientId` do PayPal, o CNPJ do recebedor, a taxa e o mínimo da
 * recorrência vêm de
 * `lib/config`; a criação da cobrança, o mandato e a leitura do status vêm de
 * `lib/payments/lusa`; os eventos de conversão, de `lib/payments/tracking`.
 * Uma cópia de qualquer um deles aqui dentro é uma divergência esperando o
 * dia em que alguém corrigir só um dos dois lugares.
 */

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

/** A seta do "aumentar para R$ X", na faixa do valor da etapa de dados. */
const IconArrowUp = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 19V5" />
    <path d="m5 12 7-7 7 7" />
  </svg>
);

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

/* ──────────────────────────────────────────────────────────── o bloco ──── */

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  CHECKOUT - modal sobre a landing, nunca outra página                 ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Antes, cada CTA de doação era um link para `/doar/<faixa>`: a pessoa saía da
 * página, perdia o lugar em que estava e, se desistisse, voltava para o topo.
 * Agora o clique abre este modal por cima da landing. As rotas `/doar/*`
 * continuam existindo - ver o aviso sobre elas no fim deste bloco.
 *
 * ── As etapas ─────────────────────────────────────────────────────────────
 *
 *   `dados`      nome, doação anônima, WhatsApp opcional e a opção de cobrir
 *                a taxa. Termina em "Continue to payment".
 *   `pagamento`  o resumo dos valores e os botões do PayPal - **PayPal** e
 *                **cartão de crédito ou débito**, um botão para cada. Desde
 *                04/09/2026 quem cria e captura o pedido é o **GiveWP**, pelas
 *                rotas REST de `givewp.kylerescuer.org` (ver
 *                `components/payments/givewp-paypal.tsx` e
 *                `lib/payments/givewp.ts`) - não mais o SDK no navegador.
 *                A doação passa a existir no painel do GiveWP, e o pedido vai
 *                ao PayPal marcado como `category: DONATION`.
 *                ⚠️ Isso cobra na conta conectada no GiveWP, que **não** é a
 *                do checkout anterior - ver o comentário em `StepPagamento`.
 *   `pago`       só quando o PayPal confirma a captura. Ver o bloco abaixo.
 *   `erro`       o caminho ruim, com botão de tentar de novo.
 *
 * A escolha da faixa de kg **não** é uma etapa daqui: ela acontece na seção de
 * ração, onde a pessoa vê a foto do saco, o preço e quantos animais aquilo
 * alimenta. Trazer isso para dentro do modal seria mostrar a mesma grade duas
 * vezes.
 *
 * ── 🔁 ⚠️ DOAÇÃO MENSAL: O CHECKOUT NÃO FECHA ELA ⚠️ ─────────────────────
 * A etapa de pagamento da mensal **não mostra botão nenhum**: ela diz que a
 * doação recorrente é combinada pelo WhatsApp e leva para lá.
 *
 * O motivo agora é do lado do GiveWP: a rota `/donate` fixa
 * `donationType: 'single'` e o form 10 está com `subscriptionsEnabled: false`
 * - não há recorrência a criar. (Antes o motivo era outro: faltava um
 * `plan_id` do PayPal para o SDK assinar no navegador. Aquele caminho foi
 * removido junto com a cobrança direta.)
 *
 * Isso é escolha, e não esquecimento: cobrar a mensal como uma doação única e
 * chamá-la de "todo mês" é prometer um débito que nunca vai acontecer. Ligar a
 * recorrência passa por habilitar assinatura no form do GiveWP e ensinar a
 * rota a aceitar `donationType: 'subscription'`.
 *
 * O que a mensal já tem de diferente na etapa de dados:
 *
 *   • **não há taxa a cobrir** nem **doação anônima**. A taxa porque ela
 *     entraria em toda cobrança de todo mês, para sempre - o que a pessoa
 *     aceitou uma vez viraria um acréscimo permanente. O anônimo porque a
 *     assinatura vai ao PayPal com o nome de quem paga, e a caixa prometia um
 *     anonimato que a tela seguinte desmente.
 *
 * ── O desenho é o do print, e o CTA fica fora do scroll ──────────────────
 * As telas seguem `public/designe-checkout` - cabeçalho com "Voltar" escrito,
 * formulário em uma coluna e o painel verde da taxa. Saíram de lá para cá as
 * duas barrinhas de progresso e a faixa que repetia o valor doado: nenhuma das
 * duas existe no print, e a faixa era a maior peça fixa da etapa.
 *
 * O CTA da etapa de dados mora num rodapé que não rola. Na de pagamento não há
 * rodapé: quem conclui ali são os botões do PayPal, e um botão nosso ao lado
 * dos deles seria um segundo "pagar" que não paga.
 *
 * ── ✅ A tela de sucesso depende do pagamento, e só dele ──────────────────
 * `pago` é inalcançável por clique. Não existe "já fiz o pagamento" e não
 * existe timeout que conclua. A única porta é o `/donate` do GiveWP responder
 * que a doação foi criada, depois de o PayPal ter aprovado - é isso que
 * confirma que o dinheiro saiu.
 *
 * Some daqui, junto com o Pix, tudo o que existia para contornar o app do
 * banco: o polling de status, a consulta à planilha no retorno da aba e o
 * "aguardando confirmação". O PayPal resolve o pagamento na mesma aba (ou num
 * popup que devolve o foco), e quem aprova volta com a resposta na mão.
 */

type Etapa = "dados" | "pagamento" | "pago" | "erro";

type Dados = {
  nome: string;
  anonimo: boolean;
  whatsapp: string;
  cobrirTaxa: boolean;
};

const DADOS_VAZIOS: Dados = {
  nome: "",
  anonimo: false,
  whatsapp: "",
  cobrirTaxa: checkoutFee.defaultChecked,
};

const FOCALIZAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Rótulo do item como ele é conciliado no gateway: "5 KG DE RAÇÃO". */
function productTitleFor(item: CheckoutItem) {
  return item.title.toUpperCase();
}

export default function Checkout() {
  const [item, setItem] = useState<CheckoutItem | null>(null);
  const [etapa, setEtapa] = useState<Etapa>("dados");
  const [dados, setDados] = useState<Dados>(DADOS_VAZIOS);
  const [erro, setErro] = useState<string | null>(null);
  const [tentouEnviar, setTentouEnviar] = useState(false);
  /**
   * Quantas vezes esta doação já foi levada à etapa de pagamento.
   *
   * É estado, e não o `geracaoRef` logo abaixo, porque quem lê é a `key` de
   * `StepPagamento` - e ref não se lê durante a renderização. Cada volta aos
   * dados e cada "tentar de novo" incrementa, e é isso que remonta os botões
   * do PayPal do zero em vez de deixar na tela um iframe do valor anterior.
   */
  const [tentativa, setTentativa] = useState(0);

  const dialogRef = useRef<HTMLDivElement>(null);
  const gatilhoRef = useRef<HTMLElement | null>(null);
  /** Descarta o que não é da doação mais recente (tentar de novo, taxa trocada). */
  const geracaoRef = useRef(0);
  /** O InitiateCheckout desta doação, que o Purchase completa depois. */
  const leadRef = useRef<LeadTracking | null>(null);
  /* A identidade do lead, em estado: o ref não pode ser lido no render, e é
     o render que a entrega ao pagamento. Ela TEM que ser a mesma dos dois
     lados - ver o aviso em `GiveWpCheckout`. */
  const [doador, setDoador] = useState<{
    leadId: string;
    email: string;
    primeiroNome: string;
    sobrenome: string;
  } | null>(null);
  /** Purchase é uma vez por doação, mesmo que dois botões se cruzem. */
  const pagoRef = useRef(false);
  /** O InitiateCheckout é uma vez por entrada na etapa de pagamento. */
  const icRef = useRef(0);

  const aberto = item !== null;
  useScrollLock(aberto);

  /* --- abrir ------------------------------------------------------------ */
  useEffect(() => {
    const onAbrir = (e: Event) => {
      const detalhe = (e as CustomEvent<CheckoutItem>).detail;
      gatilhoRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      geracaoRef.current += 1;
      leadRef.current = null;
      pagoRef.current = false;
      icRef.current = 0;
      setItem(detalhe);
      setEtapa("dados");
      setDados(DADOS_VAZIOS);
      setErro(null);
      setTentouEnviar(false);
      setTentativa(0);
    };

    window.addEventListener(CHECKOUT_EVENT, onAbrir);
    return () => window.removeEventListener(CHECKOUT_EVENT, onAbrir);
  }, []);

  /* --- fechar ----------------------------------------------------------- */
  const fechar = useCallback(() => {
    setItem(null);
    gatilhoRef.current?.focus();
  }, []);

  /*
   * Enquanto o modal estiver aberto ele é dono do botão "voltar": uma entrada
   * própria no histórico, e o `popstate` fecha o modal em vez de tirar a
   * pessoa da página. O `setCheckoutOpen` avisa o `BackIntercept` para ficar
   * quieto nesse intervalo - sem isso os dois disputam o mesmo "voltar" e a
   * oferta de retenção aparece por cima do checkout.
   */
  useEffect(() => {
    if (!aberto) {
      setCheckoutOpen(false);
      return;
    }

    setCheckoutOpen(true);
    history.pushState({ sosCheckout: true }, "");

    const onPopState = () => fechar();
    window.addEventListener("popstate", onPopState);

    return () => {
      setCheckoutOpen(false);
      window.removeEventListener("popstate", onPopState);
      /* Fechado pelo X, pelo Esc ou pelo fundo: a entrada sintética continua
         no histórico e precisa sair, senão o próximo "voltar" não faz nada.
         O `popstate` que isso gera chega com o checkout já fechado - daí a
         bandeira, para o `BackIntercept` não confundir com uma saída. */
      if (history.state?.sosCheckout) {
        suppressNextBackIntercept();
        history.back();
      }
    };
  }, [aberto, fechar]);

  /* --- Esc e foco preso -------------------------------------------------- */
  useEffect(() => {
    if (!aberto) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        fechar();
        return;
      }
      if (e.key !== "Tab") return;

      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(FOCALIZAVEIS);
      if (!nodes || nodes.length === 0) return;
      const primeiro = nodes[0];
      const ultimo = nodes[nodes.length - 1];

      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [aberto, fechar]);

  /* Foco no começo de cada etapa, para quem navega por teclado ou leitor. */
  useEffect(() => {
    if (!aberto) return;
    const alvo = dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]");
    (alvo ?? dialogRef.current)?.focus();
  }, [aberto, etapa]);

  /* --- contas ------------------------------------------------------------ */
  /* Doação mensal: outro endpoint, CPF obrigatório e outros textos - ver o
     bloco 🔁 no topo do arquivo. */
  const mensal = item?.kind === "mensal";
  /* `!mensal` é trava, não redundância: na mensal o painel da taxa nem é
     mostrado, então `cobrirTaxa` fica no padrão - e o dia em que
     `checkoutFee.defaultChecked` virar `true` a recorrência sairia com R$ 4,99
     a mais em toda cobrança sem ninguém ter marcado nada. */
  const taxaCents =
    item && dados.cobrirTaxa && !mensal ? feeCentsFor(item.amountCents) : 0;
  const totalCents = (item?.amountCents ?? 0) + taxaCents;

  /*
   * ── Aumentar a doação, sem sair do checkout ─────────────────────────────
   *
   * Só existe para quem entrou por um degrau da escada (`valorDireto`): essa
   * pessoa escolheu o valor num toque, na página, e não tem a grade atrás de
   * si para trocar de ideia. O botão oferece **o degrau seguinte da mesma
   * escada**, com o número escrito no rótulo - e não um "+" mudo, que faz a
   * pessoa apertar para descobrir quanto virou.
   *
   * ⚠️ A escada é a de `lib/config.ts`, a mesma que o modal desenha. Um
   * incremento fixo escrito aqui ("+ R$ 10") passaria por cima dos degraus que
   * a campanha pratica, e num degrau alto ele viraria um aumento sem sentido.
   *
   * No topo da escada não há botão: `find` não acha nada e o valor fica como
   * está. Quem quiser mais do que o último degrau usa o campo livre da tela de
   * valores, que continua a um clique em "outros valores", na página.
   *
   * A conta é feita no corpo do componente, e não em `useMemo`: é um `find`
   * numa lista de nove itens, e ele custa menos que a comparação de
   * dependências que o `useMemo` faria para evitá-lo.
   */
  const escada = mensal ? donationAmountsMensal : donationAmountsUnica;
  const proximoDegrau =
    item?.valorDireto === true
      ? (escada.find((a) => a.cents > item.amountCents)?.cents ?? null)
      : null;

  /*
   * Trocar o valor **da doação**, não o do formulário.
   *
   * Mexer em `item.amountCents` é seguro em qualquer momento da etapa de
   * dados: `taxaCents` e `totalCents` saem dele a cada renderização, e tanto o
   * `trackInitiateCheckout` quanto o pedido do PayPal só acontecem na etapa
   * seguinte ("pagamento"), lendo o `totalCents` daquele instante. Não há
   * nenhum número congelado no meio do caminho para ficar para trás.
   */
  const aumentarDoacao = () => {
    if (proximoDegrau === null) return;
    setItem((atual) => (atual ? { ...atual, amountCents: proximoDegrau } : atual));
  };

  /* --- confirmação de pagamento ------------------------------------------ */
  /**
   * A única porta para a tela de sucesso: o PayPal capturou o dinheiro.
   *
   * `pagoRef` é a trava - dois botões na tela (PayPal e cartão) e um
   * `onApprove` que pode voltar duas vezes não podem virar dois Purchase.
   */
  const confirmarPagamento = useCallback(
    (paypalOrderId: string) => {
      if (pagoRef.current) return;
      pagoRef.current = true;

      trackDonationPaid(leadRef.current, {
        original_value: totalCents / 100,
        currency: givewp.currency,
        settled_at: new Date().toISOString(),
        /* O id da **captura** é o que aparece no extrato do PayPal, mas neste
           fluxo quem captura é o GiveWP e o navegador não o vê - por isso
           `txid` vai vazio, em vez de receber o id do pedido fingindo ser o
           da captura. O Order ID vai no `resource_id`, que é onde o id do
           pedido sempre morou, e é o mesmo valor que o hook do WordPress
           manda ao funil como `donation_id`. */
        txid: "",
        resource_id: paypalOrderId,
      });
      clearLeadId();
      setEtapa("pago");

      /* Um respiro para a confirmação ser lida antes da troca de página. */
      window.setTimeout(() => {
        window.location.href = payments.successUrl;
      }, payments.redirectDelayMs);
    },
    [totalCents],
  );

  /* --- o lead, ao entrar na etapa de pagamento --------------------------- */
  /*
   * O InitiateCheckout é gravado quando a pessoa termina os dados e vê os
   * botões - não quando abre o modal. É o mesmo momento em que a cobrança era
   * criada no gateway antigo, então o funil continua contando a mesma coisa.
   *
   * `icRef` guarda a geração já registrada: voltar para os dados e avançar de
   * novo grava outro lead (é outra tentativa), mas uma rerrenderização no meio
   * da etapa não grava nada.
   */
  useEffect(() => {
    if (etapa !== "pagamento" || !item) return;
    if (icRef.current === geracaoRef.current) return;
    icRef.current = geracaoRef.current;

    const lead = trackInitiateCheckout({
      amountCents: totalCents,
      productName: productTitleFor(item),
      productDescription: item.impact,
      donorName: dados.nome.trim(),
      donorPhone: dados.whatsapp,
      anonymous: dados.anonimo,
      recurring: mensal,
    });
    leadRef.current = lead;
    setDoador({
      leadId: String(lead.lead_id ?? ""),
      email: String(lead.donor_email ?? ""),
      primeiroNome: String(lead.first_name ?? "Anonymous"),
      sobrenome: String(lead.last_name ?? "Donor"),
    });

    /* Não é aguardado: é o botão do PayPal que a pessoa está esperando na
       tela, e o lead viaja com `keepalive`. Ver `sendInitiateCheckoutToNest`. */
    void sendInitiateCheckoutToNest(lead);
    // `dados` entra só na leitura inicial da etapa - mudar nome depois não
    // deve gravar um segundo lead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa, item, totalCents, mensal]);

  const nomeInvalido =
    tentouEnviar && !dados.anonimo && dados.nome.trim().length < 2;
  const whatsappInvalido = tentouEnviar && !isValidPhoneBR(dados.whatsapp);

  const enviarDados = () => {
    setTentouEnviar(true);
    if (!dados.anonimo && dados.nome.trim().length < 2) return;
    if (!isValidPhoneBR(dados.whatsapp)) return;
    setErro(null);
    setEtapa("pagamento");
  };

  const titulo = useMemo(() => {
    switch (etapa) {
      case "dados":
        return "Complete your details";
      case "erro":
        return "Something went wrong";
      case "pago":
        return "Payment confirmed";
      case "pagamento":
        return "Choose how to pay";
    }
  }, [etapa]);

  if (!item) return null;

  /*
   * "Voltar" existe em todas as etapas em que há para onde voltar. Na de
   * dados, o passo anterior não é deste modal: é a tela de valores, que o
   * checkout substituiu ao abrir. Fechamos um e disparamos o outro, na mesma
   * frequência que já estava escolhida - quem entrou por engano no formulário
   * volta para a grade em vez de cair de novo na landing.
   */
  const podeVoltar =
    etapa === "dados" || etapa === "pagamento" || etapa === "erro";

  const voltar = () => {
    if (etapa === "dados") {
      /* Quem entrou por um degrau da escada (`valorDireto`) nunca passou pela
         tela de valores - o passo anterior dela é a página, não uma grade que
         ela não viu. Abrir a grade aqui seria mandar a pessoa "de volta" para
         um lugar onde ela nunca esteve, com os nove degraus que este caminho
         existe justamente para poupar. */
      if (item.valorDireto) {
        fechar();
        return;
      }
      setItem(null);
      openDonationModal({
        freq: mensal ? "mensal" : "unica",
        /* Travada volta travada: quem entrou por um CTA de doação mensal não
           encontra a doação única no caminho de volta. */
        somenteMensal: item.somenteMensal,
      });
      return;
    }
    geracaoRef.current += 1;
    setTentativa((n) => n + 1);
    setEtapa("dados");
  };

  return (
    <div
      /*
       * `p-3`, e não só `sm:p-4`: sem folga nenhuma no celular o cartão virava
       * uma folha colada nas quatro bordas da tela, sem nada do fundo à mostra
       * - lia como uma página nova, não como um modal por cima da página. A
       * margem, por menor que seja, é o que faz a pessoa continuar sentindo
       * que a landing está ali atrás, e não que ela saiu para outro lugar.
       */
      className="fixed inset-0 z-[70] flex items-center justify-center bg-night/70 p-3 anim-fade-in sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) fechar();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-titulo"
        tabIndex={-1}
        /*
         * `90dvh` e não `90vh`: no celular a `vh` ignora a barra do navegador,
         * e o rodapé com o CTA principal ficava atrás dela - que é justamente
         * o botão que precisa estar sempre visível.
         *
         * `rounded-lg` nas quatro bordas em qualquer largura - já foi só nas
         * de cima no celular (`rounded-t-lg`), do tempo em que o cartão ia até
         * a base da tela sem margem. Com margem nos quatro lados, cantos
         * quadrados embaixo ficariam sobrando.
         */
        className="anim-fade-up flex max-h-[92dvh] w-full max-w-[520px] flex-col overflow-hidden rounded-lg bg-surface shadow-xl sm:max-w-[580px]"
      >
      {/* #ui:checkout */}
        {/*
          ── A altura é orçamento, não sobra ──────────────────────────────
          A etapa "Complete seus dados" precisa caber inteira na tela, com o
          botão à vista e sem rolagem: quem rola para achar o "Continue" já
          hesitou uma vez. Cabeçalho, faixa do item, formulário e rodapé foram
          apertados juntos para isso - alturas de campo, respiros entre eles,
          textos de apoio e o resumo de valores. Antes de acrescentar qualquer
          linha aqui, vale lembrar que o orçamento é a tela.
        */}
        {/*
          ── Cabeçalho: "Voltar", título e o X ────────────────────────────
          Escrito por extenso, como no print de referência
          (`public/designe-checkout`) - e não mais uma setinha muda no canto.
          Na etapa de dados ele devolve a pessoa para a tela de valores; nas
          demais, volta um passo dentro do próprio checkout.

          ── O que saiu daqui ─────────────────────────────────────────────
          As duas barrinhas de progresso e a faixa com o valor doado. Nenhuma
          das duas existe no print, e o desenho de lá é o que esta tela segue.
          A faixa era também a maior peça fixa da etapa - sem ela o formulário
          inteiro cabe numa janela de notebook, que era o outro problema.
        */}
        <header className="flex shrink-0 items-center gap-2 px-3 py-2.5 sm:px-4">
          {podeVoltar ? (
            <button
              type="button"
              onClick={voltar}
              aria-label="Back"
              className="flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full px-2 text-fs14 font-semibold text-ink-600 transition-colors hover:bg-surface-alt hover:text-ink-900"
            >
              <IconArrowLeft size={18} />
              Back
            </button>
          ) : (
            <span aria-hidden="true" className="h-[36px] w-[36px] shrink-0" />
          )}

          <h2
            id="checkout-titulo"
            className="flex flex-1 items-center justify-center gap-1.5 text-center text-fs16 font-extrabold leading-tight text-ink-900"
          >
            {titulo}
          </h2>

          {/* Na tela de confirmação não há o que fechar: a página já vai
              trocar sozinha, e um X ali só criaria a dúvida de "perdi algo?". */}
          {etapa === "pago" ? (
            <span aria-hidden="true" className="h-[36px] w-[36px] shrink-0" />
          ) : (
            <button
              type="button"
              onClick={fechar}
              aria-label="Close"
              className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-surface-alt text-ink-600 transition-colors hover:bg-ink-900/10"
            >
              <IconClose size={18} />
            </button>
          )}
        </header>

        {/* ── Corpo (a única parte que rola) ─────────────────────────────
            Creme na etapa do pagamento, branco nas outras: lá o conteúdo é uma
            pilha de cartões brancos, e cartão branco sobre fundo branco não é
            cartão - some a borda e a pilha vira uma lista corrida. */}
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 ${
            etapa === "pagamento" ? "bg-surface-alt" : ""
          }`}
        >
          {etapa === "dados" && (
            <StepDados
              dados={dados}
              setDados={setDados}
              mensal={mensal}
              nomeInvalido={nomeInvalido}
              whatsappInvalido={whatsappInvalido}
              amountCents={item.amountCents}
              /* Só quem entrou direto vê o valor e o botão de aumentá-lo -
                 ver `CheckoutItem.valorDireto`. */
              mostrarValor={item.valorDireto === true}
              proximoDegrau={proximoDegrau}
              onAumentar={aumentarDoacao}
              onSubmit={enviarDados}
            />
          )}

          {etapa === "erro" && (
            <StepErro
              mensagem={erro}
              onTentarDeNovo={() => {
                setErro(null);
                setTentativa((n) => n + 1);
                setEtapa("pagamento");
              }}
            />
          )}

          {etapa === "pagamento" && (
            <StepPagamento
              /* `key` pela geração: "tentar de novo" e a volta para os dados
                 precisam remontar os botões do PayPal do zero, com o valor
                 novo. Sem ela o React reaproveitaria o nó e os iframes do SDK
                 continuariam cobrando o valor antigo. */
              key={`${tentativa}-${totalCents}`}
              mensal={mensal}
              amountCents={item.amountCents}
              taxaCents={taxaCents}
              totalCents={totalCents}
              doador={doador}
              onAprovado={confirmarPagamento}
              onFalha={(mensagem) => {
                setErro(mensagem);
                setEtapa("erro");
              }}
            />
          )}

          {etapa === "pago" && (
            <StepPago totalCents={totalCents} mensal={mensal} />
          )}
        </div>

        {/* ── Rodapé fixo: o CTA da etapa ────────────────────────────────
            Só a etapa de dados tem um. Na de pagamento quem conclui são os
            botões do PayPal, dentro do corpo: um botão nosso na base da tela,
            ao lado dos deles, seria um segundo "pagar" que não paga. */}
        {etapa === "dados" && (
          <div className="shrink-0 bg-surface px-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-4">
            <button
              type="button"
              onClick={enviarDados}
              className="inline-flex min-h-[clamp(48px,6.6vh,56px)] w-full items-center justify-center gap-2.5 whitespace-nowrap rounded-md bg-highlight px-6 text-fs15 font-extrabold uppercase tracking-[0.03em] text-ink-900 shadow transition hover:bg-highlight-hover"
            >
              <IconShield size={18} />
              Continue to payment
            </button>
            <p className="mt-2 hidden items-center justify-center gap-1.5 text-center text-fs12 font-semibold text-ink-600 [@media(min-height:620px)]:flex">
              <span aria-hidden="true" className="h-[7px] w-[7px] shrink-0 rounded-full bg-donate" />
              100% secure and verified payment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function StepDados({
  dados,
  setDados,
  mensal,
  nomeInvalido,
  whatsappInvalido,
  amountCents,
  mostrarValor,
  proximoDegrau,
  onAumentar,
  onSubmit,
}: {
  dados: Dados;
  setDados: (patch: (d: Dados) => Dados) => void;
  mensal: boolean;
  nomeInvalido: boolean;
  whatsappInvalido: boolean;
  amountCents: number;
  /** A faixa do valor - só para quem entrou sem passar pela tela de valores. */
  mostrarValor: boolean;
  /** O degrau seguinte da escada, em centavos. `null` no topo dela. */
  proximoDegrau: number | null;
  onAumentar: () => void;
  onSubmit: () => void;
}) {
  const taxaPreview = feeCentsFor(amountCents);
  /* `text-[16px]` fixos, e é a única medida da página que não entrou na escala
     fluida: abaixo de 16px o Safari do iPhone dá zoom sozinho ao focar o campo
     e a pessoa perde o modal de vista. O `text-fs16` da escala chega a 15px no
     celular - justamente onde o zoom acontece. */
  const campo = (invalido: boolean) =>
    `min-h-[clamp(46px,6.2vh,52px)] rounded-md border bg-surface px-3.5 text-[16px] font-semibold text-ink-900 outline-none transition-colors placeholder:font-normal placeholder:text-ink-300 ${
      invalido ? "border-error" : "border-ink-900/[.12] focus:border-donate"
    }`;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      /*
        Uma coluna, na ordem do print de referência (`public/designe-checkout`):
        nome, doação anônima, WhatsApp e o convite para cobrir a taxa. Chegou a
        ser duas colunas no notebook; com a faixa do valor e a barra de etapas
        fora do caminho, a pilha inteira voltou a caber na tela e o desenho de
        lá vale de novo.

        A mensal segue outra pilha: nome e WhatsApp, sem a caixa de doar
        anônimo e sem o painel da taxa - os dois blocos abaixo dizem por quê.
      */
      className="flex flex-col gap-3"
    >
      {/*
        ── A faixa do valor ────────────────────────────────────────────────
        Ela **não** é a faixa que saiu daqui: aquela era fixa, aparecia em
        todo checkout e era a maior peça da etapa. Esta só existe para quem
        entrou por um degrau da escada e nunca viu uma tela de conferência do
        valor (ver `CheckoutItem.valorDireto`) - e ela é uma linha, não um
        cartão, justamente para não voltar a empurrar o formulário para fora
        da janela de um notebook.

        O valor à esquerda, o aumento à direita. O botão diz o número para o
        qual ele leva: "Aumentar para R$ 35" resolve num rótulo o que um "+"
        mudo só responderia depois do toque.
      */}
      {mostrarValor && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-donate/25 bg-donate/[.07] px-3.5 py-2.5">
          <span className="flex min-w-0 flex-col">
            <span className="text-fs12 font-semibold text-ink-600">
              {mensal ? "Your monthly donation" : "Your donation"}
            </span>
            <span className="text-fs19 font-extrabold leading-tight text-ink-900 tabular-nums">
              {formatUSDCurto(amountCents)}
              {mensal && (
                <span className="text-fs13 font-semibold text-ink-600">/month</span>
              )}
            </span>
          </span>

          {proximoDegrau !== null && (
            <button
              type="button"
              onClick={onAumentar}
              className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-donate bg-surface px-3 text-fs12 font-extrabold text-donate transition-colors hover:bg-donate hover:text-donate-ink"
            >
              <IconArrowUp size={14} className="shrink-0" />
              Raise it to {formatUSDCurto(proximoDegrau)}
            </button>
          )}
        </div>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-fs13 font-extrabold text-ink-900">Name</span>
        <input
          data-autofocus=""
          type="text"
          autoComplete="name"
          disabled={dados.anonimo}
          value={dados.nome}
          onChange={(e) => setDados((d) => ({ ...d, nome: e.target.value }))}
          placeholder="Your full name"
          aria-invalid={nomeInvalido}
          className={`${campo(nomeInvalido)} disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-ink-300`}
        />
        {nomeInvalido && (
          <span className="text-fs12 font-semibold text-error">
            {mensal
              ? "Tell us what to call you - the monthly donation is set up in your name."
              : "Tell us what to call you - or tick “I want to donate anonymously”."}
          </span>
        )}
      </label>

      {/*
        ── Doar anônimo: só na doação única ────────────────────────────────
        Na mensal a caixa saiu porque ela prometia o que a tela seguinte não
        cumpre: a assinatura vai ao PayPal com o nome de quem paga, e é isso
        que aparece na cobrança de todo mês. Uma caixa de "anonimamente" logo
        antes disso não esconde nada - só faz a pessoa desconfiar da doação
        quando o nome dela aparece na fatura.
      */}
      {!mensal && (
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={dados.anonimo}
            onChange={(e) => setDados((d) => ({ ...d, anonimo: e.target.checked }))}
            className="h-[20px] w-[20px] shrink-0 cursor-pointer accent-[color:var(--sos-donate)]"
          />
          <span className="text-fs14 text-ink-900">I want to donate anonymously</span>
        </label>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-fs13 font-extrabold text-ink-900">
          WhatsApp <span className="font-semibold text-ink-600">(optional)</span>
        </span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={dados.whatsapp}
          onChange={(e) =>
            setDados((d) => ({ ...d, whatsapp: maskPhoneBR(e.target.value) }))
          }
          placeholder="(00) 00000-0000"
          aria-invalid={whatsappInvalido}
          className={campo(whatsappInvalido)}
        />
        {whatsappInvalido && (
          <span className="text-fs12 font-semibold text-error">
            Check the number: some digits are missing.
          </span>
        )}
      </label>

      {/*
        ── Cobrir a taxa: só na doação única ───────────────────────────────
        Marcar aqui na mensal não somaria $4.99 a uma doação: somaria a
        **todas**, todo mês, para sempre - a taxa entraria no valor da
        assinatura, que é o que o PayPal passa a cobrar sozinho. Um convite de
        tela é curto demais para autorizar um acréscimo permanente na fatura de
        alguém.
      */}
      {!mensal && (
        <PainelTaxa
          id="cobrir-taxa"
          taxaCents={taxaPreview}
          marcado={dados.cobrirTaxa}
          onMarcar={(v) => setDados((d) => ({ ...d, cobrirTaxa: v }))}
        />
      )}

      {/*
        O botão de verdade mora no rodapé fixo do modal, fora deste `<form>`.
        Este existe só para o Enter num campo de texto enviar, como em qualquer
        formulário - daí o `tabIndex={-1}` e o `aria-hidden`: ele não é uma
        parada de tabulação nem é anunciado, e fica de fora do laço de foco do
        modal (que ignora `[tabindex="-1"]`). Só `display: none` não serve:
        alguns navegadores desistem do envio implícito sem um botão renderizado.
      */}
      <button type="submit" tabIndex={-1} aria-hidden="true" className="sr-only">
        Continue to payment
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */

/**
 * ── O painel verde da taxa ────────────────────────────────────────────────
 * Emblema de coração, título, a frase da campanha e, embaixo, a caixa de
 * marcar com o valor em verde. Desenho e texto do print de referência.
 *
 * A caixa abre **desmarcada** (`checkoutFee.defaultChecked`): o valor que a
 * pessoa escolheu na tela de valores é o valor que ela paga, e não ele mais
 * R$ 4,99 que ela não pediu. O painel é verde sempre - marcado ou não, ele é um
 * convite, e não um aviso que acende.
 *
 * ── E **só na doação única** ─────────────────────────────────────────────
 * Na mensal ele não é renderizado - ver o motivo no ponto de chamada, dentro
 * de `StepDados`.
 *
 * ── Ele vive **só na etapa de dados**, antes do pagamento ────────────────
 * Na etapa de pagamento a caixa seria um controle que muda o valor **depois**
 * de os botões do PayPal já estarem montados com ele: ou a tela somaria $4.99 a
 * um botão que continuaria cobrando o valor antigo (alguém pagaria um número e
 * leria outro), ou um clique de caixinha remontaria o SDK inteiro debaixo do
 * dedo de quem já ia pagar. Lá a taxa aparece na linha "Fee covered" do resumo,
 * que é informação e não controle.
 */
function PainelTaxa({
  id,
  taxaCents,
  marcado,
  onMarcar,
}: {
  id: string;
  taxaCents: number;
  marcado: boolean;
  onMarcar: (valor: boolean) => void;
}) {
  if (!checkoutFee.enabled) return null;

  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer flex-col gap-2.5 rounded-md border border-donate/20 bg-donate/[.07] p-3.5"
    >
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-donate/15 text-donate"
        >
          <IconHeart size={16} />
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-fs14 font-extrabold leading-tight text-donate-text">
            Help cover the cost of your donation
          </span>
          <p className="text-fs13 leading-[1.45] text-ink-600">
            Cover the {formatUSDCurto(taxaCents)} processing cost and make
            sure your donation reaches Kyle in full.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 text-fs14 font-extrabold text-ink-900">
        <input
          id={id}
          type="checkbox"
          checked={marcado}
          onChange={(e) => onMarcar(e.target.checked)}
          className="h-[20px] w-[20px] shrink-0 cursor-pointer accent-[color:var(--sos-donate)]"
        />
        Cover the fee{" "}
        <span className="whitespace-nowrap text-donate-text tabular-nums">
          (+ {formatUSDCurto(taxaCents)})
        </span>
      </div>
    </label>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Doado + taxa + total, na etapa do pagamento.
 *
 * **Sem taxa, é uma linha só** - "Valor doado" e o número à direita, como na
 * gravação de referência. Com a caixa desmarcada, "valor doado", "taxa R$ 0,00"
 * e "valor total" eram três linhas dizendo o mesmo número; a conta só tem o que
 * mostrar quando existe uma parcela a somar.
 *
 * Não aparece na etapa de dados: lá o valor já foi escolhido na tela anterior.
 * Quem cobre a taxa vê o total somado aqui, logo acima dos botões de pagar.
 */
function ResumoValores({
  amountCents,
  taxaCents,
  totalCents,
}: {
  amountCents: number;
  taxaCents: number;
  totalCents: number;
}) {
  /* A explicação da taxa abre no "?" e não vive aberta: são três linhas que
     respondem a uma dúvida que nem todo mundo tem, e ela empurraria os botões
     de pagar para baixo de quem já entendeu. */
  const [explicando, setExplicando] = useState(false);

  return (
    <dl className={`${CARTAO} gap-1.5 p-3.5 text-fs14`}>
      <div className="flex items-baseline justify-between gap-3">
        <dt className="font-semibold text-ink-600">Amount donated</dt>
        <dd className="text-fs16 font-extrabold tabular-nums text-ink-900">
          {formatUSDCurto(amountCents)}
        </dd>
      </div>

      {taxaCents > 0 && (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="flex items-center gap-1.5 font-semibold text-ink-600">
              Fee covered
              <button
                type="button"
                onClick={() => setExplicando((v) => !v)}
                aria-expanded={explicando}
                aria-label="What the covered fee is"
                className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-ink-900/20 text-fs11 font-extrabold leading-none text-ink-600 transition-colors hover:border-action hover:text-action"
              >
                ?
              </button>
            </dt>
            <dd className="font-extrabold tabular-nums text-donate-text">
              {formatUSDCurto(taxaCents)}
            </dd>
          </div>

          {explicando && (
            <p className="rounded-md bg-surface-alt p-3 text-fs13 leading-[1.5] text-ink-600">
              This is the card and PayPal processing fee that {org.name} would
              pay to receive your donation. Leaving it ticked means the full
              amount gets through to help save more lives!
            </p>
          )}

          <div className="flex items-baseline justify-between gap-3 border-t border-ink-900/10 pt-2">
            <dt className="font-extrabold text-ink-900">Total</dt>
            <dd className="text-fs19 font-extrabold tabular-nums text-ink-900">
              {formatUSDCurto(totalCents)}
            </dd>
          </div>
        </>
      )}
    </dl>
  );
}

/* ------------------------------------------------------------------ */

const CARTAO =
  "flex flex-col rounded-md border border-ink-900/[.07] bg-surface p-4 shadow-[0_1px_3px_rgba(20,17,15,.05)]";

/** Emblema quadrado-arredondado + título, a cabeça de cada cartão. */
function TituloCartao({
  icon: Icon,
  tom = "action",
  children,
}: {
  icon: ComponentType<{ size?: number }>;
  /** `highlight` é o âmbar; o resto da tela é vermelho de marca. */
  tom?: "action" | "highlight";
  children: ReactNode;
}) {
  return (
    <p className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[12px] ${
          tom === "highlight" ? "bg-highlight/25 text-warning" : "bg-action/10 text-action"
        }`}
      >
        <Icon size={18} />
      </span>
      <span className="text-fs15 font-extrabold leading-tight text-action">
        {children}
      </span>
    </p>
  );
}

/* ------------------------------------------------------------------ */

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  A etapa do pagamento - resumo, botões do PayPal e selo               ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Dois botões, um por fonte de pagamento (ver `paypal.fundingSources`):
 *
 *   **PayPal**                      para quem tem conta
 *   **Debit or Credit Card**        formulário hospedado do PayPal, sem conta
 *
 * Um `Buttons` por fonte, e não um botão só que abre um menu: quem doa precisa
 * ver que dá para pagar **com cartão** antes de clicar em qualquer coisa - a
 * página promete "card or PayPal", e o menu escondido faria metade da promessa
 * aparecer só depois do clique.
 *
 * ── Quem fala com o PayPal é `GiveWpPaypalButtons` ───────────────────────
 * Esta etapa é a moldura: o resumo dos valores, o cartão, o selo e o caminho
 * da mensal. Os botões em si moram em
 * `components/payments/givewp-paypal.tsx`, que é o único lugar do projeto que
 * monta cobrança - a rota `/doar/valor` usa exatamente o mesmo.
 *
 * ── ⚠️ A mensal ──────────────────────────────────────────────────────────
 * Nenhum caminho fecha recorrência, então esta tela **não desenha botão** na
 * mensal: ela diz que a doação de todo mês é combinada pelo WhatsApp e leva
 * para lá. Cobrar uma vez e chamar de "todo mês" seria prometer um débito que
 * nunca vai acontecer. Ver o bloco 🔁 no topo do arquivo.
 */
function StepPagamento({
  mensal,
  amountCents,
  taxaCents,
  totalCents,
  doador,
  onAprovado,
  onFalha,
}: {
  mensal: boolean;
  amountCents: number;
  taxaCents: number;
  totalCents: number;
  /**
   * A identidade que o InitiateCheckout já registrou. Precisa ser a MESMA na
   * cobrança - ver o aviso em `GiveWpCheckout`. `null` enquanto o lead não
   * nasceu; o componente de pagamento cai nos próprios padrões nesse caso.
   */
  doador: {
    leadId: string;
    email: string;
    primeiroNome: string;
    sobrenome: string;
  } | null;
  /** Recebe o Order ID do PayPal - ver `confirmarPagamento`. */
  onAprovado: (paypalOrderId: string) => void;
  onFalha: (mensagem: string) => void;
}) {
  /** A mensal nunca tem botão - ver o bloco 🔁 no topo do arquivo. */
  const mensalSemPlano = mensal;

  return (
    <div className="flex flex-col gap-3">
      <ResumoValores
        amountCents={amountCents}
        taxaCents={taxaCents}
        totalCents={totalCents}
      />

      {mensalSemPlano ? (
        <div className={`${CARTAO} gap-3`}>
          <TituloCartao icon={IconHeart}>
            Monthly donations are set up by hand
          </TituloCartao>
          <p className="text-fs14 leading-[1.55] text-ink-600">
            We are not able to start a recurring donation from this page yet.
            Send us a message and the team sets it up with you - it takes a
            couple of minutes, and you can stop it whenever you want.
          </p>
          <a
            data-autofocus=""
            href={whatsappWith(
              `Hi! I want to donate ${formatUSDCurto(amountCents)} to ${org.name} every month. How do I set it up?`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-donate px-6 text-fs15 font-extrabold uppercase tracking-[0.03em] text-donate-ink transition-colors hover:bg-donate-hover"
          >
            Message us on WhatsApp
          </a>
        </div>
      ) : (
        <div className={`${CARTAO} gap-3`}>
          <TituloCartao icon={IconShield}>Pay with card or PayPal</TituloCartao>

          {/*
            ── Um caminho só: as rotas REST do GiveWP ───────────────────────
            A cobrança é criada e capturada pelo `givewp.kylerescuer.org`
            (`create-order` → `approve-order` → `donate`), e não mais pelo SDK
            no navegador. É o que faz a doação virar registro no painel do
            GiveWP - post, doador, recibo - e o que manda o pedido ao PayPal
            com `category: DONATION`, que a cobrança direta não mandava.

            ⚠️ Isso cobra na conta conectada no GiveWP (`BAAjNpRBvmQf1_…`),
            que **não** era a conta do checkout anterior
            (`BAAWg0MA4OOvlh2QrG…`, herdada do WordPress antigo). Foi decisão
            explícita de quem administra a campanha, em 2026-09-04.

            Não há ramo de assinatura: nem as rotas (que fixam
            `donationType: 'single'`) nem o form 10
            (`subscriptionsEnabled: false`) fecham recorrência. A mensal cai
            no bloco do WhatsApp acima, sempre.
          */}
          <GiveWpCheckout
            totalCents={totalCents}
            leadId={doador?.leadId}
            email={doador?.email}
            primeiroNome={doador?.primeiroNome}
            sobrenome={doador?.sobrenome}
            onPago={onAprovado}
            onFalha={onFalha}
          />

          <p className="text-fs12 leading-[1.5] text-ink-600">
            You will pay on PayPal&rsquo;s secure screen. No card details are
            typed on this page or stored by {org.name}.
          </p>
        </div>
      )}

      <p className="flex items-center justify-center gap-1.5 pb-1 text-center text-fs12 font-semibold text-ink-600">
        <span
          aria-hidden="true"
          className="h-[7px] w-[7px] shrink-0 rounded-full bg-donate"
        />
        100% secure and verified payment
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function StepErro({
  mensagem,
  onTentarDeNovo,
}: {
  mensagem: string | null;
  onTentarDeNovo: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center" role="alert">
      <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-error/10 text-error">
        <IconClose size={26} />
      </span>
      <p className="text-fs16 font-extrabold text-ink-900">
        We could not take your payment
      </p>
      <p className="max-w-[40ch] text-fs13 leading-[1.5] text-ink-600">
        {mensagem ?? "Try again in a few seconds."}
      </p>
      <button
        data-autofocus=""
        type="button"
        onClick={onTentarDeNovo}
        className="mt-1 inline-flex min-h-[50px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-donate px-6 text-fs15 font-extrabold uppercase tracking-[0.03em] text-donate-ink transition-colors hover:bg-donate-hover"
      >
        Try again
      </button>
    </div>
  );
}

/**
 * A tela que só o PayPal abre.
 *
 * Nenhum botão leva até aqui - ver o bloco de confirmação no topo do arquivo.
 */
function StepPago({
  totalCents,
  mensal,
}: {
  totalCents: number;
  mensal: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center gap-3 py-8 text-center"
      role="status"
      aria-live="polite"
    >
      <span className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-donate/10 text-donate">
        <IconCheck size={34} />
      </span>
      <p className="text-fs19 font-extrabold text-ink-900">
        {mensal ? "Monthly donation activated!" : "Payment confirmed!"}
      </p>
      <p className="max-w-[40ch] text-fs14 leading-[1.55] text-ink-600">
        Your donation of{" "}
        <strong className="font-semibold text-ink-900">
          {formatUSDCurto(totalCents)}
        </strong>{" "}
        is already on its way to those who need it. Thank you, truly.
      </p>
      {/* O que acabou de ser autorizado, em uma frase: a partir daqui a
          cobrança se repete sozinha, e quem não souber disso estranha a fatura
          do mês que vem. */}
      {mensal && (
        <p className="max-w-[40ch] text-fs13 leading-[1.55] text-ink-600">
          The next charge goes out on its own in a month, and so on every month.
          You can cancel whenever you want, from your PayPal account.
        </p>
      )}
      <p className="mt-1 flex items-center gap-1.5 text-fs12 font-semibold text-ink-600">
        <IconHeart size={14} className="shrink-0 text-donate" />
        Taking you to the confirmation page…
      </p>
    </div>
  );
}
