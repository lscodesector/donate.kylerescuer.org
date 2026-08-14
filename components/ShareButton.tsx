"use client";

import { useEffect, useRef, useState } from "react";
import { IconCheck, IconShare } from "./ui/Icons";

/**
 * O botão de compartilhar da barra fixa.
 *
 * ── Por que ele ocupa o lugar do pedido de doação ──────────────────────────
 * A barra é o único elemento que acompanha a pessoa a página inteira, e o
 * pedido de dinheiro já está em toda parte: na dobra (`Hero`), na barra da
 * base depois dos primeiros 520px de rolagem (`StickyDonateBar`), na seção de
 * doação e no fechamento. O que não estava em lugar nenhum da campanha era o
 * convite para levá-la adiante - e é ele que traz gente que a campanha sozinha
 * não alcança.
 *
 * ── Três caminhos, na ordem do que funciona melhor ─────────────────────────
 * 1. `navigator.share`: a folha nativa do sistema, com WhatsApp, Instagram e
 *    o resto do aparelho já dentro. É o caminho de quase todo celular, que é
 *    de onde vem quase toda a visita desta campanha.
 * 2. Copiar o link, com o botão avisando "Link copiado!" por dois segundos -
 *    o desktop do Firefox, por exemplo, não tem a folha nativa.
 * 3. WhatsApp em aba nova, se até a área de transferência estiver barrada
 *    (acontece em `http://` e em navegador antigo). É o último recurso porque
 *    escolhe a rede pela pessoa - mas um botão que não faz nada é pior.
 *
 * `AbortError` não é erro: é a pessoa fechando a folha nativa. Nesse caso o
 * botão fica quieto, sem cair para o passo seguinte - copiar um link que ela
 * acabou de decidir não compartilhar seria desfazer a escolha dela.
 */
export function ShareButton({ className }: { className?: string }) {
  const [copiado, setCopiado] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* O aviso some sozinho depois de 2s. O `clearTimeout` na saída existe para o
     caso de o componente ser desmontado antes disso (a navegação para as
     páginas legais, por exemplo). */
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const avisarCopiado = () => {
    setCopiado(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopiado(false), 2000);
  };

  const compartilhar = async () => {
    /* Sem `hash` nem `search`: o link que a pessoa manda tem que abrir a
       campanha no topo, e não na âncora em que ela parou de ler nem com os
       parâmetros de campanha (`utm_*`) de quem a trouxe até aqui colados. */
    const url = `${window.location.origin}${window.location.pathname}`;
    const texto =
      "O Caio leva ração, remédio e veterinário a mais de 400 animais em cinco abrigos. Dá uma olhada:";

    if (navigator.share) {
      try {
        await navigator.share({ title: "Caio Protetor", text: texto, url });
        return;
      } catch (erro) {
        if ((erro as Error)?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${texto} ${url}`);
      avisarCopiado();
    } catch {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  };

  return (
    /*
     * Só o ícone: a barra fixa tem 44px de altura e três peças disputando a
     * largura do celular (hambúrguer, logo e este botão), e o rótulo escrito
     * era o que apertava a marca no centro. O desenho de dois nós ligados já é
     * o símbolo de compartilhar em todo sistema.
     *
     * Sem texto na tela, o nome do botão passa a ser o `aria-label` - sem ele
     * o leitor de tela anuncia só "botão". O aviso de link copiado vira o
     * visto no lugar do ícone e um `sr-only` com `aria-live`, que é como quem
     * não vê a troca do desenho fica sabendo dela.
     */
    <button
      type="button"
      onClick={compartilhar}
      aria-label={copiado ? "Link copiado" : "Compartilhar a campanha"}
      title="Compartilhar a campanha"
      className={className}
    >
      {copiado ? <IconCheck size={18} /> : <IconShare size={18} />}
      <span className="sr-only" aria-live="polite">
        {copiado ? "Link copiado!" : ""}
      </span>
    </button>
  );
}
