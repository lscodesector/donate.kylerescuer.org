"use client";

/**
 * Identidade e eventos de conversão do checkout.
 *
 * Espelha o que a página de produção (`doe.sosanimalhelp.org`) já dispara, com
 * os mesmos nomes de evento, as mesmas chaves e o mesmo armazenamento. Isso não
 * é detalhe: o que consome esses eventos (GTM, pixel da Meta, a planilha) está
 * configurado pelos nomes de lá. Renomear um campo aqui quebra a atribuição
 * sem quebrar a página - o tipo de erro que só aparece no relatório do mês.
 *
 *   `codex:fake-donate-click`  → InitiateCheckout, no clique que abre o Pix
 *   `codex:pix-paid`           → Purchase, quando o pagamento é confirmado
 *
 * Os dois são `CustomEvent` no `document`, com o payload em `detail`.
 *
 * ── A conciliação é pelo `lead_id` ────────────────────────────────────────
 * Ele é criado no clique, guardado em `localStorage` **e** em cookie (um deles
 * sobrevive quando o outro é bloqueado), viaja como `integration_id` na
 * cobrança e como parte do `txid`. É por ele que a planilha reencontra a
 * pessoa quando ela volta do app do banco - por isso só é apagado depois de o
 * pagamento ser confirmado.
 */

const LEAD_KEY = "pix_lead_id";
const EVENT_KEY = "codex_event_id";

function getCookie(name: string) {
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name + "=([^;]+)"),
  );
  return match ? decodeURIComponent(match[1]) : "";
}

function setCookie(name: string, value: string, maxAge = 2_592_000) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/** `localStorage` primeiro, cookie como rede - modo anônimo derruba o primeiro. */
function getStored(name: string) {
  try {
    return localStorage.getItem(name) || getCookie(name) || "";
  } catch {
    return getCookie(name) || "";
  }
}

function setStored(name: string, value: string) {
  try {
    localStorage.setItem(name, value);
  } catch {
    /* Sem localStorage: o cookie abaixo segura sozinho. */
  }
  setCookie(name, value);
}

function generateId(prefix: string) {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Formato compacto, igual ao de produção: `lead_<epoch>_<6 chars>`. */
export function createLeadId() {
  let random = Math.random().toString(36).slice(2, 8);
  while (random.length < 6) random += Math.random().toString(36).slice(2);
  const leadId = `lead_${Date.now()}_${random.slice(0, 6)}`;
  setStored(LEAD_KEY, leadId);
  return leadId;
}

export function getLeadId() {
  return getStored(LEAD_KEY);
}

/** Só depois do pagamento confirmado - ver o comentário do topo. */
export function clearLeadId() {
  try {
    localStorage.removeItem(LEAD_KEY);
  } catch {
    /* Ignora: o cookie abaixo é apagado de qualquer forma. */
  }
  document.cookie = `${LEAD_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

function getUrlParam(name: string) {
  try {
    return new URL(window.location.href).searchParams.get(name) ?? "";
  } catch {
    return "";
  }
}

/** Os parâmetros de campanha e os cookies da Meta, do jeito que ela espera. */
function attribution(existing?: Record<string, string>) {
  const fbclid = existing?.fbclid || getUrlParam("fbclid");
  return {
    fbclid,
    fbp: existing?.fbp || getCookie("_fbp") || "",
    /* `fbc` sintético a partir do `fbclid` quando o cookie não existe: é o
       formato que a própria Meta documenta (`fb.1.<timestamp>.<fbclid>`). */
    fbc:
      existing?.fbc ||
      getCookie("_fbc") ||
      (fbclid ? `fb.1.${Math.floor(Date.now() / 1000)}.${fbclid}` : ""),
    utm_source: existing?.utm_source || getUrlParam("utm_source"),
    utm_medium: existing?.utm_medium || getUrlParam("utm_medium"),
    utm_campaign: existing?.utm_campaign || getUrlParam("utm_campaign"),
    utm_term: existing?.utm_term || getUrlParam("utm_term"),
    utm_content: existing?.utm_content || getUrlParam("utm_content"),
  };
}

export type LeadTracking = Record<string, unknown> & {
  lead_id: string;
  event_id: string;
  amount: number | null;
  product_name: string;
};

/**
 * InitiateCheckout: dispara no clique que abre o checkout, e é aqui que o
 * `lead_id` da doação nasce.
 *
 * `donorName` e `donorPhone` são acréscimo nosso - a etapa "Complete seus
 * dados" não existe no WordPress. Eles viajam **só** no evento, nunca no corpo
 * da cobrança (ver o aviso em `createCharge`).
 */
export function trackInitiateCheckout({
  amountCents,
  productName,
  productDescription,
  donorName,
  donorPhone,
  anonymous,
}: {
  amountCents: number;
  productName: string;
  productDescription: string;
  donorName: string;
  donorPhone: string;
  anonymous: boolean;
}): LeadTracking {
  const leadId = createLeadId();
  const eventId = generateId("ic");
  setStored(EVENT_KEY, eventId);

  const detail: LeadTracking = {
    lead_id: leadId,
    event_id: eventId,
    event_name: "InitiateCheckout",
    reconciliation_mode: "lead_id",
    donation_flow: "racao_pix_screen",
    record_action: "create",
    lookup_field: "lead_id",
    lookup_value: leadId,
    event_time: Math.floor(Date.now() / 1000),
    page_url: window.location.href,
    page_title: document.title || "",
    referrer: document.referrer || "",
    user_agent: navigator.userAgent || "",
    gateway: "infopago_pix",
    currency: "BRL",
    amount: amountCents > 0 ? Number((amountCents / 100).toFixed(2)) : null,
    product_name: productName,
    product_description: productDescription,
    donor_name: anonymous ? "Anônimo" : donorName,
    donor_phone: donorPhone,
    donor_anonymous: anonymous,
    ...attribution(),
  };

  document.dispatchEvent(
    new CustomEvent("codex:fake-donate-click", { detail }),
  );

  return detail;
}

/**
 * Purchase: só quando o gateway confirmou. `record_action: 'update'` porque a
 * linha da planilha já existe desde o InitiateCheckout - este evento completa
 * aquela linha, não cria outra.
 */
export function trackPixPaid(
  base: LeadTracking | null,
  paid: {
    original_value?: number;
    currency?: string;
    settled_at?: string;
    txid?: string;
    resource_id?: string;
    status_check_reference?: string;
    integration_id?: string;
  },
) {
  const leadId = base?.lead_id || getLeadId() || createLeadId();
  const amount = Number(paid.original_value ?? base?.amount ?? NaN);

  const detail = {
    ...(base ?? {}),
    lead_id: leadId,
    event_id: generateId("purchase"),
    event_name: "Purchase",
    reconciliation_mode: "lead_id",
    donation_flow: "racao_pix_screen",
    record_action: "update",
    lookup_field: "lead_id",
    lookup_value: leadId,
    checkout_event_id: base?.event_id || getStored(EVENT_KEY) || "",
    event_time: Math.floor(Date.now() / 1000),
    page_url: window.location.href,
    page_title: document.title || "",
    referrer: document.referrer || "",
    user_agent: navigator.userAgent || "",
    gateway: "infopago_pix",
    currency: paid.currency || "BRL",
    amount: Number.isFinite(amount) ? Number(amount.toFixed(2)) : null,
    ...attribution(base as Record<string, string> | undefined),
    status: "paid",
    payment_status: "paid",
    paid: true,
    paid_at: paid.settled_at ?? "",
    settled_at: paid.settled_at ?? "",
    txid: paid.txid ?? "",
    resource_id: paid.resource_id ?? "",
    status_check_reference: paid.status_check_reference ?? "",
    integration_id: paid.integration_id || leadId,
  };

  document.dispatchEvent(new CustomEvent("codex:pix-paid", { detail }));
  return detail;
}
