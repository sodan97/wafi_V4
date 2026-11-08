// Teste le mot de passe de la boîte OVH utilisée pour envoyer les emails du site.
// Se connecte au serveur d'envoi comme la fonction sendMail, sans envoyer d'email.
// Le mot de passe est tapé masqué et n'est ni affiché ni enregistré.
//
// Usage : node functions/test-smtp.mjs   (depuis le dossier wafi_V4)

import readline from 'node:readline';
import nodemailer from 'nodemailer';

const HOST = 'ssl0.ovh.net';
const PORT = 465;
const USER = 'contact@wafi.sn';

const askHidden = (question) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
    // Après la question, chaque caractère tapé s'affiche comme une étoile
    rl._writeToOutput = () => rl.output.write('*');
  });

const password = await askHidden(`Mot de passe de ${USER} : `);
console.log(`Connexion à ${HOST}:${PORT}...`);

const transporter = nodemailer.createTransport({ host: HOST, port: PORT, secure: true, auth: { user: USER, pass: password } });
try {
  await transporter.verify();
  console.log('OK : OVH accepte ce mot de passe. Tape exactement le même dans la commande firebase functions:secrets:set.');
} catch (error) {
  console.log(`REFUSÉ : ${error.message}`);
  console.log("Ce n'est pas le bon mot de passe (ou il y a une faute de frappe). Réessaie, ou change-le dans l'espace client OVH.");
  process.exitCode = 1;
}
