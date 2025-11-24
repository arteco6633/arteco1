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

// Шаблон письма для заявок на обратный звонок
export function getCallbackRequestEmail(data: {
  name: string
  phone: string
  comment?: string | null
  createdAt?: string
}): string {
  const date = data.createdAt
    ? new Date(data.createdAt).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })

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
        .info-block { background-color: #fff; padding: 15px; margin: 10px 0; border-left: 4px solid #000; }
        .info-label { font-weight: bold; color: #000; margin-bottom: 5px; }
        .info-value { color: #333; }
        .comment-block { background-color: #fff; padding: 15px; margin: 10px 0; border-left: 4px solid #000; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📞 Новая заявка на обратный звонок</h1>
        </div>
        <div class="content">
          <p>Поступила новая заявка на обратный звонок с сайта ART=CO.</p>
          
          <div class="info-block">
            <div class="info-label">👤 Имя клиента:</div>
            <div class="info-value">${data.name}</div>
          </div>
          
          <div class="info-block">
            <div class="info-label">📱 Телефон:</div>
            <div class="info-value"><a href="tel:${data.phone}" style="color: #000; text-decoration: none;">${data.phone}</a></div>
          </div>
          
          ${data.comment && data.comment.trim() ? `
          <div class="comment-block">
            <div class="info-label">💬 Комментарий:</div>
            <div class="info-value">${data.comment.trim().replace(/\n/g, '<br>')}</div>
          </div>
          ` : ''}
          
          <div class="info-block">
            <div class="info-label">🕐 Дата и время:</div>
            <div class="info-value">${date}</div>
          </div>
          
          <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
            <strong>Не забудьте связаться с клиентом в ближайшее время!</strong>
          </p>
        </div>
        <div class="footer">
          <p>С уважением,<br>Система уведомлений ART=CO</p>
          <p>Это автоматическое письмо, не отвечайте на него.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

