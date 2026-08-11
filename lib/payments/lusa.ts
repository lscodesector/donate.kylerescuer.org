/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  GATEWAY DE PAGAMENTO - Lusa Payments / InfoPago (Pix)                ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Este é o mesmo gateway que a página em produção (`doe.sosanimalhelp.org`,
 * WordPress + Elementor) já usa. O contrato abaixo foi extraído de lá campo a
 * campo para que as duas páginas caiam na mesma conciliação - mesmo endpoint,
 * mesmo formato de `txid`, mesmo `lead_id`, mesmos eventos de tracking.
 *
 * ── Por que o navegador chama direto ──────────────────────────────────────
 * Sem proxy no Next. O endpoint responde `access-control-allow-origin: *` no
 * preflight, então a chamada sai do navegador como sai hoje no WordPress.
 * Passar por uma rota nossa acrescentaria um salto de rede, um ponto de falha
 * e um IP de servidor no lugar do IP de quem doa - e não esconderia nada, já
 * que não existe chave secreta neste fluxo: a URL é pública e a cobrança é
 * identificada pelo `integration_id`.
 *
 * Se um dia entrar segredo (token, assinatura), aí sim isto vira rota de
 * servidor - e só este arquivo muda.
 *
 * ── O ciclo ───────────────────────────────────────────────────────────────
 *
 *   1. `createCharge()`   POST na API → devolve QR e/ou copia-e-cola
 *   2. `fetchChargeStatus()` de 5 em 5s até `paid: true` ou 15 min
 *   3. quem pagou no app do banco e voltou para a aba é pego por
 *      `checkLeadPaidOnSheet()`, que consulta a planilha por `lead_id`
 *
 * O passo 3 existe porque o passo 2 morre junto com a aba: em celular, abrir o
 * app do banco costuma descarregar a página. Quando a pessoa volta, o polling
 * já não está rodando - mas o webhook do gateway já escreveu na planilha.
 */

/**
 * Resposta da criação da cobrança.
 *
 * Todo campo é opcional de propósito: o que chega varia, e a tela decide com o
 * que tem. Abaixo, a resposta real conferida contra a API em 11/08/2026, com
 * uma cobrança de R$ 33,79:
 *
 *   success            true
 *   gateway            "onz_infopago"
 *   charge_id / txid   "lead…LUSASOSANIMA"
 *   status             "ATIVA"
 *   paid               false
 *   qr_code_text       "00020126870014br.gov.bcb.pix…"   ← o copia e cola
 *   pix_copia_e_cola   (mesmo conteúdo de `qr_code_text`)
 *   status_poll_url    ".../charge/<txid>/status"        ← GET, CORS liberado
 *   original_value     33.79
 *   value_cents        3379
 *   expires_at         +24h
 *
 * ⚠️ **Não vem `qr_code_image`.** O desenho do QR é nosso, a partir do
 * `qr_code_text` - por isso a tela tem os dois caminhos. Se um dia a API
 * passar a mandar a imagem, ela ganha e nada mais muda.
 */
export type ChargeResponse = {
  /** `false` mesmo com HTTP 200 quando o gateway recusa - tratado como erro. */
  success?: boolean;
  /** QR já renderizado pelo gateway. Hoje não vem; a tela desenha o dela. */
  qr_code_image?: string;
  /** Copia e cola (BR Code). É o que a API devolve de fato. */
  qr_code_text?: string;
  pix_copia_e_cola?: string;
  /** Mesmos dois campos, no formato alternativo que a API às vezes devolve. */
  authorization_qr_code_image?: string;
  authorization_qr_code_text?: string;
  /** Chaves para consultar o status, na ordem em que a tela tenta. */
  status_check_reference?: string;
  resource_id?: string;
  charge_id?: string;
  txid?: string;
  /** Quando presente, o status se consulta por GET nesta URL. É o caso hoje. */
  status_poll_url?: string;
  /** "ATIVA" enquanto não pago. */
  status?: string;
  /** Já pago no ato (raro, mas a API pode responder assim). */
  paid?: boolean;
  /** Valor da cobrança, em reais. */
  original_value?: number;
  value_cents?: number;
  currency?: string;
  settled_at?: string;
  expires_at?: string;
  integration_id?: string;
  /** Campos de erro, quando a resposta não é 2xx. */
  message?: string;
  error?: string;
  details?: Record<string, unknown>;
};

/**
 * ⚠️ CONFERIR ANTES DE PUBLICAR ⚠️
 *
 * Os valores são os mesmos atributos `data-*` da seção `.sah-racao-section` em
 * produção. Mudou lá, muda aqui.
 */
export const payments = {
  /** `data-api-url`. O sufixo do caminho identifica a campanha no gateway. */
  chargeUrl:
    process.env.NEXT_PUBLIC_PIX_API_URL ??
    "https://lusapayments.com/api/onz/infopago/sos-animal-help-racao/charge",

  /**
   * `data-sheet-status-url`. Apps Script que responde
   * `?action=check_paid&lead_id=…` → `{ ok, paid, redirect }`.
   * Vazio desliga a checagem de retorno, sem quebrar o resto.
   */
  sheetStatusUrl:
    process.env.NEXT_PUBLIC_PIX_SHEET_URL ??
    "https://script.google.com/macros/s/AKfycbymZVmL4mialv7mDasFrOn7_lLKIQgrHgBV9fQEJ7AaFS15UmaYwSb_6bA1gogSde9v/exec",

  /**
   * Para onde ir depois do pagamento confirmado. Em produção o WordPress manda
   * para `https://sosanimalhelp.org/obrigado`; aqui a página de obrigado é
   * interna, e é ela que recebe.
   */
  successUrl: "/obrigado",

  /** `data-loader-min-ms`: piso da tela "gerando", para ela ser lida. */
  loaderMinMs: 3500,
  /** `data-redirect-delay-ms`: respiro entre "confirmado" e o redirecionamento. */
  redirectDelayMs: 2500,
  /** `data-status-poll-ms`: intervalo entre consultas de status. */
  statusPollMs: 5000,
  /** `data-status-poll-max-ms`: 15 minutos, e o polling desiste. */
  statusPollMaxMs: 900_000,

  /** Validade do código, em segundos - 24h, como em produção. */
  expirationSeconds: 86_400,

  /** Marcador que entra no `txid`, depois do `lead_id`. */
  txidMarker: "SOSANIMA",
} as const;

/** `<createUrl>/status` - o endpoint de status é derivado do de criação. */
function deriveStatusUrl(createUrl: string) {
  const normalized = createUrl.trim().replace(/\/+$/, "");
  return normalized ? `${normalized}/status` : "";
}

/**
 * `txid` no formato que o gateway concilia: identificador do lead sem
 * separadores + "LUSA" + o marcador da campanha. É o que amarra a cobrança à
 * sessão de quem doou.
 */
export function buildTxid(leadId: string, marker = payments.txidMarker) {
  const lead = leadId.replace(/[^A-Za-z0-9]/g, "");
  const flow = marker.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return `${lead}LUSA${flow}`;
}

/** A mensagem de erro mais específica que a resposta oferecer. */
function extractErrorMessage(data: ChargeResponse | null, fallback: string) {
  if (!data) return fallback;
  if (data.message) return data.message;
  if (data.error) return data.error;

  const details = data.details;
  if (details && typeof details === "object") {
    const first = Object.values(details)[0];
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
    if (typeof first === "string" && first) return first;
  }

  return fallback;
}

async function readJson(response: Response): Promise<ChargeResponse> {
  const raw = await response.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ChargeResponse;
  } catch {
    /* A API devolveu texto puro (HTML de erro, por exemplo): vira mensagem. */
    return { error: raw };
  }
}

/** O que vai no corpo da criação da cobrança. */
export type ChargeRequest = {
  /** Valor **total**, já com a taxa se a pessoa escolheu cobrir. */
  amountCents: number;
  leadId: string;
  /** Rótulo do item, como aparece na conciliação: "5KG DE RAÇÃO". */
  productTitle: string;
};

/**
 * Cria a cobrança Pix.
 *
 * ⚠️ O corpo é **exatamente** o que o WordPress envia hoje, campo a campo.
 * Não acrescente chave nova sem confirmar com quem cuida do gateway: o que ele
 * faz com campo desconhecido (ignora? recusa?) não está documentado, e este é
 * o caminho por onde o dinheiro passa. Nome e WhatsApp de quem doa vão pelos
 * eventos de tracking (ver `lib/payments/tracking.ts`), não por aqui.
 */
export async function createCharge(
  { amountCents, leadId, productTitle }: ChargeRequest,
  signal?: AbortSignal,
): Promise<ChargeResponse> {
  const response = await fetch(payments.chargeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    signal,
    body: JSON.stringify({
      amount_cents: amountCents,
      txid: buildTxid(leadId),
      expiration: payments.expirationSeconds,
      integration_id: leadId,
      hide_visible_fields: true,
      product_title: productTitle,
      page_url: window.location.href,
    }),
  });

  const data = await readJson(response);

  /* `success: false` com HTTP 200 é recusa do gateway travestida de sucesso -
     sem esta linha a tela mostraria um Pix vazio em vez do motivo. */
  if (!response.ok || data.success === false) {
    throw new Error(
      extractErrorMessage(data, "Não foi possível gerar o Pix neste momento."),
    );
  }

  return data;
}

/** O QR e o copia-e-cola, em todos os nomes que a API usa. */
export function readPixFrom(data: ChargeResponse) {
  return {
    image: data.qr_code_image || data.authorization_qr_code_image || "",
    code:
      data.qr_code_text ||
      data.authorization_qr_code_text ||
      data.pix_copia_e_cola ||
      "",
  };
}

/** Por onde consultar o status desta cobrança, na ordem de preferência. */
export function readStatusHandle(data: ChargeResponse) {
  return {
    /** Quando a API manda a URL pronta, ela ganha: é GET e não precisa de corpo. */
    pollUrl: (data.status_poll_url ?? "").trim(),
    /* Só usada se `status_poll_url` faltar. Hoje a API devolve `charge_id` e
       `txid`; `status_check_reference` e `resource_id` ficam de reserva para
       formatos antigos que o WordPress ainda cobre. */
    reference: (
      data.status_check_reference ||
      data.resource_id ||
      data.charge_id ||
      data.txid ||
      ""
    ).trim(),
  };
}

/**
 * Uma batida de consulta de status. Devolve a resposta crua - quem decide o
 * que é "pago" é quem chama, olhando `data.paid`.
 */
export async function fetchChargeStatus(
  handle: { pollUrl: string; reference: string },
  signal?: AbortSignal,
): Promise<ChargeResponse> {
  if (handle.pollUrl) {
    const response = await fetch(handle.pollUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
    });
    const data = await readJson(response);
    if (!response.ok) {
      throw new Error(
        extractErrorMessage(
          data,
          "Não foi possível verificar o status do Pix.",
        ),
      );
    }
    return data;
  }

  const response = await fetch(deriveStatusUrl(payments.chargeUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    signal,
    body: JSON.stringify({ reference: handle.reference }),
  });

  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(
      extractErrorMessage(data, "Não foi possível verificar o status do Pix."),
    );
  }
  return data;
}

/**
 * A rede de segurança para quem pagou no app do banco.
 *
 * Em celular, sair para o app costuma descarregar a página - quando a pessoa
 * volta, o polling já morreu e ela veria um "aguardando confirmação" eterno
 * depois de ter pago. Esta consulta pergunta à planilha (alimentada pelo
 * webhook do gateway) se aquele `lead_id` consta como pago.
 *
 * Nunca lança: é chamada em `visibilitychange` e `pageshow`, e falhar aí não
 * pode atrapalhar quem ainda está pagando.
 */
export async function checkLeadPaidOnSheet(
  leadId: string,
): Promise<{ paid: boolean; redirect: string }> {
  const base = payments.sheetStatusUrl;
  if (!base || !leadId) return { paid: false, redirect: "" };

  try {
    const sep = base.includes("?") ? "&" : "?";
    const response = await fetch(
      `${base}${sep}action=check_paid&lead_id=${encodeURIComponent(leadId)}`,
      { method: "GET", redirect: "follow" },
    );
    if (!response.ok) return { paid: false, redirect: "" };

    const data = (await response.json()) as {
      ok?: boolean;
      paid?: boolean;
      redirect?: string;
    };
    if (!data?.ok || !data.paid) return { paid: false, redirect: "" };

    return { paid: true, redirect: String(data.redirect ?? "").trim() };
  } catch {
    return { paid: false, redirect: "" };
  }
}

/**
 * Registra na planilha para onde a pessoa foi mandada depois de pagar.
 * Só é chamado quando a planilha não trouxe um `redirect` próprio - é
 * "informa o que eu decidi", não "pergunta o que fazer". Falha em silêncio.
 */
export async function logSheetRedirect(leadId: string, redirectPath: string) {
  const base = payments.sheetStatusUrl;
  if (!base || !leadId) return;

  try {
    const sep = base.includes("?") ? "&" : "?";
    await fetch(
      `${base}${sep}action=log_redirect&lead_id=${encodeURIComponent(leadId)}` +
        `&redirect=${encodeURIComponent(redirectPath)}&sheet=${encodeURIComponent("Todos")}`,
      { method: "GET", redirect: "follow" },
    );
  } catch {
    /* Não bloqueia quem acabou de doar. */
  }
}
