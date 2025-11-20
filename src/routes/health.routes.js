import { healthHandler, rootHandler } from '../handlers/health.handler.js'

export function registerHealthRoutes(app) {
	app.get('/health', healthHandler)
	app.get('/', rootHandler)
}

