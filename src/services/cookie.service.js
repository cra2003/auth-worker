export function setRefreshTokenCookie(c, token) {
	const maxAge = 60 * 60 * 24 * 7 // 7 days
	// SameSite=None required for cross-origin (localhost -> worker domain)
	// Secure is required when using SameSite=None
	const cookie = [
		`refresh_token=${token}`,
		'HttpOnly',
		'Secure',
		'SameSite=None',
		'Path=/',
		`Max-Age=${maxAge}`
	].join('; ')
	c.header('Set-Cookie', cookie, { append: true })
}

export function clearAuthCookies(c) {
	c.header('Set-Cookie', 'refresh_token=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0', { append: true })
}

export function getRefreshTokenFromCookie(c) {
	const cookie = c.req.header('cookie') || ''
	const m = cookie.match(/(?:^|;\s*)refresh_token=([^;]+)/)
	return m ? decodeURIComponent(m[1]) : null
}

