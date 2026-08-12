"use client";

import { useRef, useState } from "react";
import { copy, depoimentos } from "@/content/landing";
import { withBasePath } from "@/lib/base-path";
import { CardsCarousel } from "../ui/CardsCarousel";
import { IconPlay } from "../ui/Icons";
import { SectionHead } from "../ui/SectionHead";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  "Depoimentos" - os vídeos gravados pelos próprios protetores         ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Cinco vídeos, um por abrigo, na mesma fileira que rola dos outros carrosséis
 * da página (`CardsCarousel`). Esta seção ocupa o lugar da fileira de logos de
 * parceiros do site institucional: ali os logos ainda eram marcadores
 * "COLOCAR LOGOS AQUI", e aqui há cinco pessoas com nome, abrigo e cidade
 * dizendo o que receberam. É a mesma prova social, só que verificável.
 *
 * ── Nenhum byte de vídeo baixa sozinho ────────────────────────────────────
 * Os cinco arquivos somam ~52 MB. `preload="none"` garante que o navegador não
 * toque neles até alguém apertar o play: o que carrega de cara é só o `poster`
 * (~30 KB cada). Sem isso, esta seção sozinha pesaria mais que a página inteira.
 *
 * ── Um tocando por vez ────────────────────────────────────────────────────
 * Dar play num vídeo pausa o que estiver tocando. Cinco áudios ao mesmo tempo
 * numa fileira que rola é o tipo de coisa que só acontece por descuido, e a
 * pessoa não teria como saber qual dos cinco parar.
 *
 * O `<video>` recebe `controls` só **depois** do primeiro play: antes disso a
 * barra do navegador competiria com a capa e com o botão redondo, que é o que
 * diz "isto é um vídeo". Depois que ele começa, quem manda é a barra.
 */
export function Depoimentos() {
  /* O vídeo que está tocando, só para pausar o anterior. É `ref` e não estado
     porque trocar o vídeo corrente não muda nada na tela por si só. */
  const tocandoRef = useRef<HTMLVideoElement | null>(null);
  const [iniciados, setIniciados] = useState<string[]>([]);

  /* Chamado pelo `onPlay` do próprio `<video>`, e não pelo clique: assim vale
     também para quem der play pelos controles nativos ou pelo teclado. */
  const aoTocar = (id: string, video: HTMLVideoElement) => {
    if (tocandoRef.current && tocandoRef.current !== video) {
      tocandoRef.current.pause();
    }
    tocandoRef.current = video;
    setIniciados((atual) => (atual.includes(id) ? atual : [...atual, id]));
  };

  return (
    <section id="depoimentos" className="py-[clamp(2.5rem,6vh,4.5rem)]">
      <div className="container-narrow flex max-w-[660px] flex-col gap-6">
        <SectionHead
          eyebrow={copy.depoimentos.eyebrow}
          title={copy.depoimentos.title}
          lead={copy.depoimentos.lead}
        />

        {/* As margens negativas fazem a fileira sangrar até a borda da tela: o
            card seguinte aparece cortado e diz que há mais, em vez de a fileira
            terminar certinha na margem e parecer completa. */}
        <CardsCarousel
          label={copy.depoimentos.title}
          className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 md:-mx-8 md:px-8"
        >
          {depoimentos.map((item) => {
            const iniciado = iniciados.includes(item.id);

            return (
              <li
                key={item.id}
                className="flex w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-md border border-ink-900/10 bg-surface shadow sm:w-[300px]"
              >
                <div className="relative aspect-[9/16] bg-ink-900">
                  {/*
                    `poster` é o que aparece antes do play. `playsInline` impede
                    o iOS de abrir o vídeo em tela cheia sozinho, que tiraria a
                    pessoa da página no meio da leitura.
                  */}
                  <video
                    src={withBasePath(item.src)}
                    poster={withBasePath(item.poster)}
                    preload="none"
                    playsInline
                    controls={iniciado}
                    onPlay={(e) => aoTocar(item.id, e.currentTarget)}
                    className="h-full w-full object-cover"
                  />

                  {/* Some no primeiro play e não volta: dali em diante quem
                      manda são os controles nativos, que estão por baixo. */}
                  {!iniciado && (
                    <button
                      type="button"
                      aria-label={`Reproduzir o depoimento de ${item.name}, do ${item.shelter}`}
                      onClick={(e) => {
                        const video =
                          e.currentTarget.parentElement?.querySelector("video");
                        void video?.play();
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-ink-900/20 transition-colors hover:bg-ink-900/30"
                    >
                      <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-surface/95 text-action shadow">
                        {/* Três pixels para a direita: o triângulo do play tem
                            o peso todo de um lado e, centrado de verdade,
                            parece torto dentro do círculo. */}
                        <IconPlay size={24} className="ml-[3px]" />
                      </span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-0.5 p-4">
                  <p className="text-[15px] font-extrabold leading-tight text-ink-900">
                    {item.name}
                  </p>
                  <p className="text-[13px] font-semibold text-accent">
                    {item.shelter}
                  </p>
                  <p className="text-[12px] leading-[1.4] text-ink-600">
                    {item.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </CardsCarousel>
      </div>
    </section>
  );
}
