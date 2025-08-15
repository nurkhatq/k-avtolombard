// Файл: /api/send-email.js
// Поместите этот файл в папку api в корне проекта

import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ===== ВСТАВЬТЕ СВОИ ДАННЫЕ GMAIL ЗДЕСЬ =====
  const GMAIL_USER = 'zayavka.avtolombard@gmail.com'; // <- ЗАМЕНИТЕ на вашу Gmail почту
  const GMAIL_PASS = 'aida krgh dzjw xdtc';  // <- ЗАМЕНИТЕ на 16-значный пароль приложения (БЕЗ пробелов!)
  // =============================================

  // Создаем транспорт
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS.replace(/\s/g, '') // убираем пробелы если есть
    }
  });

  try {
    const formData = req.body;
    
    // Определяем с какой формы пришла заявка
    let formName = 'Основная форма';
    const formId = formData.form_id || '';
    
    if (formId.includes('1590')) formName = 'Обратный звонок (шапка)';
    else if (formId.includes('1615')) formName = 'Узнать стоимость (первый блок)';
    else if (formId.includes('1653')) formName = 'Детальная оценка авто';
    else if (formId.includes('1724')) formName = 'Рассчитать стоимость (попап)';
    else if (formId.includes('1597')) formName = 'Обратная связь';
    else if (formId.includes('1627')) formName = 'Заявка на оценку';
    else if (formId.includes('1663')) formName = 'Узнать стоимость (форма с авто)';
    else if (formId.includes('1736')) formName = 'Заявка из попапа';
    
    // Собираем данные клиента
    let clientName = '';
    let clientPhone = '';
    let carBrand = '';
    let carYear = '';
    let carMileage = '';
    let carTransmission = '';
    
    // Извлекаем данные из всех возможных полей
    for (const [key, value] of Object.entries(formData)) {
      if (!value || key === 'form_id') continue;
      
      // Имя клиента
      if (key.includes('U1597') || key.includes('U1623') || key.includes('U1655') || 
          key.includes('U1736') || key.includes('custom_U')) {
        if (value && !value.includes('@') && value.length < 50 && !clientName) {
          if (!value.match(/^\+?\d+$/) && !value.includes('тыс')) {
            clientName = value;
          }
        }
      }
      
      // Телефон
      if (key.includes('U1592') || key.includes('U1627') || key.includes('U1663') || 
          key.includes('U1725') || key.includes('tel') || key.includes('phone')) {
        if (value && (value.includes('+') || value.match(/^\d{10,}$/))) {
          clientPhone = value;
        }
      }
      
      // Марка авто
      if (key.includes('U1675') || key.includes('марка') || key.includes('модель')) {
        carBrand = value;
      }
      
      // Год выпуска
      if (key.includes('U1659') || key.includes('год')) {
        carYear = value;
      }
      
      // Пробег
      if (key.includes('U1667') || key.includes('пробег')) {
        carMileage = value;
      }
      
      // Коробка передач
      if (key.includes('U1671') || key.includes('коробка')) {
        carTransmission = value;
      }
    }
    
    // Если не нашли имя/телефон, пробуем еще раз по всем полям
    if (!clientName || !clientPhone) {
      for (const [key, value] of Object.entries(formData)) {
        if (!value || key === 'form_id') continue;
        if (!clientPhone && value.match(/^[\+\d\s\-\(\)]+$/) && value.length >= 10) {
          clientPhone = value;
        }
        if (!clientName && !value.match(/^[\+\d\s\-\(\)]+$/) && value.length < 50) {
          clientName = value;
        }
      }
    }
    
    // Формируем красивое письмо
    let htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
          🚗 Новая заявка с сайта автоломбарда
        </h2>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #4CAF50; margin-top: 0;">📋 ${formName}</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>👤 Имя:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${clientName || 'Не указано'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>📱 Телефон:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong style="color: #4CAF50; font-size: 16px;">${clientPhone || 'Не указан'}</strong></td>
            </tr>
    `;
    
    // Добавляем информацию об авто, если есть
    if (carBrand) {
      htmlBody += `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>🚗 Марка/модель:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${carBrand}</td>
            </tr>
      `;
    }
    
    if (carYear) {
      htmlBody += `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>📅 Год выпуска:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${carYear}</td>
            </tr>
      `;
    }
    
    if (carMileage) {
      htmlBody += `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>🛣️ Пробег:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${carMileage}</td>
            </tr>
      `;
    }
    
    if (carTransmission) {
      htmlBody += `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>⚙️ Коробка передач:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${carTransmission}</td>
            </tr>
      `;
    }
    
    htmlBody += `
          </table>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <strong>⚡ Рекомендация:</strong> Перезвоните клиенту в течение 15 минут!
        </div>
        
        <div style="margin-top: 20px; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 12px; color: #666;">
          <p style="margin: 5px 0;">📍 Источник: ${formName}</p>
          <p style="margin: 5px 0;">⏰ Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })}</p>
          <p style="margin: 5px 0;">📱 Версия сайта: ${formId.includes('phone') ? 'Мобильная' : 'Десктопная'}</p>
        </div>
      </div>
    `;

    // Отправляем письмо
    await transporter.sendMail({
      from: `"Сайт Автоломбард" <${GMAIL_USER}>`,
      to: 'dnurhat140@gmail.com',
      subject: `⚡ Новая заявка: ${clientName || 'Клиент'} | ${clientPhone || 'Телефон не указан'}`,
      html: htmlBody,
      text: `Новая заявка\n\nИмя: ${clientName}\nТелефон: ${clientPhone}\n${carBrand ? `Авто: ${carBrand}\n` : ''}${carYear ? `Год: ${carYear}\n` : ''}${carMileage ? `Пробег: ${carMileage}\n` : ''}\nВремя: ${new Date().toLocaleString('ru-RU')}`
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Заявка отправлена!' 
    });

  } catch (error) {
    console.error('Ошибка:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Ошибка отправки' 
    });
  }
}