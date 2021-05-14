import { pinata, secrets } from './constants.js'

/**
 * @typedef {import('./models/users.js').User} User
 * @typedef {{ok: true, value: {IpfsHash:string, PinSize:number, Timestamp:string}}|{ok:false, error:Response}} PinataResponse
 * @typedef {import('./utils/multipart/index.js').FilePart} FilePart
 */

/**
 * @see https://pinata.cloud/documentation#PinFileToIPFS
 * @param {Blob} blob
 * @param {User} user
 * @returns {Promise<PinataResponse>}
 */
export const pinFile = async (blob, user) => {
  // create form data
  const body = new FormData()
  body.append('file', blob, `${user.nickname}-${Date.now()}`)
  body.append(
    'pinataOptions',
    JSON.stringify({
      cidVersion: 1,
      wrapWithDirectory: false,
    })
  )
  body.append(
    'pinataMetadata',
    JSON.stringify({
      name: `${user.nickname}-${Date.now()}`,
      keyvalues: {
        origin: 'https://nft.storage/',
      },
    })
  )
  const url = new URL('/pinning/pinFileToIPFS', pinata.apiUrl)

  const response = await fetch(url.toString(), {
    body,
    method: 'POST',
    headers: {
      authorization: `Bearer ${secrets.pinata}`,
    },
  })

  if (response.ok) {
    return { ok: true, value: await response.json() }
  } else {
    return { ok: false, error: response }
  }
}

/**
 * @param {FilePart[]} files
 * @param {User} user
 * @returns {Promise<PinataResponse>}
 */
export async function pinFiles(files, user) {
  const body = new FormData()
  for (const file of files) {
    body.append(
      'file',
      new File([file.data], file.filename || file.name, {
        type: file.contentType,
      }),
      'base/' + (file.filename || file.name)
    )
  }

  body.append(
    'pinataOptions',
    JSON.stringify({
      cidVersion: 1,
      wrapWithDirectory: false,
    })
  )
  body.append(
    'pinataMetadata',
    JSON.stringify({
      name: `${user.nickname}-${Date.now()}`,
      keyvalues: {
        origin: 'https://nft.storage/',
      },
    })
  )
  const url = new URL('/pinning/pinFileToIPFS', pinata.apiUrl)

  const response = await fetch(url.toString(), {
    body,
    method: 'POST',
    headers: {
      authorization: `Bearer ${secrets.pinata}`,
    },
  })

  if (response.ok) {
    return { ok: true, value: await response.json() }
  } else {
    return { ok: false, error: response }
  }
}

/**
 * @param {string} cid
 * @returns {Promise<{ ok: true, value?: any } | { ok: false, error: Response }>}
 */
export const pinInfo = async (cid) => {
  const url = new URL(
    `/data/pinList?status=pinned&hashContains=${encodeURIComponent(cid)}`,
    pinata.apiUrl
  )

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      authorization: `Bearer ${secrets.pinata}`,
    },
  })

  if (response.ok) {
    const { rows } = await response.json()
    return { ok: true, value: rows[0] }
  } else {
    return { ok: false, error: response }
  }
}

/**
 * @param {string} cid
 * @param {{ pinataOptions?: { hostNodes?: string[] }, pinataMetadata?: { name?: string } }} [options]
 * @returns {Promise<{ ok: true, value: { id: string, ipfsHash: string, status: string, name: string} }|{ ok: false, error: Response }>}
 */
export async function pinByHash(cid, options) {
  const url = new URL('/pinning/pinByHash', pinata.apiUrl)

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secrets.pinata}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ hashToPin: cid, ...(options || {}) }),
  })

  if (response.ok) {
    return { ok: true, value: await response.json() }
  } else {
    return { ok: false, error: response }
  }
}