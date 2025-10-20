const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

exports.handler = async function(event, context) {
  // Alleen POST requests toestaan
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Body parsen: ondersteunt zowel JSON als application/x-www-form-urlencoded
    let formData;
    const contentType = (event.headers && (event.headers['content-type'] || event.headers['Content-Type'])) || '';
    if (contentType.includes('application/json')) {
      formData = JSON.parse(event.body || '{}');
    } else {
      // Default HTML forms posten als x-www-form-urlencoded
      const params = new URLSearchParams(event.body || '');
      formData = Object.fromEntries(params.entries());
    }
    
    // Google Sheets authenticatie
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file'],
    });

    // Google Spreadsheet openen
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    
    // Werkblad selecteren (of aanmaken als het niet bestaat)
    let sheet = doc.sheetsByTitle['Inschrijvingen'];
    if (!sheet) {
      sheet = await doc.addSheet({ title: 'Inschrijvingen' });
      await sheet.setHeaderRow([
        'Datum Inschrijving',
        'Naam Ouder(s)',
        'E-mail',
        'Telefoon',
        'Naam Kind(eren)',
        'Leeftijd',
        'Gekozen Kamp',
        'Opmerkingen'
      ]);
    }

    // Nieuwe rij toevoegen
    const newRow = {
      'Datum Inschrijving': new Date().toLocaleString('nl-NL'),
      'Naam Ouder(s)': formData.oudernaam || '',
      'E-mail': formData.email || '',
      'Telefoon': formData.telefoon || '',
      'Naam Kind(eren)': formData.kindnaam || '',
      'Leeftijd': formData.leeftijd || '',
      'Gekozen Kamp': formData.kamp || '',
      'Opmerkingen': formData.opmerkingen || ''
    };

    await sheet.addRow(newRow);

    // E-mail notificatie (optioneel)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: 'Nieuwe inschrijving Talententuin',
        html: `
          <h2>Nieuwe inschrijving ontvangen!</h2>
          <p><strong>Naam ouder(s):</strong> ${formData.oudernaam}</p>
          <p><strong>E-mail:</strong> ${formData.email}</p>
          <p><strong>Telefoon:</strong> ${formData.telefoon}</p>
          <p><strong>Naam kind(eren):</strong> ${formData.kindnaam}</p>
          <p><strong>Leeftijd:</strong> ${formData.leeftijd}</p>
          <p><strong>Gekozen kamp:</strong> ${formData.kamp}</p>
          <p><strong>Opmerkingen:</strong> ${formData.opmerkingen || 'Geen opmerkingen'}</p>
          <hr>
          <p><em>Inschrijving opgeslagen in Google Sheets op ${new Date().toLocaleString('nl-NL')}</em></p>
        `
      };

      await transporter.sendMail(mailOptions);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Inschrijving succesvol opgeslagen in Google Sheets!',
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Er is een fout opgetreden bij het opslaan van de inschrijving.',
        details: error.message 
      })
    };
  }
};
