// Remplace l'extension Firebase "Trigger Email" (firestore-send-email), arrêtée le 31 mars 2027.
// Même format de document que l'extension : le site n'a rien à changer.
//
// Document attendu dans la collection `mail` :
//   { to: string | string[], from?, replyTo?, message: { subject, html?, text? } }
// La fonction écrit l'état d'envoi dans `delivery` (PROCESSING → SUCCESS / ERROR).

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { defineSecret, defineString } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import nodemailer from 'nodemailer';

initializeApp();
const db = getFirestore();

const SMTP_PASSWORD = defineSecret('SMTP_PASSWORD');
const SMTP_HOST = defineString('SMTP_HOST', { default: 'ssl0.ovh.net' });
const SMTP_PORT = defineString('SMTP_PORT', { default: '465' });
const SMTP_USER = defineString('SMTP_USER', { default: 'contact@wafi.sn' });
const DEFAULT_FROM = defineString('DEFAULT_FROM', { default: 'WAFI <contact@wafi.sn>' });
const DEFAULT_REPLY_TO = defineString('DEFAULT_REPLY_TO', { default: 'contact@wafi.sn' });

let transporter;
const getTransporter = () => {
  if (!transporter) {
    const port = Number(SMTP_PORT.value());
    transporter = nodemailer.createTransport({
      host: SMTP_HOST.value(),
      port,
      secure: port === 465,
      auth: { user: SMTP_USER.value(), pass: SMTP_PASSWORD.value() },
    });
  }
  return transporter;
};

const toList = (value) => (Array.isArray(value) ? value : value ? [value] : []);

export const sendMail = onDocumentCreated(
  {
    document: 'mail/{mailId}',
    region: 'europe-west1',
    secrets: [SMTP_PASSWORD],
    memory: '256MiB',
    retry: false,
  },
  async (event) => {
    const ref = event.data?.ref;
    if (!ref) return;

    // Les déclencheurs peuvent s'exécuter deux fois : on "réserve" le document pour ne pas envoyer en double.
    const claimed = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.get('delivery.state')) return null;
      tx.update(ref, {
        'delivery.state': 'PROCESSING',
        'delivery.startTime': FieldValue.serverTimestamp(),
        'delivery.attempts': FieldValue.increment(1),
      });
      return snap.data();
    });
    if (!claimed) return;

    const to = toList(claimed.to);
    const message = claimed.message || {};
    if (to.length === 0 || !message.subject || (!message.html && !message.text)) {
      await ref.update({
        'delivery.state': 'ERROR',
        'delivery.error': 'Document incomplet : "to" et "message.subject" + "message.html" ou "message.text" sont requis.',
        'delivery.endTime': FieldValue.serverTimestamp(),
      });
      return;
    }

    try {
      const info = await getTransporter().sendMail({
        from: claimed.from || DEFAULT_FROM.value(),
        replyTo: claimed.replyTo || DEFAULT_REPLY_TO.value(),
        to,
        cc: toList(claimed.cc),
        bcc: toList(claimed.bcc),
        subject: message.subject,
        html: message.html,
        text: message.text,
      });

      await ref.update({
        'delivery.state': 'SUCCESS',
        'delivery.endTime': FieldValue.serverTimestamp(),
        'delivery.info': {
          messageId: info.messageId || null,
          accepted: info.accepted || [],
          rejected: info.rejected || [],
        },
      });
    } catch (error) {
      logger.error('Envoi email échoué', { mailId: event.params.mailId, error: error.message });
      await ref.update({
        'delivery.state': 'ERROR',
        'delivery.error': String(error.message || error),
        'delivery.endTime': FieldValue.serverTimestamp(),
      });
    }
  }
);
