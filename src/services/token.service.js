import { SignJWT, jwtVerify } from 'jose'
import { sha256Hex, base64url } from '../utils/crypto.util.js'

const te = new TextEncoder()

export async function generateAccessToken(user, secret) {
	const nowSec = Math.floor(Date.now() / 1000)
	const payload = {
		sub: user.user_id,
		iat: nowSec,
		exp: nowSec + 15 * 60, // 15 minutes
		first_name: user.first_name,
		last_name: user.last_name,
		email_hash: user.email_hash,
		pwd: user.password_changed_at ? Math.floor(new Date(user.password_changed_at).getTime() / 1000) : 0
	}
	return new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).sign(te.encode(secret))
}

export async function generateRefreshToken() {
	const bytes = new Uint8Array(32)
	crypto.getRandomValues(bytes)
	return base64url(bytes)
}

export async function verifyAccessToken(token, secret) {
	try {
		const { payload } = await jwtVerify(token, te.encode(secret))
		// check password_changed_at
		if (payload.pwd && payload.iat && payload.iat < payload.pwd) {
			return { valid: false, error: 'Token invalidated' }
		}
		return { valid: true, payload }
	} catch (err) {
		return { valid: false, error: err.message }
	}
}

export async function hashRefreshToken(token) {
	return await sha256Hex(token)
}

