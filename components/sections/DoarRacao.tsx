import Image from "next/image";
import { copy, impactCompare } from "@/content/landing";
import { RacaoDonateButton } from "../RacaoDonateButton";
import { IconCheck, IconClose, IconHeart, IconShield } from "../ui/Icons";
import { Reveal } from "../ui/Reveal";
import { SectionHead } from "../ui/SectionHead";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  "Como ajudar" - o argumento e o pedido, numa seção só                ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Esta seção era duas: `Impacto` ("o que muda quando a ração chega", com o
 * contraste em dois cards) e `DoarRacao` (o pedido). Elas foram fundidas, e a
 * ordem de leitura agora é a de um argumento inteiro:
 *
 *   o pedido → o que acontece sem ração → o que acontece com ela → o botão
 *
 * Separadas, cada uma terminava no próprio CTA de "Doar ração" e havia mais um
 * botão de doação mensal logo abaixo: três pedidos em duas seções vizinhas,
 * todos para a mesma coisa. O argumento do contraste ficava a uma seção de
 * distância do botão que ele existe para justificar, e quem lia os dois cards
 * tinha que rolar de volta - ou encontrar o terceiro botão e não saber se era
 * outra coisa.
 *
 * Agora é **um botão só**, no fim, logo depois da frase que fecha o argumento
 * ("Um saco de ração não alimenta um animal. Alimenta o abrigo inteiro por
 * alguns dias - e é isso que se compra aqui").
 *
 * ── O que saiu junto ──────────────────────────────────────────────────────
 * O bloco de doação mensal que ficava no fim daqui, com o botão próprio e a
 * âncora `#mensal`. A recorrência não sumiu da página - ela é o destaque do
 * menu de frentes (`CausasModal`), que é onde a decisão "de quanto em quanto
 * tempo" acontece agora, e continua dentro do modal de ração. O que ela deixou
 * de ser é um segundo botão competindo com o pedido desta seção.
 *
 * O id continua `racao` porque é o destino de `RACAO_HREF` - cabeçalho, hero,
 * rodapé, fechamento e o checkout sem JavaScript apontam para cá.
 */
export function DoarRacao() {
  return (
    <section id="racao" className="relative overflow-hidden py-[clamp(2.5rem,6vh,4.5rem)]">
      {/* Foto de fundo bem apagada: dá matéria à seção sem competir com o
          conteúdo, que é o que interessa aqui. */}
      <div aria-hidden="true" className="absolute inset-0">
        <Image
          src="/sos-animal/abrigo-patio-caes.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-surface/92" />
      </div>

      <div className="container-narrow relative flex max-w-[660px] flex-col gap-[clamp(1.5rem,4vh,2.25rem)]">
        <SectionHead
          eyebrow={copy.doar.eyebrow}
          title={copy.doar.title}
          lead={copy.doar.lead}
        />

        {/* ── O contraste ──────────────────────────────────────────────
            `h3`, e não a `SectionHead` que este bloco usava quando era seção
            própria: o `h2` da seção já é o título acima, e dois `h2` no mesmo
            bloco quebram a escada de cabeçalhos para quem navega por elas. */}
        <Reveal className="flex flex-col items-center gap-3 text-center">
          <h3 className="text-[clamp(1.125rem,1rem+0.7vw,1.5rem)] font-extrabold leading-[1.25] text-ink-900">
            {impactCompare.title}
          </h3>
          <p className="max-w-[62ch] text-[16px] leading-[1.6] text-ink-600">
            {impactCompare.intro}
          </p>
        </Reveal>

        {/* Os dois cards, exatamente como eram: duas colunas lado a lado no
            desktop e empilhadas no celular, em vez de uma lista corrida de
            oito itens - o contraste é o argumento, e ele só existe se os dois
            lados forem lidos como blocos opostos.

            O vermelho vem primeiro (é o estado atual) e o verde depois, na
            mesma cor do botão de doar: a pessoa associa a saída à ação sem a
            página explicar. */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Reveal className="flex h-full flex-col gap-3 rounded-md border border-ink-900/[.08] bg-ink-900/[.03] p-4">
            <h4 className="flex items-center justify-center gap-2 text-[14px] font-extrabold text-ink-900 sm:justify-start">
              <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-action text-action-ink">
                <IconClose size={14} />
              </span>
              {impactCompare.withoutTitle}
            </h4>
            {/* No celular o item é uma frase centralizada e o ponto some: um
                marcador à esquerda de texto centralizado fica boiando fora da
                coluna. A partir de `sm` ele volta, e a lista lê como lista. */}
            <ul className="flex flex-col gap-2">
              {impactCompare.without.map((text) => (
                <li
                  key={text}
                  className="flex justify-center gap-2 text-center text-[14px] leading-[1.5] text-ink-600 sm:justify-start sm:text-left"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[7px] hidden h-1.5 w-1.5 shrink-0 rounded-full bg-action/60 sm:block"
                  />
                  {text}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal
            delay={1}
            className="flex h-full flex-col gap-3 rounded-md border border-donate/25 bg-donate/[.07] p-4"
          >
            <h4 className="flex items-center justify-center gap-2 text-[14px] font-extrabold text-ink-900 sm:justify-start">
              <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-donate text-donate-ink">
                <IconCheck size={14} />
              </span>
              {impactCompare.withTitle}
            </h4>
            <ul className="flex flex-col gap-2">
              {impactCompare.with.map((text) => (
                <li
                  key={text}
                  className="flex justify-center gap-2 text-center text-[14px] leading-[1.5] text-ink-600 sm:justify-start sm:text-left"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[7px] hidden h-1.5 w-1.5 shrink-0 rounded-full bg-donate/70 sm:block"
                  />
                  {text}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* A frase que fecha o argumento, e logo abaixo o único botão da
            seção. Juntos de propósito: é a frase que dá sentido ao clique. */}
        <Reveal delay={2} className="flex flex-col items-center gap-4 text-center">
          <p className="max-w-[62ch] text-[15px] font-semibold leading-[1.6] text-ink-900">
            {impactCompare.closing}
          </p>

          <RacaoDonateButton className="inline-flex min-h-[60px] w-full items-center justify-center gap-2.5 rounded-full bg-donate px-8 text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] font-extrabold uppercase tracking-[0.03em] text-donate-ink shadow-[0_12px_34px_-10px_rgba(27,138,75,.6)] transition-colors hover:bg-donate-hover">
            <IconHeart size={20} />
            {copy.doar.cta}
          </RacaoDonateButton>

          {/* Linha de confiança, não um segundo CTA: é a última objeção
              ("é seguro?") respondida no ponto em que ela aparece. */}
          <p className="flex flex-wrap items-center justify-center gap-x-1.5 text-center text-[12px] font-semibold text-ink-600">
            <IconShield size={14} className="shrink-0 text-donate" />
            {copy.doar.seal}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
