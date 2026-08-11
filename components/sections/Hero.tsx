import { heroCopy, heroPhotos } from "@/content/landing";
import { RacaoDonateButton } from "../RacaoDonateButton";
import { IconArrowRight, IconHeart, IconShield } from "../ui/Icons";
import { PawTrails } from "../ui/PawTrails";
import { PhotoSlideshow } from "../ui/PhotoSlideshow";
import { Reveal } from "../ui/Reveal";

/**
 * Primeira dobra do site institucional, e ela fecha em **uma tela**:
 *
 *   manchete → fotos → os dois botões → selo
 *
 * Quatro elementos, e três deles cabem em uma linha cada: a dobra é uma frase,
 * uma imagem e uma escolha. A linha de apoio que ficava sob a manchete saiu
 * (ver `heroCopy`) - ela repetia o primeiro parágrafo de "nossa missão", que
 * está logo abaixo, e cobrava três linhas de altura da foto.
 *
 * ── A foto é o miolo da dobra ─────────────────────────────────────────────
 * Ela fica entre o texto e os botões, e é o maior elemento da tela. O botão de
 * doar já esteve acima dela, sozinho, separando os dois CTAs: virava uma dobra
 * com três blocos de ação empilhados, e a foto - que é o que a organização tem
 * de melhor para mostrar na primeira tela - sobrava com uma faixa fina no meio.
 * Agora os dois botões dividem a mesma linha, no mesmo tamanho, e a altura que
 * eles devolveram foi toda para a foto.
 *
 * Os dois no mesmo tamanho é decisão de página institucional: doar e conhecer
 * os abrigos são as duas saídas legítimas da dobra. O que os diferencia é o
 * peso visual - verde cheio contra contorno -, não o tamanho.
 *
 * ── Quem cede altura é a foto ─────────────────────────────────────────────
 * A seção tem altura travada (`.screen-section` = 100svh menos a barra fixa),
 * então a soma texto + botões + selo é fixa e a foto é o único item flexível
 * (`flex-1 min-h-0`): ela fica com a sobra, seja ela 200px num notebook baixo
 * ou 600px num monitor grande. Como o slide desenha as fotos com `fill` +
 * `object-cover`, qualquer formato de moldura serve - não há proporção para
 * respeitar nem teto de largura para calcular, que era toda a matemática que o
 * vídeo do VTurb exigia quando ocupava este espaço.
 *
 * O `min-h` é o limite dessa conta: abaixo de 560px de dobra (celular
 * deitado, basicamente) não sobra altura para a foto existir, e aí a seção
 * para de encolher e a página rola um pouco. Rolar é melhor do que espremer a
 * foto até virar um risco.
 *
 * ── O que saiu daqui ──────────────────────────────────────────────────────
 * O VSL do VTurb. O embed continua configurado em `heroVideo` e o
 * `VturbPlayer` continua no projeto - devolver o vídeo é trocar o slot da foto
 * de volta.
 */
export function Hero() {
  return (
    <section
      id="topo"
      className="screen-section surface-alt relative min-h-[560px] overflow-hidden"
    >
      <PawTrails />

      {/* `justify-center` + a foto crescendo: a pilha ocupa a dobra inteira e,
          quando sobra folga (tela muito alta), ela vira respiro dividido em
          partes iguais em cima e embaixo. */}
      <div className="container-narrow relative flex h-full max-w-[860px] flex-col items-center justify-center gap-[clamp(0.625rem,1.6vh,1.25rem)] py-[clamp(0.75rem,2vh,1.5rem)] text-center">
        <Reveal className="flex flex-col items-center">
          {/*
            H1 único da página. A escala tem `vw` e `vh` no mesmo termo: a
            largura manda no tamanho do cartaz, mas cada pixel de fonte aqui
            sai da altura da foto, então a altura da janela precisa ter voz.
            Piso 24px, teto 40px.

            O teto era 56px e desceu: com três linhas de manchete em corpo de
            cartaz, o texto sozinho comia quase um terço da dobra e a foto
            ficava com uma faixa. Em 40px a frase continua sendo a primeira
            coisa que se lê, ainda em duas ou três linhas, e devolve ~60px para
            a imagem no notebook.
          */}
          <h1 className="max-w-[22ch] text-balance text-[clamp(1.5rem,1rem+1.2vw+0.6vh,2.5rem)] font-extrabold leading-[1.15] text-ink-900">
            {heroCopy.headline}{" "}
            <span className="text-action">{heroCopy.headlineAccent}</span>
          </h1>
        </Reveal>

        {/*
          O item flexível da coluna: fica com toda a altura que sobrar.

          `flex` aqui não é enfeite - é o que faz o quadro esticar até a altura
          do slot sem depender de uma altura em porcentagem, que precisaria de
          um pai com altura definida para resolver.

          ── Por que o quadro não passa de 520px ──────────────────────────
          É a largura da fileira de botões logo abaixo, e o alinhamento dos
          dois é o que mantém a dobra em uma coluna só. Com a largura da
          seção inteira (860px), o quadro virava uma faixa deitada de quase
          3:1: nesse formato o `object-cover` corta a foto pelo topo e pela
          base, e o que se perde é justamente a parte de cima, onde estão os
          rostos. Contido em 520px com a altura que sobra, ele fica quase
          quadrado (~1,15:1 num notebook) e a foto entra quase inteira -
          nestas seis, o corte lateral de um quadrado não tira nenhum rosto.

          `max-h` existe para o caminho contrário: em monitor muito alto a
          sobra faria um retrato estreito e comprido. Passando de 640px de
          altura, o quadro para de crescer e a folga vira respiro.
        */}
        <Reveal delay={1} className="flex min-h-0 w-full flex-1 items-center justify-center">
          <PhotoSlideshow
            photos={heroPhotos}
            label="SOS Animal Help"
            controls
            priority
            interval={4200}
            sizes="(min-width: 600px) 520px, 100vw"
            className="h-full max-h-[640px] w-full max-w-[520px] rounded-md border border-ink-900/10 shadow"
          />
        </Reveal>

        <Reveal delay={2} className="flex w-full flex-col items-center gap-[clamp(0.5rem,1.2vh,0.75rem)]">
          {/*
            Os dois botões, na mesma linha e na mesma medida - só a pintura
            muda. `flex-1` dentro de um trilho de largura limitada mantém a
            largura idêntica nos dois em qualquer idioma: rótulo mais longo não
            faz um botão crescer mais que o outro.

            No celular eles empilham (`flex-col`), porque lado a lado numa
            largura de 350px os dois ficariam com ~165px cada e o rótulo
            quebraria em duas linhas.
          */}
          <div className="flex w-full max-w-[520px] flex-col items-stretch gap-[clamp(0.5rem,1.2vh,0.75rem)] sm:flex-row">
            {/* Abre a grade de faixas de ração em modal (`RacaoModal`); sem
                JavaScript continua sendo um link para o bloco de doação. */}
            <RacaoDonateButton className="inline-flex min-h-[clamp(2.875rem,5.2vh,3.25rem)] flex-1 items-center justify-center gap-2 rounded-full bg-donate px-5 text-[clamp(0.875rem,1.4vh,0.9375rem)] font-extrabold uppercase tracking-[0.03em] text-donate-ink shadow-[0_10px_30px_-8px_rgba(27,138,75,.55)] transition-colors hover:bg-donate-hover">
              <IconHeart size={17} />
              {heroCopy.ctaPrimary}
            </RacaoDonateButton>

            <a
              href="#abrigos"
              className="inline-flex min-h-[clamp(2.875rem,5.2vh,3.25rem)] flex-1 items-center justify-center gap-2 rounded-full border-2 border-ink-900/[.12] bg-surface px-5 text-[clamp(0.875rem,1.4vh,0.9375rem)] font-extrabold text-ink-900 transition-colors hover:border-action hover:text-action"
            >
              {heroCopy.ctaSecondary}
              <IconArrowRight size={16} />
            </a>
          </div>

          {/* Some antes de tudo em tela baixa: é a linha menos essencial da
              dobra, e o CNPJ está publicado na seção de documentação. */}
          <span className="hidden items-center gap-1.5 [@media(min-height:640px)]:inline-flex">
            <IconShield size={15} className="shrink-0 text-donate" />
            <span className="text-[13px] font-semibold text-ink-600">
              {heroCopy.seal}
            </span>
          </span>
        </Reveal>
      </div>
    </section>
  );
}
