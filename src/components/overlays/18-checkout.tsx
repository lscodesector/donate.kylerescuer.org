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
import { checkoutFee, feeCentsFor, org, pix } from "@/lib/config";
import {
  cpfDigits,
  formatBRLCurto,
  isValidCpf,
  isValidPhoneBR,
  maskCpf,
  maskPhoneBR,
} from "@/lib/format";
import { openDonationModal } from "@/lib/modais";
import {
  bindRecurringAuthorization,
  buildTxid,
  createCharge,
  createRecurringCharge,
  checkLeadPaidOnSheet,
  fetchChargeStatus,
  logSheetRedirect,
  payments,
  readPixFrom,
  readRecurringStatusHandle,
  readStatusHandle,
  recurrenceStartDate,
  type ChargeResponse,
} from "@/lib/payments/lusa";
import {
  clearLeadId,
  getLeadId,
  sendInitiateCheckoutToNest,
  trackInitiateCheckout,
  trackPixPaid,
  type LeadTracking,
} from "@/lib/payments/tracking";
import { useScrollLock } from "@/lib/scroll-lock";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  18 · CHECKOUT - dados, Pix e confirmação                             ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Bloco isolado no que é desenho: os ícones e as cinco etapas moram aqui.
 *
 * ⚠️ **Zona crítica.** Nada do que decide dinheiro desce para este arquivo:
 * a chave Pix, o CNPJ do recebedor, a taxa e o mínimo da recorrência vêm de
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

const IconCheck = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m5 13 4 4L19 7" />
  </svg>
);

const IconClock = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const IconClose = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const IconCopy = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const IconHeart = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8Z" />
  </svg>
);

const IconMonitor = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="2.8" y="4" width="18.4" height="12.5" rx="2" />
    <path d="M9 20.5h6" />
    <path d="M12 16.5v4" />
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

const IconQrCode = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <path d="M14 14h3v3h-3z" />
    <path d="M20.5 14v.01M20.5 20.5v.01M17 20.5v.01" />
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
 *   `dados`    nome, doação anônima, WhatsApp opcional e a opção de cobrir a
 *              taxa. Termina em "Gerar Pix agora". Na mensal a etapa é mais
 *              curta - ver o bloco 🔁 logo abaixo.
 *   `gerando`  a cobrança sendo criada no gateway.
 *   `pix`      resumo dos valores, QR Code, copia e cola e o botão de copiar,
 *              consultando o status a cada 5 segundos.
 *   `pago`     só quando o gateway confirma. Ver o bloco abaixo.
 *   `erro`     o caminho ruim, com botão de tentar de novo.
 *
 * A escolha da faixa de kg **não** é uma etapa daqui: ela acontece na seção de
 * ração, onde a pessoa vê a foto do saco, o preço e quantos animais aquilo
 * alimenta. Trazer isso para dentro do modal seria mostrar a mesma grade duas
 * vezes.
 *
 * ── 🔁 Doação mensal: outro caminho, não outro texto ──────────────────────
 * Quando `item.kind === "mensal"`, o mesmo modal fala com outra rota do
 * gateway: Pix Automático (`createRecurringCharge`), em que **um QR só** cobra
 * a primeira parcela e cria o mandato que autoriza o banco a debitar os
 * próximos meses sozinho. O que muda por dentro:
 *
 *   • CPF vira obrigatório (o Banco Central exige devedor identificado);
 *   • **não há taxa a cobrir** nem **doação anônima**: as duas somem da etapa
 *     de dados. A taxa porque ela entraria em toda cobrança de todo mês, para
 *     sempre - o que a pessoa aceitou uma vez viraria um acréscimo permanente
 *     no débito automático dela. O anônimo porque o mandato já vai ao banco
 *     com nome e CPF: a caixa prometia um anonimato que a tela de autorização
 *     do banco desmente na frase seguinte;
 *   • o InitiateCheckout é gravado no Nest **antes** da cobrança, porque o
 *     mandato precisa de um lead onde se pendurar (`lead_not_found` é um erro
 *     silencioso - ver `sendInitiateCheckoutToNest`);
 *   • o `id_rec` da resposta é amarrado ao lead (`bindRecurringAuthorization`);
 *   • o status é consultado no profile da recorrência, não no do avulso.
 *
 * Até 12/08/2026 a mensal era o mesmo Pix avulso com outra frase embaixo ("a
 * equipe combina os próximos com você pelo WhatsApp"). Não é mais.
 *
 * ── O desenho é o do print, e o CTA fica fora do scroll ──────────────────
 * As telas seguem `public/designe-checkout` - cabeçalho com "Voltar" escrito,
 * formulário em uma coluna e o painel verde da taxa. Saíram de lá para cá as
 * duas barrinhas de progresso e a faixa que repetia o valor doado: nenhuma das
 * duas existe no print, e a faixa era a maior peça fixa da etapa.
 *
 * O CTA de cada etapa mora num rodapé que não rola. É o que mantém "Gerar Pix
 * agora" e "Copiar chave Pix" sempre na tela - antes o botão ficava embaixo do
 * QR e do código, dois scrolls abaixo da dobra.
 *
 * ── ✅ A tela de sucesso depende do gateway, e só dele ────────────────────
 * `pago` é inalcançável por clique. Não existe "já fiz o pagamento", não
 * existe timeout que conclua, e gerar o QR não conclui nada. A única porta é
 * o gateway responder `paid: true`, por um de dois caminhos:
 *
 *   1. **Polling** - a cada 5s enquanto a etapa `pix` estiver aberta, até 15
 *      minutos (`payments.statusPollMaxMs`).
 *   2. **Planilha, no retorno** - em celular, abrir o app do banco costuma
 *      descarregar esta página, e aí o polling morre junto. Quando a aba volta
 *      a ficar visível, consultamos a planilha (que o webhook do gateway
 *      alimenta) pelo `lead_id` guardado. Sem isso, quem pagou voltaria para um
 *      "aguardando confirmação" que nunca termina.
 *
 * O caminho 2 roda mesmo com o modal fechado e mesmo depois de a página ter
 * recarregado - por isso o efeito dele não depende de `aberto`.
 *
 * ── ⚠️ As rotas `/doar/*` NÃO passam pelo gateway ⚠️ ─────────────────────
 * Elas são o caminho de quem está sem JavaScript e montam um Pix **estático**
 * na chave da organização (`lib/pix.ts`). O dinheiro chega, mas fora da
 * conciliação: sem `lead_id`, sem status, sem evento de Purchase. Enquanto as
 * duas coisas coexistirem, doação por lá não aparece em relatório.
 */

type Etapa = "dados" | "gerando" | "pix" | "pago" | "erro";

type Dados = {
  nome: string;
  anonimo: boolean;
  whatsapp: string;
  /** Só a doação mensal usa - ver `StepDados` e `lib/format.ts`. */
  cpf: string;
  cobrirTaxa: boolean;
};

const DADOS_VAZIOS: Dados = {
  nome: "",
  anonimo: false,
  whatsapp: "",
  cpf: "",
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
  const [pixCode, setPixCode] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [tentouEnviar, setTentouEnviar] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const gatilhoRef = useRef<HTMLElement | null>(null);
  /** Descarta a cobrança que não é a mais recente (tentar de novo, taxa trocada). */
  const geracaoRef = useRef(0);
  /** Por onde consultar o status da cobrança em curso. */
  const statusRef = useRef({ pollUrl: "", reference: "" });
  /** O InitiateCheckout desta doação, que o Purchase completa depois. */
  const leadRef = useRef<LeadTracking | null>(null);
  /** Purchase é uma vez por doação, mesmo que polling e planilha se cruzem. */
  const pagoRef = useRef(false);

  const aberto = item !== null;
  useScrollLock(aberto);

  /* --- abrir ------------------------------------------------------------ */
  useEffect(() => {
    const onAbrir = (e: Event) => {
      const detalhe = (e as CustomEvent<CheckoutItem>).detail;
      gatilhoRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      geracaoRef.current += 1;
      statusRef.current = { pollUrl: "", reference: "" };
      leadRef.current = null;
      pagoRef.current = false;
      setItem(detalhe);
      setEtapa("dados");
      setDados(DADOS_VAZIOS);
      setPixCode("");
      setQr(null);
      setErro(null);
      setCopiado(false);
      setTentouEnviar(false);
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

  /* --- confirmação de pagamento ------------------------------------------ */
  const confirmarPagamento = useCallback((data: ChargeResponse) => {
    if (pagoRef.current) return;
    pagoRef.current = true;

    trackPixPaid(leadRef.current, data);
    clearLeadId();
    setEtapa("pago");

    /* Um respiro para a confirmação ser lida antes da troca de página. */
    window.setTimeout(() => {
      window.location.href = payments.successUrl;
    }, payments.redirectDelayMs);
  }, []);

  /* --- criação da cobrança ------------------------------------------------ */
  useEffect(() => {
    if (etapa !== "gerando" || !item) return;

    geracaoRef.current += 1;
    const minha = geracaoRef.current;
    const controller = new AbortController();

    const gerar = async () => {
      /* O piso da tela de espera começa a contar aqui, antes de qualquer ida à
         rede: se ele só nascesse junto da cobrança, a gravação do lead no Nest
         (mais abaixo) seria tempo somado ao piso em vez de tempo coberto por
         ele - e a mensal ficaria visivelmente mais lenta que a única. */
      const piso = new Promise((r) => setTimeout(r, payments.loaderMinMs));

      try {
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

        /*
         * ⚠️ ORDEM: na mensal o lead precisa estar gravado no Nest **antes** de
         * o mandato ser amarrado a ele (`bindRecurringAuthorization`, mais
         * abaixo) - um bind que chega primeiro responde `lead_not_found` calado
         * e a recorrência fica sem dono. Por isso é `await`, e não disparar e
         * seguir. Ver o bloco inteiro em `sendInitiateCheckoutToNest`.
         *
         * Nos dois fluxos, e não só na mensal: é o que a página em WordPress
         * faz com toda doação única, e é por aqui que o nome e o WhatsApp de
         * quem doa saem do navegador. A espera não aparece na tela - ela cabe
         * dentro do piso do "gerando", que começou a contar acima.
         */
        await sendInitiateCheckoutToNest(lead);

        /*
         * A cobrança e o piso correm juntos. O piso existe para a tela ser lida
         * em vez de piscar - quando a API responde antes dele, quem manda é
         * ele; quando demora mais, ele não custa nada.
         */
        const [data] = await Promise.all([
          mensal
            ? createRecurringCharge(
                {
                  amountCents: totalCents,
                  leadId: lead.lead_id,
                  cpf: cpfDigits(dados.cpf),
                  /* Sempre o nome digitado: a mensal não oferece doação
                     anônima (ver `StepDados`), e o mandato precisa do nome
                     que o banco vai exibir na autorização. */
                  donorName: dados.nome.trim(),
                  donorPhone: dados.whatsapp,
                },
                controller.signal,
              )
            : createCharge(
                {
                  amountCents: totalCents,
                  leadId: lead.lead_id,
                  productTitle: productTitleFor(item),
                  donorName: dados.nome.trim(),
                  donorPhone: dados.whatsapp,
                  anonymous: dados.anonimo,
                  /* O mesmo e-mail que foi no lead - ver `ChargeRequest`. */
                  email: String(lead.donor_email ?? ""),
                },
                controller.signal,
              ),
          piso,
        ]);

        if (geracaoRef.current !== minha) return;

        const { image, code } = readPixFrom(data);
        if (!image && !code) {
          throw new Error(
            "A API respondeu, mas não devolveu o QR Code nem o código Pix.",
          );
        }

        /*
         * O mandato, amarrado ao lead assim que o `id_rec` chega - antes de
         * qualquer tratamento de "já pago", porque é ele que garante o 2º mês.
         * Não é aguardado: é o QR que a pessoa está esperando na tela.
         */
        if (mensal) bindRecurringAuthorization(lead.lead_id, data.id_rec);

        statusRef.current = mensal
          ? readRecurringStatusHandle(data, buildTxid(lead.lead_id))
          : readStatusHandle(data);
        setPixCode(code);
        setEtapa("pix");

        if (image) {
          setQr(image);
        } else {
          /* Sem imagem pronta: desenhamos o QR do copia-e-cola com a
             biblioteca que já está no pacote - nada de script de CDN. */
          const { toDataURL } = await import("qrcode");
          const desenhado = await toDataURL(code, {
            margin: 0,
            width: 460,
            errorCorrectionLevel: "M",
            color: { dark: "#14110F", light: "#FFFFFF" },
          });
          if (geracaoRef.current === minha) setQr(desenhado);
        }

        /* A API pode responder já paga - respeitar isso evita cinco segundos
           de "aguardando" para quem não precisa esperar nada. */
        if (data.paid) confirmarPagamento(data);
      } catch (err) {
        if (geracaoRef.current !== minha || controller.signal.aborted) return;
        setErro(
          err instanceof Error
            ? err.message
            : "Não foi possível gerar o Pix. Confira sua conexão e tente de novo.",
        );
        setEtapa("erro");
      }
    };

    void gerar();
    return () => controller.abort();
    // `dados` entra só na leitura inicial: mudar nome no meio da geração não
    // deve refazer a cobrança.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa, item, totalCents, confirmarPagamento]);

  /* --- polling de status --------------------------------------------------- */
  useEffect(() => {
    if (etapa !== "pix") return;
    const handle = statusRef.current;
    if (!handle.pollUrl && !handle.reference) return;

    const inicio = Date.now();
    const controller = new AbortController();
    let timer = 0;
    let vivo = true;

    const bater = async () => {
      if (!vivo) return;
      if (Date.now() - inicio >= payments.statusPollMaxMs) return;

      try {
        const data = await fetchChargeStatus(handle, controller.signal);
        if (!vivo) return;
        if (data?.paid) {
          confirmarPagamento(data);
          return;
        }
      } catch {
        /* Rede instável ou cobrança ainda sem registro: a próxima batida
           tenta de novo. Erro de status não é erro de pagamento. */
      }

      if (vivo) timer = window.setTimeout(bater, payments.statusPollMs);
    };

    timer = window.setTimeout(bater, payments.statusPollMs);

    return () => {
      vivo = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [etapa, confirmarPagamento]);

  /*
   * --- volta do app do banco ------------------------------------------------
   *
   * Independente de o modal estar aberto: em celular esta página costuma ser
   * descarregada quando o app do banco abre, e quem volta chega com o React
   * recém-montado e o modal fechado. O `lead_id` sobreviveu no armazenamento,
   * e é ele que a planilha conhece.
   */
  useEffect(() => {
    let checando = false;

    const checar = async () => {
      if (checando || pagoRef.current) return;
      const leadId = getLeadId();
      if (!leadId) return;

      checando = true;
      try {
        const { paid, redirect } = await checkLeadPaidOnSheet(leadId);
        if (!paid) return;

        const destino = redirect || payments.successUrl;
        if (!redirect) {
          /* A planilha não tinha destino próprio: registramos o que decidimos,
             para o relatório saber para onde a pessoa foi. */
          await logSheetRedirect(leadId, pathnameOf(payments.successUrl));
        }

        pagoRef.current = true;
        clearLeadId();
        window.location.href = destino;
      } finally {
        checando = false;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") void checar();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", checar);
    void checar();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", checar);
    };
  }, []);

  /* Devolve o botão ao estado normal depois do aviso de "copiado". */
  useEffect(() => {
    if (!copiado) return;
    const id = setTimeout(() => setCopiado(false), 3000);
    return () => clearTimeout(id);
  }, [copiado]);

  const copiar = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopiado(true);
      return;
    } catch {
      /* Sem permissão de área de transferência (ou http sem TLS): cai no
         `execCommand`, que ainda funciona onde a API moderna é bloqueada. */
    }

    const campo = document.createElement("textarea");
    campo.value = pixCode;
    campo.setAttribute("readonly", "readonly");
    campo.style.position = "fixed";
    campo.style.opacity = "0";
    campo.style.left = "-9999px";
    document.body.appendChild(campo);
    campo.select();

    try {
      if (document.execCommand("copy")) setCopiado(true);
    } finally {
      document.body.removeChild(campo);
    }
  }, [pixCode]);

  const nomeInvalido =
    tentouEnviar && !dados.anonimo && dados.nome.trim().length < 2;
  const whatsappInvalido = tentouEnviar && !isValidPhoneBR(dados.whatsapp);
  const cpfInvalido = tentouEnviar && mensal && !isValidCpf(dados.cpf);

  const enviarDados = () => {
    setTentouEnviar(true);
    if (!dados.anonimo && dados.nome.trim().length < 2) return;
    if (!isValidPhoneBR(dados.whatsapp)) return;
    if (mensal && !isValidCpf(dados.cpf)) return;
    setErro(null);
    setEtapa("gerando");
  };

  const titulo = useMemo(() => {
    switch (etapa) {
      case "dados":
        return "Complete seus dados";
      case "gerando":
        return "Gerando seu Pix";
      case "erro":
        return "Algo deu errado";
      case "pago":
        return "Pagamento confirmado";
      case "pix":
        /* "Gerado com sucesso", e não "Pague com Pix": é o primeiro texto que
           a pessoa lê depois da espera, e ele responde a pergunta que ela
           estava fazendo ("deu certo?") antes de pedir a próxima coisa. */
        return "Pix gerado com sucesso!";
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
  const podeVoltar = etapa === "dados" || etapa === "pix" || etapa === "erro";

  const voltar = () => {
    if (etapa === "dados") {
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
    statusRef.current = { pollUrl: "", reference: "" };
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
          botão à vista e sem rolagem: quem rola para achar o "Gerar Pix" já
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
              aria-label="Voltar"
              className="flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full px-2 text-fs14 font-semibold text-ink-600 transition-colors hover:bg-surface-alt hover:text-ink-900"
            >
              <IconArrowLeft size={18} />
              {/* Só a seta na etapa do Pix: lá o título é a frase mais longa do
                  checkout ("Pix gerado com sucesso!") e a palavra ao lado o
                  empurrava para fora do centro da barra. */}
              {etapa !== "pix" && "Voltar"}
            </button>
          ) : (
            <span aria-hidden="true" className="h-[36px] w-[36px] shrink-0" />
          )}

          <h2
            id="checkout-titulo"
            className="flex flex-1 items-center justify-center gap-1.5 text-center text-fs16 font-extrabold leading-tight text-ink-900"
          >
            {/* O tique verde só na etapa do Pix: ali o título é uma confirmação
                ("deu certo"), e nas outras é só o nome da etapa. */}
            {etapa === "pix" && (
              <IconCheck size={17} className="shrink-0 text-donate" />
            )}
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
              aria-label="Fechar"
              className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-surface-alt text-ink-600 transition-colors hover:bg-ink-900/10"
            >
              <IconClose size={18} />
            </button>
          )}
        </header>

        {/* ── Corpo (a única parte que rola) ─────────────────────────────
            Creme na etapa do Pix, branco nas outras: lá o conteúdo é uma pilha
            de cartões brancos, e cartão branco sobre fundo branco não é
            cartão - some a borda e a pilha vira uma lista corrida. */}
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 ${
            etapa === "pix" ? "bg-surface-alt" : ""
          }`}
        >
          {etapa === "dados" && (
            <StepDados
              dados={dados}
              setDados={setDados}
              mensal={mensal}
              nomeInvalido={nomeInvalido}
              whatsappInvalido={whatsappInvalido}
              cpfInvalido={cpfInvalido}
              amountCents={item.amountCents}
              onSubmit={enviarDados}
            />
          )}

          {etapa === "gerando" && <StepGerando />}

          {etapa === "erro" && (
            <StepErro mensagem={erro} onTentarDeNovo={() => setEtapa("gerando")} />
          )}

          {etapa === "pix" && (
            <StepPix
              qr={qr}
              pixCode={pixCode}
              mensal={mensal}
              amountCents={item.amountCents}
              taxaCents={taxaCents}
              totalCents={totalCents}
              copiado={copiado}
              onCopiar={copiar}
            />
          )}

          {etapa === "pago" && (
            <StepPago totalCents={totalCents} mensal={mensal} />
          )}
        </div>

        {/* ── Rodapé fixo: o CTA da etapa ────────────────────────────────
            Só a etapa de dados tem um. Na do Pix o "copiar código" mora dentro
            do cartão do código, como na gravação de referência - e continua
            acima da dobra, porque é o terceiro bloco da pilha. Ver `StepPix`. */}
        {etapa === "dados" && (
          <div className="shrink-0 bg-surface px-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-4">
            <button
              type="button"
              onClick={enviarDados}
              className="inline-flex min-h-[clamp(48px,6.6vh,56px)] w-full items-center justify-center gap-2.5 whitespace-nowrap rounded-md bg-highlight px-6 text-fs15 font-extrabold uppercase tracking-[0.03em] text-ink-900 shadow transition hover:bg-highlight-hover"
            >
              <IconPixMark size={18} />
              Gerar Pix agora
            </button>
            <p className="mt-2 hidden items-center justify-center gap-1.5 text-center text-fs12 font-semibold text-ink-600 [@media(min-height:620px)]:flex">
              <span aria-hidden="true" className="h-[7px] w-[7px] shrink-0 rounded-full bg-donate" />
              Pagamento 100% seguro e verificado
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * `2026-09-12` → `12 de setembro`.
 *
 * Montada campo a campo, e não com `new Date("2026-09-12")`: a string ISO só
 * com data é lida como UTC, e no fuso do Brasil isso volta um dia - a tela
 * anunciaria a cobrança para 11 de setembro quando o gateway agendou 12.
 */
function dataPorExtenso(iso: string) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  if (!ano || !mes || !dia) return iso;
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });
}

/** `/obrigado` a partir de uma URL absoluta ou relativa. */
function pathnameOf(url: string) {
  try {
    return new URL(url, window.location.origin).pathname || "/obrigado";
  } catch {
    return "/obrigado";
  }
}

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */

function StepDados({
  dados,
  setDados,
  mensal,
  nomeInvalido,
  whatsappInvalido,
  cpfInvalido,
  amountCents,
  onSubmit,
}: {
  dados: Dados;
  setDados: (patch: (d: Dados) => Dados) => void;
  mensal: boolean;
  nomeInvalido: boolean;
  whatsappInvalido: boolean;
  cpfInvalido: boolean;
  amountCents: number;
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

        A mensal segue outra pilha: nome, WhatsApp e CPF, sem a caixa de doar
        anônimo e sem o painel da taxa - os dois blocos abaixo dizem por quê.
      */
      className="flex flex-col gap-3"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-fs13 font-extrabold text-ink-900">Nome</span>
        <input
          data-autofocus=""
          type="text"
          autoComplete="name"
          disabled={dados.anonimo}
          value={dados.nome}
          onChange={(e) => setDados((d) => ({ ...d, nome: e.target.value }))}
          placeholder="Seu nome completo"
          aria-invalid={nomeInvalido}
          className={`${campo(nomeInvalido)} disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-ink-300`}
        />
        {nomeInvalido && (
          <span className="text-fs12 font-semibold text-error">
            {mensal
              ? "Diga como podemos te chamar - o seu banco pede o nome para autorizar a doação mensal."
              : "Diga como podemos te chamar - ou marque “Quero doar anonimamente”."}
          </span>
        )}
      </label>

      {/*
        ── Doar anônimo: só na doação única ────────────────────────────────
        Na mensal a caixa saiu porque ela prometia o que a tela seguinte não
        cumpre: o mandato do Pix Automático vai ao banco com nome e CPF, e é
        isso que aparece na tela de autorização e no extrato de todo mês. Uma
        caixa de "anonimamente" logo antes disso não esconde nada - só faz a
        pessoa desconfiar da doação quando o nome dela aparece no banco.
      */}
      {!mensal && (
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={dados.anonimo}
            onChange={(e) => setDados((d) => ({ ...d, anonimo: e.target.checked }))}
            className="h-[20px] w-[20px] shrink-0 cursor-pointer accent-[color:var(--sos-donate)]"
          />
          <span className="text-fs14 text-ink-900">Quero doar anonimamente</span>
        </label>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-fs13 font-extrabold text-ink-900">
          WhatsApp <span className="font-semibold text-ink-600">(opcional)</span>
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
            Confira o número: faltam dígitos.
          </span>
        )}
      </label>

      {/*
        ── CPF: só na doação mensal ────────────────────────────────────────
        Não é dado que a gente resolveu pedir: o Pix Automático autoriza o
        banco a debitar a conta de alguém nos próximos meses, e o Banco Central
        exige devedor identificado para criar esse mandato. Sem CPF válido a
        ONZ/Infopago recusa a recorrência - e recusaria depois de a pessoa já
        ter preenchido tudo, que é o pior momento para descobrir.

        Não está no print porque o print é o da doação única. A frase abaixo do
        campo existe porque pedir CPF numa página de doação levanta a
        sobrancelha de qualquer um, e dizer para que serve é mais barato que
        perder a doação.
      */}
      {mensal && (
        <label className="flex flex-col gap-1.5">
          <span className="text-fs13 font-extrabold text-ink-900">CPF</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={dados.cpf}
            onChange={(e) => setDados((d) => ({ ...d, cpf: maskCpf(e.target.value) }))}
            placeholder="000.000.000-00"
            aria-invalid={cpfInvalido}
            aria-describedby="cpf-ajuda"
            className={campo(cpfInvalido)}
          />
          <span
            id="cpf-ajuda"
            className={`text-fs12 ${
              cpfInvalido ? "font-semibold text-error" : "text-ink-600"
            }`}
          >
            {cpfInvalido
              ? "Confira o CPF: os dígitos não conferem."
              : "O seu banco exige para autorizar a doação mensal."}
          </span>
        </label>
      )}

      {/*
        ── Cobrir a taxa: só na doação única ───────────────────────────────
        Marcar aqui na mensal não somaria R$ 4,99 a uma doação: somaria a
        **todas**, todo mês, para sempre - a taxa vai no `valor_rec` do
        mandato (ver `createRecurringCharge`), que é o valor que o banco passa
        a debitar sozinho. Um convite de tela é curto demais para autorizar um
        acréscimo permanente no débito automático de alguém.
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
        Gerar Pix agora
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
 * ── Ele vive **só na etapa de dados**, antes de gerar o Pix ───────────────
 * Chegou a aparecer também na etapa do Pix, e saiu de lá: depois do QR gerado
 * a caixa não pode mais ser marcada sem refazer a cobrança inteira - o valor já
 * foi para o gateway e está dentro do BR Code que a pessoa vai colar. Ou a tela
 * somava R$ 4,99 a um QR que continuava cobrando o valor antigo (alguém pagaria
 * um número e leria outro), ou um clique de caixinha jogava a pessoa de volta
 * para a tela de espera. Na etapa do Pix a taxa aparece na linha "Taxa abatida"
 * do resumo, que é informação e não controle.
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
    <div className="flex flex-col gap-2.5 rounded-md border border-donate/20 bg-donate/[.07] p-3.5">
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-donate/15 text-donate"
        >
          <IconHeart size={16} />
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-fs14 font-extrabold leading-tight text-donate-text">
            Ajude com os custos da sua doação
          </span>
          <p className="text-fs13 leading-[1.45] text-ink-600">
            Cubra os custos de {formatBRLCurto(taxaCents)} do pix e garanta que sua
            doação chegue completa ao Caio.
          </p>
        </div>
      </div>

      <label
        htmlFor={id}
        className="flex cursor-pointer items-center gap-2.5 text-fs14 font-extrabold text-ink-900"
      >
        <input
          id={id}
          type="checkbox"
          checked={marcado}
          onChange={(e) => onMarcar(e.target.checked)}
          className="h-[20px] w-[20px] shrink-0 cursor-pointer accent-[color:var(--sos-donate)]"
        />
        Cobrir a taxa{" "}
        <span className="whitespace-nowrap text-donate-text tabular-nums">
          (+ {formatBRLCurto(taxaCents)})
        </span>
      </label>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Doado + taxa + total, na etapa do Pix.
 *
 * **Sem taxa, é uma linha só** - "Valor doado" e o número à direita, como na
 * gravação de referência. Com a caixa desmarcada, "valor doado", "taxa R$ 0,00"
 * e "valor total" eram três linhas dizendo o mesmo número; a conta só tem o que
 * mostrar quando existe uma parcela a somar.
 *
 * Não aparece na etapa de dados: lá o valor já foi escolhido na tela anterior.
 * Quem cobre a taxa vê o total somado aqui, junto do QR.
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
     respondem a uma dúvida que nem todo mundo tem, e ela empurraria o "Copiar
     código Pix" para baixo de quem já entendeu. É o comportamento do checkout
     de referência. */
  const [explicando, setExplicando] = useState(false);

  return (
    <dl className={`${CARTAO} gap-1.5 p-3.5 text-fs14`}>
      <div className="flex items-baseline justify-between gap-3">
        <dt className="font-semibold text-ink-600">Valor doado</dt>
        <dd className="text-fs16 font-extrabold tabular-nums text-ink-900">
          {formatBRLCurto(amountCents)}
        </dd>
      </div>

      {taxaCents > 0 && (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="flex items-center gap-1.5 font-semibold text-ink-600">
              Taxa abatida
              <button
                type="button"
                onClick={() => setExplicando((v) => !v)}
                aria-expanded={explicando}
                aria-label="O que é a taxa abatida"
                className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-ink-900/20 text-fs11 font-extrabold leading-none text-ink-600 transition-colors hover:border-action hover:text-action"
              >
                ?
              </button>
            </dt>
            <dd className="font-extrabold tabular-nums text-donate-text">
              {formatBRLCurto(taxaCents)}
            </dd>
          </div>

          {explicando && (
            <p className="rounded-md bg-surface-alt p-3 text-fs13 leading-[1.5] text-ink-600">
              Essa é a taxa de processamento do pix que o {org.name} pagaria para
              receber sua doação. Ao manter marcado, o valor chega inteiro pra
              ajudar a salvar mais vidas!
            </p>
          )}

          <div className="flex items-baseline justify-between gap-3 border-t border-ink-900/10 pt-2">
            <dt className="font-extrabold text-ink-900">Valor total</dt>
            <dd className="text-fs19 font-extrabold tabular-nums text-ink-900">
              {formatBRLCurto(totalCents)}
            </dd>
          </div>
        </>
      )}
    </dl>
  );
}

/* ------------------------------------------------------------------ */

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  A etapa do Pix - cartões empilhados sobre fundo creme                ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * O desenho é o da gravação de referência
 * (`public/Gravando 2026-08-13 144530.mp4`), na ordem em que ela mostra:
 *
 *   valor doado → copiar código → finalize no banco → QR → selo
 *
 * O painel verde da taxa ficava entre os dois primeiros e saiu: aqui ele seria
 * um controle que não pode mais ser mexido - ver `PainelTaxa`. A taxa continua
 * na primeira linha, como número.
 *
 * ── Copiar vem antes do QR, e isso é escolha ──────────────────────────────
 * A tela anterior a esta era QR à esquerda e código à direita, lado a lado. Aqui
 * o código sobe para o topo e o QR desce para o fim, porque a maioria de quem
 * doa está **no celular**: quem já está com o telefone na mão copia e cola, e
 * quem está no computador é quem escaneia. O caminho do celular fica primeiro,
 * e o do computador continua inteiro logo abaixo.
 *
 * ── O CTA saiu do rodapé fixo ─────────────────────────────────────────────
 * "Copiar código Pix" mora dentro do próprio cartão do código, como na
 * gravação, e não mais na faixa colada na base do modal. Ele continua acima da
 * dobra porque é o terceiro bloco da pilha - o rodapé fixo existia para quando
 * o botão ficava embaixo do QR e do código, dois scrolls abaixo.
 */
const CARTAO =
  "flex flex-col rounded-md border border-ink-900/[.07] bg-surface p-4 shadow-[0_1px_3px_rgba(20,17,15,.05)]";

/** Emblema quadrado-arredondado + título, a cabeça de cada cartão. */
function TituloCartao({
  icon: Icon,
  tom = "action",
  children,
}: {
  icon: ComponentType<{ size?: number }>;
  /** `highlight` é o âmbar do QR; o resto da tela é vermelho de marca. */
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

/** Quanto tempo o código vale, do jeito que o gateway foi configurado. */
const VALIDADE_HORAS = Math.round(payments.expirationSeconds / 3600);

/* ------------------------------------------------------------------ */

function StepGerando() {
  return (
    <div
      className="flex flex-col items-center gap-3 py-10 text-center"
      role="status"
      aria-live="polite"
    >
      <span className="h-[50px] w-[50px] animate-spin rounded-full border-4 border-ink-900/10 border-t-donate" />
      <p className="text-fs15 font-extrabold text-ink-900">
        Gerando seu QR Code Pix
      </p>
      <p className="text-fs13 text-ink-600">
        Preparando o pagamento da sua doação…
      </p>
    </div>
  );
}

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
        Não foi possível gerar o Pix
      </p>
      <p className="max-w-[40ch] text-fs13 leading-[1.5] text-ink-600">
        {mensagem ?? "Tente novamente em alguns segundos."}
      </p>
      <button
        data-autofocus=""
        type="button"
        onClick={onTentarDeNovo}
        className="mt-1 inline-flex min-h-[50px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-donate px-6 text-fs15 font-extrabold uppercase tracking-[0.03em] text-donate-ink transition-colors hover:bg-donate-hover"
      >
        Tentar de novo
      </button>
    </div>
  );
}

/**
 * A tela que só o gateway abre.
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
        {mensal ? "Doação mensal ativada!" : "Pagamento confirmado!"}
      </p>
      <p className="max-w-[40ch] text-fs14 leading-[1.55] text-ink-600">
        Sua doação de{" "}
        <strong className="font-semibold text-ink-900">
          {formatBRLCurto(totalCents)}
        </strong>{" "}
        já está a caminho de quem precisa. Obrigado de verdade.
      </p>
      {/* O que acabou de ser autorizado, em uma frase: a partir daqui o débito
          é automático, e quem não souber disso estranha o extrato do mês que
          vem. A data sai da mesma conta que foi ao gateway. */}
      {mensal && (
        <p className="max-w-[40ch] text-fs13 leading-[1.55] text-ink-600">
          A próxima cobrança sai sozinha em{" "}
          <strong className="font-semibold text-ink-900">
            {dataPorExtenso(recurrenceStartDate())}
          </strong>
          , e assim todo mês. Você pode cancelar quando quiser, no app do seu
          banco, em Pix &rsaquo; Pix Automático.
        </p>
      )}
      <p className="mt-1 flex items-center gap-1.5 text-fs12 font-semibold text-ink-600">
        <IconHeart size={14} className="shrink-0 text-donate" />
        Levando você para a página de confirmação…
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function StepPix({
  qr,
  pixCode,
  mensal,
  amountCents,
  taxaCents,
  totalCents,
  copiado,
  onCopiar,
}: {
  qr: string | null;
  pixCode: string;
  mensal: boolean;
  amountCents: number;
  taxaCents: number;
  totalCents: number;
  copiado: boolean;
  onCopiar: () => void;
}) {
  /* Os três passos do banco, com os termos que a pessoa vai procurar na tela
     dele em destaque - é o que a gravação de referência marca em vermelho. */
  const passos: { titulo: string; texto: ReactNode }[] = [
    {
      titulo: "Passo 1",
      texto: (
        <>
          Abra o app ou site do seu <strong className="font-extrabold text-action">banco</strong>
        </>
      ),
    },
    {
      titulo: "Passo 2",
      texto: (
        <>
          Vá em{" "}
          <strong className="font-extrabold text-action">
            Pix &rarr; Pagar &rarr; Colar chave
          </strong>{" "}
          e cole o código
        </>
      ),
    },
    {
      titulo: "Passo 3",
      texto: mensal ? (
        <>
          Confirme o recebedor{" "}
          <strong className="font-extrabold text-action">{pix.receiver}</strong>, autorize a{" "}
          <strong className="font-extrabold text-action">cobrança mensal</strong> e finalize
        </>
      ) : (
        <>
          Confirme o recebedor{" "}
          <strong className="font-extrabold text-action">{pix.receiver}</strong> e finalize a
          transferência
        </>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <ResumoValores
        amountCents={amountCents}
        taxaCents={taxaCents}
        totalCents={totalCents}
      />

      {/*
        ── O que este QR faz, dito antes de ser lido ──────────────────────
        Na mensal ele não é um Pix comum: um scan paga hoje **e** autoriza o
        banco a repetir a cobrança nos próximos meses (Jornada 3 do Pix
        Automático). A tela do banco vai perguntar isso em outras palavras, e
        quem chega lá sem saber desiste na hora - autorização que aparece de
        surpresa lê como golpe, não como doação.
      */}
      {mensal && (
        <div className="rounded-md border-2 border-donate/30 bg-donate/[.06] p-3.5">
          <p className="text-fs13 font-extrabold leading-[1.45] text-ink-900">
            Um QR só, duas coisas
          </p>
          <p className="mt-1 text-fs13 leading-[1.5] text-ink-600">
            Ele paga{" "}
            <strong className="font-semibold text-ink-900">
              {formatBRLCurto(totalCents)} agora
            </strong>{" "}
            e autoriza a mesma cobrança todo mês, a partir de{" "}
            <strong className="font-semibold text-ink-900">
              {dataPorExtenso(recurrenceStartDate())}
            </strong>
            . Seu banco vai pedir essa confirmação - e você cancela quando
            quiser, por lá mesmo.
          </p>
        </div>
      )}

      {/* ── Copie o código Pix ─────────────────────────────────────────── */}
      <section className={`${CARTAO} gap-3`}>
        <TituloCartao icon={IconCopy}>Copie o código Pix</TituloCartao>

        {/*
          Uma linha só, cortada no fim (`truncate`), e não mais a caixa rolável
          com o código inteiro em quatro linhas. Ninguém lê um BR Code: ele
          existe para ser copiado pelo botão logo abaixo, e mostrá-lo por
          extenso só empurrava esse botão para fora da tela. O código completo
          continua no `title` e é o que vai para a área de transferência.
        */}
        <div className="flex flex-col gap-1 rounded-md border border-dashed border-ink-900/20 bg-surface-alt px-3.5 py-3">
          <span className="text-fs10 font-extrabold uppercase tracking-[0.1em] text-ink-600">
            Pix copia e cola
          </span>
          <p title={pixCode} className="truncate font-mono text-fs13 text-ink-900">
            {pixCode}
          </p>
        </div>

        <button
          type="button"
          onClick={onCopiar}
          disabled={!pixCode}
          className={`inline-flex min-h-[52px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-md px-5 text-fs15 font-extrabold uppercase tracking-[0.03em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            copiado
              ? "bg-donate-hover text-donate-ink"
              : "bg-donate text-donate-ink shadow-[0_8px_20px_-8px_rgba(27,138,75,.7)] hover:bg-donate-hover"
          }`}
        >
          {copiado ? <IconCheck size={18} /> : <IconCopy size={18} />}
          {copiado ? "Código copiado!" : "Copiar código Pix"}
        </button>

        {/* Não é enfeite: esta linha é a promessa de que a pessoa não precisa
            clicar em nada depois de pagar. */}
        <p
          aria-live="polite"
          className="flex items-center justify-center gap-1.5 text-center text-fs12 font-semibold text-ink-600"
        >
          <span className="relative flex h-[8px] w-[8px] shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-donate opacity-60" />
            <span className="relative inline-flex h-[8px] w-[8px] rounded-full bg-donate" />
          </span>
          Esta tela avisa sozinha quando o pagamento cair.
        </p>
      </section>

      {/* ── Finalize no seu banco ──────────────────────────────────────── */}
      <section className={`${CARTAO} gap-3`}>
        <TituloCartao icon={IconMonitor}>Finalize no seu banco</TituloCartao>

        <ol className="flex flex-col gap-3">
          {passos.map((passo, i) => (
            <li key={passo.titulo} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-action text-fs12 font-extrabold text-action-ink"
              >
                {i + 1}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-fs10 font-extrabold uppercase tracking-[0.1em] text-ink-600">
                  {passo.titulo}
                </span>
                <span className="text-fs14 leading-[1.45] text-ink-900">
                  {passo.texto}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Ou escaneie o QR Code ──────────────────────────────────────── */}
      <section className={`${CARTAO} gap-2.5`}>
        <TituloCartao icon={IconQrCode} tom="highlight">
          Ou escaneie o QR Code
        </TituloCartao>

        <p className="text-fs13 leading-[1.45] text-ink-600">
          Use a câmera do celular para escanear e pagar diretamente
        </p>

        <div className="flex justify-center rounded-md border border-dashed border-ink-900/20 bg-surface-alt p-3.5">
          {qr ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={qr}
              alt="QR Code Pix da sua doação"
              width={200}
              height={200}
              className="block h-[200px] w-[200px] bg-white"
            />
          ) : (
            <div className="h-[200px] w-[200px] animate-pulse rounded-sm bg-ink-900/[.06]" />
          )}
        </div>
      </section>

      {/* ── O selo que fecha a tela ────────────────────────────────────── */}
      <div className="flex items-center gap-3 rounded-md bg-action px-4 py-3 text-action-ink">
        <span
          aria-hidden="true"
          className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[12px] bg-white/15"
        >
          <IconShield size={18} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-fs14 font-extrabold leading-tight">
            Pagamento 100% seguro
          </span>
          <span className="text-fs12 leading-tight text-white/75">
            Verificado pela {pix.receiver}
          </span>
        </span>
        {/* Quanto tempo o código vale, tirado da própria configuração do
            gateway (`payments.expirationSeconds`) - um "24h" escrito à mão
            continuaria dizendo 24 no dia em que a validade mudasse. */}
        <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-highlight px-2.5 py-1 text-fs12 font-extrabold text-ink-900">
          <IconClock size={14} />
          {VALIDADE_HORAS}h
        </span>
      </div>
    </div>
  );
}
