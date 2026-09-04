"use client";

import { withBasePath } from "@/lib/base-path";
import { org, whatsappWith } from "@/lib/config";
import {
  useShelterEmail,
  useShelterFacebook,
  useShelterInstagram,
  useShelterPhone,
} from "@/lib/hooks/use-shelter-phone";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  11 · RODAPÉ - marca, navegação, contato e políticas                  ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Porte de `clone-sites-antigos/site-antigo/11-footer.html`.
 *
 * ── O contato dinâmico não foi copiado, foi reaproveitado ─────────────────
 * O original trazia ~50 linhas de `<script>` que buscavam `GET /api/ic/:slug`
 * no painel e reescreviam os `[data-cp-contact]` por `querySelectorAll`. Esse
 * mesmo dado já é lido por `lib/hooks/use-shelter-phone.ts`, com cache em
 * módulo (uma busca só, mesmo com vários blocos pedindo) e valor de reserva
 * vindo de `lib/config.ts`. Ele é usado aqui e no bloco 12.
 *
 * ⚠️ **Uma diferença de comportamento, de propósito.** No original, Instagram
 * e Facebook nasciam com `display: none` e só apareciam se o painel
 * devolvesse uma URL para eles; se a busca falhasse, ficavam escondidos para
 * sempre. Aqui eles sempre aparecem, caindo em `org.instagramHref` /
 * `org.facebookHref` quando o painel não responde - que é como o rodapé da
 * campanha atual já se comporta. Um rodapé que some quando a rede oscila é
 * pior do que um que mostra o link oficial.
 *
 * O slug do funil também muda junto: o original pedia `caio-protetor-us`, e o
 * hook deste projeto pede `cp-caio-protetor` (ver `payments.recurring.icUrl`).
 */

const NAVEGACAO = [
  { href: "#home", label: "Home" },
  { href: "#story", label: "The Story" },
  { href: "#shelters", label: "Shelters" },
  { href: "#transparency", label: "Transparency" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#faq", label: "FAQ" },
] as const;

const ICONE_WHATSAPP = (
  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
);

export default function Footer() {
  const telefone = useShelterPhone();
  const instagram = useShelterInstagram();
  const facebook = useShelterFacebook();
  const email = useShelterEmail();

  const whatsapp = whatsappWith(org.whatsappMessage, telefone);

  return (
    <footer className="cp-footer-section" id="contact">
      <div className="cp-footer-wrap">
        <div className="cp-footer-inner">
          <div className="cp-footer-grid">
            {/* MARCA */}
            <div>
              <img
                src={withBasePath("/caio/logo-kyle.webp")}
                alt="Kyle Rescuer"
                style={{
                  height: 120,
                  width: "auto",
                  display: "block",
                  marginBottom: "0.6rem",
                }}
              />
              <p className="cp-footer-brand-desc">
                Kyle is a rescuer who supports multiple animal shelters, with the
                help of{" "}
                <a
                  href="https://kylerescuer.org"
                  target="_blank"
                  rel="noopener"
                  style={{ color: "rgba(255, 255, 255, 0.55)", fontWeight: 700 }}
                >
                  SOS Animal Help
                </a>{" "}
                and people like you. 400+ animals depend on every donation.
              </p>
              <div className="cp-footer-socials">
                <a
                  href={instagram}
                  target="_blank"
                  rel="noopener"
                  className="cp-footer-social"
                  aria-label="Instagram"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
                <a
                  href={facebook}
                  target="_blank"
                  rel="noopener"
                  className="cp-footer-social"
                  aria-label="Facebook"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                  </svg>
                </a>
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener"
                  className="cp-footer-social"
                  aria-label="WhatsApp"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    {ICONE_WHATSAPP}
                  </svg>
                </a>
              </div>
            </div>

            {/* NAVEGAÇÃO */}
            <div>
              <span className="cp-footer-col-title">Navigation</span>
              <ul className="cp-footer-list">
                {NAVEGACAO.map((item) => (
                  <li key={item.href}>
                    <a href={item.href}>{item.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* SUPORTE E CONTATO */}
            <div>
              <span className="cp-footer-col-title">Support and Contact</span>
              <ul className="cp-footer-list">
                <li>
                  <a href={whatsapp} target="_blank" rel="noopener">
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a href={instagram} target="_blank" rel="noopener">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href={facebook} target="_blank" rel="noopener">
                    Facebook
                  </a>
                </li>
              </ul>
              <div className="cp-footer-contact">
                <div className="cp-footer-contact-item">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <a href="#transparency">EIN: {org.cnpj}</a>
                </div>
                <div className="cp-footer-contact-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    {ICONE_WHATSAPP}
                  </svg>
                  <a href={whatsapp} target="_blank" rel="noopener">
                    {org.whatsappDisplay}
                  </a>
                </div>
                <div className="cp-footer-contact-item">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                  <a href={`mailto:${email}`}>{email}</a>
                </div>
              </div>
            </div>
          </div>

          <div className="cp-footer-bottom">
            <span className="cp-footer-copy">
              © 2026 Kyle Rescuer · All rights reserved
            </span>
            <div className="cp-footer-policies">
              {org.policies.map((politica) => (
                <a
                  key={politica.href}
                  href={politica.href}
                  target="_blank"
                  rel="noopener"
                >
                  {politica.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
