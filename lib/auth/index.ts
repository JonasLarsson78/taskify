import { signToken, verifyToken } from './tokens'

export { signToken, verifyToken }
export type { JWTPayload } from './tokens'

const auth = { signToken, verifyToken }
export default auth
