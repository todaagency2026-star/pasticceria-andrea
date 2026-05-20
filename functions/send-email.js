const nodemailer = require('nodemailer');

// Configurare Nodemailer per Gmail con SMTP diretto
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'andrea.panbar@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD || 'pfyy ztal iybg whei'
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
        const { subject, html_content, photo_base64, photo_filename } = JSON.parse(event.body);

        console.log('📨 Email ricevuta:');
        console.log('   Subject:', subject);
        console.log('   Photo filename:', photo_filename);

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

        // Inviare l'email
        const info = await transporter.sendMail({
            from: 'Pasticceria Andrea <andrea.panbar@gmail.com>',
            to: 'andrea.panbar@gmail.com',
            subject: subject,
            text: html_content.replace(/<[^>]*>/g, ''),
            html: `
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
            `,
            replyTo: 'andrea.panbar@gmail.com',
            attachments: attachments
        });

        console.log('✅ Email inviata:', info.messageId);

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
