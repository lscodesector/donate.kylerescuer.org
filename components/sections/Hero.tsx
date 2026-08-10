import Image from "next/image";
import { heroCopy, heroVideo } from "@/content/landing";
import { DonateButton } from "../DonateButton";
import { CampaignProgress } from "../ui/CampaignProgress";
import { IconArrowRight, IconHeart, IconPlay, IconShield } from "../ui/Icons";
import { PawTrails } from "../ui/PawTrails";
import { Reveal } from "../ui/Reveal";

/**
 * Primeira dobra: promessa → vídeo → meta → botão → selo, tudo dentro de uma
 * tela (`.screen-section` = 100svh menos a barra fixa).
 *
 * O vídeo é o argumento de venda da campanha, então ele é quem fica com a
 * altura que sobra — e o texto é que cede. Por isso a manchete e a linha de
 * apoio são curtas, a barra de meta usa a variante `compact` e o CTA
 * secundário é um link, não um segundo botão.
 *
 * O tamanho do vídeo não é uma conta fixa: ele é o item flexível da coluna
 * (`.screen-section__flex`) e simplesmente fica com a altura que sobrar depois
 * do texto, da meta e dos botões. `aspect-ratio` converte essa altura em
 * largura, e `max-w-full` impede que ele passe da coluna no celular — onde
 * quem aperta é a largura, não a altura.
 *
 * A vantagem sobre a versão anterior (`min(100svh - 32rem, ...)`) é que aqui
 * não existe constante para desatualizar: mexeu no texto da dobra, o vídeo se
 * reajusta sozinho e a dobra continua fechando em uma tela.
 */
export function Hero() {
  return (
    <section id="topo" className="screen-section surface-alt relative overflow-hidden">
      <PawTrails />

      <div className="container-narrow relative flex h-full max-w-[620px] flex-col items-stretch gap-[clamp(0.5rem,1.1vh,0.75rem)] py-[clamp(0.5rem,1.4vh,1rem)]">
        <Reveal className="flex flex-col gap-1">
          {/* H1 único da página. O segundo trecho fica em vermelho: é o número
              que carrega a urgência, e é o que a pessoa retém. */}
          <h1 className="text-[clamp(1.0625rem,0.85rem+0.95vw,1.5rem)] font-extrabold leading-[1.15] text-ink-900">
            {heroCopy.headline}{" "}
            <span className="text-action">{heroCopy.headlineAccent}</span>
          </h1>

          {/* Em tela baixa a linha de apoio sai: ela custa ~40px que fazem
              diferença no vídeo, e a manchete sozinha já entrega o essencial.
              `@media` por altura, não por largura — o que aperta aqui é a
              altura da janela. O corte subiu para 820px junto com o resto do
              texto: o objetivo é o vídeo ficar com a altura, não o texto. */}
          <p className="hidden max-w-[56ch] text-[clamp(0.75rem,1.2vh,0.875rem)] leading-[1.45] text-ink-600 [@media(min-height:820px)]:block">
            {heroCopy.subheadline}
          </p>
        </Reveal>

        {/* Vídeo quadrado (ver `heroVideo.aspect`), centralizado. Ele é o maior
            elemento da dobra por decisão: é o vídeo de vendas da campanha.

            No celular ele sai da coluna de texto (`-mx-5` anula o padding de
            20px do container, e o teto de largura vira a tela inteira). O
            motivo é que o vídeo é quadrado: preso à coluna, a largura dela
            virava teto de altura, e a altura que o texto cedeu viraria espaço
            vazio em vez de vídeo maior. A partir de `sm` a coluna já é larga o
            bastante e ele volta a se centralizar normalmente. */}
        <Reveal
          delay={1}
          style={{ aspectRatio: heroVideo.aspect }}
          className="screen-section__flex relative -mx-5 min-h-[10rem] w-auto max-h-full max-w-[100vw] self-center overflow-hidden rounded-md border border-ink-900/10 bg-ink-900/5 shadow sm:mx-0 sm:max-w-full"
        >
          {heroVideo.url ? (
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
                sizes="(min-width: 700px) 560px, 90vw"
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

        <Reveal delay={2} className="flex flex-col gap-[clamp(0.5rem,1.1vh,0.75rem)]">
          <CampaignProgress compact />

          <DonateButton className="inline-flex min-h-[clamp(2.625rem,4.8vh,3.125rem)] w-full items-center justify-center gap-2 rounded-full bg-donate px-6 text-[clamp(0.8125rem,1.4vh,0.9375rem)] font-extrabold uppercase tracking-[0.03em] text-donate-ink shadow-[0_10px_30px_-8px_rgba(27,138,75,.55)] transition-colors hover:bg-donate-hover">
            <IconHeart size={16} />
            {heroCopy.ctaPrimary}
          </DonateButton>

          {/* Secundário e selo na mesma linha: separados, eram duas alturas
              gastas com o que não é a ação principal da dobra. */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
            <a
              href="#impacto"
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
