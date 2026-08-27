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
} from "@/lib/campaign";
import { org, whatsappWith } from "@/lib/config";
import { formatBRLInteiro } from "@/lib/format";
import { useShelterPhone } from "@/lib/hooks/use-shelter-phone";
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
const IconWhatsApp = ({ size = 24, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable={false}
    {...rest}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/**
 * A patinha branca do pedido mensal - mesmo desenho de `IconPaw` em
 * `01-menu.tsx`, `02-hero.tsx` e `14-cta-final.tsx`. `fill="currentColor"`
 * herda o branco de `text-action-ink` sozinho, sem precisar de `className`.
 */
const IconPaw = ({ size = 20, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable={false}
    {...rest}
  >
    <ellipse cx="7" cy="8.2" rx="2.1" ry="2.7" />
    <ellipse cx="12" cy="6.4" rx="2.1" ry="2.8" />
    <ellipse cx="17" cy="8.2" rx="2.1" ry="2.7" />
    <ellipse cx="19.6" cy="13.2" rx="1.9" ry="2.3" />
    <ellipse cx="4.4" cy="13.2" rx="1.9" ry="2.3" />
    <path d="M12 12.2c2.8 0 5.2 2 5.2 4.4 0 2-1.6 3.2-3.4 3.2-.8 0-1.3-.3-1.8-.3s-1 .3-1.8.3c-1.8 0-3.4-1.2-3.4-3.2 0-2.4 2.4-4.4 5.2-4.4Z" />
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
export default function Flutuante({
  /**
   * A página é a de doação mensal (`/ajude-sempre`): o botão pede a
   * recorrência e abre a tela travada nela, sem a aba de doação única.
   *
   * A prop existe para o **rótulo** - o comportamento já viria do padrão da
   * página (`setDonationDefaults`, ver `lib/modais.ts`). Como esta barra é
   * montada pela própria `page.tsx`, o texto certo pode sair já no HTML
   * estático, sem esperar a hidratação para trocar de palavra.
   */
  mensal = false,
}: {
  mensal?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const phone = useShelterPhone();
  const whatsappHref = whatsappWith(org.whatsappMessage, phone);
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
              {state ? formatBRLInteiro(state.raised) : "—"}
            </span>
            <span className="whitespace-nowrap text-ink-600 tabular-nums">
              de {state ? formatBRLInteiro(state.goal) : "—"}
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={state?.percent ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresso da meta da campanha"
            className="h-[6px] w-full overflow-hidden rounded-full bg-ink-900/10"
          >
            <div
              className="h-full w-full origin-left rounded-full bg-donate transition-transform duration-700 ease-out"
              style={{ transform: `scaleX(${(state?.percent ?? 0) / 100})` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-fs11 font-semibold">
            <span className="text-donate-text">{state ? `${state.percent}% da meta` : " "}</span>
            <span className="inline-flex items-center gap-1 text-ink-600">
              <span aria-hidden="true" className="h-[5px] w-[5px] shrink-0 rounded-full bg-donate" />
              {state ? `${state.supporters} apoiadores` : " "}
            </span>
          </div>
        </div>

        {/*
          ⚠️ Na mensal o rótulo **não diz a frequência**, e esta barra é o
          único CTA da página que não tem texto em volta para dizê-la por ele:
          ela flutua sobre o bloco que a pessoa estiver lendo. O que sobra
          apontando para a recorrência é a pintura - vermelho de marca e
          patinha, o mesmo par do pedido mensal em todo o resto do site.

          `px-3 sm:px-5` na mensal, contra `px-4 sm:px-6`: o rótulo em
          maiúsculas não quebra linha (`whitespace-nowrap`), e "FAÇA A
          DIFERENÇA" é três caracteres mais largo que o "DOAR AGORA" da raiz -
          num aparelho de 320px o respiro lateral é o que decide se a coluna
          da meta, ao lado, ainda tem largura para o valor caber.
        */}
        {/* Wrapper `relative` só para ancorar o "Fale Conosco": ele é
            `absolute` em relação a este botão, encostado na borda direita e
            subido para fora da barra (`bottom-full` + `mb-2` de respiro). Assim
            ele acompanha a posição exata do CTA em qualquer largura, e some
            junto com a barra (que retorna `null` antes da 1ª dobra). */}
        <div className="relative shrink-0">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Falar no WhatsApp"
            className="group absolute bottom-full right-0 mb-2 flex items-center gap-2 whitespace-nowrap"
          >
            <span className="rounded-full border border-ink-900/10 bg-surface px-3 py-1.5 text-fs12 font-bold text-ink-900 shadow-[0_4px_14px_rgba(0,0,0,0.12)]">
              Fale Conosco
            </span>
            <span
              className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full text-white shadow-[0_6px_18px_-2px_rgba(37,211,102,0.45)] transition-transform duration-200 group-hover:scale-105"
              style={{ backgroundColor: "#25d366" }}
            >
              <IconWhatsApp size={24} />
            </span>
          </a>

          <button
            type="button"
            onClick={() =>
              openDonationModal(
                mensal ? { freq: "mensal", somenteMensal: true } : {},
              )
            }
            className={`inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-full text-fs13 font-extrabold uppercase tracking-[0.02em] shadow-[0_8px_20px_-8px_rgba(27,138,75,.6)] transition-colors sm:min-h-[48px] sm:text-fs14 ${
              mensal
                ? "bg-action px-3 text-action-ink shadow-[0_8px_20px_-8px_rgba(191,5,33,.6)] hover:bg-action-hover sm:px-5"
                : "bg-donate px-4 text-donate-ink hover:bg-donate-hover sm:px-6"
            }`}
          >
            {mensal ? (
              <IconPaw size={17} />
            ) : (
              <IconHeart size={17} fill="currentColor" stroke="none" />
            )}
            {mensal ? "Faça a diferença" : "Doar agora"}
          </button>
        </div>
      </div>
    </div>
  );
}
