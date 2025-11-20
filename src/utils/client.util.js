export function getClientInfo(c) {
	const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || null
	const ua = c.req.header('user-agent') || null
	return { ip, ua }
}

