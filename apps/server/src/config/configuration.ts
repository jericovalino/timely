export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',
    expiresIn: '7d',
  },
  scan: {
    cooldownMinutes: parseInt(process.env.SCAN_COOLDOWN_MINUTES || '120', 10),
  },
});
