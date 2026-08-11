"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { RACAO_HREF, formatBRL, rationTiers } from "@/content/landing";
import {
  consumeBackInterceptSuppression,
  isCheckoutOpen,
} from "./checkout/checkout-bus";
import { IconArrowRight, IconClose, IconHeart } from "./ui/Icons";

/**
 * Retenção no botão "voltar".
 *
 * Ao tentar sair, a primeira tentativa abre uma oferta em vez de deixar a
 * página; a partir da segunda, o "voltar" funciona normalmente.
 *
 * ── Por que apenas uma vez ────────────────────────────────────────────────
 * O padrão de mercado (o "backredirect") prende a pessoa em laço: cada
 * "voltar" empurra um novo estado no histórico e ela nunca consegue sair.
 * Numa página de doação isso trabalha contra o próprio objetivo - quem se
 * sente preso associa o site a golpe, e esta página inteira foi construída
 * para dizer o contrário (CNPJ à mostra, custos publicados, documento da
 * Receita). Uma oferta que aparece uma vez e sai do caminho recupera quem
 * estava só hesitando, sem cobrar o preço de parecer armadilha.
 *
 * Vale saber também: o Chrome ignora entradas de histórico criadas sem
 * interação do usuário, então o laço infinito nem funciona de forma confiável
 * nos navegadores atuais.
 *
 * Quer mesmo o laço infinito? Troque `liberado.current = true` por um
 * `pushState` novo dentro do `onPopState`.
 *
 * ── ⚠️ Isto é gatilho de SAÍDA, e só de saída ⚠️ ─────────────────────────
 * Já apareceu no lugar errado: clicar em "Quero doar ração" abria "Antes de
 * sair: os potes continuam vazios" em vez do checkout. O motivo era o
 * histórico ser disputado por dois donos - o checkout empurra uma entrada
 * própria ao abrir (para o "voltar" fechar o modal), e este componente lia
 * aquele `popstate` como tentativa de abandonar a página. Quem estava tentando
 * doar levava uma oferta para não ir embora.
 *
 * Duas travas resolvem, e as duas precisam continuar aqui:
 *
 *   1. `isCheckoutOpen()` - com o checkout aberto, este componente não faz
 *      nada. O "voltar" pertence ao modal.
 *   2. `history.state?.sosCheckout` - o `popstate` que vem de fechar o
 *      checkout é ignorado explicitamente, mesmo que o modal já tenha se
 *      desmontado quando o evento chega.
 *
 * A regra em uma frase: **CTA de doação abre checkout; este popup só aparece
 * quando a pessoa está de fato saindo, e nunca por cima do pagamento.**
 */

const CHAVE_SESSAO = "sos-retencao-vista";

/**
 * A faixa oferecida na retenção - a menor da campanha, que é a que faz sentido
 * oferecer para quem já estava de saída. Vem de `rationTiers` em vez de estar
 * escrita aqui: preço em texto no popup envelhece sozinho e passa a mentir.
 */
const TIER_RETENCAO = rationTiers[0];

export function BackIntercept({
  variant = "landing",
}: {
  /** `checkout` fala de um pagamento em andamento; `landing`, da campanha. */
  variant?: "landing" | "checkout";
}) {
  const [aberto, setAberto] = useState(false);
  const armado = useRef(false);
  const liberado = useRef(false);

  const fechar = useCallback(() => setAberto(false), []);

  useEffect(() => {
    // Uma vez por sessão: reaparecer a cada navegação vira perseguição.
    if (sessionStorage.getItem(CHAVE_SESSAO) === "1") return;

    /*
     * O estado só entra no histórico depois de a pessoa interagir. É
     * exigência do Chrome (entrada criada sem gesto é descartada) e evita
     * mexer no histórico de quem só passou os olhos e saiu.
     */
    const armar = () => {
      if (armado.current) return;
      armado.current = true;
      history.pushState({ sosRetencao: true }, "");
    };

    const onPopState = () => {
      if (liberado.current) return;
      /* O checkout é dono do "voltar" enquanto estiver aberto - ver o bloco
         "isto é gatilho de saída" no topo do arquivo. */
      if (isCheckoutOpen()) return;
      if (history.state?.sosCheckout) return;
      /* O "voltar" que o próprio checkout disparou ao ser fechado no X. */
      if (consumeBackInterceptSuppression()) return;
      liberado.current = true;
      sessionStorage.setItem(CHAVE_SESSAO, "1");
      setAberto(true);
    };

    const gestos: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "scroll"];
    gestos.forEach((g) => window.addEventListener(g, armar, { once: true, passive: true }));
    window.addEventListener("popstate", onPopState);

    return () => {
      gestos.forEach((g) => window.removeEventListener(g, armar));
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  // Fecha no Esc e trava a rolagem do fundo enquanto estiver aberto.
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [aberto, fechar]);

  if (!aberto) return null;

  const checkout = variant === "checkout";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="retencao-titulo"
      className="fixed inset-0 z-[60] flex items-end justify-center bg-night/70 p-4 anim-fade-in sm:items-center"
    >
      <div className="relative w-full max-w-[440px] rounded-md bg-surface p-5 shadow anim-fade-up sm:p-6">
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar"
          className="absolute right-2 top-2 flex h-[40px] w-[40px] items-center justify-center rounded-sm text-ink-600 transition-colors hover:bg-surface-alt"
        >
          <IconClose size={20} />
        </button>

        <div className="flex flex-col gap-3 pr-8">
          <h2 id="retencao-titulo" className="text-[20px] font-extrabold leading-[1.2] text-ink-900">
            {checkout
              ? "Seu Pix ainda está aberto"
              : "Antes de sair: os potes continuam vazios"}
          </h2>

          {/* Preço e impacto saem de `rationTiers`, nunca escritos aqui: um
              número em texto no popup continuaria dizendo R$ 33,79 depois de a
              faixa mudar de preço. */}
          <p className="text-[14px] leading-[1.55] text-ink-600">
            {checkout
              ? "O código do Pix já está pronto nesta tela. Se você fechar agora, é só voltar e gerar de novo - mas leva menos de um minuto para concluir."
              : `Se agora não dá, tudo bem. Mas se der, ${formatBRL(TIER_RETENCAO.priceCents)} já viram ${TIER_RETENCAO.kg} kg de ração - comida para cerca de ${TIER_RETENCAO.animals} animais por ${TIER_RETENCAO.days} dias.`}
          </p>

          <div className="flex flex-col gap-2">
            {checkout ? (
              <button
                type="button"
                onClick={fechar}
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-donate px-6 text-[14px] font-extrabold uppercase tracking-[0.03em] text-donate-ink transition-colors hover:bg-donate-hover"
              >
                <IconHeart size={17} />
                Continuar meu Pix
              </button>
            ) : (
              /*
               * Leva para a seção de ração, como **todo** CTA de doação desta
               * página - cabeçalho, hero, impacto, barra fixa e fechamento vão
               * todos para `RACAO_HREF`. Já esteve abrindo o checkout de 5 kg
               * direto daqui, e era a única porta que pulava a escolha da
               * faixa: a pessoa caía no pagamento de um valor que ela não
               * tinha escolhido. A única exceção da página continua sendo a
               * doação mensal, que não tem faixa de kg.
               *
               * O 5 kg segue no texto acima como exemplo do que o menor valor
               * já resolve - mas quem decide o tamanho é ela, na grade.
               */
              <Link
                href={RACAO_HREF}
                onClick={fechar}
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-donate px-6 text-[14px] font-extrabold uppercase tracking-[0.03em] text-donate-ink transition-colors hover:bg-donate-hover"
              >
                <IconHeart size={17} />
                Doar ração
                <IconArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
