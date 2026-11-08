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

Backend : App Hosting déploie depuis la branche GitHub de `sodan97/wafi_V4` (pousser le code, puis lancer un déploiement depuis la console Firebase > App Hosting).

### Emails : migration hors de l'extension « Trigger Email » (avant le 31 mars 2027)

1. Enregistrer le mot de passe du compte OVH `contact@wafi.sn` (saisi par vous, jamais dans le code) :
   `firebase functions:secrets:set SMTP_PASSWORD`
2. Déployer la fonction : `firebase deploy --only functions`
3. **Aussitôt après**, désinstaller l'extension pour éviter les emails en double :
   `firebase ext:uninstall firestore-send-email`
4. Tester : créer un compte client → l'email de bienvenue doit arriver ; dans Firestore, le document `mail` passe à `delivery.state = SUCCESS`.

Paramètres modifiables (valeurs par défaut) : `SMTP_HOST=ssl0.ovh.net`, `SMTP_PORT=465`, `SMTP_USER=contact@wafi.sn`, `DEFAULT_FROM=WAFI <contact@wafi.sn>`.

## Sécurité (règles Firestore)

- Une commande n'est acceptée que si chaque prix correspond au catalogue, si le total est exact et si le stock suffit (10 produits différents maximum par commande).
- Un client ne lit que ses commandes, réservations et favoris ; l'admin lit tout.
- Un client ne peut envoyer un email qu'à sa propre adresse (anti-spam).
