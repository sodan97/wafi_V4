# Run and deploy your AI Studio app for Belleza

This contains everything you need to run your app locally.

## Configuration Sécurisée

### 1. Configuration Backend
1. Copiez `backend/.env.example` vers `backend/.env`
2. Modifiez les valeurs dans `backend/.env` avec vos vraies informations :
   - `MONGODB_URI` : Votre chaîne de connexion MongoDB Atlas
   - `JWT_SECRET` : Une clé secrète forte pour les tokens JWT
   - `PORT` : Port du serveur (par défaut 5002)

### 2. Configuration Frontend  
1. Copiez `.env.example` vers `.env.local`
2. Modifiez les valeurs dans `.env.local` :
   - `VITE_API_URL` : URL de votre API backend
   - `VITE_MERCHANT_WHATSAPP_NUMBER` : Numéro WhatsApp du commerçant

⚠️ **IMPORTANT** : Ne commitez JAMAIS les fichiers `.env` et `.env.local` dans Git !

## Run Locally

**Prerequisites:**  Node.js

1. Configure environment variables (see above)
2. Install backend dependencies:
   `cd backend && npm install`
3. Install frontend dependencies:
   `npm install`
4. Start the backend server:
   `cd backend && node server.js`
5. Start the frontend (in another terminal):
   `npm run dev`

# wafi2_V4
