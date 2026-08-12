import { heroCopy, heroVideo, historiaPhotos } from "@/content/landing";
import { DonateMenuButton } from "../DonateMenuButton";
import { CampaignProgress } from "../ui/CampaignProgress";
import { IconArrowRight, IconHeart, IconShield } from "../ui/Icons";
import { PawTrails } from "../ui/PawTrails";
import { PhotoSlideshow } from "../ui/PhotoSlideshow";
import { Reveal } from "../ui/Reveal";
import { VturbPlayer } from "../ui/VturbPlayer";

/**
 * Primeira dobra da campanha, e ela fecha em **uma tela**:
 *
 *   manchete → linha de apoio → vídeo → os dois botões → selo
 *
 * ── O VSL voltou para o miolo da dobra ────────────────────────────────────
 * No site institucional este espaço era um slide de fotos: um vídeo de vendas
 * é o argumento de uma *campanha*, e ali a página existia para apresentar a
 * organização. Aqui é campanha de novo, e o vídeo é o argumento - é o Caio
 * contando a própria história, que é o que faz alguém doar. O slide continua
 * como plano B: com `heroVideo.vturb: null` a dobra cai para as fotos sozinha,
 * sem ninguém mexer neste arquivo.
 *
 * ── Quem cede altura é o vídeo ────────────────────────────────────────────
 * A seção tem altura travada (`.screen-section` = 100svh menos a barra fixa),
 * então a soma texto + botões + selo é fixa e o vídeo fica com a sobra. A
 * diferença para o slide de fotos é que o player **tem proporção fixa**
 * (`heroVideo.aspect`) e não pode ser recortado: por isso o quadro limita
 * largura *e* altura, e o que sobrar vira respiro em vez de esticar o vídeo.
 *
 * O `min-h` de 560px é o limite dessa conta: abaixo disso (celular deitado,
 * basicamente) não sobra altura para o vídeo existir, a seção para de encolher
 * e a página rola um pouco. Rolar é melhor do que espremer o player.
 */
export function Hero() {
  const { vturb } = heroVideo;

  return (
    /*
      Altura **mínima** de uma tela, e não travada nela (`.screen-section`).
      A diferença importa porque quem ocupa o miolo agora é um vídeo, não uma
      foto: a foto preenchia qualquer formato de moldura com `object-cover`, e
      o player tem proporção fixa e não pode ser recortado. Com a altura
      travada, o que sobrava depois da conta virava um vão morto em volta do
      vídeo; com `min-h`, a sobra vira respiro dividido igualmente em cima e
      embaixo (é o `justify-center`), e em tela baixa a dobra cresce e a página
      rola em vez de espremer o player.
    */
    <section
      id="topo"
      className="surface-alt relative flex min-h-[max(560px,calc(100svh-var(--header-h)))] flex-col justify-center overflow-hidden"
    >
      <PawTrails />

      <div className="container-narrow relative flex h-full max-w-[860px] flex-col items-center justify-center gap-[clamp(0.5rem,1.4vh,1rem)] py-[clamp(0.75rem,2vh,1.5rem)] text-center">
        <Reveal className="flex flex-col items-center gap-2">
          {/*
            H1 único da página. A escala tem `vw` e `vh` no mesmo termo: a
            largura manda no tamanho do cartaz, mas cada pixel de fonte aqui
            sai da altura do vídeo, então a altura da janela precisa ter voz.
          */}
          <h1 className="max-w-[24ch] text-balance text-[clamp(1.375rem,0.95rem+1.1vw+0.5vh,2.25rem)] font-extrabold leading-[1.15] text-ink-900">
            {heroCopy.headline}{" "}
            <span className="text-action">{heroCopy.headlineAccent}</span>
          </h1>

          {/* Some em tela baixa: é a linha que a manchete já resume, e o espaço
              dela vale mais para o vídeo. */}
          <p className="hidden max-w-[46ch] text-[clamp(0.875rem,1.6vh,1rem)] leading-[1.5] text-ink-600 [@media(min-height:700px)]:block">
            {heroCopy.lead}
          </p>
        </Reveal>

        {/*
          `flex-initial` (`flex: 0 1 auto`), e não `flex-1`: o slot toma a
          altura natural do vídeo e **encolhe** se precisar, mas não cresce.
          Com `flex-1` ele engolia toda a sobra da dobra e centralizava o
          player dentro dela - o vídeo ficava do mesmo tamanho e o que aparecia
          era um buraco em volta dele. Sem crescer, a sobra volta para o
          `justify-center` da seção e vira respiro em cima e embaixo da pilha
          inteira.
        */}
        <Reveal
          delay={1}
          className="flex min-h-0 w-full flex-initial items-center justify-center"
        >
          {vturb ? (
            /*
              O quadro do player. `aspect-ratio` + `max-height: 100%` é o par
              que mantém a proporção do vídeo sem estourar a dobra: a largura
              cresce até 560px, a altura para no que o slot tem, e quem chegar
              primeiro no limite manda.
            */
            <div
              className="w-full max-w-[560px]"
              style={{ aspectRatio: heroVideo.aspect, maxHeight: "100%" }}
            >
              <VturbPlayer
                playerId={vturb.playerId}
                scriptSrc={vturb.scriptSrc}
                smartplayerSrc={vturb.smartplayerSrc}
                streamSrc={vturb.streamSrc}
                ratio={vturb.ratio}
              />
            </div>
          ) : (
            <PhotoSlideshow
              photos={historiaPhotos}
              label={heroCopy.headline}
              controls
              priority
              interval={4200}
              sizes="(min-width: 600px) 520px, 100vw"
              className="h-full max-h-[640px] w-full max-w-[520px] rounded-md border border-ink-900/10 shadow"
            />
          )}
        </Reveal>

        <Reveal
          delay={2}
          className="flex w-full flex-col items-center gap-[clamp(0.5rem,1.2vh,0.75rem)]"
        >
          {/* A barra de meta, na mesma largura dos botões logo abaixo: os dois
              formam uma coluna só sob o vídeo. Vem antes deles de propósito -
              é o argumento ("falta isto") que o botão responde. */}
          <CampaignProgress className="max-w-[520px]" />
          {/*
            Os dois botões, na mesma linha e na mesma medida - só a pintura
            muda. No celular eles empilham, porque lado a lado numa largura de
            350px o rótulo quebraria em duas linhas.
          */}
          <div className="flex w-full max-w-[520px] flex-col items-stretch gap-[clamp(0.5rem,1.2vh,0.75rem)] sm:flex-row">
            {/* Abre o menu de frentes (`CausasModal`); sem JavaScript continua
                sendo um link para o bloco de doação. */}
            <DonateMenuButton className="inline-flex min-h-[clamp(2.875rem,5.2vh,3.25rem)] flex-1 items-center justify-center gap-2 rounded-full bg-donate px-5 text-[clamp(0.875rem,1.4vh,0.9375rem)] font-extrabold uppercase tracking-[0.03em] text-donate-ink shadow-[0_10px_30px_-8px_rgba(27,138,75,.55)] transition-colors hover:bg-donate-hover">
              <IconHeart size={17} />
              {heroCopy.ctaPrimary}
            </DonateMenuButton>

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
