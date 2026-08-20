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
