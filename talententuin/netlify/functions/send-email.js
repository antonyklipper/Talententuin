const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
  // Alleen POST requests toestaan
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const formData = JSON.parse(event.body);
    
    // E-mail transporter configureren
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Jouw Gmail adres
        pass: process.env.EMAIL_PASS  // App-specifiek wachtwoord
      }
    });

    // E-mail inhoud bepalen op basis van formulier type
    let subject, htmlContent;
    
    if (formData['form-name'] === 'inschrijving') {
      subject = 'Nieuwe inschrijving Talententuin';
      htmlContent = `
        <h2>Nieuwe inschrijving ontvangen!</h2>
        <p><strong>Naam ouder(s):</strong> ${formData.oudernaam}</p>
        <p><strong>E-mail:</strong> ${formData.email}</p>
        <p><strong>Telefoon:</strong> ${formData.telefoon}</p>
        <p><strong>Naam kind(eren):</strong> ${formData.kindnaam}</p>
        <p><strong>Leeftijd:</strong> ${formData.leeftijd}</p>
        <p><strong>Gekozen kamp:</strong> ${formData.kamp}</p>
        <p><strong>Opmerkingen:</strong> ${formData.opmerkingen || 'Geen opmerkingen'}</p>
        <hr>
        <p><em>Inschrijving ontvangen op ${new Date().toLocaleString('nl-NL')}</em></p>
      `;
    } else if (formData['form-name'] === 'contact') {
      subject = 'Nieuw contactbericht Talententuin';
      htmlContent = `
        <h2>Nieuw contactbericht ontvangen!</h2>
        <p><strong>Naam:</strong> ${formData.naam}</p>
        <p><strong>E-mail:</strong> ${formData.email}</p>
        <p><strong>Bericht:</strong></p>
        <p>${formData.bericht.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>Bericht ontvangen op ${new Date().toLocaleString('nl-NL')}</em></p>
      `;
    }

    // E-mail versturen
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Jouw e-mailadres
      subject: subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'E-mail succesvol verzonden!' })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Er is een fout opgetreden bij het verzenden van de e-mail.' })
    };
  }
}; 