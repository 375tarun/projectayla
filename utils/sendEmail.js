import nodemailer  from 'nodemailer';

export const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true, 
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    const response = await transporter.sendMail(mailOptions);
    return {
      success: true,
      message: `Email sent successfully to ${options.email}`,
      response, 
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to send email: ${error.message}`,
      error, 
    };
  }
};