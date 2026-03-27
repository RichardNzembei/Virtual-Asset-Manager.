export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.S_DATABASE_HOST || 'localhost',
    port: parseInt(process.env.S_DATABASE_PORT || '3306', 10),
    username: process.env.S_DATABASE_USER || 'siku_zangu',
    password: process.env.S_DATABASE_PASSWORD || 'Saint@mysql4',
    name: process.env.S_DATABASE_NAME || 'tramia_dev',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'tramia-jwt-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'tramia-jwt-refresh-secret',
    expiry: process.env.JWT_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
  },
  cronSecret: process.env.CRON_SECRET,
});
