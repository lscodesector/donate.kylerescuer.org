import type { Metadata } from "next";
import NextImage, { type ImageProps } from "next/image";
import Link from "next/link";
import type { SVGProps } from "react";
import Checkout from "@/components/overlays/18-checkout";
import ModalDoacao from "@/components/overlays/17-modal-doacao";
import { withBasePath } from "@/lib/base-path";
import { MonthlyButton } from "./MonthlyButton";

/* Esta página não é um bloco da landing, mas segue a mesma regra: os ícones e
   o envelope de imagem moram aqui dentro, e de fora vêm só os dados da
   campanha (`lib/config`). */

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

const IconArrowRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
    <path d="m13 5 7 7-7 7" />
  </svg>
);

const IconCheck = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m5 13 4 4L19 7" />
  </svg>
);

const IconHeart = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8Z" />
  </svg>
);

const IconHeartFilled = ({ size = 20, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
    aria-hidden="true"
    focusable={false}
    {...rest}
  >
    <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8Z" />
  </svg>
);

/** A patinha branca do botão mensal - mesmo desenho de `IconPaw` em `01-menu.tsx`/`02-hero.tsx`. */
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

/**
 * `next/image` com o `basePath` do build prefixado no `src`.
 *
 * ⚠️ Com `images.unoptimized: true` (obrigatório num export estático - ver
 * `next.config.ts`), o `next/image` passa o `src` adiante sem tocar nele. É
 * comportamento documentado: o prefixo de `basePath` só acontece na URL do
 * otimizador (`/_next/image?url=…`), e sem otimizador não há essa URL para
 * prefixar. Sem este envelope, publicado em `donate.kylerescuer.org/v2`, toda
 * imagem apontaria para a raiz do domínio - que é outro site (WordPress) - e
 * simplesmente não carregaria.
 *
 * Só cobre `src` em string, que é o único formato usado aqui.
 */
function Image({ src, ...props }: ImageProps) {
  const prefixado = typeof src === "string" ? withBasePath(src) : src;
  return <NextImage src={prefixado} {...props} />;
}

export const metadata: Metadata = {
  title: "Thank you for your donation | Kyle Rescuer",
  robots: { index: false, follow: false },
};

/**
 * Tela de agradecimento.
 *
 * ── Quem chega aqui já pagou ──────────────────────────────────────────────
 * Esta página deixou de ser alcançável por clique. O checkout só manda para cá
 * depois de o gateway responder `paid: true` - pelo polling ou pela checagem na
 * planilha ao voltar do app do banco (ver `components/checkout/CheckoutModal`).
 * Por isso o texto afirma o pagamento em vez de condicioná-lo: dizer "assim que
 * for confirmado" para quem já teve a confirmação plantava a dúvida de que algo
 * ainda faltava.
 *
 * O pedido de doação mensal vem aqui, e não antes, porque é o único momento em
 * que a pessoa já provou que confia - quem acabou de doar é muito mais
 * receptivo a virar recorrente do que quem ainda está decidindo.
 *
 * O botão abre o mesmo modal de doação do resto do site, travado na mensal
 * (`MonthlyButton`, cliente isolado - ver o comentário lá) - por isso esta
 * página também monta `ModalDoacao` e `Checkout`, que na home vivem só em
 * `app/page.tsx`.
 */
export default function ObrigadoPage() {
  return (
    <main className="surface-alt flex min-h-svh items-center py-8">
      <div className="container-narrow flex max-w-[480px] flex-col">
        <div className="flex flex-col items-center gap-4 rounded-md border border-ink-900/10 bg-surface p-6 text-center shadow sm:p-7">
          <span className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-donate text-donate-ink">
            <IconCheck size={28} />
          </span>

          <div className="flex flex-col gap-1.5">
            {/* +30% sobre o tamanho original desta página (era
                `clamp(1.279rem,1.07rem+0.93vw,1.581rem)`) - pedido
                explícito, não faz parte da escala `text-fs*` do resto do
                site. */}
            <h1 className="text-[clamp(1.663rem,1.391rem+1.209vw,2.055rem)] font-extrabold leading-[1.15] text-ink-900">
              Your donation saved today. ❤️
            </h1>
            <p className="mx-auto max-w-[42ch] text-[clamp(1.015rem,0.984rem+0.109vw,1.097rem)] leading-[1.55] text-ink-600">
              But tomorrow they will need to eat again.
            </p>
          </div>

          {/* Divisor curto: separa o agradecimento (o que já aconteceu) do
              pedido de recorrência (o que vem a seguir), sem precisar de um
              segundo card. */}
          <hr className="w-full border-ink-900/10" />

          {/* O pedido da recorrência - o motivo desta tela existir. Mesmo
              card do agradecimento, não mais um bloco à parte: quem acabou de
              doar está com o cartão de confirmação na tela, e é aqui que ela
              está olhando. */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-[clamp(0.935rem,0.902rem+0.142vw,1.015rem)] leading-[1.5] text-ink-600">
              With a monthly donation, Kyle can secure food, medicine and
              care{" "}
              <strong className="font-extrabold text-ink-900">
                before they run out
              </strong>
              .
            </p>
            <p className="flex items-center gap-1.5 text-[clamp(0.935rem,0.902rem+0.142vw,1.015rem)] font-extrabold text-action">
              <IconHeartFilled size={15} />
              Help keep the bowls full every month.
            </p>
          </div>

          <MonthlyButton className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-action px-6 text-[clamp(1.057rem,1.017rem+0.177vw,1.158rem)] font-extrabold uppercase tracking-[0.03em] text-action-ink shadow-[0_10px_30px_-8px_rgba(191,5,33,.5)] transition-colors hover:bg-action-hover">
            <IconPaw size={18} />
            I want to help every month
          </MonthlyButton>

          <Link
            href="/#doar"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-[clamp(0.935rem,0.902rem+0.142vw,1.015rem)] font-extrabold text-ink-600 transition-colors hover:text-action"
          >
            <IconHeart size={14} />
            I would rather make another donation now
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[clamp(0.894rem,0.878rem+0.07vw,0.935rem)] text-ink-600 transition-colors hover:text-action"
          >
            Back to the campaign
            <IconArrowRight size={13} />
          </Link>
        </div>
      </div>

      <ModalDoacao />
      <Checkout />
    </main>
  );
}
