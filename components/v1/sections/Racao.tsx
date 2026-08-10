import Image from "next/image";
import Link from "next/link";
import { checkoutHref, copy, formatBRL, rationTiers } from "@/content/v1/landing";
import { DonateButton } from "../DonateButton";
import { IconArrowRight, IconBowl, IconHeart } from "../ui/Icons";
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
          icon={IconBowl}
          eyebrow={copy.racao.eyebrow}
          title={copy.racao.title}
          lead={copy.racao.lead}
          align="left"
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

                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-md bg-surface-alt">
                  {tier.image ? (
                    <Image
                      src={tier.image.src}
                      alt={tier.image.alt}
                      fill
                      sizes="(min-width: 640px) 290px, 45vw"
                      className="object-cover"
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

                <div className="flex flex-1 flex-col gap-1.5 p-4">
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

                  {/* Checkout interno: a pessoa segue no site até o Pix. */}
                  <Link
                    href={checkoutHref(tier.id)}
                    className="mt-auto inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-sm bg-donate px-2 text-[13px] font-extrabold uppercase tracking-[0.02em] text-donate-ink transition-colors hover:bg-donate-hover"
                  >
                    <IconHeart size={15} />
                    <span className="truncate">Doar {price}</span>
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Outro valor e recorrência. A mensal abre o modal já na aba certa;
            o Pix que sai de lá cobra só o primeiro mês, e o próprio checkout
            diz isso — a cobrança automática ainda depende de um gateway. */}
        <Reveal className="flex flex-col gap-3 rounded-md border border-ink-900/10 bg-surface p-4 sm:p-5">
          <div className="flex flex-col gap-1">
            <h3 className="text-[17px] font-extrabold text-ink-900">{copy.outroValor.title}</h3>
            <p className="text-[14px] leading-[1.55] text-ink-600">{copy.outroValor.text}</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {/* Fica no site: o Pix de valor livre está na própria página. */}
            <a
              href="#pix"
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full border-2 border-donate px-5 text-[14px] font-extrabold uppercase tracking-[0.02em] text-donate transition-colors hover:bg-donate/[.08]"
            >
              {copy.outroValor.ctaCustom}
              <IconArrowRight size={16} />
            </a>

            <DonateButton
              freq="mensal"
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-action px-5 text-[14px] font-extrabold uppercase tracking-[0.02em] text-white transition-colors hover:opacity-90"
            >
              <IconHeart size={16} />
              {copy.outroValor.ctaRecurring}
            </DonateButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
