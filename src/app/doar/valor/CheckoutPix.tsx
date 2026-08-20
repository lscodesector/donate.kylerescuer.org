"use client";

import NextImage, { type ImageProps } from "next/image";
import Link from "next/link";
import { useEffect, useState, type SVGProps } from "react";
import { withBasePath } from "@/lib/base-path";
import { org, pix } from "@/lib/config";

/* O checkout Pix da rota `/doar/valor` - o caminho de quem está **sem
   JavaScript** no modal. Mora junto da rota, e não numa pasta compartilhada:
   ele não é um bloco da landing e ninguém mais o usa. Os ícones e o envelope
   de imagem vão aqui dentro, pela mesma regra dos blocos. */

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

const IconArrowLeft = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </svg>
);

const IconBowl = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2.5 12.5h19" />
    <path d="M3.2 12.5a8.8 8.8 0 0 0 17.6 0" />
    <path d="M12 12.5V7" />
    <path d="M9 8.2c0-1.4.9-2.6 2-2.9" />
    <path d="M15 8.2c0-1.4-.9-2.6-2-2.9" />
  </svg>
);

const IconCheck = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m5 13 4 4L19 7" />
  </svg>
);

const IconCopy = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

/**
 * A marca do Pix como ela é distribuída - os quatro braços do losango, em
 * traçado cheio, transcrita do SVG oficial (SVG Repo) para componente: inline
 * ela herda a cor do texto (`currentColor`) e não custa uma requisição.
 *
 * O `.svg` de origem morava em `public/` e saiu de lá: servido, ele era um
 * arquivo publicado que nenhuma tela pedia - os dois `path` abaixo são o
 * arquivo inteiro, caractere por caractere.
 *
 * ⚠️ **É a única marca do Pix da página.** Havia um segundo desenho aqui, o
 * `IconPix` - um losango simplificado, redesenhado à mão, que as listas e os
 * selos usavam enquanto o checkout usava este. Dois desenhos diferentes para a
 * mesma marca, na mesma página, e o antigo não era o arquivo oficial. Ele saiu;
 * todo lugar que mostra o Pix aponta para cá.
 */
const IconPixMark = ({ size = 20, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
    focusable={false}
    {...rest}
  >
    <path d="M11.917 11.71a2.046 2.046 0 0 1-1.454-.602l-2.1-2.1a.4.4 0 0 0-.551 0l-2.108 2.108a2.044 2.044 0 0 1-1.454.602h-.414l2.66 2.66c.83.83 2.177.83 3.007 0l2.667-2.668h-.253zM4.25 4.282c.55 0 1.066.214 1.454.602l2.108 2.108a.39.39 0 0 0 .552 0l2.1-2.1a2.044 2.044 0 0 1 1.453-.602h.253L9.503 1.623a2.127 2.127 0 0 0-3.007 0l-2.66 2.66h.414z" />
    <path d="m14.377 6.496-1.612-1.612a.307.307 0 0 1-.114.023h-.733c-.379 0-.75.154-1.017.422l-2.1 2.1a1.005 1.005 0 0 1-1.425 0L5.268 5.32a1.448 1.448 0 0 0-1.018-.422h-.9a.306.306 0 0 1-.109-.021L1.623 6.496c-.83.83-.83 2.177 0 3.008l1.618 1.618a.305.305 0 0 1 .108-.022h.901c.38 0 .75-.153 1.018-.421L7.375 8.57a1.034 1.034 0 0 1 1.426 0l2.1 2.1c.267.268.638.421 1.017.421h.733c.04 0 .079.01.114.024l1.612-1.612c.83-.83.83-2.178 0-3.008z" />
  </svg>
);

const IconShield = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

/**
 * `next/image` com o `basePath` do build prefixado no `src`.
 *
 * ⚠️ Com `images.unoptimized: true` (obrigatório num export estático - ver
 * `next.config.ts`), o `next/image` passa o `src` adiante sem tocar nele. É
 * comportamento documentado: o prefixo de `basePath` só acontece na URL do
 * otimizador (`/_next/image?url=…`), e sem otimizador não há essa URL para
 * prefixar. Sem este envelope, publicado em `doe.caioprotetor.org/v2`, toda
 * imagem apontaria para a raiz do domínio - que é outro site (WordPress) - e
 * simplesmente não carregaria.
 *
 * Só cobre `src` em string, que é o único formato usado aqui.
 */
function Image({ src, ...props }: ImageProps) {
  const prefixado = typeof src === "string" ? withBasePath(src) : src;
  return <NextImage src={prefixado} {...props} />;
}

/** Quanto tempo a tela de "gerando" fica no ar antes do QR aparecer. */
const DELAY_GERACAO = 1600;

type Props = {
  /**
   * Resumo do que está sendo doado. `tier` vem preenchido quando a doação é uma
   * faixa de ração; no valor livre ele é `null` e o cabeçalho encolhe para
   * título + preço, sem inventar kg nem número de animais.
   */
  tier: {
    kg: number;
    price: string;
    animals: number;
    days: number;
    image: { src: string; alt: string } | null;
  } | null;
  /** Usados quando não há `tier`: valor livre e doação mensal. */
  titulo?: string;
  price?: string;
  descricao?: string;
  copiaECola: string;
  qrSvg: string;
};

/**
 * Checkout do Pix **em página** - o caminho de quem está sem JavaScript.
 *
 * Com JavaScript ligado, nenhum CTA chega aqui: o clique é interceptado e o
 * checkout abre em modal por cima da landing (ver
 * `components/checkout/CheckoutModal.tsx`). Esta página continua sendo o
 * destino do `href` dos mesmos botões, então ela é o que resta quando o script
 * não carrega - e por isso não pode ser apagada.
 *
 * O QR e o copia-e-cola são REAIS: vêm da chave da organização e podem ser
 * pagos de verdade. O que é encenado é só o tempo de "gerando o código" - o
 * payload já veio pronto do servidor, e a espera existe para a tela ter o
 * ritmo de um checkout de gateway.
 *
 * ⚠️ O QUE ESTA PÁGINA NÃO FAZ: confirmar pagamento. Não há PSP nem webhook,
 * então ela termina aguardando, sem tela de obrigado. O botão "Já fiz o
 * pagamento" que existia aqui foi removido: era declaração de quem doou, não
 * verificação. Para valer como confirmação de verdade é preciso um provedor
 * (Mercado Pago, Asaas, PushinPay…) e um webhook que marque a doação como paga
 * antes de liberar o sucesso.
 */
export function CheckoutPix({
  tier,
  titulo,
  price: precoLivre,
  descricao,
  copiaECola,
  qrSvg,
}: Props) {
  const price = tier ? tier.price : (precoLivre ?? "");
  const [gerando, setGerando] = useState(true);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setGerando(false), DELAY_GERACAO);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!copiado) return;
    const id = setTimeout(() => setCopiado(false), 2500);
    return () => clearTimeout(id);
  }, [copiado]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(copiaECola);
      setCopiado(true);
    } catch {
      // Sem permissão de área de transferência: seleciona o código para a
      // pessoa copiar na mão, em vez de não fazer nada.
      const node = document.getElementById("pix-copia-cola");
      if (node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }

  return (
    <main className="surface-alt min-h-svh py-6 md:py-10">
      <div className="container-narrow max-w-[620px]">
        <div className="flex flex-col gap-5 rounded-md border border-ink-900/10 bg-surface p-4 shadow sm:p-6">
          <Link
            href="/#doar"
            className="inline-flex min-h-[44px] w-fit items-center gap-2 text-fs14 font-extrabold text-ink-900 transition-colors hover:text-action"
          >
            <IconArrowLeft size={18} />
            Voltar
          </Link>

          {/* Resumo do que está sendo doado. */}
          <div className="flex items-center gap-4">
            {/* Fundo branco e `object-contain`, como nos cartões: a foto é uma
                embalagem recortada, e `cover` cortaria o saco. */}
            {tier && (
              <div className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-sm border border-ink-900/10 bg-white sm:h-[110px] sm:w-[110px]">
                {tier.image ? (
                  <Image
                    src={tier.image.src}
                    alt={tier.image.alt}
                    fill
                    sizes="110px"
                    className="object-contain p-1"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 border-2 border-dashed border-ink-900/15 text-ink-300">
                    <IconBowl size={22} />
                    <span className="text-fs10 font-semibold">{tier.kg}kg</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex min-w-0 flex-col gap-0.5">
              <h1 className="text-fs15 font-extrabold uppercase tracking-[0.04em] text-ink-900">
                {tier ? `${tier.kg}kg de ração` : titulo}
              </h1>
              <p className="text-[clamp(1.279rem,1.116rem+0.744vw,1.628rem)] font-extrabold leading-tight text-donate">
                {price}
              </p>
              <p className="text-fs13 leading-[1.45] text-ink-600">
                {tier
                  ? `Alimenta aproximadamente ${tier.animals} animais por cerca de ${tier.days} dias.`
                  : descricao}
              </p>
            </div>
          </div>

          <div className="border-t border-ink-900/10 pt-5">
            {gerando ? (
              <div
                className="flex flex-col items-center gap-3 py-10 text-center"
                role="status"
                aria-live="polite"
              >
                <span className="h-[54px] w-[54px] animate-spin rounded-full border-4 border-ink-900/10 border-t-donate" />
                <h2 className="text-[clamp(1.046rem,0.93rem+0.558vw,1.395rem)] font-extrabold text-ink-900">
                  Gerando seu QR Code Pix
                </h2>
                <p className="text-fs13 text-ink-600">
                  Preparando o pagamento da sua doação…
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 anim-fade-up">
                <div className="flex flex-col items-center gap-1 text-center">
                  <p className="inline-flex items-center gap-2 text-fs12 font-extrabold uppercase tracking-[0.1em] text-donate">
                    <IconPixMark size={16} />
                    Pague com Pix
                  </p>
                  <h2 className="text-[clamp(1.046rem,0.93rem+0.558vw,1.279rem)] font-extrabold text-ink-900">
                    Escaneie o QR Code para doar {price}
                  </h2>
                </div>

                {/* QR gerado no servidor: SVG, sem JavaScript no cliente. */}
                <div
                  aria-label="QR Code Pix da sua doação"
                  role="img"
                  className="mx-auto h-[190px] w-[190px] rounded-sm bg-white p-2 shadow sm:h-[210px] sm:w-[210px] [&>svg]:h-full [&>svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />

                <div className="flex flex-col gap-2">
                  <span className="text-fs12 font-extrabold uppercase tracking-[0.06em] text-ink-600">
                    Ou use o Pix copia e cola
                  </span>
                  <p
                    id="pix-copia-cola"
                    className="max-h-[72px] overflow-y-auto break-all rounded-sm border border-ink-900/10 bg-surface-alt p-3 text-fs11 leading-[1.5] text-ink-600"
                  >
                    {copiaECola}
                  </p>

                  <button
                    type="button"
                    onClick={copiar}
                    className={`inline-flex min-h-[52px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 text-fs15 font-extrabold uppercase tracking-[0.03em] transition-colors ${
                      copiado
                        ? "bg-ink-900 text-white"
                        : "bg-donate text-donate-ink hover:bg-donate-hover"
                    }`}
                  >
                    {copiado ? <IconCheck size={18} /> : <IconCopy size={18} />}
                    {copiado ? "Código copiado!" : "Copiar código Pix"}
                  </button>
                </div>

                <div className="flex flex-col gap-1 rounded-sm bg-surface-alt p-3 text-fs13 leading-[1.5] text-ink-600">
                  <span className="font-extrabold text-ink-900">Recebedor</span>
                  <span>
                    {pix.receiver} · CNPJ {org.cnpj}
                  </span>
                </div>

                {/*
                  ── O botão "Já fiz o pagamento" foi removido ──────────────
                  Ele levava direto para `/obrigado`, e era uma declaração de
                  quem doou, não uma confirmação: sem provedor de pagamento a
                  página não tem como saber se o Pix caiu. Qualquer pessoa
                  chegava à tela de "obrigado" sem pagar nada - inclusive quem
                  fechou o app do banco no meio.

                  A tela de sucesso só pode aparecer quando o backend disser
                  que aquele Pix foi pago. Enquanto não houver PSP com webhook,
                  o fluxo termina aqui, aguardando. Ver o bloco de pendência em
                  `components/checkout/CheckoutModal.tsx`.
                */}
                <p
                  aria-live="polite"
                  className="flex items-center justify-center gap-2 text-center text-fs13 font-semibold text-ink-600"
                >
                  <span className="relative flex h-[8px] w-[8px] shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-donate opacity-60" />
                    <span className="relative inline-flex h-[8px] w-[8px] rounded-full bg-donate" />
                  </span>
                  Aguardando a confirmação do seu pagamento…
                </p>
              </div>
            )}
          </div>

          <p className="flex items-center justify-center gap-1.5 border-t border-ink-900/10 pt-4 text-center text-fs12 font-semibold text-ink-600">
            <IconShield size={14} className="shrink-0 text-donate" />
            Pagamento direto para a conta da organização · CNPJ verificável
          </p>
        </div>
      </div>
    </main>
  );
}
