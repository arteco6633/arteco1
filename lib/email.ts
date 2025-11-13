import nodemailer from 'nodemailer'

// Создаем транспортер для отправки email
// Используем переменные окружения для конфигурации SMTP
function createTransporter() {
  const smtpHost = process.env.SMTP_HOST || 'smtp.mail.ru'
  const smtpPort = parseInt(process.env.SMTP_PORT || '465')
  const smtpUser = process.env.SMTP_USER || ''
  const smtpPassword = process.env.SMTP_PASSWORD || ''
  const smtpFrom = process.env.SMTP_FROM || smtpUser || 'noreply@arteco.ru'

  if (!smtpUser || !smtpPassword) {
    console.warn('SMTP credentials not configured. Email sending will be disabled.')
    return null
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true для 465 (SSL), false для 587 (STARTTLS)
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  })
}

// Функция для отправки email
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text?: string
}): Promise<boolean> {
  try {
    const transporter = createTransporter()
    if (!transporter) {
      console.warn('Email transporter not available. Skipping email send.')
      return false
    }

    const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@arteco.ru'

    await transporter.sendMail({
      from: `ART=CO <${smtpFrom}>`,
      to,
      subject,
      html,
      text: text || subject,
    })

    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

// Шаблон письма с благодарностью за заказ
export function getOrderConfirmationEmail(orderId: number, customerName: string, total: number): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .order-id { font-size: 24px; font-weight: bold; color: #000; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ART=CO</h1>
        </div>
        <div class="content">
          <h2>Спасибо за ваш заказ!</h2>
          <p>Уважаемый(ая) ${customerName},</p>
          <p>Мы получили ваш заказ и благодарим вас за выбор ART=CO!</p>
          <div class="order-id">Номер заказа: #${orderId}</div>
          <p>Сумма заказа: <strong>${total.toLocaleString('ru-RU')} ₽</strong></p>
          <p>Наш менеджер свяжется с вами в ближайшее время для подтверждения заказа и уточнения деталей доставки.</p>
          <p>Вы будете получать уведомления об изменении статуса вашего заказа на указанный email.</p>
        </div>
        <div class="footer">
          <p>С уважением,<br>Команда ART=CO</p>
          <p>Если у вас возникли вопросы, свяжитесь с нами по телефону или email.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Шаблоны писем для разных статусов заказа
export function getStatusUpdateEmail(
  orderId: number,
  customerName: string,
  status: string,
  statusText: string
): string {
  const statusMessages: Record<string, string> = {
    new: 'Ваш заказ принят и находится в обработке.',
    processing: 'Ваш заказ обрабатывается. Мы готовим его к отправке.',
    pending: 'Ваш заказ ожидает подтверждения или оплаты.',
    delivered: 'Ваш заказ доставлен! Надеемся, что вы останетесь довольны покупкой.',
    completed: 'Ваш заказ завершен. Спасибо за покупку!',
    cancelled: 'К сожалению, ваш заказ был отменен. Если у вас возникли вопросы, свяжитесь с нами.',
  }

  const message = statusMessages[status] || 'Статус вашего заказа был изменен.'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .status { display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; border-radius: 5px; margin: 20px 0; }
        .order-id { font-size: 18px; font-weight: bold; color: #000; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ART=CO</h1>
        </div>
        <div class="content">
          <h2>Обновление статуса заказа</h2>
          <p>Уважаемый(ая) ${customerName},</p>
          <div class="order-id">Номер заказа: #${orderId}</div>
          <div class="status">${statusText}</div>
          <p>${message}</p>
          <p>Вы можете отслеживать статус вашего заказа в личном кабинете или связавшись с нашим менеджером.</p>
        </div>
        <div class="footer">
          <p>С уважением,<br>Команда ART=CO</p>
          <p>Если у вас возникли вопросы, свяжитесь с нами по телефону или email.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Функция для получения текстового названия статуса
export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    new: 'Новый заказ',
    processing: 'В обработке',
    pending: 'Ожидает',
    delivered: 'Доставлен',
    completed: 'Завершен',
    cancelled: 'Отменен',
  }
  return statusMap[status] || status
}

