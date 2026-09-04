"use client";

import { useCallback, useEffect, useState } from "react";
import { withBasePath } from "@/lib/base-path";
import { useScrollLock } from "@/lib/scroll-lock";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  01 · MENU - a barra fixa e a gaveta de navegação                     ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Porte de `clone-sites-antigos/site-antigo/01-menu.html`.
 *
 * ⚠️ O arquivo de origem era **dois arquivos num só**: além do menu, ele
 * carregava o `<style>` com a base de desenho inteira da página (as variáveis
 * `--ln-*`, `.ln-section`, `.ln-card`, os botões, o divisor). Esse CSS foi
 * para `antiga.css` junto com o dos outros blocos - é por isso que o menu
 * "parece pequeno demais" para o tamanho do original.
 *
 * ── O que mudou do original ───────────────────────────────────────────────
 * O estado aberto/fechado era classe no DOM manipulada à mão
 * (`root.classList.add`), e a trava de rolagem era `body { overflow: hidden }`
 * via `body.hu-menu-open`. Agora o estado é do React e a trava é o
 * `useScrollLock` do projeto, que compensa a largura da barra de rolagem - o
 * original não compensava, e a página dava um salto lateral ao abrir o menu.
 *
 * O `applyCPConfig` que morava neste `<script>` não veio: ele preenchia os
 * `[data-cp-*]` do contador por `querySelectorAll`, e quem faz isso agora é
 * `lib/campaign.ts` lido direto por quem mostra o número (blocos 03 e 12).
 */

const LINKS = [
  {
    href: "#story",
    label: "The Story",
    icon: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
      </>
    ),
  },
  {
    href: "#shelters",
    label: "Shelters",
    icon: (
      <>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    ),
  },
  {
    href: "#impact",
    label: "Impact",
    icon: (
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    ),
  },
  {
    href: "#transparency",
    label: "Transparency",
    icon: (
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
    ),
  },
  {
    href: "#testimonials",
    label: "Testimonials",
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    href: "#faq",
    label: "FAQ",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
      </>
    ),
  },
] as const;

export default function Menu() {
  const [aberto, setAberto] = useState(false);

  useScrollLock(aberto);

  const fechar = useCallback(() => setAberto(false), []);

  /* Escape fecha a gaveta - mesmo comportamento do original. */
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto, fechar]);

  /**
   * Compartilhar: a folha nativa do sistema quando existe, e a área de
   * transferência quando não. Transcrito do `window.cpShare` original - o
   * `alert()` inclusive, que é o que ele fazia.
   */
  const compartilhar = async () => {
    const dados = {
      title: "Kyle Rescuer · 400 animals need you",
      text: "Learn Kyle's story and support this campaign.",
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(dados);
      } catch {
        /* Cancelar a folha de compartilhamento não é erro. */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied!");
    } catch {
      /* Sem permissão de área de transferência: não há o que fazer aqui. */
    }
  };

  return (
    <div id="lnMenuRoot" className={aberto ? "ln-menu-open" : undefined}>
      <div id="lnHeader">
        <div className="ln-header-wrap">
          <div className="ln-header">
            <div className="ln-header-left">
              <button
                className="ln-menu-btn"
                type="button"
                aria-label="Open menu"
                aria-expanded={aberto}
                onClick={() => setAberto(true)}
              >
                <span />
              </button>
            </div>

            <a
              className="ln-header-logo"
              href="#home"
              aria-label="Kyle Rescuer · Home"
            >
              {/*
                O original apontava para o `wp-content/uploads` do WordPress
                (em `http://`, ainda por cima). A imagem já está no
                repositório; servir de `public/` tira uma dependência de um
                site que pode sair do ar sem avisar.
              */}
              <img
                src={withBasePath("/caio/logo-kyle.webp")}
                alt="Kyle Rescuer"
                fetchPriority="high"
                decoding="async"
                style={{ width: "auto", display: "block", flexShrink: 0 }}
              />
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  color: "#9b1b2d",
                  whiteSpace: "nowrap",
                  lineHeight: 1,
                }}
              >
                Kyle Rescuer
              </span>
            </a>

            <div className="ln-header-right">
              <button
                className="ln-share-pill"
                type="button"
                onClick={compartilhar}
                aria-label="Share"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* A cortina. Só clicável quando a gaveta está aberta - o CSS
          (`.ln-menu-open .ln-menu-overlay`) cuida da visibilidade. */}
      <div className="ln-menu-overlay" onClick={fechar} />

      <aside className="ln-menu-panel" aria-hidden={!aberto}>
        <div className="ln-menu-top">
          <span className="cp-logo-name-panel">
            Kyle <em>Rescuer</em>
          </span>
          <button
            className="ln-menu-close"
            type="button"
            aria-label="Close menu"
            onClick={fechar}
          >
            ×
          </button>
        </div>

        <nav className="ln-menu-links" aria-label="Campaign menu">
          <ul>
            {LINKS.map((link) => (
              <li key={link.href}>
                {/* Âncora de verdade, não `<Link>`: são saltos dentro da
                    própria página, e o rolar suave vem do CSS. */}
                <a href={link.href} onClick={fechar}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    {link.icon}
                  </svg>
                  <span>{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ln-menu-footer">
          <strong>Kyle Rescuer</strong> · Supported by{" "}
          <strong>SOS Animal Help</strong>
          <br />
          400+ animals depend on every donation.
        </div>
      </aside>
    </div>
  );
}
