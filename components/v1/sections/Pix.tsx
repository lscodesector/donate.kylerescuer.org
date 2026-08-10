"use client";

import { useEffect, useState } from "react";
import { copy as texts, pix } from "@/content/v1/landing";
import { IconCheck, IconCopy, IconPix } from "../ui/Icons";

/**
 * Pix direto: a chave, o botão de copiar e os três passos.
 *
 * É o caminho de menor atrito da página — quem já decidiu doar não precisa
 * passar por formulário nenhum. Fica em verde, a cor de doação do site, e
 * ocupa a faixa inteira para não ser confundido com um card comum.
 */
export function Pix() {
  const [copied, setCopied] = useState(false);

  // Devolve o botão ao estado normal depois do aviso de "copiado".
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(id);
  }, [copied]);

  async function copiarChave() {
    try {
      await navigator.clipboard.writeText(pix.key);
      setCopied(true);
    } catch {
      // Navegador sem permissão de área de transferência (ou http sem TLS):
      // seleciona o texto para a pessoa copiar na mão em vez de não fazer nada.
      const node = document.getElementById("pix-key");
      if (node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }

  return (
    <section id="pix" className="bg-donate py-[clamp(2.5rem,6vh,4.5rem)] text-white">
      <div className="container-narrow flex max-w-[660px] flex-col gap-5">
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.12em] text-white/80">
            <IconPix size={18} />
            {texts.pix.eyebrow}
          </p>
          <h2 className="text-[clamp(1.375rem,1.05rem+1.3vw,2.125rem)] font-extrabold leading-[1.15] text-white">
            {texts.pix.title}
          </h2>
          <p className="max-w-[54ch] text-[15px] leading-[1.6] text-white/85">
            {texts.pix.text}
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-md bg-white p-4 shadow sm:p-5">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-extrabold uppercase tracking-[0.06em] text-ink-600">
              Chave {pix.keyType}
            </span>
            <span
              id="pix-key"
              className="break-all text-[clamp(1rem,0.9rem+0.5vw,1.25rem)] font-extrabold text-ink-900"
            >
              {pix.key}
            </span>
            <span className="text-[13px] text-ink-600">
              Recebedor: <strong className="font-semibold text-ink-900">{pix.receiver}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={copiarChave}
            className={`inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full px-6 text-[15px] font-extrabold uppercase tracking-[0.03em] transition-colors ${
              copied
                ? "bg-ink-900 text-white"
                : "bg-donate text-donate-ink hover:bg-donate-hover"
            }`}
          >
            {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
            {copied ? "Chave copiada!" : "Copiar chave Pix"}
          </button>
        </div>

        <ol className="flex flex-col gap-3">
          {texts.pix.steps.map((step, i) => (
            <li key={step} className="flex items-start gap-3">
              <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-white/20 text-[13px] font-extrabold text-white">
                {i + 1}
              </span>
              <p className="pt-0.5 text-[14px] leading-[1.5] text-white/90 sm:text-[15px]">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
