export {};

declare global {
  /**
   * Superfície mínima do Video.js 8 usada pelo teardown do player próprio
   * (`NewPlayerTeardown` em `02-hero.tsx`). O `player.bootstrap.js` do
   * `player-video-nest-back` carrega o Video.js pelo CDN e registra o player
   * pelo id do `<video>` (`vdlVideo`) - chamar `videojs(id)` de novo devolve
   * a instância já criada em vez de criar outra, e é essa instância que expõe
   * `dispose()`. Só existe depois que o script do embed carrega; por isso
   * `window.videojs` é opcional.
   */
  interface Window {
    videojs?: (id: string) => { dispose: () => void } | undefined;
  }
}
