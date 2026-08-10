import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { org, recurringHref, whatsappHref } from "@/content/landing";
import {
  IconArrowRight,
  IconCheck,
  IconHeart,
  IconShare,
  IconWhatsApp,
} from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Obrigado pela sua doação | SOS Animal Help",
  robots: { index: false, follow: false },
};

/**
 * Tela de agradecimento.
 *
 * O pedido de doação mensal vem aqui, e não antes, porque é o único momento em
 * que a pessoa já provou que confia — quem acabou de doar é muito mais
 * receptivo a virar recorrente do que quem ainda está decidindo.
 *
 * A recorrência não é automatizada nesta página: o botão leva ao WhatsApp, que
 * é onde a organização combina isso hoje. É um dos poucos pontos do site que
 * saem para fora, e sai porque do outro lado existe uma pessoa de verdade.
 */
export default function ObrigadoPage() {
  return (
    <main className="surface-alt min-h-svh py-8 md:py-12">
      <div className="container-narrow flex max-w-[620px] flex-col gap-5">
        <div className="flex flex-col items-center gap-4 rounded-md border border-ink-900/10 bg-surface p-6 text-center shadow">
          <span className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-donate text-donate-ink">
            <IconCheck size={32} />
          </span>

          <div className="flex flex-col gap-2">
            <h1 className="text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] font-extrabold leading-[1.15] text-ink-900">
              Obrigado. Sua doação vira ração.
            </h1>
            <p className="mx-auto max-w-[46ch] text-[15px] leading-[1.6] text-ink-600">
              Assim que o Pix for confirmado, o valor entra na compra do próximo lote de ração
              e é direcionado ao abrigo da rede que estiver mais apertado no mês.
            </p>
          </div>

          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm">
            <Image
              src="/sos-animal/voluntarias-filhote-resgatado.webp"
              alt="Duas voluntárias segurando um filhote recém-resgatado"
              fill
              priority
              sizes="(min-width: 640px) 560px, 90vw"
              className="object-cover"
            />
          </div>
        </div>

        {/* O pedido da recorrência — o motivo desta tela existir. */}
        <div className="flex flex-col gap-4 rounded-md border-2 border-donate bg-donate/[.06] p-5 sm:p-6">
          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-donate">
              Ajude todo mês
            </p>
            <h2 className="text-[clamp(1.125rem,1rem+0.7vw,1.5rem)] font-extrabold leading-[1.2] text-ink-900">
              A fome dos animais é mensal. A ajuda também pode ser.
            </h2>
            <p className="text-[14px] leading-[1.6] text-ink-600">
              Doações pontuais salvam um mês. Doações recorrentes permitem que os abrigos
              planejem a compra de ração com antecedência, comprem em maior quantidade e
              parem de depender de campanha em campanha.
            </p>
          </div>

          <a
            href={recurringHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-donate px-6 text-[15px] font-extrabold uppercase tracking-[0.03em] text-donate-ink shadow-[0_10px_30px_-8px_rgba(27,138,75,.5)] transition-colors hover:bg-donate-hover"
          >
            <IconWhatsApp size={18} />
            Quero doar todo mês
          </a>

          <p className="text-center text-[12px] text-ink-600">
            A equipe combina o valor e a melhor data com você. Sem compromisso e você pode
            cancelar quando quiser.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-md border border-ink-900/10 bg-surface p-5">
          <h2 className="text-[16px] font-extrabold text-ink-900">
            Outra forma de ajudar: contar para alguém
          </h2>
          <p className="text-[14px] leading-[1.55] text-ink-600">
            Uma indicação sua alcança pessoas que a campanha sozinha não alcança.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Acabei de ajudar a ${org.name} a manter mais de 400 animais alimentados. Se puder, dá uma olhada:`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full border-2 border-ink-900/12 px-5 text-[14px] font-extrabold text-ink-900 transition-colors hover:border-ink-900/30"
            >
              <IconShare size={16} />
              Compartilhar a campanha
            </a>

            <Link
              href="/#racao"
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full border-2 border-ink-900/12 px-5 text-[14px] font-extrabold text-ink-900 transition-colors hover:border-ink-900/30"
            >
              <IconHeart size={16} />
              Doar novamente
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-extrabold text-ink-600 transition-colors hover:text-action"
          >
            Voltar para a campanha
            <IconArrowRight size={15} />
          </Link>

          <p className="text-[12px] text-ink-600">
            Dúvidas sobre a sua doação?{" "}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-extrabold text-donate hover:underline"
            >
              Fale com a equipe
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
