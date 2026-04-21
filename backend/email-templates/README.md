# Templates d'Emails WAFI

Ce dossier contient les templates HTML pour les emails automatiques envoyés par WAFI.

## Templates Disponibles

### 1. `welcome.html` - Email de Bienvenue
Envoyé automatiquement lors de l'inscription d'un nouvel utilisateur.

**Variables disponibles:**
- `{{LOGO_URL}}` - URL du logo WAFI
- `{{NOM_CLIENT}}` - Nom complet du client
- `{{LIEN_BOUTIQUE}}` - Lien vers la boutique
- `{{EMAIL_CONTACT}}` - Email de contact
- `{{TELEPHONE}}` - Numéro de téléphone
- `{{WHATSAPP}}` - Numéro WhatsApp
- `{{ANNEE}}` - Année en cours

### 2. `stock-notification.html` - Notification de Stock
Envoyé lorsqu'un produit réservé revient en stock.

**Variables disponibles:**
- `{{LOGO_URL}}` - URL du logo WAFI
- `{{NOM_CLIENT}}` - Nom du client
- `{{NOM_PRODUIT}}` - Nom du produit
- `{{LIEN_PRODUIT}}` - Lien vers le produit
- `{{EMAIL_CONTACT}}` - Email de contact
- `{{TELEPHONE}}` - Numéro de téléphone
- `{{WHATSAPP}}` - Numéro WhatsApp
- `{{ANNEE}}` - Année en cours

## Modification des Templates

1. Éditez les fichiers HTML dans `backend/email-templates/`
2. Copiez les fichiers modifiés vers `public/email-templates/`:
   ```powershell
   Copy-Item -Path "backend/email-templates/*.html" -Destination "public/email-templates/" -Force
   ```

## Logo

Le logo utilisé dans les emails est hébergé à: `https://wafi.sn/logo2-site.png`

Pour changer le logo:
1. Placez le nouveau logo dans le dossier `public/`
2. Mettez à jour la variable `LOGO_URL` dans `src/services/notificationService.ts`

## Configuration

Les informations de contact sont configurées dans:
- `src/services/notificationService.ts` - Configuration du service
- `.env.local` - Numéro WhatsApp (`VITE_MERCHANT_WHATSAPP_NUMBER`)

## Envoi des Emails

Les emails sont envoyés via Firebase Extension "Trigger Email" avec SendGrid.

La configuration se trouve dans:
- `backend/.env` - Configuration SendGrid
- `firestore.rules` - Règles d'accès à la collection `mail`
