import bcrypt from 'bcryptjs'
import prisma from '../../../lib/prisma'
import { signToken } from '../../../lib/auth'

export async function loginWithEmailPassword(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !user.password) {
    return null
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return null
  }

  const token = signToken({ userId: user.id })
  const { password: _, ...safe } = user
  void _

  return { user: safe, token }
}
