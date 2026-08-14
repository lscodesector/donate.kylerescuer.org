"use client";

import { Img as Image } from "@/components/ui/Img";
import { cnpjDocument, org } from "@/content/landing";
import { withBasePath } from "@/lib/base-path";
import { openDocumentoModal } from "./DocumentoModal";
import { IconFile } from "./ui/Icons";

/**
 * Cartão CNPJ: o documento em si, não só o número.
 *
 * Client component só por causa do popup - sem JavaScript o `<a>` continua
 * levando à imagem sozinha (`withBasePath(cnpjDocument.src)`), que é o
 * comportamento de antes.
 */
export function DocumentoCard() {
  return (
    <div className="overflow-hidden rounded-md border border-ink-900/10 bg-surface shadow">
      <div className="flex flex-col items-center gap-3 border-b border-ink-900/[.07] p-4 text-center sm:flex-row sm:items-start sm:text-left">
        <IconFile size={20} className="shrink-0 text-action sm:mt-0.5" />
        <div className="flex flex-col">
          <span className="text-[14px] font-extrabold text-ink-900">{cnpjDocument.title}</span>
          <span className="text-[12px] text-ink-600">{cnpjDocument.subtitle}</span>
          <span className="mt-1 text-[13px] font-semibold tabular-nums text-ink-900">
            CNPJ {org.cnpj}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => openDocumentoModal()}
        aria-label="Ver documento do cartão CNPJ"
        className="relative block aspect-[16/11] w-full overflow-hidden bg-surface"
      >
        <Image
          src={cnpjDocument.src}
          alt={cnpjDocument.alt}
          fill
          sizes="(min-width: 640px) 620px, 92vw"
          className="object-cover object-top"
        />
      </button>

      <a
        href={withBasePath(cnpjDocument.src)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          openDocumentoModal();
        }}
        className="flex min-h-[48px] items-center justify-center gap-2 border-t border-ink-900/10 px-4 text-[13px] font-extrabold text-accent transition-colors hover:bg-surface-alt sm:justify-start"
      >
        <IconFile size={15} />
        Ver documento
      </a>
    </div>
  );
}
