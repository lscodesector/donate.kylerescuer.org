"use client";

import { useEffect, useState } from "react";
import { org } from "@/lib/config";
import { payments } from "@/lib/payments/lusa";

/**
 * O WhatsApp da campanha, buscado do painel (ic-wh) em vez de fixo no bundle
 * - trocar o número não pode depender de um novo build/deploy do site.
 *
 * Busca `GET /api/ic/cp-caio-protetor` (mesma rota pública que o
 * `IcHealth`/`initiateCheckout` já usa - ver `payments.recurring.icUrl`) e lê
 * `funnel.phone`. Cache em módulo: a primeira seção que montar dispara a
 * busca, as demais reaproveitam o resultado (ou a mesma promise, se ainda
 * estiver em voo) sem repetir a chamada.
 *
 * Enquanto a busca não volta, ou se ela falhar (rede, painel fora do ar),
 * usa `org.whatsapp` como valor - o número continua sendo o de hoje, nunca
 * um botão quebrado.
 */

let cachedPhone: string | null = null;
let inFlight: Promise<string | null> | null = null;

function fetchShelterPhone(): Promise<string | null> {
  if (cachedPhone) return Promise.resolve(cachedPhone);
  if (!inFlight) {
    inFlight = fetch(payments.recurring.icUrl, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { funnel?: { phone?: string | null } } | null) => {
        const phone = data?.funnel?.phone?.trim();
        if (phone) cachedPhone = phone;
        return cachedPhone;
      })
      .catch(() => null)
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

export function useShelterPhone(): string {
  const [phone, setPhone] = useState(cachedPhone ?? org.whatsapp);

  useEffect(() => {
    let active = true;
    fetchShelterPhone().then((fetched) => {
      if (active && fetched) setPhone(fetched);
    });
    return () => {
      active = false;
    };
  }, []);

  return phone;
}
