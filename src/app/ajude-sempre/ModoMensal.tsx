"use client";

import { useEffect } from "react";
import { setDonationDefaults } from "@/lib/modais";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  MODO MENSAL - o padrão de doação desta página                        ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Não desenha nada. Arma, na montagem, a intenção que vale quando um gatilho
 * de doação não diz qual quer - e desarma na saída (ver `setDonationDefaults`,
 * em `lib/modais.ts`).
 *
 * ── Por que ele existe, se os blocos já recebem `mensal` por prop ─────────
 * A prop resolve o **rótulo**: ela é lida na renderização, então o HTML
 * estático já sai com "todo mês" escrito no botão, sem esperar a hidratação
 * para trocar de palavra. O que ela não alcança são os gatilhos que a página
 * não monta - a ficha de abrigo aberta dois níveis abaixo, o "voltar" do
 * checkout, e qualquer botão de doação que apareça nesta página amanhã.
 *
 * Os dois juntos são a garantia inteira: nada nesta página abre a doação única
 * por acidente, e nada promete uma coisa no rótulo e abre outra na tela.
 *
 * ── Ele é o primeiro filho da página, e de propósito ──────────────────────
 * Efeito de montagem roda antes de qualquer clique - não há corrida com o
 * usuário aqui. Mas o padrão precisa estar armado antes de um `Reveal` ou de
 * um modal chamar `openDonationModal`, e a ordem dos efeitos segue a ordem da
 * árvore: montado antes de todo mundo, ele está armado antes de todo mundo.
 */
export default function ModoMensal() {
  useEffect(() => setDonationDefaults({ freq: "mensal", somenteMensal: true }), []);
  return null;
}
