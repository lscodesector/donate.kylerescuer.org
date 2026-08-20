# Reestrutura em blocos isolados

Estado do trabalho. Cada linha é um bloco: converta **na ordem** e marque `[x]`
assim que o arquivo estiver escrito — se o trabalho parar no meio, a próxima
sessão retoma pela primeira linha desmarcada.

Regra do bloco: ele carrega o próprio texto e os próprios utilitários de UI.
Não importa outro bloco, não importa `components/ui/`. Só pode importar de
`@/lib/` (dado de campanha, formatação, pagamento, os *buses* dos modais).

| ok | bloco | origem | conteúdo que desce pro bloco |
|---|---|---|---|
| [x] | `sections/01-menu.tsx` | `Header.tsx` + `ShareButton` | — |
| [x] | `sections/02-hero.tsx` | `sections/Hero.tsx` | `heroCopy`, `heroVideo`, `historiaPhotos` |
| [x] | `sections/03-prova.tsx` | `sections/TrustStrip.tsx` | `trustStrip` |
| [x] | `sections/04-quem-e.tsx` | `sections/Missao.tsx` | `copy.missao`, `historiaPhotos` |
| [x] | `sections/05-abrigos.tsx` | `sections/Abrigos.tsx` + `AbrigosLista.tsx` | `copy.abrigos`, `shelters` |
| [x] | `sections/06-doar.tsx` | `sections/DoarAgora.tsx` | `copy.doar`, `impactCompare` |
| [x] | `sections/07-como-funciona.tsx` | `sections/ComoFunciona.tsx` | `copy.comoFunciona` |
| [x] | `sections/08-pix-direto.tsx` | `sections/Pix.tsx` | `copy.pix` |
| [x] | `sections/09-transparencia.tsx` | `sections/Transparencia.tsx` | `copy.transparencia`, `monthlyCosts`, `impactNumbers` |
| [x] | `sections/10-atualizacoes.tsx` | `sections/Atualizacoes.tsx` | `copy.atualizacoes`, `timeline` |
| [x] | `sections/11-depoimentos.tsx` | `sections/Depoimentos.tsx` | `copy.depoimentos`, `depoimentos` |
| [x] | `sections/12-documentacao.tsx` | `sections/Documentacao.tsx` + `DocumentoCard` | `copy.documentacao`, `googleReviews` |
| [x] | `sections/13-faq.tsx` | `sections/Faq.tsx` | `copy.faq`, `faq` |
| [x] | `sections/14-cta-final.tsx` | `sections/FinalCta.tsx` | `copy.final` |
| [x] | `sections/15-footer.tsx` | `Footer.tsx` | `copy.footerAbout` |
| [x] | `overlays/16-flutuante.tsx` | `StickyDonateBar.tsx` | — |
| [x] | `overlays/17-modal-doacao.tsx` | `DonationModal.tsx` | `copy.causas`, `copy.valores`, `copy.mensal` |
| [x] | `overlays/18-checkout.tsx` | `checkout/CheckoutModal.tsx` + `CheckoutPix.tsx` | — |
| [x] | `overlays/19-modal-documento.tsx` | `DocumentoModal.tsx` | — |
| [x] | `tracking/20-pixel.tsx` | `MetaPixel.tsx` | — |

## Compartilhado (fica em `src/lib/`, não desce pro bloco)

- [x] `lib/config.ts` — chave Pix, CNPJ, contatos, taxa, grade de valores, frentes
- [x] `lib/modais.ts` — `openDonationModal`, `openDocumentoModal` e os eventos
- [x] `lib/checkout-bus.ts` — era `components/checkout/checkout-bus.ts`
- [x] `lib/format.ts` — recebeu `formatBRL` e `formatBRLCurto`

## Fechamento

- [x] apagar `content/landing.ts` e `components/ui/` quando ninguém mais importar
- [x] `src/app/page.tsx` apontando para os blocos numerados
- [x] `docs/UI-MAP.md`
- [x] `npm run build`

---

## Feito

Os 20 blocos estão escritos, o build passa e a saída foi conferida contra a
versão anterior: **texto idêntico nas 7 rotas**, e a estrutura de elementos
(tags, `id`, `href`, `data-*`) idêntica salvo nomes de chunk.

## O que a reestrutura custou, medido

Cada bloco carrega os próprios utilitários, então quase toda seção virou
`"use client"` — antes só os pedaços interativos eram cliente. Medido no build:

| gzip | antes | depois | delta |
|---|---|---|---|
| `index.html` (primeira carga, bloqueante) | 90 KB | 63 KB | **−27 KB** |
| JS (todos os chunks, adiado) | 228 KB | 248 KB | +21 KB |
| soma | 317 KB | 311 KB | −6 KB |

O HTML **encolheu**: o payload RSC que os Server Components serializavam dentro
dele custava mais do que o código cliente custa no bundle. O custo que sobra é
de hidratação — mais componentes acordam no navegador —, não de tráfego.

## Consequências conhecidas

- **Lint: 2 erros viraram 4.** São os mesmos dois de antes
  (`prefer-const` no bloco 20, `set-state-in-effect` no slide de fotos). O do
  slide agora é reportado três vezes porque o componente está em três blocos
  (02, 04, 05). Nenhum defeito novo — é a duplicação aparecendo no relatório.
- **O ano do rodapé.** `new Date().getFullYear()` roda agora no navegador, e
  não mais no build. Nas primeiras horas de 1º de janeiro o HTML publicado (ano
  do build) e o navegador (ano novo) discordam, e o React avisa de divergência
  de hidratação antes de corrigir sozinho. Antes o ano ficava congelado no
  build, sem aviso.
- **O player do VTurb hidrata.** O `<vturb-smartplayer>` ficava fora da
  hidratação (era Server Component); agora o React reconcilia aquela árvore. O
  `strategy="afterInteractive"` continua segurando o `player.js` até depois da
  hidratação, que é o que impedia a divergência — vale conferir o console na
  primeira publicação.
- **Conteúdo morto removido.** `copy.causas`, `copy.valores` e `copy.mensal`
  saíram junto com o `content/landing.ts`: nenhum componente os lia (o modal de
  doação escreve "Qual valor deseja doar?" direto no JSX).
- **Duas listas duplicadas** — abrigos e fotos da história. Ver o fim do
  `docs/UI-MAP.md`.
