const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
app.use(cors());

// Configurare Nodemailer per Gmail con SMTP diretto
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'andrea.panbar@gmail.com',
        // Usa una "Password per le app" da https://myaccount.google.com/apppasswords
        // Non la password di Gmail normale!
        pass: 'pfyy ztal iybg whei' // Password app per Gmail
    }
});

// Endpoint per ricevere e inviare email
app.post('/send-email', async (req, res) => {
    try {
        const { subject, html_content, photo_base64, photo_filename } = req.body;

        console.log('📨 Email ricevuta:');
        console.log('   Subject:', subject);
        console.log('   HTML Content length:', html_content ? html_content.length : 'NULL');
        console.log('   Photo base64 length:', photo_base64 ? photo_base64.length : 'NULL');
        console.log('   Photo filename:', photo_filename);

        if (!subject || !html_content) {
            return res.status(400).json({ error: 'Subject e html_content sono obbligatori' });
        }

        // Preparare gli attachment se c'è una foto
        const attachments = [];
        let htmlWithPhoto = html_content;

        if (photo_base64 && photo_filename) {
            // Estrarre il base64 dal data URL (rimuovere "data:image/...;base64," prefix)
            const base64String = photo_base64.replace(/^data:image\/[^;]+;base64,/, '');

            // Aggiungere la foto come attachment INLINE (visibile nell'email)
            attachments.push({
                filename: photo_filename,
                content: Buffer.from(base64String, 'base64'),
                cid: 'photo_inline',
                encoding: 'base64'
            });

            // Aggiungere l'immagine inline all'HTML
            htmlWithPhoto += `
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <div style="margin-top: 30px; text-align: center;">
                <h3 style="color: #6B5344;">Foto Allegate</h3>
                <img src="cid:photo_inline" style="max-width: 100%; height: auto; max-height: 500px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" alt="${photo_filename}">
                <p style="color: #999; font-size: 0.9rem;">
                    <a href="cid:photo_inline" style="color: #C86450; text-decoration: none;">📥 Scarica foto</a>
                </p>
            </div>
            `;
        }

        // Inviare l'email
        const info = await transporter.sendMail({
            from: 'Pasticceria Andrea <andrea.panbar@gmail.com>',
            to: 'andrea.panbar@gmail.com',
            subject: subject,
            text: html_content.replace(/<[^>]*>/g, ''), // Plain text fallback (strip HTML tags)
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
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🍰 Pasticceria Andrea</h1>
                        <p>Nuova Prenotazione Ricevuta</p>
                    </div>
                    <div class="content">
                        ${html_content}
                        ${photo_base64 && photo_filename ? `
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                        <div style="margin-top: 30px; text-align: center;">
                            <h3 style="color: #6B5344;">📸 Foto Allegata</h3>
                            <img src="cid:photo_inline" style="max-width: 100%; height: auto; max-height: 500px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" alt="${photo_filename}">
                            <p style="color: #999; font-size: 0.9rem;">Foto: ${photo_filename}</p>
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
        console.log('   Foto Allegata:', photo_filename ? '✅ Sì' : '❌ No');
        res.json({ success: true, message: 'Email inviata con successo', messageId: info.messageId });

    } catch (error) {
        console.error('❌ Errore:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Server email avviato su http://localhost:${PORT}`);
    console.log('Pasticceria Andrea - Sistema prenotazioni');
});
