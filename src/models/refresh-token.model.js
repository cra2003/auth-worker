export async function storeRefreshToken(db, { token_id, user_id, token_hash, user_agent, ip_address, expires_at }) {
	await db.prepare(
		`INSERT INTO refresh_tokens (token_id, user_id, token_hash, user_agent, ip_address, expires_at)
		 VALUES (?, ?, ?, ?, ?, ?)`
	).bind(token_id, user_id, token_hash, user_agent, ip_address, expires_at).run();
}

export async function revokeRefreshToken(db, { token_hash }) {
	await db.prepare('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = ? AND revoked_at IS NULL')
		.bind(token_hash).run();
}

export async function getRefreshToken(db, token_hash) {
	return await db.prepare(
		'SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked_at IS NULL LIMIT 1'
	).bind(token_hash).first();
}

export async function revokeAllUserRefreshTokens(db, user_id) {
	await db.prepare('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL')
		.bind(user_id).run();
}

