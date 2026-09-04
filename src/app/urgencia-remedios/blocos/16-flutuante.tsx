"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type SVGProps,
} from "react";
import {
  getCampaignServerSnapshot,
  getCampaignSnapshot,
  subscribeCampaign,
} from "../campanha";
import { formatUSDInteiro } from "@/lib/format";
import { useShelterEmail } from "@/lib/hooks/use-shelter-phone";
import { openDonationModal } from "@/lib/modais";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  16 · FLUTUANTE - a barra fixa de doação                              ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Bloco isolado: a barra e o ícone moram aqui. Os números da meta vêm da
 * mesma fonte que o `CampaignProgress` do hero (bloco 02, `lib/campaign.ts`)
 * - mesmo valor nos dois, sem duplicar a conta.
 */

/* ─────────────────────────────────────────────────────────── ícones ──── */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
    ...rest,
  };
}

const IconHeart = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8Z" />
  </svg>
);

/** O glifo do WhatsApp - `fill`, não `stroke`, então ignora o `base()`. */
const IconMail = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="2.8" y="5" width="18.4" height="14" rx="2" />
    <path d="m3.4 6.6 8.6 6 8.6-6" />
  </svg>
);

/* ──────────────────────────────────────────────────────────── o bloco ──── */

/**
 * A barra de doação colada na base da janela: os números da meta à esquerda,
 * botão à direita.
 *
 * ── O que ela substitui ────────────────────────────────────────────────────
 * O botão redondo flutuante (`FloatingDonate`). Ele existia porque o site
 * institucional não tinha nada de campanha para mostrar - "nossa missão" não
 * tem número. Esta campanha tem: a meta em R$, a porcentagem e os apoiadores
 * já aparecem na dobra (`CampaignProgress`, dentro do `Hero`), e repeti-los
 * aqui, sempre visíveis, é o que lembra quem está rolando a página de que a
 * doação continua valendo - o próprio botão redondo não dizia isso.
 *
 * ── Quando aparece ──────────────────────────────────────────────────────────
 * Depois da primeira dobra, como o botão que ela substitui: na dobra a barra
 * de meta e o CTA já estão grandes na tela, e repeti-los por cima deles seria
 * o mesmo pedido duas vezes na mesma tela.
 *
 * ── O layout ────────────────────────────────────────────────────────────
 * Valor à esquerda, meta à direita, a barra de progresso preenchendo a
 * largura entre os dois; embaixo, "X% da meta" na mesma ponta esquerda e
 * "● N apoiadores" na direita - as duas linhas alinhadas verticalmente com
 * o par de cima. O botão fica fora dessa coluna, ao lado.
 */
export default function Flutuante() {
  const [visible, setVisible] = useState(false);
  const email = useShelterEmail();
  const state = useSyncExternalStore(
    subscribeCampaign,
    getCampaignSnapshot,
    getCampaignServerSnapshot,
  );

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    /* `env(safe-area-inset-bottom)`: no iPhone a faixa do gesto de voltar
       come os últimos ~34px da janela - sem o respiro, o botão fica embaixo
       dela. `z-40`: abaixo dos modais (55, 60, 70) e do menu (50), acima do
       resto da página. */
    <div
      className="fixed inset-x-0 bottom-0 z-40 anim-fade-up border-t border-ink-900/10 bg-surface/98 shadow-[0_-8px_24px_-8px_rgba(0,0,0,.12)] backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* #ui:flutuante */}
      <div className="container-narrow flex items-center justify-center gap-3 py-2.5 sm:gap-5 sm:py-3">
        <div className="flex w-full min-w-0 max-w-[520px] flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2 text-fs13 sm:text-fs14">
            <span className="font-extrabold text-ink-900 tabular-nums">
              {state ? formatUSDInteiro(state.raised) : "—"}
            </span>
            <span className="whitespace-nowrap text-ink-600 tabular-nums">
              of {state ? formatUSDInteiro(state.goal) : "—"}
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={state?.percent ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Campaign goal progress"
            className="h-[6px] w-full overflow-hidden rounded-full bg-ink-900/10"
          >
            <div
              className="h-full w-full origin-left rounded-full bg-donate transition-transform duration-700 ease-out"
              style={{ transform: `scaleX(${(state?.percent ?? 0) / 100})` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-fs11 font-semibold">
            <span className="text-donate-text">{state ? `${state.percent}% of the goal` : " "}</span>
            <span className="inline-flex items-center gap-1 text-ink-600">
              <span aria-hidden="true" className="h-[5px] w-[5px] shrink-0 rounded-full bg-donate" />
              {state ? `${state.supporters} supporters` : " "}
            </span>
          </div>
        </div>

        {/* Wrapper `relative` só para ancorar o "Fale Conosco": ele é
            `absolute` em relação a este botão, encostado na borda direita e
            subido para fora da barra (`bottom-full` + `mb-2` de respiro). Assim
            ele acompanha a posição exata do "Doar agora" em qualquer largura, e
            some junto com a barra (que retorna `null` antes da 1ª dobra). */}
        <div className="relative shrink-0">
          <a
            href={`mailto:${email}`}
            aria-label="Email us"
            className="group absolute bottom-full right-0 mb-2 flex items-center gap-2 whitespace-nowrap"
          >
            <span className="rounded-full border border-ink-900/10 bg-surface px-3 py-1.5 text-fs12 font-bold text-ink-900 shadow-[0_4px_14px_rgba(0,0,0,0.12)]">
              Talk to us
            </span>
            <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-donate text-donate-ink shadow-[0_6px_18px_-2px_rgba(27,138,75,0.45)] transition-transform duration-200 group-hover:scale-105">
              <IconMail size={24} />
            </span>
          </a>

          <button
            type="button"
            onClick={() => openDonationModal()}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-full bg-donate px-4 text-fs13 font-extrabold uppercase tracking-[0.02em] text-donate-ink shadow-[0_8px_20px_-8px_rgba(27,138,75,.6)] transition-colors hover:bg-donate-hover sm:min-h-[48px] sm:px-6 sm:text-fs14"
          >
            <IconHeart size={17} fill="currentColor" stroke="none" />
            Doar agora
          </button>
        </div>
      </div>
    </div>
  );
}
