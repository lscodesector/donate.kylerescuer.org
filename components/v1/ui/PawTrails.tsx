import type { CSSProperties } from "react";
import { IconPaw } from "./Icons";

/**
 * Rastro decorativo de patinhas andando, igual ao fundo do hero institucional.
 * Nada translada de fato - cada pata acende e apaga na sua vez via CSS
 * (`.paw-step`, `sos-paw-step` em globals.css); só opacidade e transform, sem
 * custo de layout.
 */

const PASSO = 0.14;
const PROPORCAO = 2.6;
const AVANCO_PAR = 23;
const AVANCO_PE = 8;
const LARGURA_PASSADA = 4.5;
const ABERTURA = 12;

type Rastro = {
  x: number;
  y: number;
  angulo: number;
  curva: number;
  pares: number;
  avanco?: number;
  tamanho: number;
  opacidade: number;
  ciclo: number;
  offset: number;
  soDesktop?: boolean;
};

/*
 * O bando. Rumos para todo lado - horizontais cruzando de ponta a ponta,
 * verticais subindo e descendo, diagonais saindo dos cantos e arcos fechados -,
 * cada um no seu ciclo e entrando numa hora diferente. Como os ciclos não são
 * múltiplos entre si, o conjunto nunca repete o mesmo arranjo.
 *
 * Os doze primeiros aparecem em qualquer tela; o resto é `soDesktop`, porque no
 * celular a mesma quantidade de patas numa coluna estreita vira poluição em
 * cima do texto em vez de textura atrás dele.
 *
 * As opacidades ficam entre 0.14 e 0.24: com o bando três vezes maior, manter
 * a força de antes tiraria a legibilidade da manchete, que é o que a dobra
 * existe para fazer ler. Quem dá a sensação de "cheio" aqui é a quantidade e a
 * variedade de rumos, não o peso de cada pata.
 */
const RASTROS: Rastro[] = [
  // --- Sempre visíveis ------------------------------------------------
  // Ponta a ponta pelo topo.
  { x: -4, y: 12, angulo: 4, curva: -0.3, pares: 7, avanco: 32, tamanho: 26, opacidade: 0.2, ciclo: 9, offset: 0 },
  // Da direita para a esquerda, mais abaixo.
  { x: 104, y: 80, angulo: 184, curva: 0.6, pares: 7, avanco: 31, tamanho: 28, opacidade: 0.18, ciclo: 10.5, offset: 0.2 },
  // Descendo pela canaleta da esquerda.
  { x: 8, y: -8, angulo: 80, curva: 1.4, pares: 6, avanco: 24, tamanho: 22, opacidade: 0.22, ciclo: 8, offset: 0.45 },
  // Subindo pela direita.
  { x: 92, y: 106, angulo: -94, curva: -1.2, pares: 6, avanco: 24, tamanho: 24, opacidade: 0.2, ciclo: 11, offset: 0.65 },
  // Horizontal baixa, da esquerda.
  { x: -6, y: 92, angulo: -3, curva: 0.3, pares: 6, avanco: 30, tamanho: 24, opacidade: 0.18, ciclo: 11.7, offset: 0.15 },
  // Descendo no terço direito.
  { x: 72, y: -8, angulo: 88, curva: -1.1, pares: 6, avanco: 25, tamanho: 22, opacidade: 0.2, ciclo: 8.9, offset: 0.7 },
  // Subindo pela esquerda.
  { x: 20, y: 108, angulo: -88, curva: 1.0, pares: 6, avanco: 25, tamanho: 24, opacidade: 0.19, ciclo: 12.9, offset: 0.35 },
  // Diagonal curta no alto à direita.
  { x: 68, y: -6, angulo: 38, curva: 0.6, pares: 6, avanco: 27, tamanho: 20, opacidade: 0.17, ciclo: 9.3, offset: 0.9 },
  // Diagonal subindo do canto inferior esquerdo.
  { x: -2, y: 104, angulo: -48, curva: -0.4, pares: 6, avanco: 27, tamanho: 26, opacidade: 0.18, ciclo: 13.4, offset: 0.5 },
  // Arco fechado na esquerda: sobe, vira e desce.
  { x: 4, y: 66, angulo: -58, curva: 9, pares: 6, avanco: 22, tamanho: 22, opacidade: 0.21, ciclo: 8.3, offset: 0.25 },
  // Arco fechado descendo pela direita.
  { x: 96, y: 14, angulo: 120, curva: -7.5, pares: 6, avanco: 21, tamanho: 24, opacidade: 0.19, ciclo: 10.1, offset: 0.6 },
  // Atravessa o miolo de cima a baixo - some atrás do texto e reaparece.
  { x: 50, y: -8, angulo: 96, curva: -2.2, pares: 6, avanco: 25, tamanho: 20, opacidade: 0.19, ciclo: 7.6, offset: 0.85 },
  // Sobe pelo centro-esquerda, no contrafluxo do anterior.
  { x: 30, y: 108, angulo: -86, curva: 1.8, pares: 4, avanco: 26, tamanho: 22, opacidade: 0.18, ciclo: 14.3, offset: 0.08 },

  // --- Só do tablet para cima ------------------------------------------
  // Segunda horizontal, na altura do meio.
  { x: -6, y: 52, angulo: 8, curva: 0.4, pares: 6, avanco: 30, tamanho: 24, opacidade: 0.16, ciclo: 12.5, offset: 0.3, soDesktop: true },
  // Contramão, na faixa alta.
  { x: 106, y: 26, angulo: 176, curva: -0.5, pares: 6, avanco: 30, tamanho: 26, opacidade: 0.17, ciclo: 9.8, offset: 0.55, soDesktop: true },
  // Diagonal caindo do canto superior esquerdo.
  { x: 26, y: -6, angulo: 52, curva: 0, pares: 6, avanco: 26, tamanho: 22, opacidade: 0.15, ciclo: 10.8, offset: 0.75, soDesktop: true },
  // Diagonal subindo do canto inferior direito.
  { x: 78, y: 106, angulo: -128, curva: 0, pares: 6, avanco: 26, tamanho: 28, opacidade: 0.16, ciclo: 12, offset: 0.1, soDesktop: true },
  // Contramão pelo pé da seção.
  { x: 108, y: 96, angulo: 188, curva: 0.5, pares: 6, avanco: 29, tamanho: 22, opacidade: 0.15, ciclo: 13.9, offset: 0.4, soDesktop: true },
  // Horizontal no terço alto, indo para a direita.
  { x: -8, y: 30, angulo: -2, curva: -0.4, pares: 6, avanco: 31, tamanho: 20, opacidade: 0.16, ciclo: 11.2, offset: 0.8, soDesktop: true },
  // Descendo bem à direita.
  { x: 98, y: -8, angulo: 84, curva: 1.6, pares: 6, avanco: 24, tamanho: 24, opacidade: 0.17, ciclo: 9.1, offset: 0.05, soDesktop: true },
  // Subindo no centro-direita.
  { x: 60, y: 108, angulo: -92, curva: -1.4, pares: 6, avanco: 24, tamanho: 22, opacidade: 0.16, ciclo: 12.2, offset: 0.62, soDesktop: true },
  // Descendo à esquerda do miolo.
  { x: 34, y: -8, angulo: 92, curva: 1.2, pares: 6, avanco: 26, tamanho: 26, opacidade: 0.15, ciclo: 10.4, offset: 0.28, soDesktop: true },
  // Diagonal cruzando o alto para a esquerda.
  { x: 94, y: -6, angulo: 132, curva: 0.3, pares: 6, avanco: 27, tamanho: 20, opacidade: 0.14, ciclo: 13.1, offset: 0.48, soDesktop: true },
  // Diagonal do pé esquerdo para o alto direito.
  { x: 12, y: 106, angulo: -38, curva: -0.6, pares: 5, avanco: 28, tamanho: 24, opacidade: 0.16, ciclo: 8.7, offset: 0.92, soDesktop: true },
  // Arco no pé do centro.
  { x: 40, y: 100, angulo: -18, curva: 7, pares: 5, avanco: 23, tamanho: 22, opacidade: 0.17, ciclo: 11.9, offset: 0.18, soDesktop: true },
  // Arco no alto do centro, no sentido contrário.
  { x: 58, y: 6, angulo: 150, curva: -8.5, pares: 5, avanco: 22, tamanho: 20, opacidade: 0.15, ciclo: 9.6, offset: 0.72, soDesktop: true },
  // Vertical curta na borda esquerda.
  { x: 2, y: -6, angulo: 86, curva: 0.8, pares: 5, avanco: 26, tamanho: 22, opacidade: 0.14, ciclo: 12.7, offset: 0.38, soDesktop: true },
  // Vertical curta na borda direita, subindo.
  { x: 84, y: 108, angulo: -90, curva: -0.9, pares: 5, avanco: 26, tamanho: 24, opacidade: 0.15, ciclo: 8.1, offset: 0.58, soDesktop: true },
];

function pegadas(rastro: Rastro) {
  const avancoPar = rastro.avanco ?? AVANCO_PAR;
  const patas = rastro.pares * 2;

  let x = rastro.x;
  let y = rastro.y;
  let angulo = rastro.angulo;
  const passos = [];

  for (let i = 0; i < patas; i += 1) {
    const rad = (angulo * Math.PI) / 180;
    const perp = rad + Math.PI / 2;
    const lado = i % 2 === 0 ? -1 : 1;

    passos.push({
      x: x + (Math.cos(perp) * LARGURA_PASSADA * lado) / PROPORCAO,
      y: y + Math.sin(perp) * LARGURA_PASSADA * lado,
      giro: angulo + 90 + lado * ABERTURA,
    });

    const avanco = i % 2 === 0 ? AVANCO_PE : avancoPar - AVANCO_PE;
    angulo += rastro.curva;
    const novoRad = (angulo * Math.PI) / 180;
    x += (Math.cos(novoRad) * avanco) / PROPORCAO;
    y += Math.sin(novoRad) * avanco;
  }

  return passos;
}

export function PawTrails() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {RASTROS.map((rastro, r) => (
        <div
          key={r}
          className={`absolute inset-0 ${rastro.soDesktop ? "hidden md:block" : ""}`}
          style={{ "--paw-cycle": `${rastro.ciclo}s` } as CSSProperties}
        >
          {pegadas(rastro).map((pata, i) => (
            <IconPaw
              key={i}
              size={rastro.tamanho}
              className="paw-step"
              style={
                {
                  left: `${pata.x.toFixed(2)}%`,
                  top: `${pata.y.toFixed(2)}%`,
                  marginLeft: -rastro.tamanho / 2,
                  marginTop: -rastro.tamanho / 2,
                  animationDelay: `${(rastro.offset * rastro.ciclo + i * PASSO).toFixed(2)}s`,
                  "--paw-rotate": `rotate(${pata.giro.toFixed(1)}deg)`,
                  "--paw-opacity": rastro.opacidade,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}
