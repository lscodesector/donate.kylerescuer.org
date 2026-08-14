"use client";

import { Img as Image } from "@/components/ui/Img";
import Link from "next/link";
import { useEffect, useState } from "react";
import { org, pix } from "@/content/landing";
import {
  IconArrowLeft,
  IconBowl,
  IconCheck,
  IconCopy,
  IconPixMark,
  IconShield,
} from "@/components/ui/Icons";

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
            className="inline-flex min-h-[44px] w-fit items-center gap-2 text-[14px] font-extrabold text-ink-900 transition-colors hover:text-action"
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
                    <span className="text-[10px] font-semibold">{tier.kg}kg</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex min-w-0 flex-col gap-0.5">
              <h1 className="text-[15px] font-extrabold uppercase tracking-[0.04em] text-ink-900">
                {tier ? `${tier.kg}kg de ração` : titulo}
              </h1>
              <p className="text-[clamp(1.375rem,1.2rem+0.8vw,1.75rem)] font-extrabold leading-tight text-donate">
                {price}
              </p>
              <p className="text-[13px] leading-[1.45] text-ink-600">
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
                <h2 className="text-[clamp(1.125rem,1rem+0.6vw,1.5rem)] font-extrabold text-ink-900">
                  Gerando seu QR Code Pix
                </h2>
                <p className="text-[13px] text-ink-600">
                  Preparando o pagamento da sua doação…
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 anim-fade-up">
                <div className="flex flex-col items-center gap-1 text-center">
                  <p className="inline-flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.1em] text-donate">
                    <IconPixMark size={16} />
                    Pague com Pix
                  </p>
                  <h2 className="text-[clamp(1.125rem,1rem+0.6vw,1.375rem)] font-extrabold text-ink-900">
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
                  <span className="text-[12px] font-extrabold uppercase tracking-[0.06em] text-ink-600">
                    Ou use o Pix copia e cola
                  </span>
                  <p
                    id="pix-copia-cola"
                    className="max-h-[72px] overflow-y-auto break-all rounded-sm border border-ink-900/10 bg-surface-alt p-3 text-[11px] leading-[1.5] text-ink-600"
                  >
                    {copiaECola}
                  </p>

                  <button
                    type="button"
                    onClick={copiar}
                    className={`inline-flex min-h-[52px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 text-[15px] font-extrabold uppercase tracking-[0.03em] transition-colors ${
                      copiado
                        ? "bg-ink-900 text-white"
                        : "bg-donate text-donate-ink hover:bg-donate-hover"
                    }`}
                  >
                    {copiado ? <IconCheck size={18} /> : <IconCopy size={18} />}
                    {copiado ? "Código copiado!" : "Copiar código Pix"}
                  </button>
                </div>

                <div className="flex flex-col gap-1 rounded-sm bg-surface-alt p-3 text-[13px] leading-[1.5] text-ink-600">
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
                  className="flex items-center justify-center gap-2 text-center text-[13px] font-semibold text-ink-600"
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

          <p className="flex items-center justify-center gap-1.5 border-t border-ink-900/10 pt-4 text-center text-[12px] font-semibold text-ink-600">
            <IconShield size={14} className="shrink-0 text-donate" />
            Pagamento direto para a conta da organização · CNPJ verificável
          </p>
        </div>
      </div>
    </main>
  );
}
