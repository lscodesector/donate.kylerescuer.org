"use client";

import { useEffect } from "react";

/**
 * Marca como decorativa a miniatura que o player do VTurb injeta.
 *
 * ── O problema ────────────────────────────────────────────────────────────
 * O `player.js` reescreve o conteúdo do `<vturb-smartplayer>` quando boota e
 * coloca lá dentro um `<img>` com a miniatura do vídeo - **sem `alt`**. É um
 * DOM de terceiro, gerado depois da hidratação, então nada no nosso JSX
 * alcança ele: no HTML que sai do build todas as imagens têm `alt`, e mesmo
 * assim o Lighthouse reprova a página em "elementos de imagem não têm
 * atributos [alt]" (conta em Acessibilidade **e** em SEO).
 *
 * ── O conserto ────────────────────────────────────────────────────────────
 * `alt=""`, e não um texto inventado: a miniatura é o primeiro quadro do
 * mesmo vídeo que a seção já apresenta pela manchete e pelo `aria-label` do
 * player. Descrevê-la de novo faria o leitor de tela anunciar duas vezes a
 * mesma coisa; vazia, ela é pulada, que é o comportamento correto para
 * imagem decorativa.
 *
 * O observador vive enquanto a página viver (o player pode trocar a miniatura
 * ao pausar, ao terminar, ao reabrir), custa uma callback por mutação e não
 * toca em nenhum outro atributo - se o VTurb um dia passar a emitir o `alt`
 * sozinho, isto vira um no-op silencioso.
 */
export function PlayerA11y({ playerId }: { playerId: string }) {
  useEffect(() => {
    const alvo = document.getElementById(playerId);
    if (!alvo) return;

    const marcar = () => {
      for (const img of alvo.querySelectorAll("img:not([alt])")) {
        img.setAttribute("alt", "");
      }
    };

    marcar();
    const observador = new MutationObserver(marcar);
    observador.observe(alvo, { childList: true, subtree: true });
    return () => observador.disconnect();
  }, [playerId]);

  return null;
}
