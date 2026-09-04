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

import { payments, placeholderEmail } from "./lusa";

const LEAD_KEY = "pix_lead_id";
const EVENT_KEY = "codex_event_id";

/**
 * zip/city/state por IP - o Nest (`dynamic-funnels`) só resolve ip/country,
 * não geo completo (isso é responsabilidade de quem manda o IC, não dele).
 * Como esta página é export estático, sem backend próprio, resolve direto no
 * navegador. `ipapi.co` libera CORS no plano grátis (diferente do `ipwho.is`,
 * que bloqueia - é por isso que o WordPress resolve isso num PHP no servidor,
 * ver `nest.html`/`wp.php` de lá). Cacheado na sessão pra não bater na API de
 * novo a cada evento de tracking desta mesma visita.
 */
/* `v2`: o formato ganhou `country` - a chave muda junto para não ler um
   cache antigo sem esse campo e concluir que o país é desconhecido. */
const GEO_CACHE_KEY = "codex_ip_geo_v2";

type GeoMeta = {
  zip: string | null;
  city: string | null;
  state: string | null;
  /**
   * O país de **quem está doando**, não o da campanha.
   *
   * ⚠️ Isto é dado de casamento do CAPI: o Meta usa país, CEP, cidade e
   * estado para achar a pessoa. Um valor chumbado mente para o algoritmo -
   * e chumbar `US` numa visita do Brasil é pior do que não mandar nada.
   * Sai do mesmo `ipapi.co` que já resolvia os outros três; o campo estava
   * na resposta e era descartado.
   */
  country: string | null;
};

let geoMetaPromise: Promise<GeoMeta> | null = null;

function readGeoCache(): GeoMeta | null {
  try {
    const raw = sessionStorage.getItem(GEO_CACHE_KEY);
    return raw ? (JSON.parse(raw) as GeoMeta) : null;
  } catch {
    return null;
  }
}

function writeGeoCache(geo: GeoMeta) {
  try {
    sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(geo));
  } catch {
    // sessionStorage indisponível (modo privado etc.) - segue sem cache
  }
}

/**
 * Os provedores, na ordem em que são tentados.
 *
 * ⚠️ **Dois, e não um.** Até 04/09/2026 havia só o `ipapi.co` - e ele passou
 * a responder `{"error":true,"reason":"RateLimited"}` no plano grátis. O
 * `catch` engolia isso e devolvia tudo `null`, então `zip`/`city`/`state`
 * saíam vazios em TODO evento sem ninguém perceber: no painel a linha
 * parecia normal, só sem os campos. Um provedor de reserva transforma a
 * queda de um deles em degradação, não em apagão silencioso.
 *
 * Os dois usam os MESMOS nomes de campo (`country_code`, `postal`, `city`,
 * `region_code`), então a leitura é uma só.
 *
 * `ipwho.is` primeiro porque devolve os quatro campos e ainda tem `success`
 * para dizer quando falhou - o `ipapi.co` sinaliza erro com `error: true`.
 * (Um comentário antigo aqui dizia que o `ipwho.is` bloqueava CORS; medido
 * em 04/09/2026 ele responde `Access-Control-Allow-Origin: *`.)
 */
const GEO_PROVIDERS = ["https://ipwho.is/", "https://ipapi.co/json/"];

/** `null` quando a resposta é um erro disfarçado de 200. */
function parseGeo(data: unknown): GeoMeta | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  /* `ipwho.is` diz `success: false`; `ipapi.co`, `error: true`. */
  if (d.success === false || d.error === true) return null;

  const texto = (v: unknown) => (typeof v === "string" && v ? v : null);
  const geo: GeoMeta = {
    zip: texto(d.postal),
    city: texto(d.city),
    /* Sigla de duas letras ("SP"), não o nome por extenso. */
    state: texto(d.region_code),
    /* ISO de duas letras ("BR", "US") - o formato que o funil e o CAPI esperam. */
    country: texto(d.country_code),
  };
  /* Uma resposta que não trouxe nem o país não serve como resolvida: deixa a
     vez para o provedor seguinte. */
  return geo.country ? geo : null;
}

async function resolveGeoMeta(): Promise<GeoMeta> {
  const cached = readGeoCache();
  if (cached) return cached;

  if (!geoMetaPromise) {
    geoMetaPromise = (async () => {
      for (const url of GEO_PROVIDERS) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const geo = parseGeo(await res.json());
          if (geo) {
            writeGeoCache(geo);
            return geo;
          }
        } catch {
          /* Rede, CORS, DNS: tenta o próximo. */
        }
      }
      /* Nenhum respondeu. Campos vazios, que o Meta ignora - melhor do que um
         valor inventado, que ele usa para casar errado. NÃO é cacheado: a
         próxima visita tenta de novo. */
      return { zip: null, city: null, state: null, country: null };
    })();
  }
  return geoMetaPromise;
}

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
 * "Maria Souza Lima" → `{ first_name: "Maria", last_name: "Souza Lima" }`.
 *
 * Quem só tem um nome (ou doa anônimo) repete o mesmo dos dois lados: o
 * registro do lead rejeita sobrenome vazio, e um campo em branco ali some com
 * o nome inteiro no relatório.
 */
function splitName(full: string) {
  const nome = full.trim().replace(/\s+/g, " ");
  if (!nome) return { first_name: "Anônimo", last_name: "Anônimo" };

  const partes = nome.split(" ");
  const primeiro = partes.shift() ?? nome;
  return {
    first_name: primeiro,
    last_name: partes.length ? partes.join(" ") : nome,
  };
}

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
  recurring = false,
}: {
  amountCents: number;
  productName: string;
  productDescription: string;
  donorName: string;
  donorPhone: string;
  anonymous: boolean;
  /** Doação mensal (assinatura do PayPal). Muda o `gateway` - ver abaixo. */
  recurring?: boolean;
}): LeadTracking {
  const leadId = createLeadId();
  const eventId = generateId("ic");
  setStored(EVENT_KEY, eventId);

  const nome = anonymous ? "Anônimo" : donorName;

  const detail: LeadTracking = {
    lead_id: leadId,
    event_id: eventId,
    event_name: "InitiateCheckout",
    reconciliation_mode: "lead_id",
    donation_flow: "cp_caio_protetor",
    record_action: "create",
    lookup_field: "lead_id",
    lookup_value: leadId,
    event_time: Math.floor(Date.now() / 1000),
    page_url: window.location.href,
    page_title: document.title || "",
    referrer: document.referrer || "",
    user_agent: navigator.userAgent || "",
    /*
     * ⚠️ O substring `recurring` **é lido pelo Nest**: é por ele que o backend
     * sabe que deve tratar a doação no cenário de recorrência (Utmify/CAPI) em
     * vez de avulsa. Não trocar por outro nome - "mensal", "assinatura" e
     * afins não são reconhecidos, e a doação mensal cairia no relatório
     * indistinguível de uma doação única.
     */
    gateway: recurring ? "paypal_subscription" : "paypal",
    currency: "USD",
    amount: amountCents > 0 ? Number((amountCents / 100).toFixed(2)) : null,
    amount_cents: amountCents > 0 ? amountCents : null,
    product_name: productName,
    product_description: productDescription,
    donor_name: nome,
    /* Quebrados do nome completo porque é assim que o registro do lead guarda
       (e o CAPI espera). Sem isto o nome de quem doou nunca chega no Nest -
       bug já visto em produção, e por isso está aqui e não só no consumidor. */
    ...splitName(nome),
    donor_phone: donorPhone,
    /* Um endereço por doação, gerado aqui e reaproveitado no corpo da cobrança
       (ver `ChargeRequest.email`): é o mesmo e-mail nos dois lugares, como no
       WordPress. O checkout não pede e-mail de ninguém. */
    donor_email: placeholderEmail(),
    donor_anonymous: anonymous,
    /**
     * ⚠️ **Nunca chumbe um país aqui.** É o país de quem está doando, e vale
     * como dado de casamento do CAPI - um valor fixo mente para o Meta.
     *
     * `trackInitiateCheckout` é síncrono e a resolução por IP é assíncrona,
     * então aqui só entra o que já estiver no cache da sessão. Quando não
     * houver, fica `null` e quem preenche é o `sendInitiateCheckoutToNest`,
     * que aguarda o `resolveGeoMeta()` antes de mandar.
     */
    country: readGeoCache()?.country ?? null,
    ...attribution(),
  };

  document.dispatchEvent(
    new CustomEvent("codex:fake-donate-click", { detail }),
  );

  return detail;
}

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  Grava o InitiateCheckout no Nest - o lead que o mandato vai pendurar  ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * ── Por que isto existe aqui, e não num bloco de tracking da página ───────
 * No WordPress quem fazia esta chamada era o bloco `15-nest.html`, escutando o
 * `CustomEvent` que sai daqui. Esta página é um export estático publicado por
 * conta própria: **ninguém está escutando** aquele evento. Sem esta chamada, o
 * lead nunca chega na tabela de IC do funil.
 *
 * ── E por que a doação mensal depende disso ───────────────────────────────
 * O `bind` do Pix Automático (`bindRecurringAuthorization`) procura o lead por
 * `lead_id` para pendurar nele o mandato. Lead que não está lá → resposta
 * `{ok:false, reason:'lead_not_found'}`, **sem erro visível em lugar nenhum**,
 * e a recorrência nunca cobra o 2º mês. Por isso esta chamada é aguardada
 * antes de criar a cobrança, e não disparada e esquecida.
 *
 * ⚠️ Vale para os **dois** fluxos, único e mensal.
 *
 * Chegou a valer só para a mensal, com a justificativa de que a doação única
 * "já é conciliada pela planilha" e que mandá-la ao Nest duplicaria lead. Era
 * engano: `donate.kylerescuer.org` (WordPress) manda **toda** doação única para
 * esta mesma rota - é o que faz o bloco `15-nest.html` de lá, escutando o
 * `CustomEvent` que sai daqui. As duas páginas são caminhos alternativos para a
 * mesma campanha, nunca simultâneos, então não há o que duplicar. O que havia
 * era uma doação única cujo nome e WhatsApp morriam no navegador.
 *
 * Nunca lança: falhar aqui atrapalha o relatório, não a doação. O `catch` é
 * silencioso de propósito, mas o `console.debug` fica - é o que permite
 * diagnosticar `lead_not_found` olhando o console da página publicada.
 */
export async function sendInitiateCheckoutToNest(detail: LeadTracking) {
  const url = payments.recurring.icUrl;
  if (!url) return;

  const geo = await resolveGeoMeta();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "InitiateCheckout",
        campaign: payments.recurring.funnelSlug,
        lead_id: detail.lead_id,
        zip: geo.zip,
        city: geo.city,
        state: geo.state,
        first_name: detail.first_name ?? null,
        last_name: detail.last_name ?? null,
        phone: detail.donor_phone ?? null,
        email: detail.donor_email ?? null,
        /* Os mesmos campos que o WordPress manda no `buildLeadPayload` dele:
           é por eles que o Nest monta o evento de CAPI/Utmify. */
        event_id: detail.event_id,
        checkout_event_id: detail.event_id,
        donation_flow: detail.donation_flow ?? null,
        product_name: detail.product_name ?? null,
        product_description: detail.product_description ?? null,
        /**
         * O país sai da resolução por IP, igual a `zip`/`city`/`state` - os
         * quatro são o mesmo dado de casamento do CAPI e têm que contar a
         * mesma história.
         *
         * ⚠️ Já esteve chumbado aqui, primeiro como `"BR"` (herança do fork
         * da campanha brasileira) e depois como `"US"` (achando que era o
         * país da campanha). Os dois estavam errados: o campo é de quem doa.
         * Em 04/09/2026 o painel mostrava visitas de Hortolândia gravadas
         * como US.
         *
         * `null` quando a busca falha - melhor um campo vazio, que o Meta
         * ignora, do que um país inventado, que ele usa para casar errado.
         */
        country: geo.country ?? detail.country ?? null,
        page_title: detail.page_title ?? null,
        referrer: detail.referrer ?? null,
        amount: detail.amount,
        amount_cents: detail.amount_cents ?? null,
        currency: detail.currency ?? "USD",
        gateway: detail.gateway,
        event_time: detail.event_time,
        page_url: detail.page_url,
        user_agent: detail.user_agent,
        fbc: detail.fbc ?? null,
        fbp: detail.fbp ?? null,
        fbclid: detail.fbclid ?? null,
        utm_source: detail.utm_source ?? null,
        utm_medium: detail.utm_medium ?? null,
        utm_campaign: detail.utm_campaign ?? null,
        utm_term: detail.utm_term ?? null,
        utm_content: detail.utm_content ?? null,
      }),
      keepalive: true,
    });
    console.debug("[ic][nest]", res.status);
  } catch (err) {
    console.debug("[ic][nest] falhou", err);
  }
}

/**
 * Purchase: só quando o PayPal confirmou a captura. `record_action: 'update'`
 * porque a linha da planilha já existe desde o InitiateCheckout - este evento
 * completa aquela linha, não cria outra.
 *
 * ⚠️ O **nome do evento no DOM continua `codex:pix-paid`**, e não é
 * esquecimento: quem escuta esse nome é o GTM da campanha, fora deste
 * repositório. Renomear aqui apagaria o Purchase do relatório sem aviso, e o
 * dia em que o GTM passar a escutar outro nome os dois mudam juntos.
 */
export function trackDonationPaid(
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
    donation_flow: "cp_caio_protetor",
    record_action: "update",
    lookup_field: "lead_id",
    lookup_value: leadId,
    checkout_event_id: base?.event_id || getStored(EVENT_KEY) || "",
    event_time: Math.floor(Date.now() / 1000),
    page_url: window.location.href,
    page_title: document.title || "",
    referrer: document.referrer || "",
    user_agent: navigator.userAgent || "",
    /* Herda do InitiateCheckout: numa doação mensal ele é
       `paypal_subscription`, e sobrescrever com o avulso aqui faria a
       assinatura ser contada como doação única no relatório. */
    gateway: base?.gateway ?? "paypal",
    currency: paid.currency || "USD",
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
