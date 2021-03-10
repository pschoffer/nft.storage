import { auth0 } from "../constants"

/** @type {Record<string, HmacImportParams>} */
const algorithms = {
  HS256: {
    name: 'HMAC',
    hash: {
      name: 'SHA-256',
    },
  },
}

// Adapted from https://chromium.googlesource.com/chromium/blink/+/master/LayoutTests/crypto/subtle/hmac/sign-verify.html
var Base64URL = {
  stringify: function(/** @type {Uint8Array} */ a) {
    // @ts-ignore
    var base64string = btoa(String.fromCharCode.apply(0, a))
    return base64string
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  },
  parse: function(/** @type {string} */ s) {
    s = s
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .replace(/\s/g, '')
    return new Uint8Array(
      // @ts-ignore
      Array.prototype.map.call(atob(s), function(c) {
        return c.charCodeAt(0)
      })
    )
  },
}

/**
 * @param {any} s
 */
function isString(s) {
  return typeof s === 'string'
}

/**
 * @param {string | number | boolean} str
 */
function utf8ToUint8Array(str) {
  str = btoa(unescape(encodeURIComponent(str)))
  return Base64URL.parse(str)
}

/**
 * @param {any} fn
 */
function isFunction(fn) {
  return typeof fn === 'function'
}

/**
 * @param {null} arg
 */
function isObject(arg) {
  return arg !== null && typeof arg === 'object'
}

/**
 * @param {string} token
 * @param {string} secret
 * @param {string} alg
 */
export async function verifyJWT(token, secret = auth0.salt, alg = 'HS256') {
  if (!isString(token)) {
    throw new Error('token must be a string')
  }

  if (!isString(secret)) {
    throw new Error('secret must be a string')
  }

  if (!isString(alg)) {
    throw new Error('alg must be a string')
  }

  var tokenParts = token.split('.')

  if (tokenParts.length !== 3) {
    throw new Error('token must have 3 parts')
  }

  var importAlgorithm = algorithms[alg]

  if (!importAlgorithm) {
    throw new Error('algorithm not found')
  }

  // TODO Test utf8ToUint8Array function
  const keyData = utf8ToUint8Array(secret)
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    importAlgorithm,
    false,
    ['sign']
  )
  const headerPayload = tokenParts.slice(0, 2).join('.')
  const signature = tokenParts[2]
  const signedHeaderPayload = await crypto.subtle.sign(
    importAlgorithm.name,
    key,
    utf8ToUint8Array(headerPayload)
  )

  return Base64URL.stringify(new Uint8Array(signedHeaderPayload)) === signature
}

/**
 * @param {any} payload
 * @param {string} secret
 * @param {string} alg
 */
export async function signJWT(payload, secret = auth0.salt, alg = 'HS256') {
  if (!isObject(payload)) {
    throw new Error('payload must be an object')
  }

  if (!isString(secret)) {
    throw new Error('secret must be a string')
  }

  if (!isString(alg)) {
    throw new Error('alg must be a string')
  }

  var importAlgorithm = algorithms[alg]

  if (!importAlgorithm) {
    throw new Error('algorithm not found')
  }

  const payloadAsJSON = JSON.stringify(payload)
  const headerAsJSON = JSON.stringify({ alg: alg, typ: 'JWT' })
  const headerPayload =
    Base64URL.stringify(utf8ToUint8Array(headerAsJSON)) +
    '.' +
    Base64URL.stringify(utf8ToUint8Array(payloadAsJSON))
  const keyData = utf8ToUint8Array(secret)
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    importAlgorithm,
    false,
    ['sign']
  )
  const headerPayloadBuffer = utf8ToUint8Array(headerPayload)
  const signature = await crypto.subtle.sign(
    importAlgorithm.name,
    key,
    headerPayloadBuffer
  )
  return headerPayload + '.' + Base64URL.stringify(new Uint8Array(signature))
}

/**
 * @param {string} token
 */
export function decodeJWT(token) {
  var output = token
    .split('.')[1]
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  switch (output.length % 4) {
    case 0:
      break
    case 2:
      output += '=='
      break
    case 3:
      output += '='
      break
    default:
      throw 'Illegal base64url string!'
  }

  // TODO Use shim or document incomplete browsers
  var result = atob(output)

  try {
    return decodeURIComponent(escape(result))
  } catch (err) {
    return result
  }
}

/**
 * @param {string} token
 */
export function parseJWT(token) {
  // TODO: Handle when decodeJWT fails.
  // TODO: Handle when JSON.parse fails.
  return JSON.parse(decodeJWT(token))
}
