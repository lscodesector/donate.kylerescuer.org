"use client";

import { useEffect, useState } from "react";
import { GiveWpCardForm } from "@/components/payments/givewp-card";
import { GiveWpPaypalButtons } from "@/components/payments/givewp-paypal";
import { fetchGiveWpConfig, givewp, type GiveWpConfig } from "@/lib/payments/givewp";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  O PAGAMENTO - escolhe o gateway pelo que o servidor tem             ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Lê o `/config` do `givewp.kylerescuer.org` e monta o meio de pagamento que
 * de fato existe: PayPal se houver conta conectada, cartão (Stripe) se houver
 * chave publicável, e uma mensagem honesta se não houver nenhum.
 *
 * ── Por que isso existe ───────────────────────────────────────────────────
 * Quando o checkout foi ligado nas rotas do GiveWP, ele passou a montar
 * **só** o PayPal. Aí o Test Mode do GiveWP foi ligado no servidor - e o
 * Test Mode troca as credenciais dos dois gateways de uma vez, indo buscar a
 * conta *sandbox* do PayPal, que não existe. O `clientId` voltou vazio e a
 * tela morria com "PayPal is not connected on this campaign right now",
 * mesmo com o cartão perfeitamente disponível ao lado.
 *
 * Quem decide não pode ser o código: é o servidor que sabe o que está
 * conectado, e ele muda sem aviso (foi o que aconteceu três vezes em
 * 04/09/2026). Por isso a escolha é feita a cada montagem, a partir do
 * `/config`.
 *
 * ── ⚠️ O gateway `manual` (Test Donation) NÃO entra aqui ⚠️ ──────────────
 * Ele fecha doação sem cobrar nada, e existe para diagnóstico - está na
 * página de teste avulsa (`teste-pagamento.html`, fora do build), não aqui.
 * Expor esse botão no site público seria deixar qualquer visitante gerar uma
 * doação concluída de graça, que ainda por cima entra no painel como real.
 *
 * ── Ordem ────────────────────────────────────────────────────────────────
 * PayPal primeiro quando existe: é o que a página promete ("Card or PayPal"),
 * e o botão de cartão do PayPal cobre quem não tem conta. O Stripe entra
 * quando o PayPal não está disponível.
 */
export function GiveWpCheckout({
  formId = givewp.formId,
  totalCents,
  leadId,
  primeiroNome,
  sobrenome,
  email,
  onPago,
  onFalha,
}: {
  formId?: number;
  totalCents: number;
  /** O `lead_id` desta doação - repassado ao cartão para a correlação. */
  leadId?: string;
  /**
   * ⚠️ **A identidade tem que ser a MESMA do InitiateCheckout.**
   *
   * O funil casa o lead com a doação pelo doador. Se o IC gravar um e-mail e
   * a cobrança gerar outro, viram duas linhas soltas no painel: uma com o
   * `page_url` e sem `paid_at`, outra paga e sem origem. Foi o que aconteceu
   * em 04/09/2026 - `placeholderEmail()` usa `Date.now()`, e as duas chamadas
   * caíam com um milissegundo de diferença.
   *
   * Quem chama passa `leadRef.current.donor_email` e o nome já quebrado, não
   * um valor novo.
   */
  primeiroNome?: string;
  sobrenome?: string;
  email?: string;
  /**
   * Recebe a referência externa do pagamento: Order ID no PayPal, Payment
   * Intent no cartão. É o que vira `resource_id` no evento de conversão.
   */
  onPago: (referencia: string) => void;
  onFalha: (mensagem: string) => void;
}) {
  const [config, setConfig] = useState<GiveWpConfig | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    const controller = new AbortController();

    fetchGiveWpConfig(formId, controller.signal)
      .then((c) => {
        if (vivo) setConfig(c);
      })
      .catch((e: unknown) => {
        if (!vivo) return;
        setErro(
          e instanceof Error
            ? e.message
            : "We could not load the payment options.",
        );
      });

    return () => {
      vivo = false;
      controller.abort();
    };
  }, [formId]);

  if (erro) {
    /* O erro sobe para quem chamou na primeira renderização em que existe -
       o checkout tem uma etapa de erro própria, com botão de tentar de novo. */
    onFalha(erro);
    return null;
  }

  if (!config) {
    return (
      <div className="flex items-center gap-3 py-3" role="status" aria-live="polite">
        <span className="h-[26px] w-[26px] shrink-0 animate-spin rounded-full border-[3px] border-ink-900/10 border-t-donate" />
        <span className="text-fs14 font-semibold text-ink-600">
          Loading the secure payment options…
        </span>
      </div>
    );
  }

  if (config.paypal?.clientId) {
    return (
      <GiveWpPaypalButtons
        formId={formId}
        totalCents={totalCents}
        primeiroNome={primeiroNome}
        sobrenome={sobrenome}
        email={email}
        onPago={onPago}
        onFalha={onFalha}
      />
    );
  }

  if (config.stripe?.publishableKey) {
    return (
      <GiveWpCardForm
        formId={formId}
        totalCents={totalCents}
        leadId={leadId ?? ""}
        primeiroNome={primeiroNome}
        sobrenome={sobrenome}
        email={email}
        onPago={onPago}
        onFalha={onFalha}
      />
    );
  }

  /*
   * Nenhum dos dois conectado. Acontece de verdade: com o Test Mode ligado e
   * sem conta sandbox, os dois voltam vazios. A mensagem não explica a causa
   * para quem doa - ela é de dentro de casa - mas o console diz, para quem
   * estiver diagnosticando não precisar adivinhar.
   */
  if (typeof window !== "undefined") {
    console.warn(
      `[givewp] nenhum gateway conectado (modo ${config.paypal?.mode}). ` +
        "Com o Test Mode ligado o GiveWP busca as contas sandbox/teste; " +
        "confira Give → Settings → Payment Gateways.",
    );
  }
  onFalha("Donations are temporarily unavailable. Please try again shortly.");
  return null;
}
