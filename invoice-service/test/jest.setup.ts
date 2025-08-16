jest.setTimeout(120000);
process.env.NODE_ENV = 'test';
process.env.TZ = 'UTC';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
process.env.REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET || 'test_refresh_secret';
process.env.AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'refresh_token';
