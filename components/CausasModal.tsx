"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { causes, copy, type Cause } from "@/content/landing";
import { useScrollLock } from "@/lib/scroll-lock";
import { CHECKOUT_EVENT } from "./checkout/checkout-bus";
import { DONATION_MODAL_EVENT, openDonationModal } from "./DonationModal";
import {
  IconAlert,
  IconArrowRight,
  IconBowl,
  IconClose,
  IconHeart,
  IconHome,
  IconPulse,
  IconRepeat,
} from "./ui/Icons";

/** Evento que abre o menu de frentes. */
export const CAUSAS_MODAL_EVENT = "sos:abrir-causas";

export function openCausasModal() {
  window.dispatchEvent(new Event(CAUSAS_MODAL_EVENT));
}

const ICONES = {
  bowl: IconBowl,
  pulse: IconPulse,
  home: IconHome,
  alert: IconAlert,
} as const;

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  "Escolha onde ajudar" - o menu que abre no meio da tela              ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * A primeira etapa de toda doação que não começa por um botão específico: o
 * flutuante e o "Quero doar" do cabeçalho abrem este menu, não o checkout.
 *
 * Ele existe porque "doar" sozinho é uma decisão vaga. Escolher a frente
 * transforma um valor num destino - e destino é o que faz alguém decidir. As
 * quatro frentes estão em `causes`, no `content/landing.ts`, e não foram
 * inventadas: são as quatro maiores linhas da tabela de custos que a própria
 * campanha publica.
 *
 * Todas seguem para o `DonationModal` - valor, com a frequência na frente.
 * Ração, consulta veterinária, aluguel de abrigo e "o que estiver mais
 * apertado" não têm unidade de venda, e inventar uma seria prometer o que não
 * dá para comprovar.
 *
 * ── A mensal fecha o menu, e não é uma quinta frente ──────────────────────
 * Doação que se repete é o objetivo principal da operação. Ela aparece
 * destacada no fim porque responde a *outra* pergunta - não "onde", mas "de
 * quanto em quanto tempo" -, e enfiá-la na lista das quatro faria a pessoa
 * escolher entre "tratamento veterinário" e "todo mês", que não são opções do
 * mesmo tipo. Quem entra por ali cai no mesmo `DonationModal`, já em mensal e
 * sem frente marcada (a equipe direciona).
 *
 * `z-[55]`: abaixo dos modais que ele abre (60) e do checkout (70). Ele se
 * fecha sozinho quando qualquer um deles assume - dois modais empilhados, cada
 * um com a sua trava de rolagem, é o caminho curto para a página voltar ao
 * topo sozinha.
 */
export function CausasModal() {
  const [aberto, setAberto] = useState(false);
  const fecharRef = useRef<HTMLButtonElement>(null);
  const gatilhoRef = useRef<HTMLElement | null>(null);

  useScrollLock(aberto);

  const fechar = useCallback(() => {
    setAberto(false);
    gatilhoRef.current?.focus();
  }, []);

  useEffect(() => {
    const onAbrir = () => {
      gatilhoRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setAberto(true);
    };
    window.addEventListener(CAUSAS_MODAL_EVENT, onAbrir);
    return () => window.removeEventListener(CAUSAS_MODAL_EVENT, onAbrir);
  }, []);

  /* Sem devolver o foco: quem manda nele agora é o modal que acabou de abrir. */
  useEffect(() => {
    const onOutroModal = () => setAberto(false);
    window.addEventListener(DONATION_MODAL_EVENT, onOutroModal);
    window.addEventListener(CHECKOUT_EVENT, onOutroModal);
    return () => {
      window.removeEventListener(DONATION_MODAL_EVENT, onOutroModal);
      window.removeEventListener(CHECKOUT_EVENT, onOutroModal);
    };
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    window.addEventListener("keydown", onKey);
    fecharRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [aberto, fechar]);

  if (!aberto) return null;

  /* As quatro frentes seguem pelo mesmo caminho. Já houve uma exceção aqui - a
     ração ia para uma grade de faixas de kg, porque tinha preço fechado -, mas
     esta campanha não vende saco de ração: ela pede um valor, e o destino é o
     que a pessoa acabou de escolher.

     Sem `freq`: quem acabou de escolher *onde* ajudar ainda não decidiu *de
     quanto em quanto tempo* - o modal de valor abre no padrão dele (única), e
     a mensal continua ali, a um toque. */
  const escolher = (cause: Cause) => {
    openDonationModal({ causeId: cause.id });
  };

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end justify-center bg-night/70 anim-fade-in sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) fechar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="causas-titulo"
        className="anim-fade-up flex max-h-[92dvh] w-full max-w-[540px] flex-col overflow-hidden rounded-t-lg bg-surface shadow-xl sm:rounded-lg"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-ink-900/10 px-5 py-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h2
              id="causas-titulo"
              className="text-[20px] font-extrabold leading-tight text-ink-900"
            >
              {copy.causas.title}
            </h2>
            <p className="text-[14px] leading-[1.5] text-ink-600">{copy.causas.lead}</p>
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
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <ul className="flex flex-col gap-2.5">
            {causes.map((cause) => {
              const Icone = ICONES[cause.icon];
              return (
                <li key={cause.id}>
                  {/*
                    Card inteiro clicável, e um `<button>` de verdade: o alvo
                    de toque é o cartão todo, não uma palavra dentro dele. Sem
                    JavaScript nenhum destes cliques existe - mas este modal
                    também não, e o caminho sem JS é a seção `#racao` e as
                    rotas `/doar/*`, que continuam de pé.
                  */}
                  <button
                    type="button"
                    onClick={() => escolher(cause)}
                    className="group flex w-full items-center gap-3.5 rounded-md border border-ink-900/10 bg-surface p-3.5 text-left transition-colors hover:border-donate hover:bg-donate/[.04]"
                  >
                    <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-sm bg-accent-soft text-accent transition-colors group-hover:bg-donate/10 group-hover:text-donate">
                      <Icone size={23} />
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[16px] font-extrabold leading-tight text-ink-900">
                        {cause.title}
                      </span>
                      <span className="text-[13px] leading-[1.45] text-ink-600">
                        {cause.text}
                      </span>
                    </span>

                    <IconArrowRight
                      size={18}
                      className="shrink-0 text-ink-300 transition-colors group-hover:text-donate"
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          {/* A recorrência, destacada e separada das quatro. */}
          <div className="mt-4 flex flex-col gap-3 rounded-md border-2 border-donate/30 bg-donate/[.06] p-4">
            <div className="flex flex-col gap-1">
              <h3 className="flex items-center gap-2 text-[16px] font-extrabold text-ink-900">
                <IconRepeat size={18} className="shrink-0 text-donate" />
                {copy.causas.mensalTitle}
              </h3>
              <p className="text-[13px] leading-[1.5] text-ink-600">
                {copy.causas.mensalText}
              </p>
            </div>

            <button
              type="button"
              onClick={() => openDonationModal({ freq: "mensal" })}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-donate px-5 text-[14px] font-extrabold uppercase tracking-[0.02em] text-donate-ink shadow transition-colors hover:bg-donate-hover"
            >
              <IconHeart size={16} />
              {copy.causas.mensalCta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
