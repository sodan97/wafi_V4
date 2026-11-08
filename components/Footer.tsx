import React from 'react';
import { MERCHANT_WHATSAPP_NUMBER } from '../constants';
import { WhatsAppIcon, InstagramIcon, TikTokIcon, MailIcon } from './icons';

const INSTAGRAM_URL = 'https://www.instagram.com/samawafi7';
const TIKTOK_URL = 'https://www.tiktok.com/@samawafi';
const whatsappUrl = `https://wa.me/${MERCHANT_WHATSAPP_NUMBER}`;

const formatPhone = (number: string) => `+${number.replace(/^(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4 $5')}`;

const Footer: React.FC = () => (
  <>
    <footer className="mt-20 bg-ink-900 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="inline-flex rounded-2xl bg-white px-4 py-2">
            <img src="/logo.webp" alt="WAFI - Apprendre en jouant" className="h-12 w-auto" width={229} height={160} loading="lazy" />
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
            Des jouets éducatifs pour éveiller l’intelligence et la créativité des enfants. Basés au Sénégal, nous vous
            conseillons pour choisir le jouet adapté à chaque âge.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold">Contact</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            <li>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-sun-300">
                <WhatsAppIcon className="h-4 w-4" />{formatPhone(MERCHANT_WHATSAPP_NUMBER)}
              </a>
            </li>
            <li>
              <a href="mailto:contact@wafi.sn" className="inline-flex items-center gap-2 hover:text-sun-300">
                <MailIcon className="h-4 w-4" />contact@wafi.sn
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold">Suivez-nous</h2>
          <div className="mt-4 flex gap-3">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="WAFI sur Instagram" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-sun-400 hover:text-ink-900">
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer" aria-label="WAFI sur TikTok" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-sun-400 hover:text-ink-900">
              <TikTokIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-center text-xs text-white/50">© {new Date().getFullYear()} WAFI · Apprendre en jouant · Tous droits réservés</p>
      </div>
    </footer>

    {/* Bouton WhatsApp flottant */}
    <a
      href={`${whatsappUrl}?text=${encodeURIComponent('Bonjour WAFI, j’ai une question.')}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Nous écrire sur WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition hover:scale-110"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  </>
);

export default Footer;
