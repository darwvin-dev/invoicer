import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { CustomerModel } from '@/modules/customers/customer.model.js';
import { RefreshTokenModel } from './refreshToken.model.js';

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRES_IN  = process.env.ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '7d';

export async function register(name: string, email: string, password: string) {
  const exists = await CustomerModel.findOne({ email });
  if (exists) throw Object.assign(new Error('Email already used'), { status: 409 });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await CustomerModel.create({ name, email, passwordHash });
  return sanitize(user);
}

export async function login(email: string, password: string) {
  const user = await CustomerModel.findOne({ email });
  if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const { accessToken, refreshToken, jti, refreshExp } = await issueTokens(String(user._id));
  await RefreshTokenModel.create({ jti, customerId: user._id, expiresAt: refreshExp });
  return { user: sanitize(user), accessToken, refreshToken };
}

export async function refresh(oldToken: string) {
  let payload: any;
  try { payload = jwt.verify(oldToken, REFRESH_SECRET); } 
  catch { throw Object.assign(new Error('Invalid refresh token'), { status: 401 }); }

  const rec = await RefreshTokenModel.findOne({ jti: payload.jti, isRevoked: false });
  if (!rec) throw Object.assign(new Error('Refresh token revoked'), { status: 401 });

  rec.isRevoked = true;
  await rec.save();

  const { accessToken, refreshToken, jti, refreshExp } = await issueTokens(payload.sub);
  await RefreshTokenModel.create({ jti, customerId: rec.customerId, expiresAt: refreshExp });

  return { accessToken, refreshToken };
}

export async function logout(refreshToken: string) {
  try {
    const payload: any = jwt.verify(refreshToken, REFRESH_SECRET);
    await RefreshTokenModel.updateOne({ jti: payload.jti }, { $set: { isRevoked: true } });
  } catch { 
    
  }
}

function sanitize(u: any) {
  return { id: String(u._id), name: u.name, email: u.email, createdAt: u.createdAt };
}

async function issueTokens(sub: string) {
  const jti = randomUUID();
  const accessToken = jwt.sign({ sub }, ACCESS_SECRET,  { expiresIn: ACCESS_EXPIRES_IN });
  const refreshToken = jwt.sign({ sub, jti }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
  const now = new Date();
  const refreshExp = new Date(now.getTime() + parseJwtExpMs(REFRESH_EXPIRES_IN));
  return { accessToken, refreshToken, jti, refreshExp };
}

function parseJwtExpMs(s: string) {
  const m = /^(\d+)([mhd])$/.exec(s)!;
  const n = parseInt(m[1], 10);
  if (m[2] === 'm') return n * 60_000;
  if (m[2] === 'h') return n * 3_600_000;
  return n * 86_400_000;
}
