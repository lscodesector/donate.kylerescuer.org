"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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
 * Numa página de doação isso trabalha contra o próprio objetivo — quem se
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
 */

const CHAVE_SESSAO = "sos-retencao-vista";

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

          <p className="text-[14px] leading-[1.55] text-ink-600">
            {checkout
              ? "O código do Pix já está pronto nesta tela. Se você fechar agora, é só voltar e gerar de novo — mas leva menos de um minuto para concluir."
              : "Se agora não dá, tudo bem. Mas se der, R$ 33,79 já viram 5 kg de ração — comida para cerca de 5 animais por 3 dias."}
          </p>

          <div className="flex flex-col gap-2">
            <Link
              href={checkout ? "#" : "/doar/5kg"}
              onClick={fechar}
              className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-donate px-6 text-[14px] font-extrabold uppercase tracking-[0.03em] text-donate-ink transition-colors hover:bg-donate-hover"
            >
              <IconHeart size={17} />
              {checkout ? "Continuar meu Pix" : "Doar R$ 33,79"}
            </Link>

            {!checkout && (
              <Link
                href="/#racao"
                onClick={fechar}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 text-[13px] font-extrabold text-ink-600 transition-colors hover:text-action"
              >
                Ver todos os valores
                <IconArrowRight size={15} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
