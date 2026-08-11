import Image from "next/image";
import { RACAO_HREF, heroCopy, heroVideo } from "@/content/landing";
import { IconArrowRight, IconHeart, IconPlay, IconShield } from "../ui/Icons";
import { PawTrails } from "../ui/PawTrails";
import { Reveal } from "../ui/Reveal";
import { VturbPlayer } from "../ui/VturbPlayer";

/**
 * Primeira dobra: promessa → vídeo → botão → selo, tudo dentro de uma tela
 * (`.screen-section` = 100svh menos a barra fixa).
 *
 * O vídeo é o argumento de venda da campanha, então ele é quem fica com a
 * altura que sobra — e o texto é que cede. Por isso a manchete e a linha de
 * apoio são curtas e o CTA secundário é um link, não um segundo botão.
 *
 * ── O que já ocupou este espaço ───────────────────────────────────────────
 * Primeiro uma barra de meta em reais ("R$ 18.500 de R$ 58.000"), depois os
 * quatro números da rede em card. Os dois saíram: a dobra tem espaço para uma
 * ideia, e ela é o vídeo. Número aqui competia com ele por altura e ainda
 * dividia a atenção antes de existir qualquer pedido. Os números continuam na
 * página, em card, na seção de transparência — onde há espaço para eles serem
 * lidos de verdade.
 *
 * O tamanho do vídeo não é uma conta fixa. O slot dele é o item flexível da
 * coluna (`.screen-section__flex`) e fica com a altura que sobrar depois do
 * texto e dos botões; dentro dele, o player ocupa a largura toda e tira a
 * própria altura do `aspect-ratio`. Se essa altura não couber na sobra, o
 * `max-h-full` apara o excesso — o player fica mais baixo que o formato, nunca
 * mais alto (ver o comentário longo lá embaixo).
 *
 * A vantagem sobre a versão anterior (`min(100svh - 32rem, ...)`) é que aqui
 * não existe constante para desatualizar: mexeu no texto da dobra, o vídeo se
 * reajusta sozinho e a dobra continua fechando em uma tela.
 */
/**
 * Quanto da dobra **não** é vídeo: manchete, linha de apoio, botão, link
 * secundário, selo e os respiros entre eles.
 *
 * Serve de teto para o vídeo em tela baixa (ver `maxWidth` no slot). É o único
 * número medido a olho desta dobra, e ele erra para o lado seguro: reservar
 * demais encolhe o vídeo alguns pixels, reservar de menos deixa o vídeo passar
 * por cima do botão de doar — que foi o bug que este valor existe para evitar.
 *
 * Medido com o texto todo visível (celular alto, onde a reserva é maior): ~101px
 * de manchete + ~66px de linha de apoio + 42px de botão + ~60px de link e selo
 * + ~50px de respiros + ~30px de padding ≈ 349px. 20rem (320px) fica logo
 * abaixo disso porque em tela baixa a linha de apoio e o selo somem sozinhos.
 */
const RESERVA_SEM_VIDEO = "20rem";

export function Hero() {
  /*
   * Quantas vezes o vídeo é mais largo que alto. Com o VTurb no ar, sai do
   * `ratio` do player (altura em % da largura); sem ele, do `aspect` do poster.
   * Um número só alimenta o formato do slot **e** o teto de largura — assim os
   * dois não têm como sair de sincronia.
   */
  const [largura, altura] = heroVideo.aspect.split("/").map(Number);
  const razao = heroVideo.vturb ? 100 / heroVideo.vturb.ratio : largura / altura;

  return (
    <section id="topo" className="screen-section surface-alt relative overflow-hidden">
      <PawTrails />

      {/*
        `justify-center` + slot do vídeo que não cresce: a pilha inteira
        (texto → vídeo → CTA → selo) fica junta e o que sobra da tela vira
        respiro em cima e embaixo, em partes iguais.

        Antes o slot do vídeo era `flex: 1 1 auto` e engolia toda a folga da
        dobra sozinho — no celular isso abria ~130px de vazio entre o vídeo e o
        botão de doar, e a pessoa lia a dobra como se o CTA não existisse.
      */}
      <div className="container-narrow relative flex h-full max-w-[620px] flex-col items-stretch justify-center gap-[clamp(0.625rem,1.4vh,1rem)] py-[clamp(0.75rem,1.8vh,1.25rem)]">
        <Reveal className="flex flex-col items-center gap-2 text-center">
          {/*
            H1 único da página, centralizado em qualquer largura. O segundo
            trecho fica em vermelho: é o fecho da frase, e é o que a pessoa
            retém.

            ── Sobre o tamanho ──────────────────────────────────────────────
            A escala tem `vw` **e** `vh` no termo do meio, e o peso entre os
            dois não é acidental: `vh` pesa mais (1.45) que `vw` (0.95).

            O motivo é que a folga desta dobra não é a mesma em todo lugar.
            Num celular, depois do texto e dos botões sobram ~190px além do que
            o vídeo precisa — dá para crescer à vontade. Num notebook de
            1280×800 a folga já é zero: a largura é grande (o que infla o `vw`)
            mas a altura não acompanha, e cada pixel de fonte ali sai do vídeo.
            Pesar `vh` faz o título crescer onde sobra altura e se conter onde
            não sobra.

            Resultado medido: +22% no celular, +5~7% no notebook, +14% em tela
            grande — com o vídeo continuando quadrado (proporção 1.00 a 1.08)
            em todas elas. Piso 24px, teto 48px.
          */}
          <h1 className="text-[clamp(1.5rem,0.875rem+0.95vw+1.45vh,3rem)] font-extrabold leading-[1.12] text-ink-900">
            {heroCopy.headline}{" "}
            <span className="text-action">{heroCopy.headlineAccent}</span>
          </h1>

          {/* Em tela baixa a linha de apoio sai: ela custa ~40px que fazem
              diferença no vídeo, e a manchete sozinha já entrega o essencial.
              `@media` por altura, não por largura — o que aperta aqui é a
              altura da janela. O corte subiu para 820px junto com o resto do
              texto: o objetivo é o vídeo ficar com a altura, não o texto. */}
          {/* Escala só por `vh`: a largura desta linha já é limitada pelo
              `52ch`, então `vw` aqui não mudaria nada de útil — só a altura da
              janela decide quanto ela pode crescer. Piso 14px, teto 18px. */}
          <p className="mx-auto hidden max-w-[52ch] text-[clamp(0.875rem,0.4rem+1.05vh,1.125rem)] leading-[1.5] text-ink-600 [@media(min-height:820px)]:block">
            {heroCopy.subheadline}
          </p>
        </Reveal>

        {/*
          O player, no formato que vier de `heroVideo.aspect`. Ele é o maior
          elemento da dobra por decisão: é o vídeo de vendas da campanha.

          ── Quem manda no tamanho é a LARGURA ────────────────────────────
          O slot serve só de moldura: quem tem o formato é a caixa de dentro,
          que é `w-full` e tira a altura do `aspect-ratio`.

          `flex-1` saiu daqui (era `screen-section__flex`). Crescer fazia o
          slot absorver toda a folga da dobra e jogar o botão de doar para
          longe do vídeo. Agora ele não cresce: em tela alta o vídeo fica no
          tamanho natural e a folga vira respiro dividido pelo `justify-center`
          do container.

          ── O teto em tela baixa é de LARGURA, não de altura ─────────────
          Um `max-height` cortaria o vídeo pela borda de baixo: o player do
          VTurb tira a própria altura de um `padding-top` em %, então limitar a
          altura da moldura não encolhe o vídeo, só esconde um pedaço dele.

          Limitando a **largura** o formato é respeitado: menos largura, menos
          altura na mesma proporção, e o vídeo inteiro continua à vista. O teto
          é a altura que sobra da dobra (`100svh` menos `RESERVA_SEM_VIDEO`)
          convertida em largura pela `razao`. Em tela alta esse teto é maior que
          a coluna e não faz nada; em tela baixa ele é quem manda.

          No celular o vídeo sai da coluna de texto: o `-mx-5` está no slot (e
          não na caixa) justamente para o teto de largura poder encolher a caixa
          mantendo-a centralizada — com a margem negativa na caixa, ela encolhia
          para a esquerda.
        */}
        <div className="-mx-5 flex min-h-0 shrink items-center justify-center sm:mx-0">
          <Reveal
            delay={1}
            /* Com o VTurb no ar, o formato do slot é o do próprio player
               (`ratio` é altura em % da largura): moldura e vídeo com a mesma
               proporção é o que impede o corte na borda de baixo. */
            style={{
              aspectRatio: heroVideo.vturb
                ? `100 / ${heroVideo.vturb.ratio}`
                : heroVideo.aspect,
              maxWidth: `calc((100svh - ${RESERVA_SEM_VIDEO}) * ${razao})`,
            }}
            className="relative w-full overflow-hidden rounded-md border border-ink-900/10 bg-ink-900/5 shadow"
          >
            {heroVideo.vturb ? (
              <VturbPlayer
                playerId={heroVideo.vturb.playerId}
                scriptSrc={heroVideo.vturb.scriptSrc}
                smartplayerSrc={heroVideo.vturb.smartplayerSrc}
                streamSrc={heroVideo.vturb.streamSrc}
                ratio={heroVideo.vturb.ratio}
              />
            ) : heroVideo.url ? (
              <video
                src={heroVideo.url}
                poster={heroVideo.poster.src}
                controls
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <>
                <Image
                  src={heroVideo.poster.src}
                  alt={heroVideo.poster.alt}
                  fill
                  priority
                  sizes="(min-width: 640px) 620px, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-night/40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
                  <span className="flex h-[clamp(2.75rem,6vh,3.75rem)] w-[clamp(2.75rem,6vh,3.75rem)] shrink-0 items-center justify-center rounded-full bg-surface text-action shadow">
                    <IconPlay size={22} />
                  </span>
                  <span className="text-[clamp(0.8125rem,1.5vh,1rem)] font-extrabold leading-snug text-white drop-shadow">
                    {heroVideo.label}
                  </span>
                </div>
              </>
            )}
          </Reveal>
        </div>

        <Reveal delay={2} className="flex flex-col gap-[clamp(0.5rem,1.1vh,0.75rem)]">
          {/* Vai direto para a seção de ração, e não para um modal de valores:
              o que esta página vende é kg de ração, e é lá que a pessoa vê
              quantos animais cada faixa alimenta. */}
          <a
            href={RACAO_HREF}
            className="inline-flex min-h-[clamp(2.625rem,4.8vh,3.125rem)] w-full items-center justify-center gap-2 rounded-full bg-donate px-6 text-[clamp(0.8125rem,1.4vh,0.9375rem)] font-extrabold uppercase tracking-[0.03em] text-donate-ink shadow-[0_10px_30px_-8px_rgba(27,138,75,.55)] transition-colors hover:bg-donate-hover"
          >
            <IconHeart size={16} />
            {heroCopy.ctaPrimary}
          </a>

          {/* Secundário e selo na mesma linha: separados, eram duas alturas
              gastas com o que não é a ação principal da dobra. */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
            <a
              href="#abrigos"
              className="inline-flex items-center gap-1 text-[12px] font-extrabold text-ink-600 transition-colors hover:text-action"
            >
              {heroCopy.ctaSecondary}
              <IconArrowRight size={14} />
            </a>
            <span aria-hidden="true" className="hidden text-ink-300 [@media(min-height:700px)]:inline">
              ·
            </span>
            <span className="hidden items-center gap-1 text-[12px] font-semibold text-ink-600 [@media(min-height:700px)]:inline-flex">
              <IconShield size={14} className="shrink-0 text-donate" />
              {heroCopy.seal}
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
