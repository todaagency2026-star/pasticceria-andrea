# 📧 Configurazione Email - Pasticceria Andrea

## Status: ✅ ATTIVO E FUNZIONANTE

### Variabili d'Ambiente Netlify
- **GMAIL_APP_PASSWORD**: Configurata su Netlify (Production)
- **EMAIL_RECIPIENT**: andrea.panbar@gmail.com

### Funzione Netlify
- **Percorso**: `functions/send-email.js`
- **Endpoint**: `/.netlify/functions/send-email`
- **Status**: ✅ Deployata e operativa

### Flusso Email
1. Cliente invia ordine dal sito
2. Netlify Function legge la password app Gmail da variabili d'ambiente
3. Email inviata a andrea.panbar@gmail.com (ordine)
4. Email inviata al cliente (conferma ordine)
5. Client vede "Ordine inviato, Grazie Mille ❤️"

### Password App Gmail
- Email: andrea.panbar@gmail.com
- Password App: Configurata su Netlify (non in git per sicurezza)
- Scadenza: NESSUNA - rimane valida finché non la revochi

### Test Email
Per testare se le email funzionano:
1. Vai su https://pasticceria-andrea.com
2. Compila il form di prenotazione
3. Invia l'ordine
4. Controlla email a andrea.panbar@gmail.com e email cliente

### Troubleshooting
Se le email non arrivano:
1. Controlla spam/cartella promozionali
2. Verifica che GMAIL_APP_PASSWORD sia configurata su Netlify
3. Verifica i log della funzione: https://app.netlify.com/projects/pasticceria-andrea/logs/functions

### Deploy History
- Ultimo deploy: Thu May 21 14:25:XX 2026
- Funzione email: Sempre sincronizzata con main branch

---
**Non modificare** `functions/send-email.js` senza aggiornare il codice su GitHub!
