import { impactCompare } from "@/content/v1/landing";
import { DonateButton } from "../DonateButton";
import { IconAlert, IconArrowRight, IconCheck, IconClose } from "../ui/Icons";
import { Reveal } from "../ui/Reveal";
import { SectionHead } from "../ui/SectionHead";

/**
 * A comparação: o que acontece sem apoio, o que acontece com ele.
 *
 * Duas colunas lado a lado no desktop e empilhadas no celular, em vez de uma
 * lista corrida de seis itens — o contraste é o argumento, e ele só existe se
 * os dois lados forem lidos como blocos opostos.
 *
 * O vermelho vem primeiro (é o estado atual) e o verde depois, na mesma cor do
 * botão de doar: a pessoa associa a saída à ação sem a página explicar.
 */
export function Impacto() {
  return (
    <section id="impacto" className="py-[clamp(2.5rem,6vh,4.5rem)]">
      <div className="container-narrow flex max-w-[660px] flex-col gap-6">
        <SectionHead
          icon={IconAlert}
          title={impactCompare.title}
          lead={impactCompare.intro}
          align="left"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Reveal className="flex h-full flex-col gap-3 rounded-md border border-ink-900/[.08] bg-ink-900/[.03] p-4">
            <h3 className="flex items-center gap-2 text-[14px] font-extrabold text-ink-900">
              <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-action text-action-ink">
                <IconClose size={14} />
              </span>
              {impactCompare.withoutTitle}
            </h3>
            <ul className="flex flex-col gap-2">
              {impactCompare.without.map((text) => (
                <li key={text} className="flex gap-2 text-[14px] leading-[1.5] text-ink-600">
                  <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-action/60" />
                  {text}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal
            delay={1}
            className="flex h-full flex-col gap-3 rounded-md border border-donate/25 bg-donate/[.07] p-4"
          >
            <h3 className="flex items-center gap-2 text-[14px] font-extrabold text-ink-900">
              <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-donate text-donate-ink">
                <IconCheck size={14} />
              </span>
              {impactCompare.withTitle}
            </h3>
            <ul className="flex flex-col gap-2">
              {impactCompare.with.map((text) => (
                <li key={text} className="flex gap-2 text-[14px] leading-[1.5] text-ink-600">
                  <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-donate/70" />
                  {text}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal className="flex flex-col gap-4">
          <p className="max-w-[62ch] text-[15px] font-semibold leading-[1.6] text-ink-900">
            {impactCompare.closing}
          </p>

          <DonateButton className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-donate px-6 text-[15px] font-extrabold uppercase tracking-[0.03em] text-donate-ink shadow-[0_10px_30px_-8px_rgba(27,138,75,.5)] transition-colors hover:bg-donate-hover sm:w-auto sm:self-start sm:px-8">
            Escolher minha doação
            <IconArrowRight size={18} />
          </DonateButton>
        </Reveal>
      </div>
    </section>
  );
}
