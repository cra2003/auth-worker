import { Hono } from 'hono'
import corsMiddleware from './middleware/cors.middleware.js'
import loggingMiddleware from './middleware/logging.middleware.js'
import { registerAuthRoutes } from './routes/auth.routes.js'
import { registerHealthRoutes } from './routes/health.routes.js'

const app = new Hono()

app.use('/*', corsMiddleware)
app.use('*', loggingMiddleware)

registerAuthRoutes(app)
registerHealthRoutes(app)

export default app
