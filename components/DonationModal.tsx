"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  causeById,
  donationAmounts,
  donationAmountsUnica,
  formatBRL,
  type Cause,
} from "@/content/landing";
import { useScrollLock } from "@/lib/scroll-lock";
import { CHECKOUT_EVENT, openCheckout } from "./checkout/checkout-bus";
import { IconArrowRight, IconClose, IconRepeat, IconShield } from "./ui/Icons";

/**
 * Evento que abre o modal. É um evento de janela, e não um contexto React,
 * porque quem dispara é um botão dentro de uma seção que é Server Component -
 * ela não pode receber um callback por prop sem virar cliente inteira.
 */
export const DONATION_MODAL_EVENT = "sos:abrir-doacao";

export type DonationIntent = {
  /** `id` de uma frente (`causes`). Sem ele, a doação é para a rede toda. */
  causeId?: string;
  /** Com que frequência a tela abre. Única é o padrão - ver abaixo. */
  freq?: Freq;
};

export function openDonationModal(intent: DonationIntent = {}) {
  window.dispatchEvent(
    new CustomEvent<DonationIntent>(DONATION_MODAL_EVENT, { detail: intent }),
  );
}

type Freq = "mensal" | "unica";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  Quanto, e com que frequência                                         ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * É a segunda etapa do menu de frentes (`CausasModal`): a pessoa já escolheu
 * *onde* ajudar, aqui ela escolhe *quanto* e *de quanto em quanto tempo*. A
 * exceção é a ração, que tem preço fechado por kg e por isso vai para a grade
 * de faixas (`RacaoModal`) em vez de vir para cá.
 *
 * ── A única vem selecionada ───────────────────────────────────────────────
 * Quem clica em "onde ajudar" ainda não decidiu se quer se comprometer com um
 * valor todo mês - forçar essa escolha antes mesmo de ver quanto custa é pedir
 * demais logo de cara. A doação única abre primeiro, sem fricção nenhuma; a
 * mensal continua a um toque de distância, na mesma tela, com o selo de
 * recomendada - quem já sabia que queria ajudar todo mês não perde nada.
 *
 * A escada de valores muda junto com a frequência (`donationAmounts` contra
 * `donationAmountsUnica`): R$ 30 por mês e R$ 30 uma vez não resolvem a mesma
 * coisa, e oferecer a mesma escada nas duas faria uma delas estar sempre
 * errada.
 *
 * ── As abas "Doação Única / Mensal" já saíram daqui uma vez ───────────────
 * Na versão de campanha o modal era só mensal, e a doação única era a grade de
 * kg da seção de ração. Elas voltam agora porque a página deixou de vender só
 * ração: tratamento, estrutura e "onde for mais urgente" não têm faixa de kg
 * nenhuma, e sem a escolha de frequência essas três frentes não teriam como
 * ser doadas.
 */
export function DonationModal() {
  const [intent, setIntent] = useState<DonationIntent | null>(null);
  const [freq, setFreq] = useState<Freq>("unica");
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const [valorLivre, setValorLivre] = useState("");
  const fecharRef = useRef<HTMLButtonElement>(null);
  const gatilhoRef = useRef<HTMLElement | null>(null);

  const aberto = intent !== null;
  useScrollLock(aberto);

  const fechar = useCallback(() => {
    setIntent(null);
    gatilhoRef.current?.focus();
  }, []);

  useEffect(() => {
    const onAbrir = (e: Event) => {
      const detalhe = (e as CustomEvent<DonationIntent>).detail ?? {};
      gatilhoRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setIntent(detalhe);
      setFreq(detalhe.freq ?? "unica");
      setSelecionado(null);
      setValorLivre("");
    };

    window.addEventListener(DONATION_MODAL_EVENT, onAbrir);
    return () => window.removeEventListener(DONATION_MODAL_EVENT, onAbrir);
  }, []);

  /* Sai de cena quando o checkout assume - dois modais empilhados, cada um com
     a sua trava de rolagem, é o caminho curto para a página voltar ao topo
     sozinha. Sem devolver o foco: quem manda nele agora é o checkout. */
  useEffect(() => {
    const onCheckout = () => setIntent(null);
    window.addEventListener(CHECKOUT_EVENT, onCheckout);
    return () => window.removeEventListener(CHECKOUT_EVENT, onCheckout);
  }, []);

  // Esc fecha - o scroll do fundo já está travado pelo `useScrollLock`.
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    window.addEventListener("keydown", onKey);
    fecharRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [aberto, fechar]);

  if (!intent) return null;

  const cause = causeById(intent.causeId);
  const mensal = freq === "mensal";
  const valores = mensal ? donationAmounts : donationAmountsUnica;

  // O valor livre, quando preenchido, manda no que foi clicado acima.
  const centsLivre = Number(valorLivre || 0) * 100;
  const cents = centsLivre > 0 ? centsLivre : selecionado;
  const podeSeguir = cents !== null && cents > 0;

  /*
   * Fecha este modal e abre o checkout no lugar dele - sem trocar de página.
   *
   * Antes era `router.push('/doar/valor?cents=…')`: escolher o valor tirava a
   * pessoa da landing, e voltar significava recarregar tudo e perder o lugar.
   * Agora todos os caminhos de doação terminam no mesmo checkout, com as
   * mesmas etapas. A rota `/doar/valor` continua existindo para quem está sem
   * JavaScript.
   */
  const seguir = () => {
    if (!podeSeguir) return;
    openCheckout({
      kind: mensal ? "mensal" : "causa",
      amountCents: cents,
      title: tituloDoItem(cause, mensal),
      impact: impactoDoItem(cause, mensal),
      image: null,
      txid: `${cause?.txid ?? "DOACAO"}${mensal ? "MENSAL" : "UNICA"}`,
    });
  };

  const aba = (destino: Freq) =>
    `relative flex min-h-[46px] flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-[14px] font-extrabold transition-colors ${
      freq === destino
        ? "bg-surface text-ink-900 shadow"
        : "text-ink-600 hover:text-ink-900"
    }`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-night/70 p-0 anim-fade-in sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) fechar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="doacao-titulo"
        className="anim-fade-up max-h-[92dvh] w-full max-w-[520px] overflow-y-auto rounded-t-lg bg-surface p-5 shadow-xl sm:rounded-lg sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-action/10 text-action">
              <IconRepeat size={20} />
            </span>
            <div className="flex min-w-0 flex-col">
              {/* O rótulo diz a frente escolhida; sem frente, diz o que a tela
                  é. Assim quem chegou pelo menu não perde de vista onde a
                  doação vai cair. */}
              <span className="truncate text-[12px] font-extrabold uppercase tracking-[0.08em] text-accent">
                {cause ? cause.title : "Doação"}
              </span>
              <h2
                id="doacao-titulo"
                className="text-[19px] font-extrabold leading-tight text-ink-900"
              >
                Quanto você quer doar?
              </h2>
            </div>
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

        {cause && (
          <p className="mt-3 text-[14px] leading-[1.55] text-ink-600">{cause.text}</p>
        )}

        {/* ── A frequência, antes do valor ──────────────────────────────
            Nesta ordem porque ela muda a escada de valores logo abaixo:
            escolher R$ 50 e só então descobrir que era mensal seria a pessoa
            decidindo com metade da informação. */}
        <div
          role="tablist"
          aria-label="Frequência da doação"
          className="mt-4 flex gap-1 rounded-full bg-surface-alt p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mensal}
            onClick={() => {
              setFreq("mensal");
              setSelecionado(null);
            }}
            className={aba("mensal")}
          >
            Todo mês
            <span className="rounded-full bg-donate px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.04em] text-donate-ink">
              melhor
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={!mensal}
            onClick={() => {
              setFreq("unica");
              setSelecionado(null);
            }}
            className={aba("unica")}
          >
            Uma vez
          </button>
        </div>

        <p className="mt-3 text-[13px] leading-[1.55] text-ink-600">
          {mensal
            ? "Com um valor fixo todo mês, os abrigos conseguem comprar em quantidade em vez de esperar a próxima campanha."
            : "Uma doação só, no valor que você escolher, aplicada já no próximo repasse para os abrigos."}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          {valores.map((amount) => {
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
                {mensal && (
                  <span className="block text-[10px] font-semibold text-ink-600">
                    /mês
                  </span>
                )}
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
              placeholder={mensal ? "Valor por mês" : "Valor da doação"}
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

        {/* O Pix do checkout cobra só o primeiro mês - dizer isso aqui, e não
            só lá, evita que a pessoa descubra depois de pagar. */}
        {mensal && (
          <p className="mt-3 text-center text-[12px] leading-[1.5] text-ink-600">
            O Pix cobre o primeiro mês. A equipe combina os próximos com você
            pelo WhatsApp.
          </p>
        )}

        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[12px] font-semibold text-ink-600">
          <IconShield size={14} className="shrink-0 text-donate" />
          Pagamento 100% seguro e verificado
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * O nome do item como ele aparece no checkout e é conciliado no gateway.
 *
 * Curto de propósito: o checkout mostra este texto numa linha só, com o valor
 * embaixo, e o gateway recebe a versão em maiúsculas como nome do produto.
 */
function tituloDoItem(cause: Cause | null, mensal: boolean) {
  if (!cause) return mensal ? "Doação mensal" : "Doação única";
  return mensal ? `${cause.title} (mensal)` : cause.title;
}

/** A linha de apoio do item, dentro do checkout. */
function impactoDoItem(cause: Cause | null, mensal: boolean) {
  if (mensal) {
    return "Este Pix cobre o primeiro mês. A equipe combina os próximos com você pelo WhatsApp.";
  }
  return cause?.text ?? "Sua doação vai direto para os abrigos que apoiamos.";
}
