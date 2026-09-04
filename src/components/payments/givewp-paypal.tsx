"use client";

import { useEffect, useRef, useState } from "react";
import {
  approvePaypalOrder,
  createPaypalOrder,
  fetchGiveWpConfig,
  givewp,
  loadGiveWpPaypalSdk,
  submitDonation,
} from "@/lib/payments/givewp";
import { placeholderEmail } from "@/lib/payments/lusa";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  PAYPAL VIA GIVEWP - a doação que entra no painel                     ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * O botão do PayPal ligado às rotas REST do `givewp.kylerescuer.org`, em vez
 * de cobrar direto no navegador. Fala só com `lib/payments/givewp.ts`.
 *
 * ── Por que não se cobra mais direto no navegador ─────────────────────────
 * Até 04/09/2026 existia um `paypal-buttons.tsx` que criava e capturava o
 * pedido no próprio navegador (`actions.order.create`), fora do GiveWP.
 * Cobrava, mas a doação não virava registro: sem post de doação, sem doador,
 * sem recibo, sem aparecer no painel. E o pedido ia ao PayPal como venda
 * comum, sem o `category: DONATION` que o GiveWP acrescenta.
 *
 * Aquele caminho foi **removido**. Hoje só existe este: `create-order` →
 * `approve-order` → `donate`, os três no servidor do WordPress.
 *
 * ── ⚠️ A conta que recebe mudou junto ⚠️ ────────────────────────────────
 * O `clientId` vem do `/config` (`BAAjNpRBvmQf1_…`), que é a conta conectada
 * neste WordPress - e **não** é a que o checkout usava antes
 * (`BAAWg0MA4OOvlh2QrG…`, chumbada no código e herdada do WordPress antigo).
 * Trocar de caminho trocou de conta; foi decisão explícita de quem administra
 * a campanha, em 2026-09-04.
 *
 * ── O fluxo, e onde cada passo acontece ──────────────────────────────────
 *
 *   createOrder  → POST /paypal/create-order   (WP cria o pedido no PayPal)
 *   [a pessoa aprova no popup do PayPal]
 *   onApprove    → POST /paypal/approve-order  (WP aprova)
 *                → POST /donate                (WP cria a doação; fecha aqui)
 *
 * Diferente do Stripe, o PayPal **fecha síncrono**: quando o `/donate`
 * responde, a doação já existe e já está paga.
 */
export function GiveWpPaypalButtons({
  formId = givewp.formId,
  totalCents,
  primeiroNome = "Anonymous",
  sobrenome = "Donor",
  email,
  onPago,
  onFalha,
}: {
  formId?: number;
  totalCents: number;
  primeiroNome?: string;
  sobrenome?: string;
  /** Sem e-mail real, entra um de reserva: a doação exige o campo. */
  email?: string;
  /**
   * Recebe o **Order ID do PayPal** - o mesmo valor que o hook do WordPress
   * relê da doação (`give_get_payment_transaction_id`) e manda pro funil.
   * É por ele que os dois lados falam do mesmo pagamento.
   *
   * ⚠️ Não é o id da *captura*. Neste fluxo a captura acontece dentro do
   * GiveWP e o navegador nunca a vê - ver o aviso no cabeçalho.
   */
  onPago: (paypalOrderId: string) => void;
  onFalha: (mensagem: string) => void;
}) {
  const alvo = useRef<HTMLDivElement>(null);
  const [carregando, setCarregando] = useState(true);

  /* Callbacks por ref: uma rerrenderização não pode remontar os iframes do
     PayPal - a pessoa perderia o popup aberto no meio do pagamento. */
  const pago = useRef(onPago);
  const falhou = useRef(onFalha);
  useEffect(() => {
    pago.current = onPago;
    falhou.current = onFalha;
  });

  /* `totalCents` nas dependências: o valor é lido no clique, mas o botão é
     refeito quando ele muda para não sobrar iframe cobrando o valor
     anterior - o pior defeito possível numa tela de pagamento. */
  useEffect(() => {
    const no = alvo.current;
    if (!no) return;

    let vivo = true;
    const controller = new AbortController();

    const montar = async () => {
      try {
        setCarregando(true);

        const config = await fetchGiveWpConfig(formId, controller.signal);
        if (!vivo) return;

        if (!config.paypal?.clientId) {
          throw new Error(
            "PayPal is not connected on this campaign right now.",
          );
        }

        const sdk = await loadGiveWpPaypalSdk(
          config.paypal.clientId,
          config.currency,
        );
        if (!vivo) return;

        /* O valor preso aos limites que o `/config` publica, com as duas
           casas que a API exige (`"33.8"` é recusado). */
        const min = Number(config.minAmount) || 0.01;
        const max = Number(config.maxAmount) || Infinity;
        const valor = Math.min(Math.max(totalCents / 100, min), max).toFixed(2);

        const doador = {
          formId,
          amount: valor,
          firstName: primeiroNome,
          lastName: sobrenome,
          email: email || placeholderEmail(),
        };

        no.replaceChildren();

        const botoes = sdk.Buttons({
          style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal" },

          createOrder: async () => {
            const { id } = await createPaypalOrder(doador);
            return id;
          },

          onApprove: async (data) => {
            const orderId = data.orderID;
            if (!orderId) {
              falhou.current("PayPal did not return an order to confirm.");
              return;
            }

            try {
              await approvePaypalOrder(orderId, formId);
              await submitDonation({
                ...doador,
                gatewayId: "paypal-commerce",
                currency: config.currency,
                paypalOrderId: orderId,
              });
              if (vivo) pago.current(orderId);
            } catch (err) {
              /* O dinheiro pode já ter saído aqui: o PayPal aprovou e o que
                 falhou foi o registro no GiveWP. A mensagem manda conferir
                 antes de tentar de novo, em vez de convidar a uma segunda
                 cobrança. */
              falhou.current(
                err instanceof Error
                  ? err.message
                  : "Your payment went through but we could not confirm it. Please contact us before trying again.",
              );
            }
          },

          onError: () => {
            if (!vivo) return;
            falhou.current(
              "PayPal could not complete this payment. Please try again.",
            );
          },

          onCancel: () => {
            /* Fechar o popup não é erro - a pessoa continua na mesma etapa. */
          },
        });

        if (!botoes.isEligible()) {
          falhou.current(
            "No payment method is available for your country right now.",
          );
          return;
        }

        await botoes.render(no);
        if (!vivo) return;
        setCarregando(false);
      } catch (err) {
        if (!vivo) return;
        falhou.current(
          err instanceof Error
            ? err.message
            : "We could not load the payment options. Check your connection.",
        );
      }
    };

    void montar();
    return () => {
      vivo = false;
      controller.abort();
    };
  }, [formId, totalCents, primeiroNome, sobrenome, email]);

  return (
    <>
      {carregando && (
        <div className="flex items-center gap-3 py-3" role="status" aria-live="polite">
          <span className="h-[26px] w-[26px] shrink-0 animate-spin rounded-full border-[3px] border-ink-900/10 border-t-donate" />
          <span className="text-fs14 font-semibold text-ink-600">
            Loading the secure payment options…
          </span>
        </div>
      )}

      {/* Onde o SDK desenha. O conteúdo daqui para dentro não é React. */}
      <div ref={alvo} className="flex flex-col gap-2" />
    </>
  );
}
