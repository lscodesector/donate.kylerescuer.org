/**
 * O canal entre "clicou em doar" e o modal de checkout.
 *
 * É um evento de janela, e não um contexto React, pelo mesmo motivo do modal
 * mensal: quem dispara é um botão dentro de seções que são Server Components,
 * e elas não podem receber um callback por prop sem virar cliente inteiras.
 * Assim só o botão é cliente.
 */

export const CHECKOUT_EVENT = "sos:abrir-checkout";

/** O que o checkout mostra no topo - o item que está sendo doado. */
export type CheckoutItem = {
  /**
   * `causa` é um valor para uma das frentes do menu "escolha onde ajudar";
   * `mensal` é o mesmo valor se repetindo todo mês.
   *
   * ⚠️ A diferença **não é só de texto**. Até 12/08/2026 era: a mensal gerava
   * o mesmo Pix avulso e prometia combinar os próximos meses pelo WhatsApp.
   * Hoje `mensal` manda o checkout por outro caminho inteiro - Pix Automático,
   * outro endpoint, outro profile no gateway, CPF obrigatório e o mandato
   * amarrado ao lead no Nest. Ver `createRecurringCharge` em
   * `lib/payments/lusa.ts`.
   *
   * Havia um terceiro, `racao`, para as faixas de kg - elas saíram junto com a
   * virada para a campanha do Caio, que pede valor e não saco de ração.
   */
  kind: "causa" | "mensal";
  /** Valor da doação em centavos, **sem** a taxa. */
  amountCents: number;
  /** Rótulo curto do item: "Ração dos abrigos", "Doação mensal". */
  title: string;
  /** Uma linha sobre o impacto daquela quantidade. */
  impact: string;
  /** Foto do item. Hoje sempre `null`: a doação é um valor, não um produto. */
  image: { src: string; alt: string } | null;
  /** Identificador que vai no BR Code. */
  txid: string;
  /**
   * A doação veio de um CTA que só oferece a mensal.
   *
   * Não muda nada no pagamento - `kind` já decide isso. Serve ao "Voltar" da
   * etapa de dados, que reabre a tela de valores: com esta marca ela volta
   * travada na mensal, como estava, em vez de oferecer a doação única a quem
   * clicou em "doar todo mês". Ver `DonationIntent.somenteMensal`.
   */
  somenteMensal?: boolean;
};

export function openCheckout(item: CheckoutItem) {
  window.dispatchEvent(
    new CustomEvent<CheckoutItem>(CHECKOUT_EVENT, { detail: item }),
  );
}

/**
 * Sinaliza para o `BackIntercept` que o checkout está aberto.
 *
 * O popup de saída e o checkout escutam os dois o mesmo "voltar" do
 * navegador. Sem este sinal, quem abre o checkout e aperta voltar recebe a
 * oferta de retenção ("Antes de sair…") no lugar de simplesmente fechar o
 * modal - que é exatamente o cruzamento de gatilhos que este arquivo existe
 * para impedir. Enquanto for `true`, o `BackIntercept` não faz nada.
 *
 * É um módulo com estado, e não um contexto, porque quem lê (`BackIntercept`)
 * e quem escreve (`CheckoutModal`) são irmãos sem pai comum que não seja a
 * página inteira.
 */
let checkoutOpen = false;

export function setCheckoutOpen(open: boolean) {
  checkoutOpen = open;
}

export function isCheckoutOpen() {
  return checkoutOpen;
}

/**
 * "O próximo `popstate` é meu, ignore."
 *
 * `isCheckoutOpen()` cobre o caso de a pessoa fechar o checkout apertando
 * voltar - o modal ainda está aberto quando o evento chega. Não cobre o
 * contrário: fechar pelo X, pelo Esc ou clicando no fundo. Aí o modal precisa
 * tirar do histórico a entrada que ele mesmo empurrou, chama `history.back()`,
 * e esse `popstate` chega quando o checkout **já está fechado** - o
 * `BackIntercept` o leria como "a pessoa está saindo da página" e abriria a
 * oferta de retenção sozinha, um instante depois de o checkout sumir.
 *
 * A bandeira é de uso único: quem lê, consome.
 */
let suppressNextPop = false;

export function suppressNextBackIntercept() {
  suppressNextPop = true;
}

export function consumeBackInterceptSuppression() {
  if (!suppressNextPop) return false;
  suppressNextPop = false;
  return true;
}
