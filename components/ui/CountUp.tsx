"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * `useLayoutEffect` no navegador, `useEffect` no servidor.
 *
 * O efeito precisa rodar **antes da pintura**: ele é quem zera o número para a
 * contagem começar do zero. Com `useEffect`, que roda depois, o navegador
 * chegava a pintar o valor final e só então voltava para zero - um piscar
 * visível em todo card. E `useLayoutEffect` puro avisa no console durante o
 * SSR, onde não existe pintura para acontecer antes. Daí a troca pela largura
 * do ambiente, e não por uma flag.
 */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Número que conta do zero até o valor quando entra na tela.
 *
 * O valor **final** é o que sai do servidor. Isso importa por dois motivos:
 * sem JavaScript o número aparece do mesmo jeito (o `<noscript>` do layout já
 * cuida do resto da página), e o que o Google lê é "400", não "0". Quem tem
 * JavaScript vê o zero só a partir do efeito de layout, antes da primeira
 * pintura - então na prática a contagem sempre começa do zero.
 *
 * `prefix` e `suffix` ficam fora da conta de propósito: o "+" de "+400" e o
 * "t" de "+20t" são rótulo, não número, e animá-los daria "2t, 7t, 13t…".
 *
 * Respeita `prefers-reduced-motion`: quem pediu menos movimento recebe o
 * número parado, sem contagem nenhuma.
 */
export function CountUp({
  value,
  prefix = "",
  suffix = "",
  duration = 900,
  className = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  /** Duração da contagem, em milissegundos. Curta de propósito. */
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Navegador antigo ou quem pediu menos movimento: número parado no valor
    // final, que é o que já está na tela. Nada a fazer.
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setDisplay(0);

    let frame = 0;
    let inicio = 0;

    const passo = (agora: number) => {
      if (!inicio) inicio = agora;
      const t = Math.min(1, (agora - inicio) / duration);
      // easeOutCubic: sai rápido e desacelera no fim, então o número passa a
      // maior parte do tempo perto do valor final em vez de no meio do caminho.
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(eased * value));
      if (t < 1) frame = requestAnimationFrame(passo);
    };

    // Dispara uma vez, quando o card entra na tela - e não na montagem: os
    // cards da transparência estão bem abaixo da dobra, e a contagem toda
    // aconteceria antes de alguém chegar lá.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        frame = requestAnimationFrame(passo);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    // `tabular-nums`: sem isso cada dígito tem largura própria e o número
    // treme na horizontal durante a contagem inteira.
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {display.toLocaleString("pt-BR")}
      {suffix}
    </span>
  );
}
