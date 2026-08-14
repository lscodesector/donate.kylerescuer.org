import type { ComponentType, SVGProps } from "react";
import { trustStrip } from "@/content/landing";
import { IconBowl, IconCheck, IconFile, IconHome, IconPixMark, IconShield, IconWhatsApp } from "../ui/Icons";
import { Reveal } from "../ui/Reveal";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const ICONS: Record<string, IconComponent> = {
  shield: IconShield,
  file: IconFile,
  whatsapp: IconWhatsApp,
  pix: IconPixMark,
  bowl: IconBowl,
  home: IconHome,
};

/**
 * Faixa curta de confiança, logo depois do hero.
 *
 * Vem cedo de propósito: a objeção "posso confiar nisso?" aparece no mesmo
 * instante em que a pessoa vê um pedido de dinheiro. São itens escaneáveis,
 * sem parágrafo - cada um é verificável em outro ponto da própria página.
 */
export function TrustStrip() {
  return (
    <section className="border-y border-ink-900/10 bg-surface py-6">
      {/* Centralizada em qualquer largura: são cinco selos curtos numa faixa
          baixa, e centralizados eles lêem como um bloco só. Alinhados à
          esquerda, a última linha sobrava no meio da faixa. */}
      <div className="container-narrow flex max-w-[660px] flex-col items-center gap-3 text-center">
        <Reveal className="text-fs15 font-extrabold text-ink-900">{trustStrip.title}</Reveal>

        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {trustStrip.items.map((item) => {
            const Icon = ICONS[item.icon] ?? IconCheck;
            return (
              <li
                key={item.label}
                className="inline-flex items-center gap-1.5 text-fs13 font-semibold text-ink-600"
              >
                <Icon size={15} className="shrink-0 text-donate" />
                {item.label}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
