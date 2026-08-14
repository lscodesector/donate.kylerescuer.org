import { copy } from "@/content/landing";
import { DonateMenuButton } from "../DonateMenuButton";
import { MonthlyDonateButton } from "../MonthlyDonateButton";
import { IconArrowRight, IconHeart, IconShield } from "../ui/Icons";
import { Reveal } from "../ui/Reveal";

/**
 * Fechamento. A pessoa já viu o vídeo, as histórias, os valores e a
 * documentação - aqui só faltam os botões, sem nada disputando espaço com eles.
 *
 * ── Fundo branco, e não mais a foto escura ────────────────────────────────
 * A foto de fundo saiu junto com as duas camadas de véu que existiam só para
 * proteger o texto dela. Uma foto no fim da página competia com a decisão que
 * este bloco pede: a essa altura a pessoa já viu seis fotos do Caio e cinco
 * vídeos de protetores, e mais uma imagem aqui só divide a atenção com os dois
 * botões. No branco eles são a única coisa colorida da tela.
 *
 * ── Os dois botões são doação, e a diferença entre eles é a frequência ─────
 * Antes o segundo era "tenho uma dúvida antes de doar", que descia para o FAQ.
 * No fim da página a dúvida já passou - o FAQ está logo acima -, e mandar a
 * pessoa de volta para ler no exato momento em que ela decidiu é oferecer uma
 * saída no lugar de um caminho. Agora os dois pedem a doação: um agora, outro
 * todo mês.
 *
 * O mensal não é o "menor" dos dois: ele tem o mesmo tamanho, o mesmo peso e
 * cor cheia. O que os separa no fundo branco é a pintura - o "escolher um
 * valor" sai em contorno verde (a cor de doação da página) e o mensal em
 * vermelho cheio, que é o par de cores da marca.
 */
export function FinalCta() {
  return (
    <section className="bg-surface py-[clamp(3rem,7vh,5rem)]">
      <div className="container-narrow flex max-w-[660px] flex-col gap-5">
        {/* Uma linha só, centralizada em qualquer largura, como as cabeças de
            seção. `max-w` em `ch` para a frase quebrar em duas linhas curtas no
            desktop em vez de atravessar a coluna inteira. */}
        <Reveal className="flex flex-col gap-4 text-center">
          <h2 className="mx-auto max-w-[24ch] text-balance text-[clamp(1.5rem,1rem+2vw,2.375rem)] font-extrabold leading-[1.15] text-ink-900">
            {copy.final.title}
          </h2>

          {/*
            Lado a lado a partir de `md`, empilhados abaixo disso: são dois
            rótulos longos, e nenhum CTA da página quebra linha
            (`whitespace-nowrap`), então o que não couber estoura para fora do
            botão em vez de descer. Em `sm` (640px) sobravam ~280px por botão e
            "Quero ajudar todo mês" em maiúsculas passa disso numa tela alta,
            onde a fonte vai ao topo do `clamp`; em `md` são ~324px, com folga.
            `flex-1` + `basis-0` dá aos dois exatamente a mesma medida, para que
            nenhum pareça o principal.
          */}
          <div className="flex flex-col gap-3 md:flex-row">
            {/* Abre a tela de valor direto - é o que o rótulo promete. Sem
                JavaScript ele continua sendo um link para o bloco de doação. */}
            <DonateMenuButton className="inline-flex min-h-[56px] flex-1 basis-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-donate bg-surface px-6 text-center text-[clamp(0.9375rem,1.6vh,1.0625rem)] font-extrabold uppercase tracking-[0.03em] text-donate transition-colors hover:bg-donate hover:text-donate-ink">
              {copy.final.ctaPrimary}
              <IconArrowRight size={20} className="shrink-0" />
            </DonateMenuButton>

            {/* Este abre a tela de valor travada na mensal: sem as abas de
                frequência e terminando no checkout de recorrência - ver
                `MonthlyDonateButton`. */}
            <MonthlyDonateButton className="inline-flex min-h-[56px] flex-1 basis-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-action px-6 text-center text-[clamp(0.9375rem,1.6vh,1.0625rem)] font-extrabold uppercase tracking-[0.03em] text-action-ink shadow-[0_10px_30px_-10px_rgba(191,5,33,.5)] transition-colors hover:bg-action-hover">
              <IconHeart size={20} className="shrink-0" />
              {copy.final.ctaSecondary}
            </MonthlyDonateButton>
          </div>

          {/* A mesma linha de confiança que fecha a seção "Como ajudar", agora
              na pintura do fundo claro: cinza com o escudo verde, em vez do
              branco translúcido que ela usava sobre a foto. */}
          <p className="flex flex-wrap items-center justify-center gap-x-1.5 text-center text-[12px] font-semibold text-ink-600">
            <IconShield size={15} className="shrink-0 text-donate" />
            {copy.final.seal}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
