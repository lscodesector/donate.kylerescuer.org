import { copy, formatBRL, monthlyCosts, monthlyCostsTotal } from "@/content/landing";
import { IconChart } from "../ui/Icons";
import { ImpactStats } from "../ui/ImpactStats";
import { Reveal } from "../ui/Reveal";
import { SectionHead } from "../ui/SectionHead";

/**
 * Para onde vai o dinheiro - a conta mensal da rede, em reais.
 *
 * É a seção da v1 reproduzida aqui: mesma cabeça (ícone de barras, título à
 * esquerda) e mesma tabela de duas colunas, rótulo à esquerda e valor à
 * direita. Foi decisão de campanha manter as duas versões idênticas nesta
 * parte - é a única seção da v2 que não usa a cabeça centralizada do resto da
 * página, e é por isso que `SectionHead` ainda aceita `icon` e `align`.
 *
 * Tabela, e não lista de cards: são pares rótulo/valor lidos em coluna, e é o
 * alinhamento à direita que deixa os valores comparáveis de relance.
 *
 * O total é somado dos itens (`monthlyCostsTotal`), então a linha final nunca
 * fica fora de sincronia com a lista acima.
 *
 * Bloco informativo, sem animação nos números: numa página que pede dinheiro,
 * número que se anima parece propaganda. Quem conta do zero é só o
 * `ImpactStats` logo abaixo, que fala de vidas, não de reais.
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
            {/* Só para leitor de tela: na tela, a linha de apoio da seção já
                explica de que custos a tabela está falando. */}
            <caption className="sr-only">{copy.transparencia.costsCaption}</caption>
            <tbody>
              {monthlyCosts.items.map((item) => (
                <tr key={item.label} className="border-b border-ink-900/[.07]">
                  <th scope="row" className="px-4 py-3 text-fs14 font-normal text-ink-600">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={`h-2 w-2 shrink-0 rounded-full ${item.dot}`}
                      />
                      {item.label}
                    </span>
                  </th>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-fs14 font-extrabold tabular-nums text-ink-900">
                    {formatBRL(item.cents)}
                  </td>
                </tr>
              ))}

              <tr className="bg-surface-alt">
                <th scope="row" className="px-4 py-4 text-fs14 font-extrabold text-ink-900">
                  {copy.transparencia.totalLabel}
                </th>
                <td className="whitespace-nowrap px-4 py-4 text-right text-[clamp(0.93rem,0.837rem+0.372vw,1.163rem)] font-extrabold tabular-nums text-action">
                  {formatBRL(monthlyCostsTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </Reveal>

        <ImpactStats />
      </div>
    </section>
  );
}
