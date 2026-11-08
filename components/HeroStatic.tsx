import React from 'react';
import { useProduct } from '../context/ProductContext';
import { MERCHANT_WHATSAPP_NUMBER } from '../constants';
import { ArrowRightIcon, WhatsAppIcon, SparklesIcon, TruckIcon, ChatIcon, ShieldIcon, CartIcon } from './icons';

const scrollToCatalog = () => {
  document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const whatsappHelloUrl = `https://wa.me/${MERCHANT_WHATSAPP_NUMBER}?text=${encodeURIComponent('Bonjour WAFI, je voudrais un conseil pour choisir un jouet.')}`;

const HeroStatic: React.FC = () => {
  const { activeProducts } = useProduct();
  // Vitrine : trois produits en stock avec photo
  const showcase = activeProducts.filter(p => p.stock > 0 && p.imageUrls?.[0]).slice(0, 3);
  const tileColors = ['bg-sun-200', 'bg-brand-100', 'bg-tangerine-100'];

  return (
    <>
      <section className="relative overflow-hidden rounded-[2rem] bg-white px-6 py-10 shadow-sm ring-1 ring-ink-900/5 sm:px-10 md:py-14 lg:px-14">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-sun-100" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-brand-50" />

        <div className="relative grid items-center gap-10 lg:grid-cols-2">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700">
              <SparklesIcon className="h-4 w-4" />
              Jouets éducatifs et kits scientifiques
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] text-ink-900 sm:text-5xl lg:text-6xl">
              Ils jouent, <span className="text-brand-600">ils apprennent</span>, ils grandissent.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-500 sm:text-lg">
              Éoliennes, robots, circuits électriques à construire soi-même : des jouets qui éveillent la curiosité
              et la créativité des enfants, livrés chez vous partout à Dakar.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={scrollToCatalog} className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 font-semibold text-white shadow-md shadow-brand-600/20 transition hover:-translate-y-0.5 hover:bg-brand-700">
                Découvrir les jouets
                <ArrowRightIcon className="h-5 w-5" />
              </button>
              <a href={whatsappHelloUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink-900/10 px-7 py-3 font-semibold text-ink-900 transition hover:border-[#25D366] hover:text-[#128C4B]">
                <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                Demander conseil
              </a>
            </div>
          </div>

          {showcase.length > 0 && (
            <div className="relative grid grid-cols-2 gap-4" aria-hidden="true">
              {showcase.map((product, i) => (
                <div
                  key={product.id}
                  className={`${tileColors[i]} flex items-center justify-center overflow-hidden rounded-3xl p-4 ${i === 0 ? 'row-span-2 aspect-[3/4]' : 'aspect-square'} ${i === 0 ? '-rotate-2' : i === 1 ? 'rotate-2' : '-rotate-1'} transition-transform duration-300 hover:rotate-0`}
                >
                  <img src={product.imageUrls[0]} alt="" className="h-full w-full rounded-2xl object-contain mix-blend-multiply" loading="eager" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Nos engagements">
        {[
          { icon: SparklesIcon, title: 'Jouets qui font réfléchir', text: 'Sciences, énergie, construction' },
          { icon: TruckIcon, title: 'Livraison à Dakar', text: 'Régions : nous consulter' },
          { icon: ChatIcon, title: 'Commande par WhatsApp', text: 'Simple et rapide' },
          { icon: ShieldIcon, title: 'Conseil personnalisé', text: 'Selon l’âge de l’enfant' },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink-900/5 sm:flex-row sm:items-start">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-snug text-ink-900">{title}</p>
              <p className="mt-0.5 text-xs text-ink-500">{text}</p>
            </div>
          </div>
        ))}
      </section>
    </>
  );
};

// Section « Comment commander » (affichée sous le catalogue)
export const HowToOrder: React.FC = () => (
  <section className="mt-16 rounded-[2rem] bg-brand-700 px-6 py-12 text-white sm:px-10" aria-labelledby="how-to-order">
    <h2 id="how-to-order" className="text-center text-3xl font-semibold sm:text-4xl">Commander, c’est simple</h2>
    <p className="mx-auto mt-3 max-w-xl text-center text-brand-100">Pas besoin de carte bancaire : on finalise ensemble sur WhatsApp.</p>
    <ol className="mt-10 grid gap-6 md:grid-cols-3">
      {[
        { icon: CartIcon, title: 'Choisissez vos jouets', text: 'Ajoutez-les à votre panier en un clic.' },
        { icon: ChatIcon, title: 'Envoyez la commande', text: 'Un message WhatsApp prêt à envoyer est créé pour vous.' },
        { icon: TruckIcon, title: 'Recevez-les chez vous', text: 'On confirme le paiement et la livraison avec vous.' },
      ].map(({ icon: Icon, title, text }, i) => (
        <li key={title} className="relative rounded-3xl bg-white/10 p-6">
          <span className="absolute right-5 top-4 font-display text-5xl font-semibold text-white/15">{i + 1}</span>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sun-400 text-ink-900">
            <Icon className="h-6 w-6" />
          </span>
          <h3 className="mt-4 text-xl font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-brand-100">{text}</p>
        </li>
      ))}
    </ol>
  </section>
);

export default HeroStatic;
