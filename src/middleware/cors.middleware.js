import { cors } from 'hono/cors'

export default cors({
	origin: (origin) => {
		// Allow localhost for development and your production frontend
		if (!origin) return '*'
		if (origin.includes('localhost') || origin.includes('127.0.0.1')) return origin
		// Add your production frontend URL here when deployed
		// if (origin === 'https://your-frontend-domain.com') return origin
		return origin
	},
	credentials: true,
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowHeaders: ['Content-Type', 'Authorization'],
	exposeHeaders: ['Content-Type']
})

