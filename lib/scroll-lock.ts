"use client";

import { useEffect } from "react";

/**
 * Trava a rolagem do fundo enquanto um modal estiver aberto - e devolve a
 * página exatamente onde ela estava quando ele fechar.
 *
 * `overflow: hidden` sozinho não basta. No iOS ele não segura a rolagem por
 * toque, e em qualquer navegador a página pode voltar para o topo ao ser
 * destravada, porque enquanto o `<body>` não rola o `scrollY` não tem onde se
 * apoiar. Quem abre o checkout no meio da seção de ração e fecha voltando para
 * o topo perde o lugar e, na prática, perde a doação.
 *
 * A solução é fixar o corpo na posição em que ele está (`position: fixed` com
 * `top: -scrollY`) e, ao soltar, rolar de volta para lá. `scroll-behavior:
 * auto` no `<html>` durante a restauração é obrigatório: sem isso o
 * `scroll-behavior: smooth` global anima o retorno e a pessoa vê a página
 * deslizando sozinha depois de fechar o modal.
 *
 * ── A trava é contada, e não uma por componente ───────────────────────────
 * A ficha de um abrigo abre o popup do cartão CNPJ **por cima dela**, e os dois
 * chamam este hook. Se cada chamada mexesse no `<body>` por conta própria, a de
 * dentro guardaria como "estado anterior" o corpo *já travado* e, ao fechar o
 * popup, devolveria a rolagem com a ficha ainda aberta - e a página voltaria
 * para o topo por baixo dela. Com o contador abaixo, só a primeira trava
 * aplica o estilo, e só a última a ser solta restaura a rolagem.
 */
let travas = 0;
let soltar: (() => void) | null = null;

function travar() {
  const { body, documentElement: html } = document;
  const scrollY = window.scrollY;

  const previous = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    overflow: body.style.overflow,
  };

  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";

  return () => {
    Object.assign(body.style, previous);

    const previousBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, scrollY);
    html.style.scrollBehavior = previousBehavior;
  };
}

export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    if (++travas === 1) soltar = travar();

    return () => {
      if (--travas === 0) {
        soltar?.();
        soltar = null;
      }
    };
  }, [locked]);
}
