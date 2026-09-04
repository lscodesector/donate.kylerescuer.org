"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  extractStripeIntent,
  fetchGiveWpConfig,
  givewp,
  loadStripeSdk,
  paymentIntentIdFrom,
  registerGiveWpRef,
  submitDonation,
  type GiveWpConfig,
  type StripeElements,
  type StripeInstance,
} from "@/lib/payments/givewp";
import { placeholderEmail } from "@/lib/payments/lusa";
import { formatUSDCurto } from "@/lib/format";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  O CAMPO DE CARTÃO - Stripe Payment Element, via GiveWP               ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * A interface de doação por cartão. Fala só com `lib/payments/givewp.ts`
 * (as rotas REST do `givewp.kylerescuer.org`) - nunca com a Stripe por fora
 * delas, para não perder a validação que o GiveWP já faz.
 *
 * ⚠️ **Preparado, ainda não ligado.** Nenhuma tela importa daqui: o checkout
 * cobra por PayPal (`components/payments/givewp-paypal.tsx`).
 *
 * O motivo é do lado do WordPress, não daqui: em 2026-09-04 o `/config`
 * devolve `stripe.publishableKey` vazio - não há conta Stripe conectada.
 * Montar este componente hoje mostra "Card payments are not available right
 * now". No dia em que a conta for conectada, ele passa a funcionar sem
 * mudança de código.
 *
 * ── Por que não existe um "criar cobrança" antes ──────────────────────────
 * Diferente do PayPal, aqui **não há** passo de criar pedido. O Payment
 * Element monta com um Payment Intent *diferido* - quer dizer, sem
 * `clientSecret` nenhum -, e o Intent só nasce de verdade lá dentro do
 * `/donate`, quando a pessoa já clicou em pagar. Só depois disso o
 * `confirmPayment` tenta cobrar o cartão.
 *
 * ── As fases ─────────────────────────────────────────────────────────────
 *
 *   `carregando`   busca `/config`, carrega o SDK e monta o campo
 *   `pronto`       campo visível, esperando o clique
 *   `processando`  valida → `/donate` → `confirmPayment`
 *   `pago`         a Stripe aceitou; quem fecha a doação é o webhook dela
 *
 * ── Erros vão para quem chamou ───────────────────────────────────────────
 * Mesmo contrato de `GiveWpPaypalButtons`: o componente não desenha bloco de
 * erro próprio, ele chama `onFalha`. Uma tela de pagamento com duas superfícies
 * de erro diferentes é uma que mostra a mensagem no lugar errado no dia
 * ruim. A validação de campo (número incompleto, CVC faltando) é exceção
 * porque quem desenha é a própria Stripe, colada no campo.
 */
export function GiveWpCardForm({
  formId = givewp.formId,
  totalCents,
  leadId,
  primeiroNome = "Anonymous",
  sobrenome = "Donor",
  email,
  onPago,
  onFalha,
}: {
  formId?: number;
  totalCents: number;
  /** O `lead_id` desta doação - o que casa o pagamento com o funil. */
  leadId: string;
  primeiroNome?: string;
  sobrenome?: string;
  /** Sem e-mail real, entra um de reserva: a doação exige o campo. */
  email?: string;
  /**
   * Recebe o **Payment Intent ID** (`pi_…`) - o mesmo valor que a Stripe
   * manda no evento `PaymentIntentSucceeded` e que o hook do WordPress relê
   * da doação. É a chave que casa os dois lados, e o equivalente ao Order ID
   * do PayPal em `GiveWpPaypalButtons`.
   */
  onPago: (paymentIntentId: string) => void;
  onFalha: (mensagem: string) => void;
}) {
  type Fase = "carregando" | "pronto" | "processando" | "pago";

  const [fase, setFase] = useState<Fase>("carregando");
  const alvo = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<StripeInstance | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const configRef = useRef<GiveWpConfig | null>(null);

  /* Os callbacks entram por ref para o efeito não depender deles: uma
     rerrenderização da tela não pode remontar o campo de cartão e apagar o
     que a pessoa já digitou. */
  const pago = useRef(onPago);
  const falhou = useRef(onFalha);
  useEffect(() => {
    pago.current = onPago;
    falhou.current = onFalha;
  });

  /**
   * O valor a cobrar, preso aos limites que `/config` publica.
   *
   * Lido ao vivo do ref, e não capturado por closure: o `/config` chega
   * depois de a tela já ter montado, e um valor fora do mínimo do form seria
   * recusado pelo GiveWP só lá na frente, com mensagem ruim.
   */
  const valorCobrado = useCallback(() => {
    const cfg = configRef.current;
    const dolares = totalCents / 100;
    const min = cfg?.minAmount ? Number(cfg.minAmount) : 0.01;
    const max = cfg?.maxAmount ? Number(cfg.maxAmount) : Infinity;
    /* Duas casas sempre: `"33.8"` no lugar de `"33.80"` é recusado. */
    return Math.min(Math.max(dolares, min || 0.01), max || Infinity).toFixed(2);
  }, [totalCents]);

  /* Monta o campo. `totalCents` na lista de dependências de propósito: o
     valor é assado dentro do `elements({ amount })`, então trocar de pacote
     precisa refazer o campo - senão o cartão cobraria o valor anterior, que
     é o pior defeito possível numa tela de pagamento. */
  useEffect(() => {
    let vivo = true;
    const controller = new AbortController();

    const montar = async () => {
      try {
        setFase("carregando");

        const config = await fetchGiveWpConfig(formId, controller.signal);
        if (!vivo) return;

        /* `?.` porque o campo some do JSON (em vez de vir vazio) se o
           WordPress ainda estiver numa versão do `functions.php` anterior à
           que devolve o bloco `stripe` no `/config`. Sem a checagem isso
           quebraria com um TypeError cru em vez da mensagem abaixo. */
        if (!config.stripe?.publishableKey) {
          throw new Error(
            "Card payments are not available right now. Please try PayPal.",
          );
        }
        configRef.current = config;

        const stripe = await loadStripeSdk(
          config.stripe.publishableKey,
          config.stripe.connectedAccountId,
        );
        if (!vivo) return;
        stripeRef.current = stripe;

        /* `mode: "payment"` sem `clientSecret` - o Payment Intent diferido.
           Ele só é criado de verdade dentro do `/donate`, em `pagar`. */
        const elements = stripe.elements({
          mode: "payment",
          amount: Math.round(Number(valorCobrado()) * 100),
          currency: config.currency.toLowerCase(),
        });
        elementsRef.current = elements;

        const no = alvo.current;
        if (!no || !vivo) return;
        /* O SDK não desenha React: ele monta um `<iframe>` dentro de um nó
           que a gente entrega. Limpar antes evita dois campos empilhados
           quando o efeito roda de novo por troca de valor. */
        no.replaceChildren();
        elements.create("payment").mount(no);

        setFase("pronto");
      } catch (err) {
        if (!vivo) return;
        falhou.current(
          err instanceof Error
            ? err.message
            : "We could not load the card form. Check your connection.",
        );
      }
    };

    void montar();
    return () => {
      vivo = false;
      controller.abort();
    };
  }, [formId, totalCents, valorCobrado]);

  const pagar = async () => {
    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    const cfg = configRef.current;
    if (!stripe || !elements || !cfg) return;

    setFase("processando");

    try {
      /* Valida os campos no navegador. A Stripe desenha o erro colada no
         campo errado - por isso este caso não vai para `onFalha`. */
      const { error: erroDeCampo } = await elements.submit();
      if (erroDeCampo) {
        setFase("pronto");
        return;
      }

      const resultado = await submitDonation({
        formId,
        gatewayId: "stripe_payment_element",
        amount: valorCobrado(),
        currency: cfg.currency,
        firstName: primeiroNome,
        lastName: sobrenome,
        email: email || placeholderEmail(),
        stripePaymentMethod: "card",
        stripePaymentMethodIsCreditCard: true,
        successUrl: typeof window !== "undefined" ? window.location.href : "",
      });

      if (!resultado.ok) {
        throw new Error(
          "GiveWP declined this donation. Please check with us before trying again.",
        );
      }

      const intent = extractStripeIntent(resultado);

      /*
       * ── A correlação vai ANTES de confirmar o cartão ──────────────────
       * O `/donate` não devolve id de doação nenhum; a chave que casa os
       * dois lados é o Payment Intent, escondido no prefixo do
       * `clientSecret`. Registrar aqui, e não depois do `confirmPayment`,
       * porque um método que exija redirect de página inteira leva a pessoa
       * embora antes da linha seguinte rodar - e o webhook do lado do
       * WordPress pode chegar bem antes de o navegador voltar.
       */
      registerGiveWpRef(leadId, paymentIntentIdFrom(intent.clientSecret));

      const { error: erroDeCobranca } = await stripe.confirmPayment({
        elements,
        clientSecret: intent.clientSecret,
        confirmParams: {
          return_url: intent.returnUrl || window.location.href,
          payment_method_data: intent.billingDetails
            ? { billing_details: intent.billingDetails }
            : undefined,
        },
        /* Cartão comum fica na mesma página; só navega se o método exigir
           página inteira. O 3DS costuma ser um modal por cima, não redirect. */
        redirect: "if_required",
      });

      if (erroDeCobranca) {
        throw new Error(
          erroDeCobranca.message ?? "Your card was declined. Please try another one.",
        );
      }

      /* `confirmPayment` sem erro já basta para agradecer: a doação segue
         `processing` no GiveWP até o webhook da Stripe fechar, e isso
         acontece entre Stripe e WordPress, sem passar por aqui. É o mesmo
         critério que o form nativo do GiveWP usa. */
      setFase("pago");
      pago.current(paymentIntentIdFrom(intent.clientSecret));
    } catch (err) {
      setFase("pronto");
      falhou.current(
        err instanceof Error
          ? err.message
          : "We could not confirm your donation. Please try again.",
      );
    }
  };

  if (fase === "pago") {
    return (
      <p
        className="py-3 text-center text-fs14 font-semibold text-donate-text"
        role="status"
        aria-live="polite"
      >
        Payment confirmed. Thank you!
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {fase === "carregando" && (
        <div
          className="flex items-center gap-3 py-3"
          role="status"
          aria-live="polite"
        >
          <span className="h-[26px] w-[26px] shrink-0 animate-spin rounded-full border-[3px] border-ink-900/10 border-t-donate" />
          <span className="text-fs14 font-semibold text-ink-600">
            Loading the secure card form…
          </span>
        </div>
      )}

      {/* Onde o Payment Element desenha. O conteúdo daqui para dentro não é
          React - ver o bloco do topo. Fica montado durante `processando`
          para o iframe não ser destruído no meio de um 3DS. */}
      <div ref={alvo} />

      {fase !== "carregando" && (
        <button
          type="button"
          onClick={pagar}
          disabled={fase === "processando"}
          className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-md bg-donate px-6 text-fs15 font-extrabold uppercase tracking-[0.03em] text-donate-ink shadow-[0_8px_20px_-8px_rgba(27,138,75,.7)] transition-colors hover:bg-donate-hover disabled:cursor-not-allowed disabled:opacity-70"
        >
          {fase === "processando" ? (
            <>
              <span className="h-[18px] w-[18px] shrink-0 animate-spin rounded-full border-2 border-donate-ink/30 border-t-donate-ink" />
              Confirming your card…
            </>
          ) : (
            `Donate ${formatUSDCurto(totalCents)}`
          )}
        </button>
      )}
    </div>
  );
}
