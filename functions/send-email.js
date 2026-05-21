const nodemailer = require('nodemailer');

// Configurare Nodemailer per Gmail con SMTP diretto
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'andrea.panbar@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD || 'avmtmprjtbddlumd'
    }
});

// Netlify Function per inviare email
exports.handler = async (event, context) => {
    // Gestire CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { subject, html_content, photo_base64, photo_filename, customer_email, customer_name } = JSON.parse(event.body);

        console.log('📨 Email ricevuta:');
        console.log('   Subject:', subject);
        console.log('   Photo filename:', photo_filename);
        console.log('   Customer email:', customer_email);

        if (!subject || !html_content) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Subject e html_content sono obbligatori' })
            };
        }

        // Preparare gli attachment se c'è una foto
        const attachments = [];

        if (photo_base64 && photo_filename) {
            // Estrarre il base64 dal data URL
            const base64String = photo_base64.replace(/^data:image\/[^;]+;base64,/, '');

            // Aggiungere la foto come attachment INLINE
            attachments.push({
                filename: photo_filename,
                content: Buffer.from(base64String, 'base64'),
                cid: 'photo_inline',
                encoding: 'base64'
            });
        }

        // Email HTML template
        const emailHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #555; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px; }
                    .header { background: #6B5344; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
                    .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
                    h2 { color: #6B5344; border-bottom: 2px solid #C86450; padding-bottom: 10px; }
                    .field { margin: 15px 0; }
                    .label { font-weight: bold; color: #6B5344; }
                    .value { color: #555; margin-left: 10px; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 0.9rem; }
                    pre { background: #f5f0eb; padding: 15px; border-radius: 5px; overflow-x: auto; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🍰 Pasticceria Andrea</h1>
                        <p>Nuova Prenotazione Ricevuta</p>
                    </div>
                    <div class="content">
                        <pre>${html_content}</pre>
                        ${photo_base64 && photo_filename ? `
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                        <div style="margin-top: 30px; text-align: center;">
                            <h3 style="color: #6B5344;">📸 Foto Allegata</h3>
                            <img src="cid:photo_inline" style="max-width: 100%; height: auto; max-height: 500px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" alt="${photo_filename}">
                            <p style="color: #999; font-size: 0.9rem;">📁 ${photo_filename}</p>
                        </div>
                        ` : ''}
                    </div>
                    <div class="footer">
                        <p>© 2026 Pasticceria Andrea | Via Stalingrado, 14 - Cinisello Balsamo (MI)</p>
                        <p>Tel: +39 02 6604 1000 | Email: andrea.panbar@gmail.com</p>
                    </div>
                </div>
            </body>
            </html>
            `;

        // 1️⃣ INVIA EMAIL ALLA PASTICCERIA
        const info = await transporter.sendMail({
            from: 'Pasticceria Andrea <andrea.panbar@gmail.com>',
            to: 'andrea.panbar@gmail.com',
            subject: subject,
            text: html_content.replace(/<[^>]*>/g, ''),
            html: emailHTML,
            replyTo: 'andrea.panbar@gmail.com',
            attachments: attachments
        });

        console.log('✅ Email inviata alla pasticceria:', info.messageId);

        // 2️⃣ INVIA EMAIL DI CONFERMA AL CLIENTE (se email è disponibile)
        if (customer_email) {
            const confirmationHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #555; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px; }
                    .header { background: #6B5344; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
                    .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
                    .success-message { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px; color: #2e7d32; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 0.9rem; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🍰 Pasticceria Andrea</h1>
                        <p>Grazie per il tuo ordine!</p>
                    </div>
                    <div class="content">
                        <p>Ciao ${customer_name || 'Cliente'},</p>
                        <div class="success-message">
                            <h2 style="margin: 0; color: #2e7d32;">✅ Ordine Confermato</h2>
                            <p style="margin: 10px 0 0 0;">Il tuo ordine è stato ricevuto correttamente!</p>
                        </div>
                        <p>Abbiamo registrato la tua prenotazione e il nostro team sta preparando il tuo ordine.</p>
                        <p><strong>Ti contatteremo al numero di telefono fornito per qualsiasi conferma o aggiornamento.</strong></p>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                        <p><strong>Dettagli Ordine:</strong></p>
                        <pre style="background: #f5f0eb; padding: 15px; border-radius: 5px; overflow-x: auto;">${html_content}</pre>
                    </div>
                    <div class="footer">
                        <p>© 2026 Pasticceria Andrea | Via Stalingrado, 14 - Cinisello Balsamo (MI)</p>
                        <p>Tel: +39 02 6604 1000 | Email: andrea.panbar@gmail.com</p>
                        <p>Grazie di aver scelto Pasticceria Andrea! 🍰</p>
                    </div>
                </div>
            </body>
            </html>
            `;

            await transporter.sendMail({
                from: 'Pasticceria Andrea <andrea.panbar@gmail.com>',
                to: customer_email,
                subject: '✅ Ordine Confermato - Pasticceria Andrea',
                text: `Grazie ${customer_name || 'Cliente'}! Il tuo ordine è stato ricevuto correttamente.`,
                html: confirmationHTML,
                replyTo: 'andrea.panbar@gmail.com'
            });

            console.log('✅ Email di conferma inviata al cliente:', customer_email);
        }

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                message: 'Email inviata con successo',
                messageId: info.messageId
            })
        };

    } catch (error) {
        console.error('❌ Errore:', error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: error.message })
        };
    }
};
