import { Router } from 'express';
import { z } from 'zod';
import { login, logout, refresh, register } from './auth.service.js';

const r = Router();

const RegisterDto = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8)
});
const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

r.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = RegisterDto.parse(req.body);
    const user = await register(name, email, password);
    res.status(201).json({ user });
  } catch (e) { next(e); }
});

r.post('/login', async (req, res, next) => {
  try {
    const { email, password } = LoginDto.parse(req.body);
    const { user, accessToken, refreshToken } = await login(email, password);
    setRefreshCookie(res, refreshToken);
    res.json({ user, accessToken });
  } catch (e) { next(e); }
});

r.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!token) return res.status(401).json({ error: { message: 'Missing refresh token' }});
    const { accessToken, refreshToken } = await refresh(token);
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken });
  } catch (e) { next(e); }
});

r.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;
    if (token) await logout(token);
    clearRefreshCookie(res);
    res.status(204).send();
  } catch (e) { next(e); }
});

function setRefreshCookie(res: any, token: string) {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/api/v1/auth'
  });
}
function clearRefreshCookie(res: any) {
  res.clearCookie('refresh_token', { path: '/api/v1/auth' });
}

export default r;
