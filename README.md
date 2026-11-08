# WAFI - Apprendre en jouant

Boutique en ligne de jouets éducatifs (Sénégal) : https://wafi.sn

- **Front** : React 19 + Vite + Tailwind CSS 4, hébergé sur Firebase Hosting
- **Données** : Firestore + Firebase Auth + Firebase Storage (projet `projet-wafi-dev`)
- **Emails** : Cloud Function `sendMail` (dossier `functions/`), qui remplace l'extension « Trigger Email »
- **Backend** (`backend/`) : API Express sur Firebase App Hosting, protégée par jetons Firebase (le site ne s'en sert plus directement)

## Développement local

```bash
npm install
npm run dev          # http://localhost:5173
```

Variables du front : `.env.development` / `.env.production` (clés web Firebase, publiques par nature).

### Essai local sans toucher au vrai site (émulateurs)

Pour tester comptes, profil, commandes et règles de sécurité avec des données factices :

```bash
npx firebase-tools@13.35.1 emulators:start --only auth,firestore --project demo-wafi   # terminal 1
npm run dev:emulator                                                                   # terminal 2
```

Le mode `emulator` (`.env.emulator`) branche le site sur les émulateurs locaux : un projet `demo-…` ne peut pas atteindre les serveurs Google. La base démarre vide (ajouter des produits pour tester une commande). firebase-tools 13 est utilisé car les versions récentes exigent Java 21.

## Comptes clients

- **Mon profil** (menu du compte) : prénom, nom, téléphone WhatsApp et adresse de livraison, qui pré-remplissent les commandes. L'email ne se modifie pas depuis le site.
- **Téléphone** : tous les pays sont acceptés (choix du pays puis numéro), enregistré au format international `+33612345678`. Vérification par `libphonenumber-js` (`src/utils/phone.ts`).
- **Mot de passe** : changement après saisie du mot de passe actuel ; les comptes Google n'ont pas de mot de passe WAFI.
- **Suppression du compte** : supprime le profil, les favoris, les alertes de stock et les notifications, puis le compte. Les commandes passées sont conservées (suivi, comptabilité).
- Les champs obligatoires de tous les formulaires sont marqués d'un astérisque rouge.

## Déploiement

Toujours vérifier le projet actif : `firebase use` doit afficher `projet-wafi-dev`.

```bash
npm run build
firebase deploy --only hosting                      # site
firebase deploy --only firestore:rules,firestore:indexes  # règles de sécurité + index
```

Backend Express (`backend/`) : il n'est plus utilisé par le site et son déploiement App Hosting (`wafi-backend`) a été supprimé le 8 novembre 2026, car il exposait les commandes. Le code reste ici pour mémoire.

### Emails : fonction `sendMail`

Depuis le 8 novembre 2026, les emails sont envoyés par la fonction `functions/index.js` (l'extension « Trigger Email » a été désinstallée). Le site écrit toujours un document dans la collection `mail`, au même format qu'avant.

- Mot de passe de la boîte OVH `contact@wafi.sn` : dans Secret Manager (`SMTP_PASSWORD`). Pour le changer, après l'avoir modifié dans l'espace client OVH :
  1. `node functions/test-smtp.mjs` : vérifie auprès d'OVH que le mot de passe est accepté, sans envoyer d'email (saisie masquée, rien n'est enregistré).
  2. Seulement si le test répond « OK » : `firebase functions:secrets:set SMTP_PASSWORD`, et répondre **Yes** quand Firebase propose de redéployer la fonction (elle garde la version du mot de passe connue lors du déploiement).
  3. Facultatif : détruire l'ancienne version avec `firebase functions:secrets:destroy SMTP_PASSWORD@<n> -f`. Firebase annonce à tort qu'elle est « in use » : il ne regarde que le nom du secret, pas la version.
- Autres réglages (serveur, port, expéditeur) : `functions/.env.projet-wafi-dev`.
- Déployer : `firebase deploy --only functions`. Sur un ordinateur lent, l'analyse du code peut dépasser 10 s : définir `FUNCTIONS_DISCOVERY_TIMEOUT=60` avant la commande.
- Vérifier un envoi : dans Firestore, le document `mail` passe à `delivery.state = SUCCESS` (ou `ERROR` avec le message dans `delivery.error`).

## Sécurité (règles Firestore)

- Une commande n'est acceptée que si chaque prix correspond au catalogue, si le total est exact et si le stock suffit (10 produits différents maximum par commande).
- Un client ne lit que ses commandes, réservations et favoris ; l'admin lit tout.
- Un client ne peut envoyer un email qu'à sa propre adresse (anti-spam).
