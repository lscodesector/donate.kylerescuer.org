import Image from "next/image";
import { copy, formatBRL, rationTiers } from "@/content/landing";
import { DonateTierButton } from "../checkout/DonateTierButton";
import { MonthlyDonateButton } from "../MonthlyDonateButton";
import { IconBowl, IconHeart, IconRepeat } from "../ui/Icons";
import { Reveal } from "../ui/Reveal";
import { SectionHead } from "../ui/SectionHead";

/**
 * A seção de conversão.
 *
 * A hierarquia dentro do card é valor → quantidade → impacto: o valor é o que
 * a pessoa está decidindo, então ele é o maior elemento. A estimativa vem com
 * "aproximadamente" e "cerca de" porque é uma referência de consumo, não uma
 * garantia — e a página não deve prometer o que não pode comprovar.
 *
 * As faixas, preços e estimativas vêm de `rationTiers` em `content/landing.ts`.
 */
export function Racao() {
  return (
    <section id="racao" className="surface-alt py-[clamp(2.5rem,6vh,4.5rem)]">
      <div className="container-narrow flex max-w-[660px] flex-col gap-[clamp(1.5rem,4vh,2.25rem)]">
        <SectionHead
          eyebrow={copy.racao.eyebrow}
          title={copy.racao.title}
          lead={copy.racao.lead}
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {rationTiers.map((tier, i) => {
            const price = formatBRL(tier.priceCents);
            return (
              <Reveal
                key={tier.id}
                delay={(i % 3) as 0 | 1 | 2}
                className={`relative flex flex-col rounded-md border bg-surface shadow ${
                  tier.popular ? "border-donate ring-2 ring-donate/30" : "border-ink-900/10"
                }`}
              >
                {tier.popular && (
                  <span className="absolute left-1/2 top-3 z-10 max-w-[calc(100%-24px)] -translate-x-1/2 truncate rounded-full bg-donate px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] text-donate-ink shadow">
                    Mais escolhido
                  </span>
                )}

                {/*
                  Quadrado e branco, e não `16/10` sobre `surface-alt`: as
                  fotos são embalagens em pé, recortadas em fundo branco. Num
                  slot deitado sobrava faixa vazia dos dois lados; no quadrado
                  o saco ocupa a moldura inteira.

                  `object-contain` é obrigatório aqui — com `object-cover` o
                  navegador preenche o quadrado cortando o saco pelo topo e
                  pela base, e a foto de 150kg (seis sacos lado a lado) perdia
                  metade da fileira. Como todos os arquivos já saem no mesmo
                  900×900 (ver `rationTiers`), `contain` não deixa sobra.
                */}
                <div className="relative aspect-square w-full overflow-hidden rounded-t-md bg-white">
                  {tier.image ? (
                    <Image
                      src={tier.image.src}
                      alt={tier.image.alt}
                      fill
                      sizes="(min-width: 640px) 300px, 45vw"
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 border-2 border-dashed border-ink-900/15 text-ink-300">
                      <IconBowl size={24} />
                      <span className="px-2 text-center text-[11px] font-semibold leading-tight">
                        Foto do saco de {tier.kg}kg
                      </span>
                    </div>
                  )}
                </div>

                {/* Centralizado em qualquer largura, como os cards de adoção:
                    o cartão de faixa tem a mesma largura estreita no celular e
                    no desktop (a grade é de duas colunas nos dois), então não
                    existe "versão desktop" dele para alinhar à esquerda. */}
                <div className="flex flex-1 flex-col items-center gap-1.5 p-4 text-center">
                  {/* Valor primeiro: é o que a pessoa está decidindo. */}
                  <span className="text-[clamp(1.25rem,1.05rem+0.7vw,1.625rem)] font-extrabold leading-[1.1] text-ink-900">
                    {price}
                  </span>

                  <span className="text-[13px] font-extrabold uppercase tracking-[0.05em] text-accent">
                    {tier.kg} kg de ração
                  </span>

                  <p className="text-[13px] leading-[1.45] text-ink-600">
                    Ajuda a alimentar aproximadamente{" "}
                    <strong className="font-semibold text-ink-900">{tier.animals} animais</strong> por
                    cerca de{" "}
                    <strong className="font-semibold text-ink-900">{tier.days} dias</strong>.
                  </p>

                  {/*
                    O rótulo é só o peso — "Doar 5kg", "Doar 150kg". O preço
                    saiu daqui: ele já está no topo do cartão, em corpo maior,
                    e repetido dentro do botão criava a linha comprida que
                    obrigava o `truncate` a cortar justamente o valor. Peso é
                    também o que diferencia um cartão do outro na grade.

                    Abre o checkout em modal, sem sair da página; o `href` para
                    `/doar/<faixa>` continua ali como caminho sem JavaScript.
                  */}
                  <DonateTierButton
                    tier={tier}
                    className="mt-auto inline-flex w-full min-h-[48px] items-center justify-center gap-1.5 rounded-sm bg-donate px-2 text-[14px] font-extrabold uppercase tracking-[0.02em] text-donate-ink transition-colors hover:bg-donate-hover"
                  >
                    <IconHeart size={15} />
                    Doar {tier.kg}kg
                  </DonateTierButton>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Doação mensal — o único CTA da página que abre o modal em vez de
            rolar para cá.

            O botão "Escolher outro valor" que ficava ao lado saiu: ele mandava
            para o Pix de valor livre, que já está logo abaixo nesta mesma
            página, e dividia o clique entre duas saídas que resolvem a mesma
            coisa. Sem ele, o bloco tem uma pergunta e uma resposta.

            O Pix que sai do modal cobra só o primeiro mês, e tanto o modal
            quanto o checkout dizem isso — a cobrança automática ainda depende
            de um gateway. */}
        <Reveal
          id="mensal"
          className="flex flex-col items-center gap-3 rounded-md border border-ink-900/10 bg-surface p-4 text-center sm:items-start sm:p-5 sm:text-left"
        >
          <div className="flex flex-col gap-1">
            <h3 className="flex items-center justify-center gap-2 text-[17px] font-extrabold text-ink-900 sm:justify-start">
              <IconRepeat size={18} className="shrink-0 text-accent" />
              {copy.mensal.title}
            </h3>
            <p className="text-[14px] leading-[1.55] text-ink-600">{copy.mensal.text}</p>
          </div>

          <MonthlyDonateButton className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-action px-5 text-[14px] font-extrabold uppercase tracking-[0.02em] text-white transition-colors hover:bg-action-hover">
            <IconHeart size={16} />
            {copy.mensal.cta}
          </MonthlyDonateButton>
        </Reveal>
      </div>
    </section>
  );
}
