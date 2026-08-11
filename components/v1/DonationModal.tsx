"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { checkoutValorHref, donationAmounts, formatBRL } from "@/content/v1/landing";
import { IconArrowRight, IconClose, IconHeart, IconShield } from "./ui/Icons";

/**
 * Evento que abre o modal. É um evento de janela, e não um contexto React,
 * porque quem dispara está espalhado por seções que são Server Components
 * (hero, impacto, fechamento) - elas não podem receber um callback por prop
 * sem virar cliente inteiras. Quem abre só precisa de um botão.
 */
export const DONATION_MODAL_EVENT = "sos:abrir-doacao";

type Freq = "unica" | "mensal";

/** `freq` escolhe a aba já aberta - o CTA de mensal cai direto nela. */
export function openDonationModal(freq: Freq = "unica") {
  window.dispatchEvent(new CustomEvent<Freq>(DONATION_MODAL_EVENT, { detail: freq }));
}

/** Só dígitos, e no máximo o valor de uma doação plausível. */
function parseValorLivre(texto: string): number {
  const digits = texto.replace(/\D/g, "").slice(0, 7);
  return digits ? Number(digits) : 0;
}

export function DonationModal() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [freq, setFreq] = useState<Freq>("unica");
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const [valorLivre, setValorLivre] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const fecharRef = useRef<HTMLButtonElement>(null);

  const fechar = useCallback(() => setAberto(false), []);

  useEffect(() => {
    const onAbrir = (e: Event) => {
      const detail = (e as CustomEvent<Freq>).detail;
      if (detail === "mensal" || detail === "unica") setFreq(detail);
      setAberto(true);
    };
    window.addEventListener(DONATION_MODAL_EVENT, onAbrir);
    return () => window.removeEventListener(DONATION_MODAL_EVENT, onAbrir);
  }, []);

  // Esc fecha e o scroll do fundo trava - sem isso a página rola atrás do modal.
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    fecharRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [aberto, fechar]);

  if (!aberto) return null;

  // O valor livre, quando preenchido, manda no que foi clicado acima.
  const centsLivre = parseValorLivre(valorLivre) * 100;
  const cents = centsLivre > 0 ? centsLivre : selecionado;
  const podeSeguir = cents !== null && cents > 0;

  const seguir = () => {
    if (!podeSeguir) return;
    fechar();
    router.push(checkoutValorHref(cents, freq === "mensal"));
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-night/70 p-0 anim-fade-in sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) fechar();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="doacao-titulo"
        className="max-h-[92svh] w-full max-w-[520px] overflow-y-auto rounded-t-lg bg-surface p-5 shadow-xl sm:rounded-lg sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-action/10 text-action">
              <IconHeart size={20} />
            </span>
            <h2 id="doacao-titulo" className="text-[19px] font-extrabold leading-tight text-ink-900">
              Qual valor deseja doar?
            </h2>
          </div>

          <button
            ref={fecharRef}
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-surface-alt text-ink-600 transition-colors hover:bg-ink-900/10"
          >
            <IconClose size={20} />
          </button>
        </div>

        {/* Única x mensal. A recorrência ainda não é cobrada automaticamente -
            ver o aviso no checkout - mas a escolha já viaja para lá. */}
        <div
          role="tablist"
          aria-label="Frequência da doação"
          className="mt-5 grid grid-cols-2 gap-2 rounded-full bg-surface-alt p-1"
        >
          {(
            [
              { id: "unica", label: "Doação Única" },
              { id: "mensal", label: "Doação Mensal" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={freq === opt.id}
              onClick={() => setFreq(opt.id)}
              className={`min-h-[44px] rounded-full px-3 text-[14px] font-extrabold transition-colors ${
                freq === opt.id
                  ? "bg-action text-white shadow"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          {donationAmounts.map((amount) => {
            const ativo = selecionado === amount.cents && centsLivre === 0;
            return (
              <button
                key={amount.cents}
                type="button"
                onClick={() => {
                  setSelecionado(amount.cents);
                  setValorLivre("");
                }}
                className={`relative min-h-[56px] rounded-md border-2 px-1 text-[15px] font-extrabold transition-colors ${
                  ativo
                    ? "border-action bg-action/[.06] text-action"
                    : "border-ink-900/10 bg-surface text-ink-900 hover:border-action/40"
                }`}
              >
                {amount.popular && (
                  <span className="absolute -top-2 right-1 rounded-full bg-warning px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.04em] text-ink-900">
                    popular
                  </span>
                )}
                {formatBRL(amount.cents).replace(/\s/g, " ")}
              </button>
            );
          })}
        </div>

        <label className="mt-5 block text-[14px] font-extrabold text-ink-900">
          Ou o que o seu coração mandar ❤️:
          <div className="mt-2 flex overflow-hidden rounded-md border-2 border-ink-900/10 focus-within:border-action">
            <span className="flex w-[64px] shrink-0 items-center justify-center bg-action/[.06] text-[16px] font-extrabold text-action">
              R$
            </span>
            <input
              inputMode="numeric"
              value={valorLivre}
              onChange={(e) => setValorLivre(e.target.value.replace(/\D/g, "").slice(0, 7))}
              placeholder="Valor livre"
              className="min-h-[56px] w-full bg-surface px-3 text-[16px] font-semibold text-ink-900 outline-none placeholder:font-normal placeholder:text-ink-300"
            />
          </div>
        </label>

        <button
          type="button"
          onClick={seguir}
          disabled={!podeSeguir}
          className="mt-5 inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-md bg-warning px-6 text-[16px] font-extrabold uppercase tracking-[0.03em] text-ink-900 shadow transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continuar
          <IconArrowRight size={18} />
        </button>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[12px] font-semibold text-ink-600">
          <IconShield size={14} className="shrink-0 text-donate" />
          Pagamento 100% seguro e verificado
        </p>
      </div>
    </div>
  );
}
