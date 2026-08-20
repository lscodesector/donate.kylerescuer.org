"use client";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  20 · PIXEL DA META - o bloco que o export estático não tinha         ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * A página em WordPress (`doe.caioprotetor.org`) carrega o `fbevents.js` e
 * dispara PageView, ViewContent e InitiateCheckout. Esta página não carregava
 * **nada** - `fbq` não existia aqui -, então o tráfego de anúncio que chega
 * pelo navegador do Instagram e do Facebook não gerava evento nenhum no
 * navegador. Este componente é a porta desse bloco para cá.
 *
 * ── O ID do pixel não mora no código ──────────────────────────────────────
 * Ele vem do funil, no Nest (`payments.webPixelsUrl`), que é o mesmo endereço
 * que o WordPress consulta e onde a regra por `utm_campaign` é aplicada. Trocar
 * de pixel é mexer no funil - nada aqui precisa ser publicado de novo.
 *
 * ── PII não vai para o pixel ──────────────────────────────────────────────
 * O `detail` do InitiateCheckout carrega nome, telefone e e-mail porque o Nest
 * precisa deles. O pixel do navegador **não** recebe nenhum dos três: eles são
 * retirados antes (ver `SEM_PII`), como o WordPress também faz. Quem manda
 * dado pessoal para a Meta é o CAPI, do lado do servidor, onde ele vai com
 * hash.
 *
 * ── Uma diferença de propósito em relação ao WordPress ────────────────────
 * Lá o `event_id` viaja **dentro** do payload, e isso não deduplica nada: a
 * Meta casa navegador e CAPI pelo `eventID` do quarto argumento do `fbq`. Aqui
 * ele vai no lugar certo, com o mesmo valor que `sendInitiateCheckoutToNest`
 * manda para o Nest - é o que impede a mesma doação de ser contada duas vezes.
 */

import { useEffect } from "react";
import { payments } from "@/lib/payments/lusa";

type Fbq = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  push?: unknown;
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/** Campos que ficam no `detail` e **não** vão para a Meta pelo navegador. */
const SEM_PII = new Set([
  "donor_name",
  "donor_phone",
  "donor_email",
  "first_name",
  "last_name",
  "name",
  "phone",
  "email",
  "event_name",
  "user_agent",
]);

/** O carregador oficial do `fbevents.js`, no formato que a Meta publica. */
function carregarFbevents() {
  if (window.fbq) return;

  const fbq: Fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue?.push(args);
  } as Fbq;

  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];

  window.fbq = fbq;
  if (!window._fbq) window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
}

function getCookie(name: string) {
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name + "=([^;]+)"),
  );
  return match ? decodeURIComponent(match[1]) : "";
}

function getUrlParam(name: string) {
  try {
    return new URL(window.location.href).searchParams.get(name) ?? "";
  } catch {
    return "";
  }
}

/** Os mesmos campos de base que o WordPress soma a todo evento. */
function baseParams() {
  const fbclid = getUrlParam("fbclid");
  return {
    fbclid: fbclid || null,
    fbc:
      getCookie("_fbc") ||
      (fbclid ? `fb.1.${Math.floor(Date.now() / 1000)}.${fbclid}` : null),
    fbp: getCookie("_fbp") || null,
    page_url: window.location.href,
    event_time: Math.floor(Date.now() / 1000),
  };
}

/* #ui:pixel - o bloco não desenha nada (retorna `null`), então a âncora fica
   aqui em cima, e não no JSX. */
export default function Pixel() {
  useEffect(() => {
    let vivo = true;
    /* Cada evento espera os `init` terminarem: `fbq('track')` antes do
       `fbq('init')` é engolido sem erro e sem evento. */
    let pronto: Promise<string[]>;

    carregarFbevents();

    const url = `${payments.webPixelsUrl}?utm_campaign=${encodeURIComponent(
      getUrlParam("utm_campaign"),
    )}`;

    pronto = fetch(url, { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { pixels?: unknown } | null) => {
        const pixels = Array.isArray(data?.pixels)
          ? (data.pixels as unknown[]).map(String)
          : [];
        if (!pixels.length) {
          console.warn("[pixel] nenhum pixel devolvido para o funil");
        }
        pixels.forEach((id) => window.fbq?.("init", id));
        return pixels;
      })
      .catch((err) => {
        console.warn("[pixel] falha ao buscar os pixels do funil", err);
        return [];
      });

    const track = (
      evento: string,
      payload: Record<string, unknown>,
      eventID?: string,
    ) => {
      void pronto.then((pixels) => {
        if (!vivo || !pixels.length) return;
        /* O 4º argumento é o que deduplica com o CAPI - ver o topo. */
        if (eventID) window.fbq?.("track", evento, payload, { eventID });
        else window.fbq?.("track", evento, payload);
      });
    };

    track("PageView", {
      content_name: "envio_pixel",
      content_category: "page_load",
      ...baseParams(),
    });

    /* ViewContent aos 30% da página, como no WordPress: é o sinal de que a
       pessoa leu alguma coisa, e não só abriu e saiu. */
    let viewContentEnviado = false;
    const conferirViewContent = () => {
      if (viewContentEnviado) return;
      const el = document.documentElement;
      const alcance = el.scrollHeight - window.innerHeight;
      if (alcance <= 0) return;
      if (window.scrollY / alcance < 0.3) return;

      viewContentEnviado = true;
      track("ViewContent", {
        content_name: "envio_pixel_view",
        content_category: "pix",
        ...baseParams(),
      });
    };

    /* InitiateCheckout: o mesmo `CustomEvent` que alimenta o Nest. Um por
       `event_id` - uma segunda tentativa de doação gera outro, e essa conta
       mesmo, mas o mesmo evento nunca vai duas vezes. */
    const enviados = new Set<string>();
    const onCheckout = (e: Event) => {
      const detail = (e as CustomEvent<Record<string, unknown>>).detail ?? {};
      const eventId = String(detail.event_id ?? "");
      if (eventId && enviados.has(eventId)) return;
      if (eventId) enviados.add(eventId);

      const limpo: Record<string, unknown> = {};
      for (const [chave, valor] of Object.entries(detail)) {
        if (!SEM_PII.has(chave)) limpo[chave] = valor;
      }

      const cents = Number(detail.amount_cents ?? 0);

      track(
        "InitiateCheckout",
        {
          content_name: "envio_pixel",
          content_category: "pix",
          content_type: "donation",
          num_items: 1,
          contents: [{ id: "pix_donation", quantity: 1 }],
          currency: "BRL",
          /* `value` em reais: é o campo que a Meta usa para otimizar campanha
             por valor, e ela espera a moeda, não centavos. */
          value: Number((cents / 100).toFixed(2)),
          ...limpo,
          ...baseParams(),
        },
        eventId || undefined,
      );
    };

    window.addEventListener("scroll", conferirViewContent, { passive: true });
    const t = window.setTimeout(conferirViewContent, 200);
    document.addEventListener("codex:fake-donate-click", onCheckout);

    return () => {
      vivo = false;
      window.clearTimeout(t);
      window.removeEventListener("scroll", conferirViewContent);
      document.removeEventListener("codex:fake-donate-click", onCheckout);
    };
  }, []);

  return null;
}
