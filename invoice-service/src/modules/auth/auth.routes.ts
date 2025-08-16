import { Router } from 'express';
import { z } from 'zod';
import { login, logout, refresh } from './auth.service.js';

export const authRouter = Router();

const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = LoginDto.parse(req.body);
    const { user, accessToken, refreshToken } = await login(email, password);
    setRefreshCookie(res, refreshToken);
    res.json({ user, accessToken });
  } catch (e) { next(e); }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!token) return res.status(401).json({ error: { message: 'Missing refresh token' } });
    const { accessToken, refreshToken } = await refresh(token);
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken });
  } catch (e) { next(e); }
});

authRouter.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;
    if (token) await logout(token);
    clearRefreshCookie(res);
    res.status(204).send();
  } catch (e) { next(e); }
});

const setRefreshCookie = (res: any, token: string) => {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/api/v1/auth'
  });
}
const clearRefreshCookie = (res: any) => {
  res.clearCookie('refresh_token', { path: '/api/v1/auth' });
}
