const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp-relay.sendinblue.com", // SMTP do Brevo
  port: Number(process.env.MAIL_PORT) || 587, // Convertendo para número
  secure: Number(process.env.MAIL_PORT) === 465, // SSL para porta 465, TLS para 587
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: true, // Maior segurança
  },
});

// Função para ler e compilar templates dinamicamente
async function loadTemplate(templateName, data) {
  const templatePath = path.join(
    __dirname,
    "templates",
    `${templateName}.html`
  );
  const templateFile = fs.readFileSync(templatePath, "utf-8");
  const compiledTemplate = handlebars.compile(templateFile);
  return compiledTemplate(data);
}

async function sendMail(to, templateName, subject, data, attachments) {
  try {
    const html = await loadTemplate(templateName, data);
    console.log(`📤 Enviando email para ${to}...`);

    const mailOptions = {
      from: "Piweto <anacleto@1kole.com>",
      to,
      subject,
      html,
      ...(Array.isArray(attachments) &&
        attachments.length > 0 && {
          attachments: attachments.map((attachment) => ({
            filename: attachment.filename,
            path: attachment.path,
            contentType: attachment.contentType || "application/pdf",
            encoding: "base64",
          })),
        }),
    };

    // Validação básica dos anexos
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        if (!fs.existsSync(attachment.path)) {
          throw new Error(`Arquivo não encontrado: ${attachment.path}`);
        }
      }
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email enviado com sucesso! ID: ${info.messageId}`);

    return info;
  } catch (err) {
    console.error("❌ Erro ao enviar o E-mail:", err.message);
    throw err; // Rejeita a promise para tratamento externo
  }
}

module.exports = sendMail;
