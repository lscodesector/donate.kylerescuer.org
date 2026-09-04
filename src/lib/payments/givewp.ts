/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  GIVEWP - a API própria que fecha a doação por CARTÃO                 ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Fala com as rotas REST descritas na skill `criar-api-doacao-givewp`,
 * registradas no `functions.php` de **`givewp.kylerescuer.org`** - o
 * WordPress que hospeda o motor de doação do GiveWP (form id 10, campanha
 * "Kyle Rescuer"). Este arquivo é o único lugar do projeto que conhece
 * essas rotas.
 *
 * ⚠️ **Preparado, ainda não ligado.** Nenhuma tela de produção importa
 * daqui: o checkout continua cobrando pelo PayPal no navegador
 * (`lib/payments/paypal.ts`). Este módulo e `components/payments/
 * givewp-card.tsx` existem para o dia em que o `givewp.kylerescuer.org`
 * estiver funcional - hoje ele ainda está sendo preparado do lado do
 * WordPress, e as rotas abaixo ainda respondem 404.
 *
 * ── Por que só o cartão mora aqui ─────────────────────────────────────────
 * O servidor expõe quatro rotas (`/config`, `/paypal/create-order`,
 * `/paypal/approve-order`, `/donate`). Só as duas que o cartão usa estão
 * portadas: `/config` e `/donate`. As duas do PayPal ficam de fora porque o
 * PayPal desta campanha **não passa pelo GiveWP** - ele cobra direto no
 * navegador. Se um dia o PayPal migrar para cá, elas entram junto com o
 * código que passar a usá-las, e não antes.
 *
 * ── O ciclo do cartão (Stripe Payment Element) ───────────────────────────
 *
 *   1. `fetchGiveWpConfig()`   GET  /config   → chave pública, conta, limites
 *   2. `loadStripeSdk()`       carrega `js.stripe.com/v3` com essa chave
 *   3. o Payment Element monta **sem** clientSecret (Intent "diferido")
 *   4. `submitDonation()`      POST /donate   → é AQUI que o Payment Intent
 *                                               nasce, e volta o clientSecret
 *   5. `stripe.confirmPayment()` no navegador cobra de fato
 *
 * ⚠️ Diferente do PayPal, o passo 4 **não fecha a doação**: ela fica
 * `processing` no GiveWP até o webhook da própria Stripe
 * (`payment_intent.succeeded`) confirmar, direto entre Stripe e WordPress -
 * sem passar por aqui nem pelo navegador.
 *
 * ── Isto não é segredo ────────────────────────────────────────────────────
 * A `publishableKey` da Stripe é feita para ir ao navegador, e a
 * `connectedAccountId` é só um identificador de conta - mesmo estatuto do
 * `clientId` do PayPal em `lib/payments/paypal.ts`. O que é segredo (a chave
 * secreta) nunca sai do WordPress: quem cria o Payment Intent é o GiveWP,
 * do lado do servidor.
 */

import { payments } from "./lusa";

/* ─────────────────────────────────────────────── onde a API responde ──── */

/**
 * ⚠️ CONFERIR ANTES DE PUBLICAR ⚠️
 *
 * `givewp.kylerescuer.org` é o WordPress do motor de doação - **não** é o
 * `donate.kylerescuer.org`, que é este site estático. São servidores
 * diferentes.
 */
export const givewp = {
  /** A origem do WordPress. Só o host: o caminho é montado por `routeUrl`. */
  origin:
    process.env.NEXT_PUBLIC_GIVEWP_ORIGIN ?? "https://givewp.kylerescuer.org",

  /** O form do GiveWP que recebe estas doações. */
  formId: Number(process.env.NEXT_PUBLIC_GIVEWP_FORM_ID ?? 10),

  /**
   * A moeda da campanha.
   *
   * Quem manda de verdade é o `/config` (`currency`), lido em toda cobrança -
   * esta constante existe só para os pontos que precisam do valor **antes**
   * de a configuração chegar, como o evento de Purchase montado na hora da
   * confirmação. As duas são conferidas: o `/config` devolve `USD`.
   */
  currency: "USD",

  /**
   * Onde o front registra a correlação `lead_id → Payment Intent ID`, para o
   * hook do WordPress (`give_update_payment_status`) casar o pagamento
   * confirmado com o InitiateCheckout já gravado no Nest. Mesmo host das
   * outras rotas do funil (ver `payments.recurring.icUrl` em `lusa.ts`), só
   * outro caminho.
   *
   * ⚠️ O `/donate` do Stripe **não devolve** `donationId` - só
   * `{clientSecret, returnUrl, billingDetails}`. Por isso a correlação é
   * pelo Payment Intent ID, extraído do prefixo do `clientSecret` antes de
   * `_secret_`: é o mesmo ID que a Stripe manda no evento
   * `PaymentIntentSucceeded`, e que o WordPress relê da doação com
   * `give_get_payment_transaction_id()` para montar o payload que manda pro
   * Nest. É o casamento desses dois valores que acha o lead certo sem
   * depender de e-mail - que este checkout não coleta de verdade.
   *
   * ⚠️ No PayPal a chave é outra: `give_get_payment_transaction_id()`
   * devolve o **Order ID do PayPal**, não um `pi_`. Quem registrar a
   * correlação nesse fluxo tem que mandar o `orderID` que o SDK devolveu,
   * não o resultado de `paymentIntentIdFrom()`.
   *
   * ⚠️ **Desligado por padrão, e não por descuido.** Em 2026-09-04 a rota
   * `/wh/givewp/ref` devolve 404 nos dois hosts do funil
   * (`track.lusapayments.com/api/…` e a ponte
   * `lusapayments.com/api/nest-relay/…`). Não é 404 de "método errado": na
   * mesma API, `/wh/givewp` responde 200 até em GET e uma rota inventada
   * responde 404 - ou seja, `/wh/givewp/ref` simplesmente **não existe
   * nesta implantação do Nest**.
   *
   * Deixar uma URL chutada aqui seria pior do que não ter nenhuma:
   * `registerGiveWpRef` engole o erro de propósito (não pode segurar quem
   * está pagando), então a correlação falharia em silêncio e ninguém
   * descobriria até faltar dado no relatório.
   *
   * Vazio = a função não chama nada. Para ligar, defina
   * `NEXT_PUBLIC_GIVEWP_REF_URL` depois de confirmar com quem cuida do Nest
   * que a rota existe e qual o formato do corpo.
   */
  refUrl: process.env.NEXT_PUBLIC_GIVEWP_REF_URL ?? "",
};

/**
 * Monta a URL de uma rota REST no caminho `/wp-json/`.
 *
 * ⚠️ **Não trocar por `?rest_route=`.** Os dois formatos parecem
 * equivalentes e não são, neste servidor: o nginx responde **405 Not
 * Allowed** ao `OPTIONS` de `/?rest_route=…`, e 200 ao de `/wp-json/…`.
 * Medido ao vivo em 2026-09-04, com os dois lado a lado.
 *
 * Isso importa porque todo POST daqui manda `Content-Type: application/json`,
 * que não é um tipo "seguro" de CORS - o navegador dispara um **preflight**
 * `OPTIONS` antes. Com 405 ele nem chega no PHP, o filtro de CORS do
 * `functions.php` não roda, e o navegador bloqueia a chamada com
 * *"No 'Access-Control-Allow-Origin' header is present"*. O sintoma engana:
 * parece CORS mal configurado no WordPress, e é o método barrado no nginx.
 *
 * O `GET /config` funciona nos dois formatos justamente porque é requisição
 * simples e não tem preflight - então testar só a leitura esconde o
 * problema, que aparece no primeiro POST.
 *
 * (Este arquivo já usou `?rest_route=`: era defesa para quando os permalinks
 * do servidor estavam em "plain" e `/wp-json/` devolvia 404. Foram
 * arrumados; a defesa virou o defeito.)
 */
function routeUrl(path: string, params: Record<string, string> = {}) {
  const query = new URLSearchParams(params);
  const qs = query.toString();
  return `${givewp.origin}/wp-json/givewp/v1${path}${qs ? `?${qs}` : ""}`;
}

/* ──────────────────────────────────────────────────────── /config ──── */

export type GiveWpConfig = {
  formId: number;
  gatewayId: string;
  paypal: { clientId: string; mode: "live" | "sandbox" };
  /**
   * `publishableKey`/`connectedAccountId` vazios = gateway Stripe desligado,
   * ou o form sem conta conectada. É assim que a tela decide se tem como
   * mostrar o campo de cartão - ver `GiveWpCardForm`.
   */
  stripe: {
    publishableKey: string;
    connectedAccountId: string;
    mode: "live" | "sandbox";
  };
  currency: string;
  /**
   * ⚠️ Chegam como **string** (`"10.00"`, `"6000.00"`), não número - o
   * `give_get_form_minimum_price()` do GiveWP devolve o valor já formatado.
   * Confirmado contra a API no ar em 2026-09-04. Quem lê tem que passar por
   * `Number()` antes de comparar - ver `valorCobrado` em `GiveWpCardForm`.
   */
  minAmount: number | string;
  maxAmount: number | string;
  /**
   * O **Test Mode global** do GiveWP (Give → Settings → General). Ele manda
   * no PayPal e no Stripe juntos - não existe env separada por gateway. Com
   * ele ligado, a `publishableKey` que volta é `pk_test_…` e o cartão
   * `4242 4242 4242 4242` completa um pagamento de mentira.
   */
  testMode: boolean;
  formNonce: string;
};

/** O que a resposta de erro do WordPress traz (`WP_Error`). */
type WpErrorBody = { code?: string; message?: string; data?: unknown };

async function readJson<T>(response: Response): Promise<T> {
  const raw = await response.text();
  if (!raw) return {} as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    /* Resposta não-JSON quase sempre é 404 do nginx (ver `routeUrl`) ou uma
       fatal do PHP em HTML - nos dois casos, dizer "não é JSON" ajuda mais
       do que repetir o texto cru na tela de quem está doando. */
    throw new Error("The donation server replied with something unreadable.");
  }
}

function extractWpError(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as WpErrorBody).message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

/** `GET /config` - tudo que a tela precisa, nada chumbado no front. */
export async function fetchGiveWpConfig(
  formId: number = givewp.formId,
  signal?: AbortSignal,
): Promise<GiveWpConfig> {
  const response = await fetch(routeUrl("/config", { form_id: String(formId) }), {
    signal,
    headers: { Accept: "application/json" },
  });
  const data = await readJson<GiveWpConfig | WpErrorBody>(response);
  if (!response.ok) {
    throw new Error(extractWpError(data, "We could not load the payment form."));
  }
  return data as GiveWpConfig;
}

/* ────────────────────────────────────────────── /paypal/* (2 rotas) ──── */

export type DonorInfo = {
  formId?: number;
  /** String com duas casas - `"33.80"`, nunca `"33.8"`. */
  amount: string;
  firstName: string;
  lastName: string;
  email: string;
};

/**
 * `POST /paypal/create-order` - devolve o `id` do pedido criado no PayPal.
 *
 * ⚠️ **O id vem em `data.data.id`, não em `data.id`.** A rota faz proxy cru
 * do `admin-ajax.php`, e o WordPress responde no envelope padrão dele
 * (`{ success, data }`) - que a nossa rota embrulha de novo. Ler no nível
 * errado descarta um pedido que foi criado de verdade do lado do PayPal e
 * cai num erro genérico. O `?? data.id` fica como rede, caso a rota passe a
 * desembrulhar sozinha.
 */
export async function createPaypalOrder(
  doador: DonorInfo,
  signal?: AbortSignal,
): Promise<{ id: string }> {
  const response = await fetch(routeUrl("/paypal/create-order"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    signal,
    body: JSON.stringify({
      form_id: doador.formId ?? givewp.formId,
      amount: doador.amount,
      first_name: doador.firstName,
      last_name: doador.lastName,
      email: doador.email,
    }),
  });

  const data = await readJson<
    { id?: string; success?: boolean; data?: { id?: string } } & WpErrorBody
  >(response);
  const id = data.data?.id ?? data.id;

  if (!response.ok || data.success === false || !id) {
    throw new Error(
      extractWpError(data, "We could not start the payment with PayPal."),
    );
  }
  return { id };
}

/**
 * `POST /paypal/approve-order`.
 *
 * ⚠️ **A chave é `paypal_order_id`, nunca `order_id`.** Está confirmado por
 * curl direto contra este servidor: um POST cujo corpo JSON contém a chave
 * literal `order_id` é bloqueado por uma regra de WAF no nginx - devolve 404
 * seco, sem mensagem, sem nem chegar no PHP. Renomear é o que resolve, e não
 * há nada no erro que aponte para isso.
 */
export async function approvePaypalOrder(
  paypalOrderId: string,
  formId: number = givewp.formId,
  signal?: AbortSignal,
) {
  const response = await fetch(routeUrl("/paypal/approve-order"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    signal,
    body: JSON.stringify({ form_id: formId, paypal_order_id: paypalOrderId }),
  });

  const data = await readJson<{ success?: boolean } & WpErrorBody>(response);
  if (!response.ok || data.success === false) {
    throw new Error(
      extractWpError(data, "PayPal could not approve this payment."),
    );
  }
  return data;
}

/* ──────────────────────────────────────────────────────── /donate ──── */

export type DonatePayload = {
  formId?: number;
  /** `paypal-commerce` ou `stripe_payment_element`. */
  gatewayId?: string;
  /** String com duas casas - `"33.80"`, nunca `"33.8"`. */
  amount: string;
  currency: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Só o PayPal usa - o id que `approvePaypalOrder` acabou de aprovar. */
  paypalOrderId?: string;
  stripePaymentMethod?: string;
  stripePaymentMethodIsCreditCard?: boolean;
  /**
   * Para onde a Stripe manda o navegador **se** o método exigir redirect de
   * página inteira. Cartão comum fica na mesma página, por causa do
   * `redirect: "if_required"` em `GiveWpCardForm`.
   */
  successUrl?: string;
};

/**
 * `POST /donate` - o passo que cria a doação no GiveWP.
 *
 * ⚠️ **Desembrulha exatamente um nível, e é aqui que isso tem que
 * acontecer.** A rota do WordPress sempre responde
 * `{ ok, data: <resposta do GiveWP> }`, e a resposta do GiveWP para o
 * gateway do Stripe já vem embrulhada como `{ data: { clientSecret… } }`.
 * Devolver o corpo HTTP inteiro daqui (em vez de só o `.data` dele)
 * acrescenta um nível a mais, e `extractStripeIntent` passa a procurar o
 * `clientSecret` um andar raso demais - sem erro de sintaxe, só um "campo
 * não encontrado" confuso rio abaixo, com o Payment Intent já criado do
 * lado da Stripe. É um bug que já caiu em produção na campanha irmã.
 *
 * Sucesso não traz chave `ok`/`success` no corpo do GiveWP - só erro traz.
 * Por isso `?? true`, nunca comparar com `false` direto.
 */
export async function submitDonation(
  payload: DonatePayload,
  signal?: AbortSignal,
): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const response = await fetch(routeUrl("/donate"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    signal,
    body: JSON.stringify({
      form_id: payload.formId ?? givewp.formId,
      /* Padrão no gateway que está de fato conectado neste WordPress. Em
         2026-09-04 o `/config` devolve `stripe.publishableKey` vazio - cair
         no Stripe por omissão seria montar uma cobrança num gateway
         desligado. Quem quiser Stripe passa `gatewayId` explicitamente. */
      gateway_id: payload.gatewayId ?? "paypal-commerce",
      amount: payload.amount,
      currency: payload.currency,
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      origin_url: typeof window !== "undefined" ? window.location.href : "",
      paypal_order_id: payload.paypalOrderId,
      stripe_payment_method: payload.stripePaymentMethod,
      stripe_payment_method_is_credit_card: payload.stripePaymentMethodIsCreditCard,
      success_url: payload.successUrl,
    }),
  });
  const data = await readJson<
    { ok?: boolean; data?: Record<string, unknown> } & WpErrorBody
  >(response);
  if (!response.ok) {
    throw new Error(extractWpError(data, "We could not confirm your donation."));
  }
  return { ok: data.ok ?? true, data: data.data ?? (data as Record<string, unknown>) };
}

/**
 * O que o `/donate` devolve para o gateway do Stripe - e só ele.
 *
 * Duas camadas de `data` aninhadas: `submitDonation` já tirou a nossa
 * (`{ ok, data }`), e a do GiveWP (`RespondToBrowser`) é a que sobrou. Por
 * isso `result.data.data`, e não `result.data`.
 */
export type StripeIntentResult = {
  clientSecret: string;
  returnUrl: string;
  billingDetails?: {
    name?: string;
    email?: string;
    address?: Record<string, string | null>;
  };
};

export function extractStripeIntent(result: {
  ok: boolean;
  data: Record<string, unknown>;
}): StripeIntentResult {
  const inner = (result.data as { data?: unknown } | undefined)?.data;
  const clientSecret =
    inner && typeof inner === "object" && "clientSecret" in inner
      ? String((inner as { clientSecret?: unknown }).clientSecret ?? "")
      : "";

  if (!clientSecret) {
    throw new Error("GiveWP did not return the payment key for this card.");
  }

  const obj = inner as {
    clientSecret: string;
    returnUrl?: string;
    billingDetails?: StripeIntentResult["billingDetails"];
  };
  return {
    clientSecret: obj.clientSecret,
    returnUrl: obj.returnUrl ?? "",
    billingDetails: obj.billingDetails,
  };
}

/**
 * O `pi_XXXX` de dentro de um `clientSecret` (`pi_XXXX_secret_YYYY`).
 *
 * É a chave de correlação dos dois lados: o front registra ela no funil, e o
 * WordPress relê a mesma coisa da doação quando o webhook da Stripe fecha o
 * pagamento.
 */
export function paymentIntentIdFrom(clientSecret: string) {
  return clientSecret.split("_secret_")[0] ?? "";
}

/**
 * Registra `{slug, lead_id, refs:[paymentIntentId]}` no funil.
 *
 * **Nunca lança e nunca é aguardado.** Falhar aqui não pode segurar quem
 * está pagando - mesmo padrão que o resto do funil já usa. `keepalive`
 * porque um método que exija redirect de página inteira leva a pessoa embora
 * antes desta chamada terminar.
 *
 * O `slug` sai de `payments.recurring.funnelSlug` em vez de repetido aqui: o
 * dia em que o funil mudar de nome, muda num lugar só.
 */
export function registerGiveWpRef(leadId: string, paymentIntentId: string) {
  if (!leadId || !paymentIntentId) return;

  try {
    void fetch(givewp.refUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: payments.recurring.funnelSlug,
        lead_id: leadId,
        refs: [paymentIntentId],
      }),
      keepalive: true,
    }).catch(() => {
      /* Ver o aviso acima: nunca segura quem está pagando. */
    });
  } catch {
    /* idem */
  }
}

/* ─────────────────────────────────────────────────── SDK do PayPal ──── */

/**
 * O BN Code (Partner Attribution ID) do próprio GiveWP.
 *
 * ⚠️ **Sem ele o botão de cartão não aparece.** A conta PayPal deste
 * WordPress foi conectada por OAuth de parceiro ("Connect with PayPal") sob
 * esse BN code, e é em cima dessa identificação que o PayPal resolve a
 * elegibilidade do funding source de cartão (guest checkout). Sem o atributo
 * o SDK carrega normalmente e só desenha o botão amarelo - mesmo com o
 * cartão habilitado no painel do Give.
 *
 * Vai como atributo `data-*` na tag `<script>`, **não** como query string.
 *
 * ⚠️ Note que `lib/payments/paypal.ts` diz o contrário - e está certo lá.
 * Aquele arquivo cobra direto na conta da campanha, fora do GiveWP; mandar o
 * BN code deles numa integração que não é deles atribuiria a venda ao
 * parceiro errado. Aqui é o oposto: a cobrança **é** pelo PayPal Commerce do
 * GiveWP, então o BN code é o correto.
 */
const PAYPAL_BN_CODE = "GiveWP_SP_PPCPV2";

/**
 * O recorte do SDK do PayPal que este projeto usa - e só ele.
 *
 * Tipar a API inteira seria copiar uma superfície que não é nossa e que muda
 * sem avisar; mesmo critério do recorte da Stripe mais abaixo. Estes tipos
 * vieram de `lib/payments/paypal.ts`, que era o dono do SDK enquanto a
 * cobrança acontecia no navegador - com aquele caminho removido, o dono
 * passou a ser este arquivo.
 *
 * Note que não há mais um tipo de "captura": neste fluxo quem captura é o
 * GiveWP, e o navegador só vê o `orderID`.
 */
export type PaypalButtonsOptions = {
  style?: Record<string, string | number>;
  createOrder: () => Promise<string>;
  onApprove: (data: { orderID?: string }) => Promise<void> | void;
  onError?: (err: unknown) => void;
  onCancel?: () => void;
};

export type PaypalNamespace = {
  Buttons(options: PaypalButtonsOptions): {
    isEligible(): boolean;
    render(container: HTMLElement): Promise<void>;
    close(): Promise<void>;
  };
  FUNDING: Record<string, string>;
};

declare global {
  interface Window {
    paypal?: PaypalNamespace;
  }
}

/**
 * Carrega o SDK do PayPal com o `clientId` que veio de `/config` - nunca um
 * chumbado. É o que garante que a cobrança nasce na conta que este WordPress
 * tem conectada.
 */
let carregamentoPaypal: Promise<unknown> | null = null;

export function loadGiveWpPaypalSdk(
  clientId: string,
  currency: string,
): Promise<NonNullable<Window["paypal"]>> {
  if (carregamentoPaypal)
    return carregamentoPaypal as Promise<NonNullable<Window["paypal"]>>;

  carregamentoPaypal = new Promise((resolve, reject) => {
    if (window.paypal) {
      resolve(window.paypal);
      return;
    }

    const params = new URLSearchParams({
      "client-id": clientId,
      currency,
      intent: "capture",
      components: "buttons",
      /* Só a linha de crédito sai. `card` fica: é ele que desenha o botão de
         cartão para quem não tem conta PayPal. */
      "disable-funding": "credit",
    });

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.setAttribute("data-partner-attribution-id", PAYPAL_BN_CODE);
    script.async = true;
    script.onload = () =>
      window.paypal
        ? resolve(window.paypal)
        : reject(new Error("The PayPal SDK loaded but did not register itself."));
    script.onerror = () => {
      script.remove();
      carregamentoPaypal = null;
      reject(new Error("We could not reach PayPal. Check your connection."));
    };
    document.head.appendChild(script);
  });

  return carregamentoPaypal as Promise<NonNullable<Window["paypal"]>>;
}

/* ─────────────────────────────────────────────────── SDK da Stripe ──── */

declare global {
  interface Window {
    Stripe?: (
      publishableKey: string,
      options?: { stripeAccount?: string },
    ) => StripeInstance;
  }
}

/**
 * O recorte do SDK que este projeto usa - e só ele. Tipar a API inteira da
 * Stripe seria copiar uma superfície que não é nossa e que muda sem avisar;
 * mesmo critério de `PaypalNamespace` em `lib/payments/paypal.ts`.
 */
export type StripeElements = {
  create: (type: "payment") => { mount: (el: string | HTMLElement) => void };
  /** Valida os campos no navegador. Ainda não chama a Stripe de verdade. */
  submit: () => Promise<{ error?: { message?: string; code?: string } }>;
};

export type StripeInstance = {
  elements: (options: {
    mode: "payment";
    amount: number;
    currency: string;
    appearance?: Record<string, unknown>;
  }) => StripeElements;
  confirmPayment: (options: {
    elements: StripeElements;
    clientSecret: string;
    confirmParams: {
      return_url: string;
      payment_method_data?: { billing_details?: Record<string, unknown> };
    };
    redirect: "if_required";
  }) => Promise<{
    error?: { message?: string; type?: string; code?: string };
    paymentIntent?: { status?: string };
  }>;
};

const STRIPE_SDK_SRC = "https://js.stripe.com/v3/";

/**
 * Carrega `js.stripe.com/v3` uma vez só e devolve a instância já associada à
 * chave pública e à conta conectada que vieram de `/config`.
 *
 * Sem `@stripe/stripe-js`: por baixo o pacote é só `window.Stripe(...)`
 * depois de carregar esse script - mesmo padrão de `<script>` que o SDK do
 * PayPal já usa neste projeto, e um dependência a menos para auditar.
 *
 * A promessa fica guardada no módulo para o modal poder abrir, fechar e
 * reabrir sem injetar uma segunda tag na página.
 */
let carregamentoStripe: Promise<StripeInstance> | null = null;
let chaveCarregada = "";

export function loadStripeSdk(
  publishableKey: string,
  connectedAccountId: string,
): Promise<StripeInstance> {
  /* Trocar de chave (test ↔ live, por exemplo) precisa de uma instância
     nova: a `publishableKey` é fixada no momento do `window.Stripe(...)`. */
  const chave = `${publishableKey}|${connectedAccountId}`;
  if (carregamentoStripe && chaveCarregada === chave) return carregamentoStripe;

  chaveCarregada = chave;
  carregamentoStripe = new Promise<StripeInstance>((resolve, reject) => {
    const construir = () => {
      if (!window.Stripe) {
        reject(new Error("The Stripe library loaded but did not register itself."));
        return;
      }
      resolve(
        window.Stripe(publishableKey, {
          stripeAccount: connectedAccountId || undefined,
        }),
      );
    };

    if (window.Stripe) {
      construir();
      return;
    }

    const existente = document.querySelector<HTMLScriptElement>(
      `script[src="${STRIPE_SDK_SRC}"]`,
    );
    if (existente) {
      existente.addEventListener("load", construir);
      existente.addEventListener("error", () =>
        reject(new Error("We could not reach Stripe. Check your connection.")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = STRIPE_SDK_SRC;
    script.async = true;
    script.onload = construir;
    script.onerror = () => {
      /* Some da página para uma segunda tentativa não ficar presa a um
         `<script>` que já falhou - mesmo cuidado de `carregarSdk` em
         `lib/payments/paypal.ts`. */
      script.remove();
      carregamentoStripe = null;
      chaveCarregada = "";
      reject(new Error("We could not reach Stripe. Check your connection."));
    };
    document.head.appendChild(script);
  });

  return carregamentoStripe;
}
