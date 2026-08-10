import { BackIntercept } from "@/components/BackIntercept";
import { DonationModal } from "@/components/DonationModal";
import { FloatingActions } from "@/components/FloatingActions";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { StickyDonateBar } from "@/components/StickyDonateBar";
import { Documentacao } from "@/components/sections/Documentacao";
import { Faq } from "@/components/sections/Faq";
import { FinalCta } from "@/components/sections/FinalCta";
import { Hero } from "@/components/sections/Hero";
import { Historias } from "@/components/sections/Historias";
import { Impacto } from "@/components/sections/Impacto";
import { Pix } from "@/components/sections/Pix";
import { Racao } from "@/components/sections/Racao";
import { Transparencia } from "@/components/sections/Transparencia";
import { TrustStrip } from "@/components/sections/TrustStrip";

/**
 * A jornada, na ordem em que a decisão de doar acontece:
 *
 * entender o problema → perceber a urgência → enxergar o impacto →
 * escolher como ajudar → confirmar que é confiável → doar.
 *
 *  1. Hero          promessa, vídeo e a barra de arrecadação (itens 2 e 3)
 *  2. TrustStrip    prova rápida de confiança, antes que a objeção apareça
 *  3. Historias     quem recebe
 *  4. Impacto       com e sem a ajuda
 *  5. Racao         o pedido concreto + outro valor e recorrência
 *  6. Pix           o caminho de menor atrito
 *  7. Transparencia para onde vai o dinheiro
 *  8. Documentacao  documento e canais oficiais
 *  9. Faq           as últimas dúvidas
 * 10. FinalCta      fechamento
 */
export default function DonationPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustStrip />
        <Historias />
        <Impacto />
        <Racao />
        <Pix />
        <Transparencia />
        <Documentacao />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <FloatingActions />
      <StickyDonateBar />
      <DonationModal />
      <BackIntercept />
    </>
  );
}
