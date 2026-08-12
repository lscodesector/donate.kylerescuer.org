"use client";

import { Img as Image } from "@/components/ui/Img";
import { useEffect, useRef, useState } from "react";
import { IconArrowLeft, IconArrowRight } from "./Icons";

export type Photo = { src: string; alt: string };

/**
 * Fotos de um mesmo assunto passando sozinhas, uma sobre a outra.
 *
 * As fotos ficam empilhadas no mesmo lugar e o que muda é a opacidade - sem
 * trilho que rola, sem largura calculada, e a altura nunca muda no meio da
 * troca: o quadro é do pai (é ele quem traz a proporção) e todas as fotos o
 * preenchem com `fill` + `object-cover`.
 *
 * ── Quando o relógio anda ──────────────────────────────────────────────────
 * Só quando faz sentido, e são quatro condições:
 *
 *  • o bloco está **na tela** (`IntersectionObserver`) - card lá embaixo não
 *    gasta troca nenhuma, e quem chega nele vê o slide começar do começo;
 *  • o ponteiro e o foco estão fora dele - quem parou em cima de uma foto para
 *    olhar não a perde no meio;
 *  • ninguém clicou numa seta - a partir do primeiro clique quem manda é a
 *    pessoa, e voltar a girar sozinho tiraria da mão dela a foto que escolheu;
 *  • `prefers-reduced-motion` não está em `reduce` - trocar conteúdo sozinho é
 *    movimento, mesmo sem deslizar. Nesse caso fica a primeira foto e, onde há
 *    `controls`, a troca acontece no clique.
 *
 * ── Quando as fotos baixam ─────────────────────────────────────────────────
 * Só entram no DOM as fotos até uma à frente da atual: a primeira aparece, a
 * segunda baixa em silêncio enquanto a primeira ainda está no ar, e as outras
 * esperam a vez. São quatro abrigos na mesma seção - montar as doze de uma vez
 * faria a lista puxar ~700 KB de fotos que a pessoa vê uma por vez.
 */
export function PhotoSlideshow({
  photos,
  sizes,
  label,
  controls = false,
  interval = 2600,
  priority = false,
  className = "",
}: {
  photos: Photo[];
  /** `sizes` do `next/image` - o mesmo para todas, o quadro é um só. */
  sizes: string;
  /** De quem são as fotos, para os rótulos das setas: "Abrigo Salve Cão". */
  label: string;
  /** Setas e pontinhos clicáveis. Sem isso, os pontinhos são só enfeite. */
  controls?: boolean;
  /** Tempo de cada foto no ar, em ms - a troca em si leva 0,4s por cima disso. */
  interval?: number;
  /**
   * Prioriza **só a primeira** foto no carregamento. Ligado no slide da
   * primeira dobra, que é o maior elemento da tela inicial e por isso o
   * candidato natural a LCP; nos cards de abrigo fica desligado, senão
   * quatro slides disputariam a banda da abertura entre si.
   */
  priority?: boolean;
  /** Classes do quadro - é aqui que entram a proporção e a largura. */
  className?: string;
}) {
  /*
   * A foto no ar **e** a que estava antes dela, num estado só.
   *
   * As duas são necessárias juntas porque a troca é um fade em camadas, e não
   * um crossfade: quem estava no ar continua opaca, embaixo, até a nova
   * terminar de entrar por cima (ver o bloco das imagens, lá embaixo). Num
   * estado só porque elas mudam sempre no mesmo instante - separadas, um
   * `setState` dentro do updater do outro é o tipo de coisa que o React chama
   * duas vezes em modo estrito e desalinha.
   */
  const [slide, setSlide] = useState({ atual: 0, anterior: 0 });
  const i = slide.atual;
  const [naTela, setNaTela] = useState(false);
  const [parado, setParado] = useState(false);
  const [assumido, setAssumido] = useState(false);
  const quadro = useRef<HTMLDivElement>(null);

  // Marca d'água de quantas fotos já entraram no DOM. É "a maior que já foi"
  // e não `i + 2` direto: ao dar a volta (última → primeira) o cálculo direto
  // desmontaria as fotos do fim e elas baixariam tudo de novo na volta seguinte.
  const [montadas, setMontadas] = useState(2);

  // Uma foto só não é slide: nada de relógio, nada de pontinho.
  const passa = photos.length > 1;

  useEffect(() => {
    const el = quadro.current;
    if (!el || !passa) return;

    // Fica em `false` para sempre com movimento reduzido: é isto que segura o
    // relógio, já que ele só anda com `naTela`.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entrada]) => setNaTela(entrada.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [passa]);

  useEffect(() => {
    if (!naTela || parado || assumido) return;
    const t = setInterval(
      () =>
        setSlide(({ atual }) => ({
          anterior: atual,
          atual: (atual + 1) % photos.length,
        })),
      interval,
    );
    return () => clearInterval(t);
  }, [naTela, parado, assumido, interval, photos.length]);

  useEffect(() => {
    setMontadas((v) => Math.max(v, Math.min(i + 2, photos.length)));
  }, [i, photos.length]);

  const ir = (destino: number) => {
    setAssumido(true);
    setSlide(({ atual }) => ({
      anterior: atual,
      atual: (destino + photos.length) % photos.length,
    }));
  };

  /* `z-30`: as fotos agora empilham em `z-10`/`z-20` para a troca não piscar
     (ver o bloco das imagens), e sem uma camada própria as setas e os
     pontinhos ficariam **atrás** delas - vir depois no HTML não basta contra
     um irmão com `z-index`. */
  const seta =
    "z-30 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-surface/90 text-ink-900 shadow backdrop-blur transition-colors hover:bg-surface";

  const ponto = (ativo: boolean) =>
    `h-1.5 rounded-full bg-white transition-all ${ativo ? "w-4 opacity-100" : "w-1.5 opacity-55"}`;

  return (
    <div
      ref={quadro}
      className={`relative overflow-hidden bg-surface-alt ${className}`}
      /* `focus`/`blur` com captura (`onFocus` no React já sobe do filho) cobrem
         quem chega nas setas pelo Tab - sem isso a foto trocaria debaixo do
         botão que a pessoa acabou de focar. */
      onMouseEnter={() => setParado(true)}
      onMouseLeave={() => setParado(false)}
      onFocus={() => setParado(true)}
      onBlur={() => setParado(false)}
    >
      {/*
        ── A troca é um fade EM CAMADAS, não um crossfade ──────────────────
        A versão anterior apagava a foto que saía enquanto acendia a que
        entrava, as duas ao mesmo tempo. No meio do caminho as duas estavam a
        50%, e duas camadas de 50% não tapam o que está atrás delas: sobrava
        um quarto do fundo claro do quadro à mostra, e a troca **piscava
        branco**. Não era um defeito de carregamento - era a soma das duas
        opacidades, e acontecia toda vez, com a foto já baixada.

        Aqui a foto que sai **não apaga**: ela continua opaca, uma camada
        abaixo (`z-10`), enquanto a nova entra por cima dela (`z-20`) de 0 a
        100. Como sempre existe uma camada opaca embaixo, o fundo do quadro
        nunca aparece - e a foto anterior só é apagada duas trocas depois,
        quando já está coberta por outras duas e ninguém a vê sumir.

        De quebra isso conserta o caso da foto que ainda não terminou de
        baixar: em vez do quadro vazio, quem espera vê a foto anterior até a
        nova pintar.
      */}
      {photos.slice(0, montadas).map((foto, indice) => {
        const atual = indice === i;
        const saindo = indice === slide.anterior && !atual;

        return (
          <Image
            key={foto.src}
            src={foto.src}
            alt={foto.alt}
            fill
            priority={priority && indice === 0}
            sizes={sizes}
            /* `pointer-events-none` em tudo que não é a foto no ar: empilhadas,
               elas roubariam o clique das setas se ficassem no caminho. */
            className={`object-cover transition-opacity duration-400 ${
              atual ? "z-20 opacity-100" : "pointer-events-none"
            } ${saindo ? "z-10 opacity-100" : ""} ${
              !atual && !saindo ? "opacity-0" : ""
            }`}
            aria-hidden={atual ? undefined : true}
          />
        );
      })}

      {passa && controls && (
        <>
          <button
            type="button"
            onClick={() => ir(i - 1)}
            aria-label={`${label}: foto anterior`}
            className={`absolute left-2 top-1/2 -translate-y-1/2 ${seta}`}
          >
            <IconArrowLeft size={17} />
          </button>

          <button
            type="button"
            onClick={() => ir(i + 1)}
            aria-label={`${label}: próxima foto`}
            className={`absolute right-2 top-1/2 -translate-y-1/2 ${seta}`}
          >
            <IconArrowRight size={17} />
          </button>
        </>
      )}

      {passa && (
        /* O degradê é o que garante o contraste dos pontinhos brancos: várias
           dessas fotos são de quintal claro ou piso de cimento. */
        <div
          /* Sem `controls` a fileira é enfeite: some para o leitor de tela e não
             recebe clique, porque no card quem responde ao toque é o botão que
             cobre tudo e abre a ficha. */
          aria-hidden={controls ? undefined : true}
          className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-center gap-1.5 bg-linear-to-t from-night/45 to-transparent pb-2 pt-6"
        >
          {photos.map((foto, indice) =>
            controls ? (
              <button
                key={foto.src}
                type="button"
                onClick={() => ir(indice)}
                aria-label={`${label}: foto ${indice + 1} de ${photos.length}`}
                aria-current={indice === i}
                /* O alvo do toque tem 24px de altura; o que se vê é o pontinho
                   de 6px no meio dele. */
                className="flex h-6 w-4 items-center justify-center"
              >
                <span className={ponto(indice === i)} />
              </button>
            ) : (
              <span key={foto.src} className={ponto(indice === i)} />
            ),
          )}
        </div>
      )}
    </div>
  );
}
