"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { checkoutFee, feeCentsFor, formatBRL } from "@/content/landing";
import { isValidPhoneBR, maskPhoneBR } from "@/lib/format";
import {
  createCharge,
  checkLeadPaidOnSheet,
  fetchChargeStatus,
  logSheetRedirect,
  payments,
  readPixFrom,
  readStatusHandle,
  type ChargeResponse,
} from "@/lib/payments/lusa";
import {
  clearLeadId,
  getLeadId,
  trackInitiateCheckout,
  trackPixPaid,
  type LeadTracking,
} from "@/lib/payments/tracking";
import { useScrollLock } from "@/lib/scroll-lock";
import {
  CHECKOUT_EVENT,
  setCheckoutOpen,
  suppressNextBackIntercept,
  type CheckoutItem,
} from "./checkout-bus";
import {
  IconArrowLeft,
  IconBowl,
  IconCheck,
  IconClose,
  IconCopy,
  IconHeart,
  IconPix,
  IconShield,
} from "../ui/Icons";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  CHECKOUT — modal sobre a landing, nunca outra página                 ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Antes, cada CTA de doação era um link para `/doar/<faixa>`: a pessoa saía da
 * página, perdia o lugar em que estava e, se desistisse, voltava para o topo.
 * Agora o clique abre este modal por cima da landing. As rotas `/doar/*`
 * continuam existindo — ver o aviso sobre elas no fim deste bloco.
 *
 * ── As etapas ─────────────────────────────────────────────────────────────
 *
 *   `dados`    nome, doação anônima, WhatsApp opcional e a opção de cobrir a
 *              taxa. Termina em "Gerar Pix agora".
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
 * ── O resumo do item e o CTA ficam fora do scroll ─────────────────────────
 * Foto, quantidade, valor e impacto ficam numa faixa entre o cabeçalho e o
 * corpo; o CTA de cada etapa mora num rodapé fixo. Só o miolo rola. É o que
 * mantém "o que estou doando" e "Copiar chave Pix" sempre na tela — antes o
 * botão ficava embaixo do QR e do código, dois scrolls abaixo da dobra.
 *
 * ── ✅ A tela de sucesso depende do gateway, e só dele ────────────────────
 * `pago` é inalcançável por clique. Não existe "já fiz o pagamento", não
 * existe timeout que conclua, e gerar o QR não conclui nada. A única porta é
 * o gateway responder `paid: true`, por um de dois caminhos:
 *
 *   1. **Polling** — a cada 5s enquanto a etapa `pix` estiver aberta, até 15
 *      minutos (`payments.statusPollMaxMs`).
 *   2. **Planilha, no retorno** — em celular, abrir o app do banco costuma
 *      descarregar esta página, e aí o polling morre junto. Quando a aba volta
 *      a ficar visível, consultamos a planilha (que o webhook do gateway
 *      alimenta) pelo `lead_id` guardado. Sem isso, quem pagou voltaria para um
 *      "aguardando confirmação" que nunca termina.
 *
 * O caminho 2 roda mesmo com o modal fechado e mesmo depois de a página ter
 * recarregado — por isso o efeito dele não depende de `aberto`.
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

export function CheckoutModal() {
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
   * quieto nesse intervalo — sem isso os dois disputam o mesmo "voltar" e a
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
         O `popstate` que isso gera chega com o checkout já fechado — daí a
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
  const taxaCents = item && dados.cobrirTaxa ? feeCentsFor(item.amountCents) : 0;
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
      try {
        const lead = trackInitiateCheckout({
          amountCents: totalCents,
          productName: productTitleFor(item),
          productDescription: item.impact,
          donorName: dados.nome.trim(),
          donorPhone: dados.whatsapp,
          anonymous: dados.anonimo,
        });
        leadRef.current = lead;

        /*
         * A cobrança e o piso da tela de espera correm juntos. O piso existe
         * para a tela ser lida em vez de piscar — quando a API responde antes
         * dele, quem manda é ele; quando demora mais, ele não custa nada.
         */
        const [data] = await Promise.all([
          createCharge(
            {
              amountCents: totalCents,
              leadId: lead.lead_id,
              productTitle: productTitleFor(item),
            },
            controller.signal,
          ),
          new Promise((r) => setTimeout(r, payments.loaderMinMs)),
        ]);

        if (geracaoRef.current !== minha) return;

        const { image, code } = readPixFrom(data);
        if (!image && !code) {
          throw new Error(
            "A API respondeu, mas não devolveu o QR Code nem o código Pix.",
          );
        }

        statusRef.current = readStatusHandle(data);
        setPixCode(code);
        setEtapa("pix");

        if (image) {
          setQr(image);
        } else {
          /* Sem imagem pronta: desenhamos o QR do copia-e-cola com a
             biblioteca que já está no pacote — nada de script de CDN. */
          const { toDataURL } = await import("qrcode");
          const desenhado = await toDataURL(code, {
            margin: 0,
            width: 460,
            errorCorrectionLevel: "M",
            color: { dark: "#14110F", light: "#FFFFFF" },
          });
          if (geracaoRef.current === minha) setQr(desenhado);
        }

        /* A API pode responder já paga — respeitar isso evita cinco segundos
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

  const enviarDados = () => {
    setTentouEnviar(true);
    if (!dados.anonimo && dados.nome.trim().length < 2) return;
    if (!isValidPhoneBR(dados.whatsapp)) return;
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
        return "Pague com Pix";
    }
  }, [etapa]);

  if (!item) return null;

  const podeVoltar = etapa === "pix" || etapa === "erro";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-night/70 anim-fade-in sm:items-center sm:p-4"
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
         * e o rodapé com o CTA principal ficava atrás dela — que é justamente
         * o botão que precisa estar sempre visível.
         */
        className="anim-fade-up flex max-h-[90dvh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-lg bg-surface shadow-xl sm:rounded-lg"
      >
        {/* ── Cabeçalho ─────────────────────────────────────────────── */}
        <header className="flex shrink-0 items-center gap-2 border-b border-ink-900/10 px-3 py-2.5 sm:px-4">
          {podeVoltar ? (
            <button
              type="button"
              onClick={() => {
                geracaoRef.current += 1;
                statusRef.current = { pollUrl: "", reference: "" };
                setEtapa("dados");
              }}
              aria-label="Voltar para os dados"
              className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-surface-alt hover:text-ink-900"
            >
              <IconArrowLeft size={20} />
            </button>
          ) : (
            <span aria-hidden="true" className="h-[40px] w-[40px] shrink-0" />
          )}

          <h2
            id="checkout-titulo"
            className="flex-1 text-center text-[16px] font-extrabold leading-tight text-ink-900"
          >
            {titulo}
          </h2>

          {/* Na tela de confirmação não há o que fechar: a página já vai
              trocar sozinha, e um X ali só criaria a dúvida de "perdi algo?". */}
          {etapa === "pago" ? (
            <span aria-hidden="true" className="h-[40px] w-[40px] shrink-0" />
          ) : (
            <button
              type="button"
              onClick={fechar}
              aria-label="Fechar"
              className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-surface-alt hover:text-ink-900"
            >
              <IconClose size={20} />
            </button>
          )}
        </header>

        <StepProgress etapa={etapa} />

        {/* ── O item, sempre à vista ────────────────────────────────────
            Fora da área que rola: é o que a pessoa está comprando, e some
            no primeiro scroll se ficar junto do corpo. */}
        <div className="flex shrink-0 items-center gap-3 border-b border-ink-900/10 bg-surface-alt px-3 py-3 sm:px-4">
          <div className="relative h-[62px] w-[62px] shrink-0 overflow-hidden rounded-sm border border-ink-900/10 bg-white sm:h-[72px] sm:w-[72px]">
            {item.image ? (
              /* `object-contain`: a foto é um produto em fundo branco, e
                 `cover` cortaria o saco. */
              <Image
                src={item.image.src}
                alt={item.image.alt}
                fill
                sizes="72px"
                className="object-contain p-1"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-ink-300">
                <IconBowl size={26} />
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[12px] font-extrabold uppercase tracking-[0.06em] text-accent">
              {item.title}
            </span>
            <span className="text-[20px] font-extrabold leading-none text-ink-900 tabular-nums">
              {formatBRL(item.amountCents)}
            </span>
            <span className="text-[12px] leading-[1.35] text-ink-600">
              {item.impact}
            </span>
          </div>
        </div>

        {/* ── Corpo (a única parte que rola) ───────────────────────────── */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4">
          {etapa === "dados" && (
            <StepDados
              dados={dados}
              setDados={setDados}
              nomeInvalido={nomeInvalido}
              whatsappInvalido={whatsappInvalido}
              amountCents={item.amountCents}
              taxaCents={taxaCents}
              totalCents={totalCents}
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
              amountCents={item.amountCents}
              taxaCents={taxaCents}
              totalCents={totalCents}
            />
          )}

          {etapa === "pago" && <StepPago totalCents={totalCents} />}
        </div>

        {/* ── Rodapé fixo: o CTA da etapa ──────────────────────────────── */}
        {(etapa === "dados" || etapa === "pix") && (
          <div className="shrink-0 border-t border-ink-900/10 bg-surface px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-4">
            {etapa === "dados" ? (
              <>
                <button
                  type="button"
                  onClick={enviarDados}
                  className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-donate px-6 text-[15px] font-extrabold uppercase tracking-[0.03em] text-donate-ink shadow-[0_10px_30px_-10px_rgba(27,138,75,.7)] transition-colors hover:bg-donate-hover"
                >
                  <IconPix size={18} />
                  Gerar Pix agora
                </button>
                {/* A referência usa amarelo neste selo; aqui ele é verde, que
                    é a cor de doação desta campanha. */}
                <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[12px] font-semibold text-ink-600">
                  <IconShield size={14} className="shrink-0 text-donate" />
                  Pagamento 100% seguro e verificado
                </p>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={copiar}
                  disabled={!pixCode}
                  className={`inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full px-6 text-[15px] font-extrabold uppercase tracking-[0.03em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    copiado
                      ? "bg-ink-900 text-white"
                      : "bg-donate text-donate-ink shadow-[0_10px_30px_-10px_rgba(27,138,75,.7)] hover:bg-donate-hover"
                  }`}
                >
                  {copiado ? <IconCheck size={18} /> : <IconCopy size={18} />}
                  {copiado ? "Chave Pix copiada!" : "Copiar chave Pix"}
                </button>
                {/* Não é enfeite: esta linha é a promessa de que a pessoa não
                    precisa clicar em nada depois de pagar. */}
                <p
                  aria-live="polite"
                  className="mt-2 flex items-center justify-center gap-1.5 text-center text-[12px] font-semibold text-ink-600"
                >
                  <span className="relative flex h-[8px] w-[8px] shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-donate opacity-60" />
                    <span className="relative inline-flex h-[8px] w-[8px] rounded-full bg-donate" />
                  </span>
                  Esta tela avisa sozinha quando o pagamento cair.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
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

/** Duas barrinhas: dados → pagamento. `gerando` e `erro` contam como dados. */
function StepProgress({ etapa }: { etapa: Etapa }) {
  const indice = etapa === "pix" || etapa === "pago" ? 1 : 0;
  return (
    <div className="flex shrink-0 gap-1 px-3 pb-2 sm:px-4" aria-hidden="true">
      {[0, 1].map((i) => (
        <span
          key={i}
          className={`h-[3px] flex-1 rounded-full transition-colors ${
            i <= indice ? "bg-donate" : "bg-ink-900/10"
          }`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function StepDados({
  dados,
  setDados,
  nomeInvalido,
  whatsappInvalido,
  amountCents,
  taxaCents,
  totalCents,
  onSubmit,
}: {
  dados: Dados;
  setDados: (patch: (d: Dados) => Dados) => void;
  nomeInvalido: boolean;
  whatsappInvalido: boolean;
  amountCents: number;
  taxaCents: number;
  totalCents: number;
  onSubmit: () => void;
}) {
  const taxaPreview = feeCentsFor(amountCents);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-extrabold text-ink-900">Nome</span>
        <input
          data-autofocus=""
          type="text"
          autoComplete="name"
          disabled={dados.anonimo}
          value={dados.nome}
          onChange={(e) => setDados((d) => ({ ...d, nome: e.target.value }))}
          placeholder="Seu nome completo"
          aria-invalid={nomeInvalido}
          /* `text-[16px]`: abaixo disso o Safari do iPhone dá zoom sozinho ao
             focar o campo e a pessoa perde o modal de vista. */
          className={`min-h-[52px] rounded-md border-2 bg-surface px-3 text-[16px] font-semibold text-ink-900 outline-none transition-colors placeholder:font-normal placeholder:text-ink-300 disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-ink-300 ${
            nomeInvalido ? "border-error" : "border-ink-900/10 focus:border-donate"
          }`}
        />
        {nomeInvalido && (
          <span className="text-[12px] font-semibold text-error">
            Diga como podemos te chamar — ou marque “Quero doar anonimamente”.
          </span>
        )}
      </label>

      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={dados.anonimo}
          onChange={(e) => setDados((d) => ({ ...d, anonimo: e.target.checked }))}
          className="h-[22px] w-[22px] shrink-0 cursor-pointer accent-[color:var(--sos-donate)]"
        />
        <span className="text-[14px] font-semibold text-ink-900">
          Quero doar anonimamente
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-extrabold text-ink-900">
          WhatsApp{" "}
          <span className="font-semibold text-ink-600">(opcional)</span>
        </span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={dados.whatsapp}
          onChange={(e) =>
            setDados((d) => ({ ...d, whatsapp: maskPhoneBR(e.target.value) }))
          }
          placeholder="(85) 99999-9999"
          aria-invalid={whatsappInvalido}
          className={`min-h-[52px] rounded-md border-2 bg-surface px-3 text-[16px] font-semibold text-ink-900 outline-none transition-colors placeholder:font-normal placeholder:text-ink-300 ${
            whatsappInvalido
              ? "border-error"
              : "border-ink-900/10 focus:border-donate"
          }`}
        />
        <span
          className={`text-[12px] ${
            whatsappInvalido ? "font-semibold text-error" : "text-ink-600"
          }`}
        >
          {whatsappInvalido
            ? "Confira o número: faltam dígitos."
            : "Só usamos para avisar quando a ração chegar no abrigo."}
        </span>
      </label>

      {checkoutFee.enabled && (
        <div
          className={`rounded-md border-2 p-3 transition-colors ${
            dados.cobrirTaxa ? "border-donate bg-donate/[.06]" : "border-ink-900/10"
          }`}
        >
          <div className="flex items-start gap-3">
            <input
              id="cobrir-taxa"
              type="checkbox"
              checked={dados.cobrirTaxa}
              onChange={(e) =>
                setDados((d) => ({ ...d, cobrirTaxa: e.target.checked }))
              }
              aria-describedby="cobrir-taxa-desc"
              className="mt-0.5 h-[22px] w-[22px] shrink-0 cursor-pointer accent-[color:var(--sos-donate)]"
            />
            <div className="flex flex-col gap-1">
              <label
                htmlFor="cobrir-taxa"
                className="cursor-pointer text-[15px] font-extrabold leading-tight text-ink-900"
              >
                Deseja cobrir a taxa?{" "}
                <span className="whitespace-nowrap text-donate tabular-nums">
                  (+ {formatBRL(taxaPreview)})
                </span>
              </label>
              <p id="cobrir-taxa-desc" className="text-[13px] leading-[1.5] text-ink-600">
                Todo pagamento tem uma taxa de processamento. Cobrindo ela, o
                valor integral da sua doação chega inteiro na organização.{" "}
                <strong className="font-semibold text-ink-900">
                  Pode desmarcar sem problema
                </strong>
                : sua doação continua valendo igual.
              </p>
            </div>
          </div>
        </div>
      )}

      <ResumoValores
        amountCents={amountCents}
        taxaCents={taxaCents}
        totalCents={totalCents}
      />

      {/*
        O botão de verdade mora no rodapé fixo do modal, fora deste `<form>`.
        Este existe só para o Enter num campo de texto enviar, como em qualquer
        formulário — daí o `tabIndex={-1}` e o `aria-hidden`: ele não é uma
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

/** Doado + taxa + total. Aparece nas duas etapas, com os mesmos números. */
function ResumoValores({
  amountCents,
  taxaCents,
  totalCents,
}: {
  amountCents: number;
  taxaCents: number;
  totalCents: number;
}) {
  return (
    <dl className="flex flex-col gap-1.5 rounded-md bg-surface-alt p-3 text-[14px]">
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-ink-600">Valor doado</dt>
        <dd className="font-semibold tabular-nums text-ink-900">
          {formatBRL(amountCents)}
        </dd>
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-ink-600">
          {taxaCents > 0 ? "Taxa coberta por você" : "Taxa"}
        </dt>
        <dd
          className={`font-semibold tabular-nums ${
            taxaCents > 0 ? "text-donate" : "text-ink-600"
          }`}
        >
          {taxaCents > 0 ? `+ ${formatBRL(taxaCents)}` : formatBRL(0)}
        </dd>
      </div>

      <div className="flex items-baseline justify-between gap-3 border-t border-ink-900/10 pt-2">
        <dt className="font-extrabold text-ink-900">Valor total</dt>
        <dd className="text-[19px] font-extrabold tabular-nums text-ink-900">
          {formatBRL(totalCents)}
        </dd>
      </div>
    </dl>
  );
}

/* ------------------------------------------------------------------ */

function StepGerando() {
  return (
    <div
      className="flex flex-col items-center gap-3 py-10 text-center"
      role="status"
      aria-live="polite"
    >
      <span className="h-[50px] w-[50px] animate-spin rounded-full border-4 border-ink-900/10 border-t-donate" />
      <p className="text-[15px] font-extrabold text-ink-900">
        Gerando seu QR Code Pix
      </p>
      <p className="text-[13px] text-ink-600">
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
      <p className="text-[16px] font-extrabold text-ink-900">
        Não foi possível gerar o Pix
      </p>
      <p className="max-w-[40ch] text-[13px] leading-[1.5] text-ink-600">
        {mensagem ?? "Tente novamente em alguns segundos."}
      </p>
      <button
        data-autofocus=""
        type="button"
        onClick={onTentarDeNovo}
        className="mt-1 inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-donate px-6 text-[15px] font-extrabold uppercase tracking-[0.03em] text-donate-ink transition-colors hover:bg-donate-hover"
      >
        Tentar de novo
      </button>
    </div>
  );
}

/**
 * A tela que só o gateway abre.
 *
 * Nenhum botão leva até aqui — ver o bloco de confirmação no topo do arquivo.
 */
function StepPago({ totalCents }: { totalCents: number }) {
  return (
    <div
      className="flex flex-col items-center gap-3 py-8 text-center"
      role="status"
      aria-live="polite"
    >
      <span className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-donate/10 text-donate">
        <IconCheck size={34} />
      </span>
      <p className="text-[19px] font-extrabold text-ink-900">
        Pagamento confirmado!
      </p>
      <p className="max-w-[40ch] text-[14px] leading-[1.55] text-ink-600">
        Sua doação de{" "}
        <strong className="font-semibold text-ink-900">
          {formatBRL(totalCents)}
        </strong>{" "}
        já está a caminho de quem precisa. Obrigado de verdade.
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold text-ink-600">
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
  amountCents,
  taxaCents,
  totalCents,
}: {
  qr: string | null;
  pixCode: string;
  amountCents: number;
  taxaCents: number;
  totalCents: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      <ResumoValores
        amountCents={amountCents}
        taxaCents={taxaCents}
        totalCents={totalCents}
      />

      <p className="flex items-center justify-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.08em] text-donate">
        <IconCheck size={15} />
        Pix gerado — escaneie ou copie
      </p>

      {/*
        168px, e não os 220px do checkout antigo. O QR precisa ser legível pela
        câmera do celular, não ocupar a tela: com 220 mais o código e o resumo,
        o botão de copiar caía abaixo da dobra num celular pequeno — que é o
        problema que este passo inteiro foi reorganizado para resolver.
      */}
      <div className="mx-auto rounded-md border-2 border-ink-900/10 bg-white p-2">
        {qr ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={qr}
            alt="QR Code Pix da sua doação"
            width={168}
            height={168}
            className="block h-[168px] w-[168px]"
          />
        ) : (
          <div className="h-[168px] w-[168px] animate-pulse rounded-sm bg-surface-alt" />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] font-extrabold uppercase tracking-[0.06em] text-ink-600">
          Pix copia e cola
        </span>
        <p className="max-h-[58px] overflow-y-auto break-all rounded-sm border border-ink-900/10 bg-surface-alt p-2.5 font-mono text-[11px] leading-[1.45] text-ink-600">
          {pixCode}
        </p>
      </div>

      <ol className="flex flex-col gap-2 rounded-sm bg-surface-alt p-3">
        {[
          "Abra o app do seu banco e entre em Pix › Pix Copia e Cola.",
          "Cole o código e confira o valor.",
          "Confirme. Esta tela avisa sozinha assim que o pagamento cair.",
        ].map((passo, i) => (
          <li key={passo} className="flex gap-2.5 text-[12px] leading-[1.45] text-ink-600">
            <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-donate text-[11px] font-extrabold text-donate-ink">
              {i + 1}
            </span>
            <span>{passo}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
