import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc, getDoc, addDoc } from 'firebase/firestore';
import { MERCHANT_WHATSAPP_NUMBER } from '../../constants';

interface NotificationResult {
  success: boolean;
  emailsSent: number;
  emailsFailed: number;
  totalReservations: number;
  message: string;
}

class NotificationService {
  private readonly LOGO_URL = 'https://firebasestorage.googleapis.com/v0/b/projet-wafi-dev.firebasestorage.app/o/logo.png?alt=media&token=92c1230e-2851-4b35-b46e-6fa16de2ae2d';
  private readonly SHOP_URL = 'https://wafi.sn';
  private readonly CONTACT_EMAIL = 'contact@wafi.sn';
  private readonly CURRENT_YEAR = new Date().getFullYear();

  private async loadEmailTemplate(templateName: string): Promise<string> {
    try {
      const response = await fetch(`/email-templates/${templateName}.html`);
      if (!response.ok) {
        throw new Error(`Failed to load template: ${templateName}`);
      }
      return await response.text();
    } catch (error) {
      console.error(`Error loading email template ${templateName}:`, error);
      return '';
    }
  }

  private replaceTemplatePlaceholders(template: string, replacements: Record<string, string>): string {
    let result = template;
    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    try {
      const template = await this.loadEmailTemplate('welcome');
      if (!template) {
        console.error('Welcome email template not found');
        return false;
      }

      const htmlContent = this.replaceTemplatePlaceholders(template, {
        LOGO_URL: this.LOGO_URL,
        NOM_CLIENT: userName,
        LIEN_BOUTIQUE: this.SHOP_URL,
        EMAIL_CONTACT: this.CONTACT_EMAIL,
        TELEPHONE: MERCHANT_WHATSAPP_NUMBER,
        WHATSAPP: MERCHANT_WHATSAPP_NUMBER,
        ANNEE: this.CURRENT_YEAR.toString()
      });

      await addDoc(collection(db, 'mail'), {
        to: [userEmail],
        from: 'contact@wafi.sn',
        message: {
          subject: 'Bienvenue chez WAFI - Votre compte est actif ! 🎉',
          html: htmlContent,
        },
      });

      console.log(`✅ [NotificationService] Welcome email queued for ${userEmail}`);
      return true;
    } catch (error) {
      console.error(`❌ [NotificationService] Failed to send welcome email to ${userEmail}:`, error);
      return false;
    }
  }

  /**
   * Envoie des notifications par email lorsqu'un produit revient en stock
   * Utilise Firebase Extension "Trigger Email" avec SendGrid
   * @param productId - L'ID du produit dans Firestore
   * @param productName - Le nom du produit
   * @param oldStock - L'ancien stock (avant mise à jour)
   * @param newStock - Le nouveau stock (après mise à jour)
   * @param productImage - L'URL de l'image du produit (optionnel)
   */
  async notifyStockAvailable(
    productId: string,
    productName: string,
    oldStock: number,
    newStock: number,
    productImage?: string
  ): Promise<NotificationResult> {
    try {
      // Ne notifier que si le stock passe de 0 à une valeur > 0
      if (oldStock !== 0 || newStock === 0) {
        return {
          success: true,
          emailsSent: 0,
          emailsFailed: 0,
          totalReservations: 0,
          message: 'No notification needed (stock was not 0 or is still 0)'
        };
      }

      console.log(`🔔 [NotificationService] Product "${productName}" is back in stock. Checking for reservations...`);

      // Récupérer toutes les réservations pour ce produit avec notification email
      const reservationsRef = collection(db, 'reservations');
      const q = query(
        reservationsRef,
        where('productId', '==', productId),
        where('notificationMethod', '==', 'email')
      );
      const reservationsSnapshot = await getDocs(q);

      if (reservationsSnapshot.empty) {
        console.log(`ℹ️  [NotificationService] No email reservations found for product ${productName}`);
        return {
          success: true,
          emailsSent: 0,
          emailsFailed: 0,
          totalReservations: 0,
          message: 'No users to notify'
        };
      }

      console.log(`📋 [NotificationService] Found ${reservationsSnapshot.size} email reservation(s) for product ${productName}`);

      let emailsSent = 0;
      let emailsFailed = 0;

      // Charger le template d'email une seule fois
      const template = await this.loadEmailTemplate('stock-notification');

      // Pour chaque réservation, créer un document dans la collection 'mail'
      // Firebase Extension détectera automatiquement et enverra l'email via SendGrid
      for (const reservationDoc of reservationsSnapshot.docs) {
        const reservation = reservationDoc.data();

        try {
          let userEmail: string | null = null;
          let userName: string = 'Client';

          // Récupérer l'email selon le type de réservation
          if (reservation.userId) {
            // Utilisateur connecté
            const userDoc = await getDoc(doc(db, 'users', reservation.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              userEmail = userData.email;
              userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Client';
            }
          } else if (reservation.guestEmail) {
            // Invité
            userEmail = reservation.guestEmail;
            userName = 'Client';
          }

          if (!userEmail) {
            console.warn(`⚠️  [NotificationService] No email found for reservation ${reservationDoc.id}, skipping...`);
            emailsFailed++;
            continue;
          }

          // Créer un document dans la collection 'mail'
          // Firebase Extension "Trigger Email" le détectera et enverra l'email
          try {
            const htmlContent = template
              ? this.replaceTemplatePlaceholders(template, {
                  LOGO_URL: this.LOGO_URL,
                  NOM_CLIENT: userName,
                  NOM_PRODUIT: productName,
                  IMAGE_PRODUIT: productImage || this.LOGO_URL,
                  LIEN_PRODUIT: `${this.SHOP_URL}?product=${productId}`,
                  EMAIL_CONTACT: this.CONTACT_EMAIL,
                  TELEPHONE: MERCHANT_WHATSAPP_NUMBER,
                  WHATSAPP: MERCHANT_WHATSAPP_NUMBER,
                  ANNEE: this.CURRENT_YEAR.toString()
                })
              : `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #4ECDC4 0%, #44B09E 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">WAFI</h1>
                  </div>
                  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #4ECDC4; margin-top: 0;">Bonne nouvelle ${userName} !</h2>
                    ${productImage ? `
                    <div style="text-align: center; margin: 20px 0;">
                      <img src="${productImage}" alt="${productName}" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #e5e7eb;">
                    </div>
                    ` : ''}
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                      Le produit <strong style="color: #FF6B35;">${productName}</strong> que vous avez réservé est maintenant disponible en stock.
                    </p>
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                      Connectez-vous à votre compte WAFI pour passer commande avant qu'il ne soit à nouveau en rupture !
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${this.SHOP_URL}" style="display: inline-block; background-color: #4ECDC4; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        Voir le produit
                      </a>
                    </div>
                    <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
                      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                        Cordialement,<br/>
                        <strong>L'équipe WAFI</strong>
                      </p>
                    </div>
                  </div>
                  <div style="text-align: center; margin-top: 20px;">
                    <p style="color: #9ca3af; font-size: 12px;">
                      © ${this.CURRENT_YEAR} WAFI. Tous droits réservés.
                    </p>
                  </div>
                </div>
              `;

            await addDoc(collection(db, 'mail'), {
              to: [userEmail],
              from: 'contact@wafi.sn',
              message: {
                subject: `Le produit "${productName}" est de nouveau disponible ! 🎉`,
                html: htmlContent,
              },
            });

            emailsSent++;
            console.log(`✅ [NotificationService] Email queued for ${userEmail}`);
          } catch (emailError) {
            emailsFailed++;
            console.error(`❌ [NotificationService] Failed to queue email for ${userEmail}:`, emailError);
          }

          // Supprimer la réservation après traitement
          await deleteDoc(doc(db, 'reservations', reservationDoc.id));
          console.log(`🗑️  [NotificationService] Deleted reservation ${reservationDoc.id}`);

        } catch (error) {
          emailsFailed++;
          console.error(`❌ [NotificationService] Error processing reservation ${reservationDoc.id}:`, error);
        }
      }

      const summary = {
        success: true,
        emailsSent,
        emailsFailed,
        totalReservations: reservationsSnapshot.size,
        message: `Emails queued: ${emailsSent}, Failed: ${emailsFailed}`
      };

      console.log(`📊 [NotificationService] Summary for product "${productName}":`, summary);
      return summary;

    } catch (error) {
      console.error(`❌ [NotificationService] Error in notifyStockAvailable:`, error);
      return {
        success: false,
        emailsSent: 0,
        emailsFailed: 0,
        totalReservations: 0,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default new NotificationService();
