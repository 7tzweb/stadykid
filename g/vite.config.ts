import fs from 'node:fs/promises'
import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Connect, type Plugin } from 'vite'

const creaturePriceOverridesFile = path.resolve(__dirname, './src/game/content/creature-price-overrides.json')
const shopItemPriceOverridesFile = path.resolve(__dirname, './src/game/content/shop-item-price-overrides.json')

async function ensurePriceOverridesFile(filePath: string) {
  try {
    await fs.access(filePath)
  } catch {
    await fs.writeFile(filePath, '{}\n', 'utf8')
  }
}

async function readPriceOverrides(filePath: string) {
  await ensurePriceOverridesFile(filePath)

  const raw = await fs.readFile(filePath, 'utf8')
  return JSON.parse(raw) as Record<string, number>
}

async function writePriceOverrides(filePath: string, overrides: Record<string, number>) {
  const normalized = Object.fromEntries(
    Object.entries(overrides)
      .filter(([, priceStars]) => Number.isFinite(priceStars) && priceStars >= 0)
      .sort(([leftId], [rightId]) => leftId.localeCompare(rightId)),
  )

  await fs.writeFile(filePath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
}

async function readRequestBody(request: Connect.IncomingMessage) {
  const chunks: Buffer[] = []

  for await (const chunk of request) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }

  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : null
}

function createPriceAdminMiddleware(
  routePrefix: string,
  idField: string,
  filePath: string,
  entityLabel: string,
): Connect.NextHandleFunction {
  return async (request, response, next) => {
    if (!request.url?.startsWith(routePrefix)) {
      next()
      return
    }

    try {
      if (request.method === 'GET') {
        const overrides = await readPriceOverrides(filePath)
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify({ overrides }))
        return
      }

      if (request.method === 'POST') {
        const body = await readRequestBody(request)
        const entityId = typeof body?.[idField] === 'string' ? body[idField].trim() : ''
        const parsedPrice = Number(body?.priceStars)

        if (!entityId || !Number.isInteger(parsedPrice) || parsedPrice < 0) {
          response.statusCode = 400
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ error: `Invalid ${entityLabel} price payload.` }))
          return
        }

        const overrides = await readPriceOverrides(filePath)
        overrides[entityId] = parsedPrice
        await writePriceOverrides(filePath, overrides)

        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify({ [idField]: entityId, priceStars: parsedPrice }))
        return
      }

      response.statusCode = 405
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify({ error: 'Method not allowed.' }))
    } catch (error) {
      response.statusCode = 500
      response.setHeader('Content-Type', 'application/json')
      response.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : `Unable to update ${entityLabel} price overrides.`,
        }),
      )
    }
  }
}

function creaturePriceAdminPlugin(): Plugin {
  return {
    name: 'creature-price-admin-plugin',
    configureServer(server) {
      server.middlewares.use(
        createPriceAdminMiddleware(
          '/__admin/creature-price-overrides',
          'creatureId',
          creaturePriceOverridesFile,
          'creature',
        ),
      )
      server.middlewares.use(
        createPriceAdminMiddleware(
          '/__admin/shop-item-price-overrides',
          'itemId',
          shopItemPriceOverridesFile,
          'shop item',
        ),
      )
    },
  }
}

export default defineConfig({
  plugins: [creaturePriceAdminPlugin(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1300,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) {
            return 'phaser'
          }

          if (id.includes('node_modules/firebase')) {
            return 'firebase'
          }

          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react-vendor'
          }

          return undefined
        },
      },
    },
  },
})
