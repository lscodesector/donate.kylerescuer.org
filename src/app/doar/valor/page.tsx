import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutValor } from "./CheckoutValor";

export const metadata: Metadata = {
  title: "Finalizar doação | Caio Protetor",
  robots: { index: false, follow: false },
};

/**
 * O invólucro estático de `/doar/valor`.
 *
 * O valor da doação vem na query (`?cents=…`), e query não existe em build:
 * o HTML desta rota é um só, e é o navegador que lê o número e monta o Pix
 * (ver `CheckoutValor`). Por isso a página é apenas este casco - ele existe
 * para carregar o `metadata`, que Client Component não pode exportar, e para
 * abrir o `Suspense` que `useSearchParams` exige na renderização estática.
 *
 * O fallback é vazio de propósito: o miolo aparece no primeiro quadro depois
 * da hidratação, e um esqueleto piscando antes disso só somaria um pulo.
 */
export default function CheckoutValorPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutValor />
    </Suspense>
  );
}
