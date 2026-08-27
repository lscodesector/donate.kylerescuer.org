"use client";

import { useEffect, useState } from "react";
import { org } from "@/lib/config";
import { payments } from "@/lib/payments/lusa";

/**
 * WhatsApp, Instagram, Facebook e e-mail da campanha, buscados do painel (Nest)
 * em vez de fixos no bundle - trocar o número/perfil/e-mail não pode depender de
 * um novo build/deploy do site.
 *
 * Busca `GET /api/ic/cp-caio-protetor` (mesma rota pública que o
 * `IcHealth`/`initiateCheckout` já usa - ver `payments.recurring.icUrl`) e lê
 * `funnel.phone`, `funnel.instagramUrl`, `funnel.facebookUrl` e `funnel.email`.
 * Cache em módulo: a primeira seção que montar dispara a busca (uma vez só, pros
 * quatro dados), as demais reaproveitam o resultado (ou a mesma promise, se
 * ainda estiver em voo).
 *
 * Enquanto a busca não volta, ou se ela falhar (rede, painel fora do ar, ou a
 * ponte via Laravel/túnel SSH indisponível), usa `org.whatsapp` /
 * `org.instagramHref` / `org.facebookHref` / `org.email` como valor - nunca um
 * link quebrado.
 */

type ShelterFunnelData = {
  phone: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  email: string | null;
};

let cachedFunnel: ShelterFunnelData | null = null;
let inFlight: Promise<ShelterFunnelData> | null = null;

function fetchShelterFunnel(): Promise<ShelterFunnelData> {
  if (cachedFunnel) return Promise.resolve(cachedFunnel);
  if (!inFlight) {
    inFlight = fetch(payments.recurring.icUrl, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          data: {
            funnel?: {
              phone?: string | null;
              instagramUrl?: string | null;
              facebookUrl?: string | null;
              email?: string | null;
            };
          } | null,
        ) => {
          const phone = data?.funnel?.phone?.trim() || null;
          const instagramUrl = data?.funnel?.instagramUrl?.trim() || null;
          const facebookUrl = data?.funnel?.facebookUrl?.trim() || null;
          const email = data?.funnel?.email?.trim() || null;
          cachedFunnel = { phone, instagramUrl, facebookUrl, email };
          return cachedFunnel;
        },
      )
      .catch(() => ({
        phone: null,
        instagramUrl: null,
        facebookUrl: null,
        email: null,
      }))
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

export function useShelterPhone(): string {
  const [phone, setPhone] = useState(cachedFunnel?.phone ?? org.whatsapp);

  useEffect(() => {
    let active = true;
    fetchShelterFunnel().then((fetched) => {
      if (active && fetched.phone) setPhone(fetched.phone);
    });
    return () => {
      active = false;
    };
  }, []);

  return phone;
}

export function useShelterInstagram(): string {
  const [href, setHref] = useState(
    cachedFunnel?.instagramUrl ?? org.instagramHref,
  );

  useEffect(() => {
    let active = true;
    fetchShelterFunnel().then((fetched) => {
      if (active && fetched.instagramUrl) setHref(fetched.instagramUrl);
    });
    return () => {
      active = false;
    };
  }, []);

  return href;
}

export function useShelterFacebook(): string {
  const [href, setHref] = useState(
    cachedFunnel?.facebookUrl ?? org.facebookHref,
  );

  useEffect(() => {
    let active = true;
    fetchShelterFunnel().then((fetched) => {
      if (active && fetched.facebookUrl) setHref(fetched.facebookUrl);
    });
    return () => {
      active = false;
    };
  }, []);

  return href;
}

export function useShelterEmail(): string {
  const [email, setEmail] = useState(cachedFunnel?.email ?? org.email);

  useEffect(() => {
    let active = true;
    fetchShelterFunnel().then((fetched) => {
      if (active && fetched.email) setEmail(fetched.email);
    });
    return () => {
      active = false;
    };
  }, []);

  return email;
}
