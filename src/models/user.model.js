export async function findUserByEmailHash(db, email_hash) {
	return await db.prepare('SELECT * FROM users WHERE email_hash = ?').bind(email_hash).first()
}

export async function findUserById(db, user_id) {
	return await db.prepare('SELECT * FROM users WHERE user_id = ?').bind(user_id).first()
}

export async function insertUser(db, userData) {
	const {
		user_id, email_hash, email_cipher, first_name, last_name, password_hash,
		phone_cipher, addresses_cipher, profile_image_url, language, default_currency,
		is_member, status, disabled_reason, created_ip, user_agent
	} = userData

	await db.prepare(
		`INSERT INTO users (
			user_id, email_hash, email_cipher, first_name, last_name, password_hash,
			phone_cipher, addresses_cipher, profile_image_url, language, default_currency,
			is_member, status, disabled_reason, created_ip, user_agent
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	).bind(
		user_id, email_hash, email_cipher, first_name, last_name, password_hash,
		phone_cipher, addresses_cipher, profile_image_url ?? null, language ?? 'en', default_currency ?? 'USD',
		is_member ? 1 : 0, status, disabled_reason, created_ip, user_agent
	).run()
}

export async function updateUser(db, user_id, updates) {
	const set = Object.keys(updates).map((k) => `${k} = ?`).join(', ')
	const vals = Object.keys(updates).map((k) => updates[k])
	await db.prepare(`UPDATE users SET ${set}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`)
		.bind(...vals, user_id).run()
}

export async function updateUserLastLogin(db, user_id, ip) {
	await db.prepare(
		`UPDATE users SET last_login_ip = ?, last_login_at = CURRENT_TIMESTAMP WHERE user_id = ?`
	).bind(ip, user_id).run()
}

