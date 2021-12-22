import { normalizeCid } from '../utils/cid.js'

/**
 * @typedef {Object} CidUpdateRequest
 * @property {string} cid
 * @property {string[]} urls gateway URLs
 */

/**
 * Durable Object for keeping CID state.
 */
export class Cids1 {
  constructor(state) {
    this.state = state
  }

  // Handle HTTP requests from clients.
  async fetch(request) {
    // Apply requested action.
    let url = new URL(request.url)

    if (url.pathname === '/update') {
      /** @type {CidUpdateRequest} */
      const data = await request.json()

      await this.state.storage.put(data.cid, data.urls)
      return new Response()
    } else if (url.pathname.includes('/status')) {
      const cid = url.pathname.split('/status/')[1]
      console.log('cid', cid)
      const nCid = normalizeCid(cid)
      console.log('ncid', nCid)

      const stored = await this.state.storage.get(nCid)

      if (stored) {
        return new Response(JSON.stringify(stored))
      }

      return new Response('Not found', { status: 404 })
    }

    return new Response('Not found', { status: 404 })
  }
}
