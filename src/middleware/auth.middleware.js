import { verifyAccessToken } from '../services/token.service.js'

const te = new TextEncoder()

export default async function authMiddleware(c, next) {
	try {
		const auth = c.req.header('authorization') || ''
		const [, token] = auth.split(' ')
		if (!token) return c.json({ error: 'Unauthorized' }, 401)
		const result = await verifyAccessToken(token, c.env.JWT_SECRET)
		if (!result.valid) {
			return c.json({ error: result.error || 'Unauthorized' }, 401)
		}
		c.set('auth', { user_id: result.payload.sub, email_hash: result.payload.email_hash })
		return next()
	} catch {
		return c.json({ error: 'Unauthorized' }, 401)
	}
}

