"use client";

import { useCallback, useEffect, useRef, useState, type SVGProps } from "react";
import {
  checkoutItemFor,
  consumeBackInterceptSuppression,
  isCheckoutOpen,
  openCheckout,
} from "@/lib/checkout-bus";
import { donationAmountsMensal } from "@/lib/config";
import { formatBRLCurto } from "@/lib/format";
import { useScrollLock } from "@/lib/scroll-lock";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  OFERTA DE SAÍDA - o degrau menor, no "voltar"                        ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Quem aperta "voltar" em `/ajude-sempre` sem ter doado vê, **uma vez**, o
 * degrau mais baixo da escada mensal lido por dia: R$ 0,50 por dia, que são os
 * R$ 15 por mês que a campanha já pratica.
 *
 * ── Ela é o consumidor que faltava ────────────────────────────────────────
 * O contrato inteiro já existia em `lib/checkout-bus.ts` - `setCheckoutOpen`,
 * `isCheckoutOpen`, `suppressNextBackIntercept`,
 * `consumeBackInterceptSuppression` -, e o checkout (bloco 18) já o alimenta
 * há tempos. O que nunca foi escrito era quem lê. Os comentários de lá chamam
 * este componente de `BackIntercept`; é este arquivo.
 *
 * ── ⚠️ UMA VEZ, E NUNCA PRENDER ───────────────────────────────────────────
 * Na montagem ela empurra **uma** entrada no histórico. O primeiro "voltar"
 * cai nela, a oferta aparece, e a entrada acabou - o "voltar" seguinte sai da
 * página de verdade, como a pessoa mandou.
 *
 * A entrada **não** é reempurrada depois de mostrar. Reempurrar é o que
 * transforma uma oferta em armadilha: a pessoa aperta voltar, aperta de novo,
 * e continua onde estava. Numa página que pede dinheiro, prender o botão de
 * sair é o que faz a pessoa fechar a aba e não voltar nunca - e é o que
 * transforma uma campanha em reclamação. Uma oferta, e o caminho fica livre.
 *
 * ── Quem é dono do "voltar" em cada momento ───────────────────────────────
 * Três situações, e as três estão cobertas:
 *
 *   checkout aberto      `isCheckoutOpen()` - o "voltar" é dele, que fecha o
 *                        modal. Esta oferta fica quieta, senão ela apareceria
 *                        por cima do checkout.
 *   checkout recém-fechado pelo X, Esc ou fundo: ele desfaz sozinho a entrada
 *                        que empurrou, e o `popstate` disso chega com o modal
 *                        já fechado. `consumeBackInterceptSuppression()` é a
 *                        bandeira de uso único que separa esse caso de uma
 *                        saída de verdade.
 *   nenhum dos dois      é a pessoa saindo. É a hora da oferta.
 */

/* ─────────────────────────────────────────────────── conteúdo do bloco ──── */

/**
 * O degrau oferecido na saída: **o mais baixo da escada mensal**.
 *
 * ⚠️ Lido de `donationAmountsMensal` (`lib/config.ts`), nunca escrito aqui.
 * Uma oferta de retenção que anuncia um valor que o checkout não pratica é a
 * pior das divergências possíveis: ela aparece justamente para quem já estava
 * indo embora.
 */
const degrauDaSaida = donationAmountsMensal[0]!;

/** Os mesmos 30 dias da faixa vermelha do bloco `TodoMes`. */
const DIAS_DO_MES = 30;

/**
 * A entrada sintética já foi empurrada neste carregamento de página?
 *
 * ⚠️ **É de módulo, e não um `useRef`, de propósito.** Em desenvolvimento o
 * React monta o componente, desmonta e monta de novo (StrictMode) - um `ref`
 * nasce zerado na segunda montagem, e o efeito empurraria uma **segunda**
 * entrada no histórico. O efeito colateral disso é exatamente o que este
 * arquivo promete não fazer: com duas entradas, o primeiro "voltar" mostra a
 * oferta, o segundo consome a entrada sobrando e a pessoa **continua na
 * página** - o botão de sair vira armadilha.
 *
 * Foi o que aconteceu na primeira medição: a oferta aparecia certo, e o
 * segundo "voltar" não saía de `/ajude-sempre/`.
 *
 * Uma variável de módulo sobrevive à remontagem e morre no carregamento
 * seguinte, que é exatamente o tempo de vida que esta entrada precisa ter.
 */
let entradaEmpurrada = false;

const copySaida = {
  /** Vermelho e curto - é a única palavra que precisa ser lida na hora. */
  alerta: "Espera",
  title: "E se fossem 50 centavos?",
  /* `{porDia}` é trocado na renderização: a frase não pode escrever o valor,
     porque ele sai da escada. */
  lead: "Menos do que você paga num café, todo mês, sem pensar nisso de novo.",
  unidade: "por dia",
  /* ⚠️ A cifra mensal, pelo mesmo motivo da faixa vermelha: quem vê "50
     centavos" precisa ler, na mesma tela, quanto sai da conta. É o preço, não
     uma explicação - ver `copyPorDia` em `TodoMes.tsx`. */
  mes: "{valor} por mês",
  cta: "Quero ajudar com {porDia} por dia",
  recusa: "Não, obrigado",
};

/* ─────────────────────────────────────────────────────────── ícones ──── */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const IconClose = ({ size = 20, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable={false}
    {...rest}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

/**
 * A patinha branca do pedido mensal - mesmo desenho de `IconPaw` nos blocos
 * 01, 02, 14, 16 e em `TodoMes`.
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

export default function OfertaDeSaida() {
  const [aberta, setAberta] = useState(false);
  /** Uma vez por carregamento de página. Ver o aviso lá em cima. */
  const jaMostrou = useRef(false);
  const fecharRef = useRef<HTMLButtonElement>(null);

  useScrollLock(aberta);

  const fechar = useCallback(() => setAberta(false), []);

  useEffect(() => {
    /*
     * A entrada sintética: é nela que o primeiro "voltar" cai. Uma só - ela
     * não é reempurrada depois de a oferta aparecer.
     *
     * ⚠️ **`{ ...history.state }` não é enfeite - sem ele nada disto funciona.**
     * O App Router do Next guarda o estado de roteamento dele dentro de
     * `history.state`. Empurrar um objeto limpo (`{ sosSaida: true }`) apaga
     * esse estado da entrada: no "voltar", o Next não reconhece para onde
     * está indo e faz uma **navegação dura** - a página recarrega inteira, o
     * `popstate` nunca chega a este componente e a oferta não aparece. Foi
     * exatamente o que aconteceu na primeira versão deste arquivo: disparando
     * `popstate` na mão a oferta abria, e no "voltar" de verdade a página
     * simplesmente recarregava.
     *
     * Espalhando o estado do Next por baixo, a entrada continua sendo uma
     * entrada que ele entende, e o `popstate` chega aqui no mesmo documento.
     *
     * O `entradaEmpurrada` garante **uma** entrada por carregamento, mesmo com
     * a remontagem do StrictMode - ver o comentário lá em cima.
     */
    if (!entradaEmpurrada) {
      entradaEmpurrada = true;
      history.pushState({ ...history.state, sosSaida: true }, "");
    }

    const onPopState = () => {
      /* O checkout é dono do "voltar" enquanto está aberto, e a bandeira cobre
         o instante em que ele acabou de se fechar por fora do histórico. */
      if (isCheckoutOpen()) return;
      if (consumeBackInterceptSuppression()) return;
      if (jaMostrou.current) return;

      jaMostrou.current = true;
      setAberta(true);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  /* Esc fecha, e o foco começa no X - a rolagem do fundo já está travada. */
  useEffect(() => {
    if (!aberta) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    window.addEventListener("keydown", onKey);
    fecharRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [aberta, fechar]);

  if (!aberta) return null;

  const centsMes = degrauDaSaida.cents;
  const valorDia = formatBRLCurto(Math.round(centsMes / DIAS_DO_MES));

  const doar = () => {
    setAberta(false);
    /* Direto para o checkout, com `valorDireto` - quem estava saindo não
       encara uma grade de nove degraus. É o mesmo caminho dos degraus do
       bloco `TodoMes`, e a etapa de dados mostra o valor com o botão de
       aumentar. Ver `CheckoutItem.valorDireto`. */
    openCheckout(
      checkoutItemFor({
        amountCents: centsMes,
        mensal: true,
        somenteMensal: true,
        valorDireto: true,
      }),
    );
  };

  return (
    /* `z-[55]`: acima da página e da barra fixa (40) e do menu (50), abaixo do
       modal de doação (60) e do checkout (70). É a faixa que o comentário do
       bloco 16 já reservava para ela. */
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/60 p-3 backdrop-blur-[8px] anim-fade-in sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) fechar();
      }}
    >
      {/* #ui:oferta-saida */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="oferta-saida-titulo"
        className="relative w-full max-w-[420px] overflow-hidden rounded-lg bg-surface shadow-xl"
      >
        <button
          ref={fecharRef}
          type="button"
          onClick={fechar}
          aria-label="Fechar"
          className="absolute right-2.5 top-2.5 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-surface-alt text-ink-600 transition-colors hover:bg-ink-900/10"
        >
          <IconClose size={17} />
        </button>

        <div className="flex flex-col items-center gap-3 px-5 py-6 text-center sm:px-6">
          {/* O texto chamativo: vermelho de marca, em maiúsculas espaçadas.
              Uma palavra - é a única coisa que precisa ser lida por quem já
              tinha decidido sair. */}
          <p className="text-fs14 font-extrabold uppercase tracking-[0.2em] text-action">
            {copySaida.alerta}
          </p>

          <h2
            id="oferta-saida-titulo"
            className="text-balance text-[clamp(1.279rem,1.116rem+0.651vw,1.628rem)] font-extrabold leading-[1.2] text-ink-900"
          >
            {copySaida.title}
          </h2>

          {/* O número, do tamanho do argumento. Vermelho, como a palavra de
              cima - é o mesmo pedido, só que menor. */}
          <p className="flex flex-wrap items-baseline justify-center gap-x-2">
            <span className="text-[clamp(2.093rem,1.628rem+1.86vw,2.79rem)] font-extrabold leading-none tracking-[-0.01em] text-action">
              {valorDia}
            </span>
            <span className="text-fs15 font-extrabold uppercase leading-none tracking-[0.04em] text-ink-600">
              {copySaida.unidade}
            </span>
          </p>

          <p className="max-w-[42ch] text-fs14 leading-[1.5] text-ink-600">
            {copySaida.lead}
          </p>

          {/* ⚠️ Quanto sai da conta. Ver `copySaida.mes`. */}
          <p className="text-fs13 font-semibold text-ink-900">
            {copySaida.mes.replace("{valor}", formatBRLCurto(centsMes))}
          </p>

          <button
            type="button"
            onClick={doar}
            className="inline-flex min-h-[56px] w-full items-center justify-center gap-2.5 text-balance rounded-full bg-action px-5 py-3 text-center text-[clamp(0.872rem,0.837rem+0.209vw,0.988rem)] font-extrabold uppercase leading-tight tracking-[0.03em] text-action-ink transition-colors hover:bg-action-hover"
          >
            <IconPaw size={19} className="shrink-0" />
            {copySaida.cta.replace("{porDia}", valorDia)}
          </button>

          {/* A recusa é um link discreto, e não um segundo botão: ela precisa
              existir e ser fácil de achar - a pessoa já disse que queria sair -,
              sem disputar a leitura com a oferta. */}
          <button
            type="button"
            onClick={fechar}
            className="min-h-[36px] text-fs13 font-semibold text-ink-600 underline underline-offset-4 transition-colors hover:text-ink-900"
          >
            {copySaida.recusa}
          </button>
        </div>
      </div>
    </div>
  );
}
