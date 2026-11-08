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

- Mot de passe de la boîte OVH `contact@wafi.sn` : dans Secret Manager (`SMTP_PASSWORD`). Pour le changer : `firebase functions:secrets:set SMTP_PASSWORD`, puis redéployer la fonction.
- Autres réglages (serveur, port, expéditeur) : `functions/.env.projet-wafi-dev`.
- Déployer : `firebase deploy --only functions`. Sur un ordinateur lent, l'analyse du code peut dépasser 10 s : définir `FUNCTIONS_DISCOVERY_TIMEOUT=60` avant la commande.
- Vérifier un envoi : dans Firestore, le document `mail` passe à `delivery.state = SUCCESS` (ou `ERROR` avec le message dans `delivery.error`).

## Sécurité (règles Firestore)

- Une commande n'est acceptée que si chaque prix correspond au catalogue, si le total est exact et si le stock suffit (10 produits différents maximum par commande).
- Un client ne lit que ses commandes, réservations et favoris ; l'admin lit tout.
- Un client ne peut envoyer un email qu'à sa propre adresse (anti-spam).
