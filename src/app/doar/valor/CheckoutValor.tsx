"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GiveWpCheckout } from "@/components/payments/givewp-checkout";
import { donationMinCentsUnica, org, whatsappWith } from "@/lib/config";
import { formatUSDCurto } from "@/lib/format";
import { givewp } from "@/lib/payments/givewp";
import { payments } from "@/lib/payments/lusa";
import {
  clearLeadId,
  sendInitiateCheckoutToNest,
  trackDonationPaid,
  trackInitiateCheckout,
  type LeadTracking,
} from "@/lib/payments/tracking";
import { isLocalhost } from "@/lib/test-mode";

/**
 * O checkout de valor livre em página, montado no navegador.
 *
 * ── Por que aqui e não no servidor ────────────────────────────────────────
 * O site é estático (ver `next.config.ts`): `next build` gera **um** HTML por
 * rota, e este não pode conhecer o `?cents=` de ninguém. Ler a query no
 * servidor tornaria a rota dinâmica e quebraria o export.
 *
 * ── O que esta rota é hoje ────────────────────────────────────────────────
 * O destino do `href` dos CTAs de doação (`checkoutValorHref`, em
 * `lib/config.ts`). Com JavaScript, o modal intercepta o clique e ninguém
 * chega aqui; sem ele, o link ao menos abre uma tela que cobra de verdade -
 * os mesmos botões do PayPal do modal, pelo mesmo componente
 * (`components/payments/givewp-paypal.tsx`, que cobra pelas rotas REST do
 * GiveWP).
 *
 * ⚠️ Antes daqui morava um **Pix estático**, montado na chave da organização e
 * fora da conciliação: o dinheiro chegava sem `lead_id`, sem status e sem
 * evento de Purchase, e doação por esta rota não aparecia em relatório. Isso
 * acabou junto com o Pix - a conclusão dispara o Purchase como no modal.
 *
 * ⚠️ **O `lead_id` deixou de viajar no `custom_id` do pedido.** Ele ia lá
 * enquanto o SDK criava o pedido no navegador; a rota `/paypal/create-order`
 * do GiveWP não aceita esse campo. A ligação entre lead e pagamento passou a
 * ser o **Order ID do PayPal**, que sai daqui no `resource_id` do Purchase e
 * é o mesmo valor que o hook do WordPress manda ao funil como `donation_id`.
 * Quem junta os dois é o Nest - ver o aviso em `lib/payments/givewp.ts` sobre
 * a rota de correlação que ainda não existe.
 *
 * ⚠️ Sem JavaScript esta página fica vazia, e não há como não ficar: o botão
 * de pagar é um iframe do SDK do PayPal. Um caminho de doação sem script não
 * existe mais em lugar nenhum do site.
 */

/**
 * Piso e teto de sanidade: a URL é editável por quem quiser.
 *
 * O piso publicado é o mesmo do modal - $10.00 na única
 * (`donationMinCentsUnica`) e o piso da recorrência na mensal
 * (`payments.recurring.minCents`) - e $0.01 em `localhost` (ver
 * `lib/test-mode.ts`). Sem a exceção, o degrau de teste da grade morria aqui:
 * o modal manda `?cents=1` e esta tela devolvia a pessoa para `/#doar`.
 */
const MIN_CENTS_TESTE = 1;
const MAX_CENTS = 100_000_00;

export function CheckoutValor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [erro, setErro] = useState<string | null>(null);
  const [pago, setPago] = useState(false);

  /** O InitiateCheckout desta doação, que o Purchase completa depois. */
  const leadRef = useRef<LeadTracking | null>(null);
  /* O mesmo `lead_id`, em estado: o ref não pode ser lido durante o render, e
     é o render que passa o id para o checkout. */
  const [leadId, setLeadId] = useState("");
  /* A identidade do lead. TEM que ser a mesma na cobrança, senão o funil
     grava duas linhas soltas - ver o aviso em `GiveWpCheckout`. */
  const [doador, setDoador] = useState<{
    email: string;
    primeiroNome: string;
    sobrenome: string;
  } | null>(null);
  /** Purchase é uma vez por doação, mesmo que dois botões se cruzem. */
  const pagoRef = useRef(false);

  const cents = Number(searchParams.get("cents"));
  const mensal = searchParams.get("freq") === "mensal";
  const minCents = isLocalhost()
    ? MIN_CENTS_TESTE
    : mensal
      ? payments.recurring.minCents
      : donationMinCentsUnica;
  const valorValido =
    Number.isInteger(cents) && cents >= minCents && cents <= MAX_CENTS;

  /* A mensal nunca tem botão: nem as rotas do GiveWP (que fixam
     `donationType: 'single'`) nem o form 10 (`subscriptionsEnabled: false`)
     fecham recorrência. Ela sempre cai no WhatsApp - ver o bloco 🔁 em
     `overlays/18-checkout.tsx`. */
  const mensalSemPlano = mensal;

  // Valor inválido volta para a seção de doação, em vez de cobrar um número
  // que ninguém escolheu.
  useEffect(() => {
    if (!valorValido) router.replace("/#doar");
  }, [valorValido, router]);

  /* O lead, uma vez, quando a tela com os botões aparece. */
  useEffect(() => {
    if (!valorValido || mensalSemPlano) return;
    if (leadRef.current) return;

    const lead = trackInitiateCheckout({
      amountCents: cents,
      productName: mensal ? "MONTHLY DONATION" : "ONE-TIME DONATION",
      productDescription: `Donation to ${org.name}`,
      donorName: "",
      donorPhone: "",
      anonymous: false,
      recurring: mensal,
    });
    leadRef.current = lead;
    setLeadId(String(lead.lead_id ?? ""));
    setDoador({
      email: String(lead.donor_email ?? ""),
      primeiroNome: String(lead.first_name ?? "Anonymous"),
      sobrenome: String(lead.last_name ?? "Donor"),
    });
    void sendInitiateCheckoutToNest(lead);
  }, [valorValido, mensalSemPlano, cents, mensal]);

  const confirmar = (paypalOrderId: string) => {
    if (pagoRef.current) return;
    pagoRef.current = true;

    trackDonationPaid(leadRef.current, {
      original_value: cents / 100,
      currency: givewp.currency,
      settled_at: new Date().toISOString(),
      /* `txid` é o id da **captura**, e neste fluxo quem captura é o GiveWP -
         o navegador não o vê. O Order ID vai no `resource_id`, que é onde o
         id do pedido sempre morou, e é o mesmo valor que o hook do WordPress
         manda ao funil como `donation_id`. */
      txid: "",
      resource_id: paypalOrderId,
    });
    clearLeadId();
    setPago(true);

    window.setTimeout(() => {
      window.location.href = payments.successUrl;
    }, payments.redirectDelayMs);
  };

  if (!valorValido) return null;

  return (
    <main className="surface-alt flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-[460px] flex-col gap-3">
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-fs13 font-semibold text-ink-600">
            {mensal ? "Monthly donation" : "One-time donation"}
          </span>
          <span className="text-[2rem] font-extrabold leading-none text-ink-900 tabular-nums">
            {formatUSDCurto(cents)}
            {mensal && (
              <span className="text-fs15 font-semibold text-ink-600">/month</span>
            )}
          </span>
          <p className="mt-1 max-w-[36ch] text-fs14 leading-[1.5] text-ink-600">
            Your donation turns into food, medicine and vet care at the shelters
            Kyle follows.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-md border border-ink-900/[.07] bg-surface p-4 shadow-[0_1px_3px_rgba(20,17,15,.05)]">
          {pago ? (
            <p
              className="py-4 text-center text-fs16 font-extrabold text-donate-text"
              role="status"
              aria-live="polite"
            >
              Payment confirmed! Taking you to the confirmation page…
            </p>
          ) : erro ? (
            <div className="flex flex-col gap-3 py-2 text-center" role="alert">
              <p className="text-fs15 font-extrabold text-ink-900">
                We could not take your payment
              </p>
              <p className="text-fs13 leading-[1.5] text-ink-600">{erro}</p>
              <Link
                href="/#doar"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-donate px-6 text-fs15 font-extrabold uppercase tracking-[0.03em] text-donate-ink"
              >
                Back to the campaign
              </Link>
            </div>
          ) : mensalSemPlano ? (
            <div className="flex flex-col gap-3">
              <p className="text-fs15 font-extrabold text-ink-900">
                Monthly donations are set up by hand
              </p>
              <p className="text-fs14 leading-[1.55] text-ink-600">
                We are not able to start a recurring donation from this page
                yet. Send us a message and the team sets it up with you.
              </p>
              <a
                href={whatsappWith(
                  `Hi! I want to donate ${formatUSDCurto(cents)} to ${org.name} every month. How do I set it up?`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-donate px-6 text-fs15 font-extrabold uppercase tracking-[0.03em] text-donate-ink"
              >
                Message us on WhatsApp
              </a>
            </div>
          ) : (
            <>
              {/* Um caminho só, o do GiveWP - ver `overlays/18-checkout`. */}
              <GiveWpCheckout
                totalCents={cents}
                leadId={leadId}
                email={doador?.email}
                primeiroNome={doador?.primeiroNome}
                sobrenome={doador?.sobrenome}
                onPago={confirmar}
                onFalha={setErro}
              />
              <p className="text-fs12 leading-[1.5] text-ink-600">
                You will pay on PayPal&rsquo;s secure screen. No card details
                are typed on this page or stored by {org.name}.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
