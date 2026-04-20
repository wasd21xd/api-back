// Утилита для определения информации об устройстве
const ua = require('ua-parser-js');

const getDeviceInfo = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const parser = new ua(userAgent);
  const result = parser.getResult();
  
  // Получаем IP адрес (через прокси или напрямую)
  const ipAddress = (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  );

  const deviceName = `${result.browser.name || 'Unknown'} on ${result.os.name || 'Unknown'}`;

  return {
    device_name: deviceName,
    browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
    os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
    ip_address: ipAddress,
  };
};

module.exports = getDeviceInfo;
