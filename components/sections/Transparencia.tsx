import { copy, formatBRL, monthlyCosts, monthlyCostsTotal } from "@/content/landing";
import { IconChart } from "../ui/Icons";
import { Reveal } from "../ui/Reveal";
import { SectionHead } from "../ui/SectionHead";

/**
 * Para onde vai o dinheiro.
 *
 * Bloco informativo, sem animação nos números: numa página que pede dinheiro,
 * número que se anima parece propaganda. O total é somado a partir dos itens
 * (`monthlyCostsTotal`), então a linha final nunca fica fora de sincronia com
 * a lista acima.
 */
export function Transparencia() {
  return (
    <section id="transparencia" className="py-[clamp(2.5rem,6vh,4.5rem)]">
      <div className="container-narrow flex max-w-[660px] flex-col gap-5">
        <SectionHead
          icon={IconChart}
          eyebrow={copy.transparencia.eyebrow}
          title={copy.transparencia.title}
          lead={copy.transparencia.lead}
          align="left"
        />

        <Reveal className="overflow-hidden rounded-md border border-ink-900/10 shadow">
          <table className="w-full border-collapse bg-surface text-left">
            <caption className="sr-only">
              Custos mensais da rede de abrigos apoiada pela SOS Animal Help
            </caption>
            <tbody>
              {monthlyCosts.items.map((item) => (
                <tr key={item.label} className="border-b border-ink-900/[.07]">
                  <th scope="row" className="px-4 py-3 text-[14px] font-normal text-ink-600">
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${item.dot}`} />
                      {item.label}
                    </span>
                  </th>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-[14px] font-extrabold tabular-nums text-ink-900">
                    {formatBRL(item.cents)}
                  </td>
                </tr>
              ))}
              <tr className="bg-surface-alt">
                <th scope="row" className="px-4 py-4 text-[14px] font-extrabold text-ink-900">
                  {copy.transparencia.totalLabel}
                </th>
                <td className="whitespace-nowrap px-4 py-4 text-right text-[clamp(1rem,0.9rem+0.4vw,1.25rem)] font-extrabold tabular-nums text-action">
                  {formatBRL(monthlyCostsTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}
