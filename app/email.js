import nodemailer from 'nodemailer'

export function createTransporter(emailConfig) {
  return nodemailer.createTransport({
    host: emailConfig.server,
    port: emailConfig.port,
    secure: false,
    auth: {
      user: emailConfig.username,
      pass: emailConfig.password,
    }
  })
}

export function sendEmail(transporter, report, emailConfig) {
  console.info(`>> Sending email to ${emailConfig.to}`)
  const mailOptions = {
    from: emailConfig.username,
    to: emailConfig.to,
    subject: 'Backup Report',
    text: report,
  }

  return transporter.sendMail(mailOptions)
}
