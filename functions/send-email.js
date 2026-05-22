const nodemailer = require('nodemailer');

// Configurare Nodemailer per Gmail con SMTP diretto
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'andrea.panbar@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD || 'avmtmprjtbddlumd'
    },
    connectionTimeout: 10000,  // 10 secondi max per connettersi
    socketTimeout: 10000       // 10 secondi max per socket
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
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    // Check payload size (max 5MB)
    const payloadSize = event.body ? event.body.length : 0;
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (payloadSize > maxSize) {
        console.error(`❌ Payload troppo grande: ${Math.round(payloadSize / 1024 / 1024)} MB`);
        return {
            statusCode: 413,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                error: `Payload troppo grande (${Math.round(payloadSize / 1024 / 1024)} MB, max 5MB)`,
                payloadSize: payloadSize
            })
        };
    }

    try {
        // Parse body
        let emailData;
        try {
            emailData = JSON.parse(event.body);
        } catch(parseError) {
            console.error('❌ Errore nel parsing JSON:', parseError.message);
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'JSON malformato: ' + parseError.message })
            };
        }

        const { subject, html_content, photo_base64, photo_filename, customer_email, customer_name } = emailData;

        console.log('📨 Email ricevuta:');
        console.log('   Subject:', subject ? 'OK' : 'MANCANTE');
        console.log('   HTML content:', html_content ? `OK (${html_content.length} chars)` : 'MANCANTE');
        console.log('   Photo filename:', photo_filename || 'Nessuna');
        console.log('   Photo size:', photo_base64 ? `${Math.round(photo_base64.length / 1024)} KB` : 'Nessuna');
        console.log('   Customer email:', customer_email || 'Nessuna');
        console.log('   Payload size totale:', Math.round(event.body.length / 1024), 'KB');

        if (!subject || !html_content) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({
                    error: 'Subject e html_content sono obbligatori',
                    receivedFields: {
                        subject: !!subject,
                        html_content: !!html_content
                    }
                })
            };
        }

        // Preparare gli attachment se c'è una foto
        const attachments = [];

        if (photo_base64 && photo_filename) {
            try {
                // Estrarre il base64 dal data URL
                const base64String = photo_base64.replace(/^data:image\/[^;]+;base64,/, '');

                // Aggiungere la foto come attachment INLINE
                attachments.push({
                    filename: photo_filename,
                    content: Buffer.from(base64String, 'base64'),
                    cid: 'photo_inline',
                    encoding: 'base64'
                });
                console.log('✅ Foto processata correttamente:', photo_filename);
            } catch(photoError) {
                console.error('⚠️ Errore nel processare la foto, continuo senza allegato:', photoError.message);
                // Continuo senza l'allegato piuttosto che fallire completamente
            }
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
        console.log('📧 Tentativo di invio email alla pasticceria...');
        let info;
        try {
            info = await transporter.sendMail({
                from: 'Pasticceria Andrea <andrea.panbar@gmail.com>',
                to: 'andrea.panbar@gmail.com',
                subject: subject,
                text: html_content.replace(/<[^>]*>/g, ''),
                html: emailHTML,
                replyTo: 'andrea.panbar@gmail.com',
                attachments: attachments
            });
            console.log('✅ Email inviata alla pasticceria:', info.messageId);
        } catch(emailError) {
            console.error('❌ Errore nell\'invio email alla pasticceria:', emailError.message);
            throw new Error(`Impossibile inviare email a pasticceria: ${emailError.message}`);
        }

        // 2️⃣ INVIA EMAIL DI CONFERMA AL CLIENTE (se email è disponibile)
        if (customer_email) {
            console.log('📧 Tentativo di invio email di conferma al cliente:', customer_email);
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

            try {
                await transporter.sendMail({
                    from: 'Pasticceria Andrea <andrea.panbar@gmail.com>',
                    to: customer_email,
                    subject: '✅ Ordine Confermato - Pasticceria Andrea',
                    text: `Grazie ${customer_name || 'Cliente'}! Il tuo ordine è stato ricevuto correttamente.`,
                    html: confirmationHTML,
                    replyTo: 'andrea.panbar@gmail.com'
                });
                console.log('✅ Email di conferma inviata al cliente:', customer_email);
            } catch(confirmError) {
                console.error('⚠️ Errore nell\'invio email di conferma (continuiamo comunque):', confirmError.message);
                // Non throwamo l'errore perché l'ordine è già stato registrato
            }
        }

        console.log('✅✅✅ SUCCESSO! Email inviata completamente.');
        console.log('   MessageID:', info.messageId);
        console.log('   Attached files:', attachments.length);

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                message: 'Email inviata con successo',
                messageId: info.messageId,
                attachmentsCount: attachments.length
            })
        };

    } catch (error) {
        console.error('❌ Errore:', error);
        console.error('   Nome errore:', error.name);
        console.error('   Messaggio:', error.message);
        console.error('   Stack:', error.stack);

        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                error: error.message,
                errorName: error.name,
                errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};
