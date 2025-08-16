import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { number, z } from 'zod';
import { CustomerModel } from '@/modules/customers/customer.model.js';
import { RefreshTokenModel } from './refreshToken.model.js';

const Env = z.object({
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  ACCESS_EXPIRES_IN: z.string().min(1).default('15m'), 
  REFRESH_EXPIRES_IN: z.string().min(1).default('7d'),
}).parse(process.env);

const ACCESS_OPTS: SignOptions  = { expiresIn: toSeconds(Env.ACCESS_EXPIRES_IN) };
const REFRESH_OPTS: SignOptions = { expiresIn: toSeconds(Env.REFRESH_EXPIRES_IN) };

class HttpError extends Error { constructor(public status: number, msg: string){ super(msg);} }
const boom = (s: number, m: string) => new HttpError(s, m);

type PublicUser = { id: string; name: string; email: string; createdAt: Date };
type JwtRefreshPayload = JwtPayload & { jti: string; sub: string };

function sanitize(u: any): PublicUser {
  return { id: String(u._id), name: u.name, email: u.email, createdAt: u.createdAt };
}

function toSeconds(s?: string): number {
  const v = (s ?? '').trim();
  if (!v) throw new Error('Invalid duration: empty');

  const m = /^(\d+)\s*([smhd])$/i.exec(v) || [1,20];

  const n = parseInt((m[1]).toString(), 10);
  switch ((m[2])?.toString().toLowerCase()) {
    case 's': return n;
    case 'm': return n * 60;
    case 'h': return n * 3600;
    case 'd': return n * 86400;
    default:  throw new Error(`Invalid duration unit: ${v}`);
  }
}

function toMillis(s: string): number {
  return toSeconds(s) * 1000;
}

export const login = async(email: string, password: string) => {
  const user = await CustomerModel.findOne({ email });
  if (!user) throw boom(401, 'Invalid credentials');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw boom(401, 'Invalid credentials');

  const { accessToken, refreshToken, jti, refreshExp } = await issueTokens(String(user._id));
  await RefreshTokenModel.create({ jti, customerId: user._id, expiresAt: refreshExp });

  return { user: sanitize(user), accessToken, refreshToken };
}

export async function refresh(oldToken: string) {
  let payload: JwtRefreshPayload;
  try {
    payload = jwt.verify(oldToken, Env.JWT_REFRESH_SECRET) as JwtRefreshPayload;
  } catch {
    throw boom(401, 'Invalid refresh token');
  }

  const rec = await RefreshTokenModel.findOne({ jti: payload.jti, isRevoked: false });
  if (!rec) throw boom(401, 'Refresh token revoked');

  rec.isRevoked = true;
  await rec.save();

  const { accessToken, refreshToken, jti, refreshExp } = await issueTokens(payload.sub);
  await RefreshTokenModel.create({ jti, customerId: rec.customerId, expiresAt: refreshExp });

  return { accessToken, refreshToken };
}

export async function logout(refreshToken: string) {
  try {
    const payload = jwt.verify(refreshToken, Env.JWT_REFRESH_SECRET) as JwtRefreshPayload;
    await RefreshTokenModel.updateOne({ jti: payload.jti }, { $set: { isRevoked: true } });
  } catch { }
}

async function issueTokens(sub: string) {
  const jti = randomUUID();

  const accessToken  = jwt.sign({ sub },      Env.JWT_ACCESS_SECRET,  ACCESS_OPTS);
  const refreshToken = jwt.sign({ sub, jti }, Env.JWT_REFRESH_SECRET, REFRESH_OPTS);

  const refreshExp = new Date(Date.now() + toMillis(Env.REFRESH_EXPIRES_IN));
  return { accessToken, refreshToken, jti, refreshExp };
}
