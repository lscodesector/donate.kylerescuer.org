import type { DetailedHTMLProps, HTMLAttributes } from "react";

/**
 * O player do VTurb é um Web Component: `<vturb-smartplayer>` não existe no
 * JSX do React, e sem esta declaração o TypeScript rejeita a tag.
 *
 * A augmentação é em `react`, e não no namespace global `JSX`: o React 19
 * removeu o global e `IntrinsicElements` passou a viver em `React.JSX`.
 */
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "vturb-smartplayer": DetailedHTMLProps<
        HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

declare global {
  /**
   * Superfície mínima de teardown que o runtime do SmartPlayer pode expor -
   * seja no próprio elemento `<vturb-smartplayer>`, seja numa instância em
   * `window.smartplayer`. Usada pelo `VturbTeardown` em `02-hero.tsx` para
   * desmontar o player (e o hls.js que ele embute) quando o React o tira do
   * DOM. Ambos os métodos são opcionais: o embed pode não expor nenhum.
   */
  interface VturbDisposable {
    destroy?: () => void;
    dispose?: () => void;
  }

  interface Window {
    /**
     * O runtime do SmartPlayer (`smartplayer.js`), presente só depois que o
     * player boota. O formato muda entre versões - pode ser um mapa por id do
     * player, eventualmente com uma sub-coleção `instances`. Tipado no mínimo
     * necessário para o teardown defensivo; pode não existir.
     */
    smartplayer?: Record<string, VturbDisposable | undefined> & {
      instances?: Record<string, VturbDisposable | undefined>;
    };
  }
}
