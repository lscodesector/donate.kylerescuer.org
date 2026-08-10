import Image from "next/image";
import { cnpjDocument, copy, googleReviews, org, whatsappHref } from "@/content/v1/landing";
import { IconFile, IconMail, IconPin, IconShield, IconStar, IconWhatsApp } from "../ui/Icons";
import { Reveal } from "../ui/Reveal";
import { SectionHead } from "../ui/SectionHead";

/**
 * Documentação e canais oficiais.
 *
 * O card de avaliação do Google só aparece quando `googleReviews.enabled` for
 * `true` — enquanto não houver nota e número confirmados, ele fica fora da
 * interface. Publicar avaliação inventada numa página de doação é enganar quem
 * doa, e não é algo que se conserta depois.
 */
export function Documentacao() {
  return (
    <section id="documentacao" className="surface-alt py-[clamp(2.5rem,6vh,4.5rem)]">
      <div className="container-narrow flex max-w-[660px] flex-col gap-5">
        <SectionHead
          icon={IconShield}
          eyebrow={copy.documentacao.eyebrow}
          title={copy.documentacao.title}
          lead={copy.documentacao.lead}
          align="left"
        />

        {/* Cartão CNPJ: o documento em si, não só o número.
            O arquivo é a página A4 inteira (1600×2264) e mais de um terço dela
            embaixo é papel em branco — a moldura recorta a faixa útil e ancora
            no topo, onde estão o brasão, o número e a razão social. */}
        <Reveal className="overflow-hidden rounded-md border border-ink-900/10 bg-surface shadow">
          <div className="flex items-start gap-3 border-b border-ink-900/[.07] p-4">
            <IconFile size={20} className="mt-0.5 shrink-0 text-action" />
            <div className="flex flex-col">
              <span className="text-[14px] font-extrabold text-ink-900">{cnpjDocument.title}</span>
              <span className="text-[12px] text-ink-600">{cnpjDocument.subtitle}</span>
              <span className="mt-1 text-[13px] font-semibold tabular-nums text-ink-900">
                CNPJ {org.cnpj}
              </span>
            </div>
          </div>

          <div className="relative aspect-[16/11] w-full overflow-hidden bg-surface">
            <Image
              src={cnpjDocument.src}
              alt={cnpjDocument.alt}
              fill
              sizes="(min-width: 640px) 620px, 92vw"
              className="object-cover object-top"
            />
          </div>

          <a
            href={cnpjDocument.src}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[48px] items-center gap-2 border-t border-ink-900/10 px-4 text-[13px] font-extrabold text-accent transition-colors hover:bg-surface-alt"
          >
            <IconFile size={15} />
            Ver documento
          </a>
        </Reveal>

        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-full flex-col gap-1 rounded-md border border-ink-900/10 bg-surface p-4 shadow transition-colors hover:border-donate/50"
          >
            <span className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.06em] text-accent">
              <IconWhatsApp size={16} />
              WhatsApp
            </span>
            <span className="text-[14px] font-semibold text-ink-900">{org.whatsappDisplay}</span>
            <span className="text-[12px] leading-[1.4] text-ink-600">
              Fale diretamente com nossa equipe.
            </span>
            <span className="mt-auto pt-2 text-[13px] font-extrabold text-donate">
              Falar no WhatsApp
            </span>
          </a>

          <a
            href={`mailto:${org.email}`}
            className="flex h-full flex-col gap-1 rounded-md border border-ink-900/10 bg-surface p-4 shadow transition-colors hover:border-donate/50"
          >
            <span className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.06em] text-accent">
              <IconMail size={16} />
              E-mail
            </span>
            {/* `break-words` e não `break-all`: só quebra quando não cabe, e no
                lugar certo. */}
            <span className="break-words text-[13px] font-semibold leading-[1.35] text-ink-900">
              {org.email}
            </span>
            <span className="mt-auto pt-2 text-[12px] leading-[1.4] text-ink-600">
              Dúvidas, informações e prestação de contas.
            </span>
          </a>

          <a
            href={org.mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-full flex-col gap-1 rounded-md border border-ink-900/10 bg-surface p-4 shadow transition-colors hover:border-donate/50 sm:col-span-2"
          >
            <span className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.06em] text-accent">
              <IconPin size={16} />
              Endereço
            </span>
            <address className="text-[14px] not-italic leading-[1.5] text-ink-900">
              {org.address.line1}
              <br />
              {org.address.line2}, {org.address.city} · {org.address.zip}
            </address>
            <span className="mt-auto pt-2 text-[13px] font-extrabold text-donate">
              Ver localização
            </span>
          </a>

          {/* Só entra quando houver dado real — ver `googleReviews`. */}
          {googleReviews.enabled && (
            <a
              href={googleReviews.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full flex-col gap-1 rounded-md border border-ink-900/10 bg-surface p-4 shadow transition-colors hover:border-donate/50 sm:col-span-2"
            >
              <span className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.06em] text-accent">
                <IconStar size={16} />
                Avaliação no Google
              </span>
              <span className="text-[14px] font-semibold text-ink-900">
                {googleReviews.rating.toFixed(1)} · {googleReviews.reviewCount} avaliações
              </span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
