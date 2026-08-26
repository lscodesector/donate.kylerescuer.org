/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  GATEWAY DE PAGAMENTO - Lusa Payments / InfoPago (Pix)                ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Este é o mesmo gateway que a página em produção da campanha
 * (`doe.caioprotetor.org`, WordPress + Elementor) já usa. O contrato abaixo foi
 * extraído de lá campo a campo para que as duas páginas caiam na mesma
 * conciliação - mesmo endpoint, mesmo formato de `txid`, mesmo `lead_id`,
 * mesmos eventos de tracking.
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

import { withBasePath } from "@/lib/base-path";

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
  /**
   * Só na recorrência: o identificador do **mandato** (`rec`) que autoriza as
   * cobranças dos próximos meses. É o que amarra a recorrência ao lead no Nest
   * (ver `bindRecurringAuthorization`) - sem ele, o mês 2 nunca é cobrado.
   */
  id_rec?: string;
  /** Campos de erro, quando a resposta não é 2xx. */
  message?: string;
  error?: string;
  details?: Record<string, unknown>;
  /** Erros de validação do Laravel: `{ campo: ["mensagem"] }`. */
  errors?: Record<string, string[]>;
  onz_diagnostics?: { diagnostic_id?: string };
};

/**
 * ⚠️ CONFERIR ANTES DE PUBLICAR ⚠️
 *
 * Os valores são os mesmos atributos `data-*` da seção `.sah-racao-section` em
 * produção. Mudou lá, muda aqui.
 */
export const payments = {
  /**
   * `data-api-url`. O sufixo do caminho identifica a campanha no gateway.
   *
   * ⚠️ É `sos-animal-help`, **sem** o `-racao` do fim: aquele era o da campanha
   * de ração, e este é o que a página do Caio (`doe.caioprotetor.org`) usa hoje.
   * Trocar o sufixo troca a conta que recebe.
   */
  chargeUrl:
    process.env.NEXT_PUBLIC_PIX_API_URL ??
    "https://lusapayments.com/api/onz/infopago/sos-animal-help/charge",

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
   *
   * `withBasePath`, e não `"/obrigado"` puro: quem lê este valor é
   * `window.location.href` em `CheckoutModal`, uma troca de página pelo
   * navegador que não passa pelo Next - sem o prefixo, publicado em
   * `doe.caioprotetor.org/v2` a pessoa que acabou de pagar cairia em
   * `doe.caioprotetor.org/obrigado`, que é o WordPress, não esta página.
   */
  successUrl: withBasePath("/obrigado"),

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

  /**
   * Marcador que entra no `txid`, depois do `lead_id`. É o que separa esta
   * campanha das outras na conciliação - `CPCAIOPR` é o mesmo que a página em
   * WordPress do Caio manda hoje, então as duas caem no mesmo relatório.
   */
  txidMarker: "CPCAIOPR",

  /**
   * ╔════════════════════════════════════════════════════════════════════╗
   * ║  Pixels da Meta - servidos pelo Nest, nunca chumbados aqui          ║
   * ╚════════════════════════════════════════════════════════════════════╝
   *
   * `GET` devolve `{ ok, slug, pixels: ["1329196859189821"] }`. É o mesmo
   * endereço que a página em WordPress consulta: o ID do pixel mora no funil,
   * do lado do backend, e a regra por `utm_campaign` é aplicada lá - por isso
   * a chamada leva a `utm_campaign` da URL. Trocar de pixel é mexer no funil,
   * não em código publicado.
   *
   * ⚠️ O slug do fim do caminho é o mesmo `recurring.funnelSlug`, repetido
   * porque um literal não consegue se referenciar. Mudou lá, muda aqui.
   */
  // Ponte temporaria via Laravel/Cloudways (SSH tunnel), enquanto o aaPanel
  // estiver com bloqueio de rede da DigitalOcean. Reverter para
  // 'https://track.lusapayments.com/api/funnels/cp-caio-protetor/web-pixels'
  // quando o bloqueio for removido.
  webPixelsUrl:
    process.env.NEXT_PUBLIC_NEST_WEB_PIXELS_URL ??
    "https://lusapayments.com/api/funnels/cp-caio-protetor/web-pixels",

  /**
   * ╔════════════════════════════════════════════════════════════════════╗
   * ║  DOAÇÃO MENSAL - Pix Automático (Jornada 3 da Infopago)             ║
   * ╚════════════════════════════════════════════════════════════════════╝
   *
   * Um QR só faz duas coisas: cobra a **1ª parcela agora** (`cob`) e cria o
   * **mandato** (`rec`) que autoriza o banco a debitar os próximos meses
   * sozinho. É o que substitui a mensal de mentira - aquela que gerava um Pix
   * e prometia "a equipe combina os próximos com você pelo WhatsApp".
   *
   * ⚠️ **O profile NÃO é o mesmo do Pix único.** O avulso usa
   * `sos-animal-help` (conta genérica); a rota de recorrência recusa esse nome
   * e responde `Profile de cobranca invalido` com a lista dos que aceita -
   * conferido contra a API em 12/08/2026. O desta campanha é
   * `sos_animal_help_caio_protetor`. Trocar isto troca a conta que recebe.
   */
  recurring: {
    chargeUrl:
      process.env.NEXT_PUBLIC_PIX_RECURRING_API_URL ??
      "https://lusapayments.com/api/onz/infopago/sos_animal_help_caio_protetor/recurring-charge",

    /**
     * ⚠️ Base do **status**, escrita por extenso de propósito.
     *
     * A rota de recorrência cria a cobrança imediata como `/cob/{txid}`, então
     * quem responde pelo status dela é `/charge/{txid}/status`. **Não existe**
     * `/recurring-charge/{txid}/status`. E o profile aqui é o da recorrência,
     * não o do avulso: a cobrança nasceu na conta dele.
     */
    statusUrlBase:
      process.env.NEXT_PUBLIC_PIX_RECURRING_STATUS_URL ??
      "https://lusapayments.com/api/onz/infopago/sos_animal_help_caio_protetor/charge",

    periodicity: "MENSAL",
    /** `NAO_PERMITE` | `PERMITE_3R_7D` - 3 retentativas em 7 dias se faltar saldo. */
    retryPolicy: "PERMITE_3R_7D",

    /**
     * A recorrência começa **1 mês à frente**, nunca hoje: na Jornada 3 o QR
     * de hoje já é a parcela deste mês, e um mandato começando hoje cobraria a
     * pessoa duas vezes no primeiro mês. Ver `recurrenceStartDate`.
     */
    startMonthsAhead: 1,

    /**
     * Piso do valor livre da mensal, em centavos.
     *
     * R$ 10,00, o mesmo que a página em WordPress do Caio pratica hoje: lá o
     * par é `FORM_ENV = 'prod'` → `MIN_CENTS = 1000` (conferido no HTML
     * publicado de `doe.caioprotetor.org` em 13/08/2026), e é o piso das
     * campanhas irmãs (Adrielly, SOS Animal Help).
     *
     * ⚠️ Esteve em `1` durante o desenvolvimento, para conferir o fluxo do
     * mandato pagando de verdade - esta integração não tem sandbox e o bind só
     * funciona no domínio publicado (CORS), então cada teste custa dinheiro.
     * Se precisar testar de novo, baixe **temporariamente** e volte para
     * `1000` antes de publicar: com o piso em um centavo, quem digita no campo
     * de valor livre cadastra um débito automático de R$ 0,01 por mês.
     */
    minCents: 1000,

    /**
     * Prefixo do `contrato` - o identificador do vínculo, no máximo 35
     * caracteres alfanuméricos.
     *
     * ⚠️ **O banco mostra isto na tela de autorização do doador**, como
     * "identificador da cobrança". Não é campo interno. Por isso o `lead_id`
     * entra sem o prefixo `lead_`: sem isso, aparecia "CAIOPROTETORLEAD1784…"
     * e a palavra "lead" ia parar na tela de quem está doando.
     */
    contratoPrefix: "CAIOPROTETOR",

    /**
     * `solicitacaoPagador`: a única frase deste payload escrita para o doador
     * ler - o banco a exibe na tela em que ele autoriza a recorrência. Sem
     * acento, como o resto do que vai para o gateway.
     */
    payerQuestion: "Doacao mensal para o Caio Protetor",

    /**
     * ⚠️ CONFERIR COM O BACKEND ⚠️
     *
     * Slug do funil no Nest. É por ele que o `bind` (ver
     * `bindRecurringAuthorization`) acha o lead para pendurar o mandato, e é
     * o mesmo que nomeia a rota de InitiateCheckout (`/api/ic/<slug>`).
     *
     * Está como `cp-caio-protetor` porque é o slug da rota de IC que a
     * campanha em WordPress usa hoje (`/api/ic/cp-caio-protetor`). A página
     * `/obrigado` do Caio manda `caio-protetor` no bind - se o certo for esse,
     * é só trocar aqui. Slug errado **não dá erro visível**: o bind responde
     * `{ok:false, reason:'lead_not_found'}` e a recorrência fica sem dono.
     */
    funnelSlug: process.env.NEXT_PUBLIC_NEST_FUNNEL_SLUG ?? "cp-caio-protetor",

    /** Onde o mandato é amarrado ao lead. Ver `bindRecurringAuthorization`.
     * Ponte temporaria via Laravel/Cloudways (SSH tunnel), enquanto o aaPanel
     * estiver com bloqueio de rede da DigitalOcean. Reverter para
     * 'https://track.lusapayments.com/api/wh/pixauto/bind' quando resolvido. */
    bindUrl:
      process.env.NEXT_PUBLIC_NEST_PIXAUTO_BIND_URL ??
      "https://lusapayments.com/api/wh-relay/pixauto/bind",

    /**
     * Onde o InitiateCheckout é gravado. **O bind depende disto**: sem o lead
     * na tabela de IC do funil, ele não tem onde pendurar o mandato.
     * Ponte temporaria via Laravel/Cloudways (SSH tunnel), enquanto o aaPanel
     * estiver com bloqueio de rede da DigitalOcean. Reverter para
     * 'https://track.lusapayments.com/api/ic/cp-caio-protetor' quando resolvido. */
    icUrl:
      process.env.NEXT_PUBLIC_NEST_IC_URL ??
      "https://lusapayments.com/api/ic-relay/cp-caio-protetor",
  },
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
  if (data.error) {
    /* `diagnostic_id` é o número que quem cuida do gateway pede para achar a
       tentativa no log dele - sem ele, "deu erro" não é rastreável. */
    const diagnostico = data.onz_diagnostics?.diagnostic_id?.trim();
    return diagnostico ? `${data.error} (ref: ${diagnostico})` : data.error;
  }

  /* Validação do Laravel: `{ periodicidade: ["The periodicidade field…"] }`.
     É o formato com que a rota de recorrência recusa campo faltando. */
  const errors = data.errors;
  if (errors && typeof errors === "object") {
    const primeiro = Object.values(errors)[0];
    if (Array.isArray(primeiro) && typeof primeiro[0] === "string") {
      return primeiro[0];
    }
  }

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
  donorName: string;
  /** Como a pessoa digitou; a máscara sai aqui dentro. Opcional no checkout. */
  donorPhone: string;
  anonymous: boolean;
  /**
   * O mesmo endereço que foi no InitiateCheckout - ver `placeholderEmail`.
   * Vem de fora, e não é gerado aqui, para a cobrança e o lead do Nest
   * carregarem o **mesmo** e-mail: dois `placeholderEmail()` em instantes
   * diferentes dariam endereços diferentes para a mesma doação, e quem
   * cruza cobrança com lead veria duas pessoas onde há uma.
   */
  email: string;
};

/**
 * `55` + DDD + número, que é o formato com que o WordPress manda o telefone.
 * Devolve vazio quando não há número - o campo é opcional no checkout.
 */
function phoneForGateway(input: string) {
  let d = input.replace(/\D/g, "");
  if (!d) return "";
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  if (d.length > 11) d = d.slice(-11);
  return `55${d}`;
}

/**
 * E-mail sintético, no formato do WordPress (`anonEmail()`).
 *
 * O checkout não pede e-mail, mas o gateway espera o campo. Um endereço
 * inventado por doação é o que a página em produção manda hoje - e é preferível
 * a mandar vazio, que já foi motivo de recusa em integrações irmãs.
 */
export function placeholderEmail() {
  return `doadoranonimo${String(Date.now()).slice(-5)}@gmail.com`;
}

/**
 * Cria a cobrança Pix.
 *
 * ⚠️ Cada campo aqui espelha o corpo que `doe.caioprotetor.org` (WordPress)
 * manda hoje para **este mesmo endpoint** - extraído do HTML publicado em
 * 13/08/2026, do `createCharge()` do bloco "13 - MODAL DOACAO V2". É por isso
 * que nome, e-mail e telefone entram: não é enfeite nosso, é o que o webhook do
 * gateway grava na planilha de conciliação. Uma versão anterior deste arquivo
 * mandava só `amount_cents`/`txid`/`integration_id` e afirmava, errado, que
 * aquilo era "exatamente o que o WordPress envia".
 *
 * Não acrescente chave que o WordPress não mande sem confirmar com quem cuida
 * do gateway: o que ele faz com campo desconhecido (ignora? recusa?) não está
 * documentado, e este é o caminho por onde o dinheiro passa.
 *
 * ⚠️ CPF **não** entra aqui - só na recorrência, que é onde o Banco Central
 * exige devedor identificado. Ver `createRecurringCharge` e `lib/format.ts`.
 */
export async function createCharge(
  {
    amountCents,
    leadId,
    productTitle,
    donorName,
    donorPhone,
    anonymous,
    email,
  }: ChargeRequest,
  signal?: AbortSignal,
): Promise<ChargeResponse> {
  const nome = anonymous ? "Anônimo" : donorName.trim();

  const response = await fetch(payments.chargeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    signal,
    body: JSON.stringify({
      amount_cents: amountCents,
      original_value: Number((amountCents / 100).toFixed(2)),
      txid: buildTxid(leadId),
      name: nome,
      email,
      phone: phoneForGateway(donorPhone),
      /* Os três nomes do mesmo identificador. O WordPress manda `lead_id` e
         `correlation_id`; `integration_id` é o que a resposta desta API devolve
         de volta e o que a planilha consulta em `checkLeadPaidOnSheet`. */
      lead_id: leadId,
      correlation_id: leadId,
      integration_id: leadId,
      campaign: payments.recurring.funnelSlug,
      payer_question: "Doacao",
      expiration: payments.expirationSeconds,
      hide_visible_fields: true,
      product_title: productTitle,
      page_url: window.location.href,
      /*
       * `additional_info` fica de fora, e é a única divergência de propósito
       * em relação ao WordPress: lá ele manda `lead_id` e `campaign` nessa
       * lista, e o banco imprime o conteúdo dela em "Informações adicionais"
       * no comprovante de quem doou. Nada se perde na conciliação - o lead já
       * viaja no `txid`, no `lead_id`, no `correlation_id` e no
       * `integration_id`. Mesma decisão tomada em `createRecurringCharge`.
       */
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

/* ══════════════════════════════════════════════════════════════════════
   DOAÇÃO MENSAL - Pix Automático
   ══════════════════════════════════════════════════════════════════════ */

/**
 * Data da primeira parcela **automática**, em `Y-m-d`: um mês à frente.
 *
 * O QR de hoje já cobra o mês corrente, então o mandato só começa no mês que
 * vem - ver o comentário em `payments.recurring.startMonthsAhead`.
 *
 * O cuidado com o dia não é preciosismo: `setMonth` com dia 31 rola para o mês
 * seguinte (31/01 vira 03/03) e a recorrência pularia fevereiro inteiro. Por
 * isso o dia é fixado no último válido do mês alvo.
 */
export function recurrenceStartDate(hoje = new Date()) {
  const dia = hoje.getDate();
  const alvo = new Date(
    hoje.getFullYear(),
    hoje.getMonth() + payments.recurring.startMonthsAhead,
    1,
  );
  const ultimoDia = new Date(
    alvo.getFullYear(),
    alvo.getMonth() + 1,
    0,
  ).getDate();
  alvo.setDate(Math.min(dia, ultimoDia));

  const mes = String(alvo.getMonth() + 1).padStart(2, "0");
  const dd = String(alvo.getDate()).padStart(2, "0");
  return `${alvo.getFullYear()}-${mes}-${dd}`;
}

/**
 * O `contrato`: identificador do vínculo, no máximo 35 caracteres.
 * Legível de propósito - **quem lê é o doador**, na tela do banco.
 */
export function buildContrato(leadId: string) {
  const base = leadId
    .replace(/^lead_/i, "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();
  return `${payments.recurring.contratoPrefix}${base}`.slice(0, 35);
}

/**
 * O corpo vai em `application/x-www-form-urlencoded`, e não em JSON como o do
 * Pix único: é o formato com que esta rota foi validada nas outras campanhas
 * (Adrielly, SOS Animal Help) e o que as duas mandam hoje em produção.
 */
function toFormUrlEncoded(payload: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(payload)) {
    if (valor === null || valor === undefined) continue;
    params.append(chave, String(valor));
  }
  return params.toString();
}

export type RecurringChargeRequest = {
  /** 1ª parcela, cobrada agora pelo QR - já com a taxa, se ela foi coberta. */
  amountCents: number;
  leadId: string;
  /** Só dígitos. Obrigatório: sem devedor identificado não há mandato. */
  cpf: string;
  donorName: string;
  donorPhone: string;
};

/**
 * Cria a cobrança imediata **e** o mandato de recorrência, num QR só.
 *
 * ⚠️ O CPF entra **só aqui**. O evento de tracking (`trackInitiateCheckout`) é
 * espalhado para fora - pixel, planilha, CRM -, e CPF ali dentro seria dado
 * pessoal entregue a terceiro. O mesmo aviso está em `lib/format.ts`.
 *
 * ⚠️ Campos deste corpo foram conferidos contra a API em 12/08/2026: sem
 * `periodicidade`, `data_inicial` e `contrato` a rota responde 422. Não
 * acrescente chave nova sem confirmar com quem cuida do gateway - vale aqui a
 * mesma regra de `createCharge`.
 */
export async function createRecurringCharge(
  { amountCents, leadId, cpf, donorName, donorPhone }: RecurringChargeRequest,
  signal?: AbortSignal,
): Promise<ChargeResponse> {
  const reais = Number((amountCents / 100).toFixed(2));

  const response = await fetch(payments.recurring.chargeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    signal,
    body: toFormUrlEncoded({
      amount_cents: amountCents,
      original_value: reais,
      /* As parcelas dos próximos meses repetem exatamente o valor da primeira.
         Desde 13/08/2026 esse valor é só a doação: o convite para cobrir a taxa
         saiu do checkout mensal (ver `CheckoutModal`) justamente porque ele
         entraria aqui, no `valor_rec`, e viraria um acréscimo permanente no
         débito automático de quem marcasse a caixa uma vez. */
      valor_rec: reais,
      periodicidade: payments.recurring.periodicity,
      data_inicial: recurrenceStartDate(),
      politica_retentativa: payments.recurring.retryPolicy,
      contrato: buildContrato(leadId),
      cpf,
      txid: buildTxid(leadId),
      name: donorName,
      phone: donorPhone.replace(/\D/g, ""),
      lead_id: leadId,
      correlation_id: leadId,
      campaign: payments.recurring.funnelSlug,
      payer_question: payments.recurring.payerQuestion,
      /*
       * `additional_info` fica **de fora** de propósito: é opcional no
       * backend, mas o banco imprime tudo em "Informações adicionais" na tela
       * do doador - `lead_id` e nome de campanha ali só despejam jargão nosso
       * no comprovante dele. Nada se perde: o lead continua no `txid`, no
       * `correlation_id` e dentro do `contrato`.
       */
    }),
  });

  const data = await readJson(response);

  if (!response.ok || data.success === false) {
    throw new Error(
      extractErrorMessage(
        data,
        "Não foi possível criar a doação mensal neste momento.",
      ),
    );
  }

  return data;
}

/**
 * Por onde consultar o status de uma cobrança **recorrente**.
 *
 * Quando a API manda `status_poll_url`, ela ganha, como no avulso. O que muda é
 * o plano B: derivar de `payments.chargeUrl` mandaria a consulta para o profile
 * do Pix único, onde esta cobrança não existe - e a tela ficaria em "aguardando
 * confirmação" para sempre, mesmo com o dinheiro pago.
 */
export function readRecurringStatusHandle(data: ChargeResponse, txid: string) {
  const handle = readStatusHandle(data);
  if (handle.pollUrl) return handle;

  const referencia = handle.reference || txid;
  if (!referencia) return handle;

  return {
    pollUrl: `${payments.recurring.statusUrlBase}/${encodeURIComponent(referencia)}/status`,
    reference: referencia,
  };
}

/**
 * Amarra o mandato (`id_rec`) ao lead, no Nest.
 *
 * ── Por que o front faz isso ──────────────────────────────────────────────
 * O webhook `/rec` do Pix Automático (o do Banco Central) **nunca chegou** em
 * produção nesta integração - a Infopago não implementa esse canal para estas
 * contas. Sem o vínculo, a recorrência ficaria autorizada e paga, mas sem
 * nenhum rastro de para onde mandar as cobranças dos próximos meses: o cron do
 * Nest varre `recurring_authorizations`, e o que não está lá não é cobrado.
 *
 * O `id_rec` vem na própria resposta do `recurring-charge`, então isto não
 * depende de webhook nenhum.
 *
 * ⚠️ **A ordem importa.** O bind só encontra o lead se o InitiateCheckout já
 * tiver sido gravado (`sendInitiateCheckoutToNest`). Se o lead não estiver lá,
 * a resposta é `{ok:false, reason:'lead_not_found'}` - sem erro visível, sem
 * nada quebrado na tela, e a doação mensal simplesmente nunca cobra o 2º mês.
 *
 * Nunca lança: falhar aqui não pode segurar o QR de quem está doando.
 */
export function bindRecurringAuthorization(leadId: string, idRec?: string) {
  if (!leadId || !idRec) return;

  try {
    void fetch(payments.recurring.bindUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: payments.recurring.funnelSlug,
        lead_id: leadId,
        id_rec: idRec,
      }),
      /* `keepalive`: quem acabou de gerar o QR costuma sair para o app do
         banco na sequência, e a aba pode morrer antes de a requisição sair. */
      keepalive: true,
    }).catch(() => {
      /* Ver o aviso acima: nunca segura a tela. */
    });
  } catch {
    /* idem */
  }
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
