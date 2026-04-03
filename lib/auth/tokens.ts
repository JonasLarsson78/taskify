import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret'

export type JWTPayload = Record<string, unknown>

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload as object, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): unknown | null {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}
