/**
 * Asset Helper Utilities for Template Export
 *
 * Provides utilities for handling images and other assets
 * during template compilation, including base64 conversion.
 */

/**
 * Check if a URL is already a data URL (base64 encoded)
 *
 * @param url - URL to check
 * @returns true if the URL is a data URL
 */
export function isDataUrl(url: string): boolean {
  return url.startsWith('data:')
}

/**
 * Check if a URL is from Supabase Storage
 *
 * @param url - URL to check
 * @returns true if the URL appears to be from Supabase Storage
 */
export function isSupabaseStorageUrl(url: string): boolean {
  // Supabase storage URLs typically contain 'supabase.co' and '/storage/'
  return url.includes('supabase.co') && url.includes('/storage/')
}

/**
 * Check if a URL is an external URL (not a data URL or relative path)
 *
 * @param url - URL to check
 * @returns true if the URL is an external URL
 */
export function isExternalUrl(url: string): boolean {
  if (!url) return false
  if (isDataUrl(url)) return false
  return url.startsWith('http://') || url.startsWith('https://')
}

/**
 * Fetch an image from a URL and convert it to a base64 data URL
 *
 * @param url - The URL of the image to fetch
 * @returns Promise resolving to a base64 data URL string
 * @throws Error if the fetch fails or the response is not an image
 */
export async function imageToBase64(url: string): Promise<string> {
  // If already a data URL, return as-is
  if (isDataUrl(url)) {
    return url
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        // Set Accept header to prefer images
        Accept: 'image/*',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
    }

    // Get the content type to determine the MIME type
    const contentType = response.headers.get('content-type')
    const mimeType = contentType?.startsWith('image/')
      ? contentType
      : 'image/png' // Default to PNG if unknown

    // Convert to array buffer, then to base64
    const arrayBuffer = await response.arrayBuffer()
    const base64 = arrayBufferToBase64(arrayBuffer)

    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to convert image to base64: ${message}`)
  }
}

/**
 * Convert an ArrayBuffer to a base64 string
 *
 * @param buffer - ArrayBuffer to convert
 * @returns Base64 encoded string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''

  // Process in chunks to avoid call stack size exceeded error
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  // Use btoa for base64 encoding (available in browser and Node.js)
  if (typeof btoa === 'function') {
    return btoa(binary)
  }

  // Fallback for environments without btoa
  return Buffer.from(binary, 'binary').toString('base64')
}

/**
 * Get the MIME type from a file extension or URL
 *
 * @param urlOrExtension - URL or file extension
 * @returns MIME type string
 */
export function getMimeType(urlOrExtension: string): string {
  const extension = urlOrExtension.split('.').pop()?.toLowerCase()?.split('?')[0] || ''

  const mimeTypes: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
    tiff: 'image/tiff',
    tif: 'image/tiff',
  }

  return mimeTypes[extension] || 'image/png'
}

/**
 * Process an image URL for export, converting external URLs to base64
 *
 * @param url - Image URL to process
 * @param options - Processing options
 * @returns Promise resolving to the processed URL (data URL or original)
 */
export async function processImageUrl(
  url: string,
  options: {
    convertExternal?: boolean
    maxSizeBytes?: number
  } = {}
): Promise<string> {
  const { convertExternal = true, maxSizeBytes } = options

  // If already a data URL, optionally check size
  if (isDataUrl(url)) {
    if (maxSizeBytes && url.length > maxSizeBytes) {
      console.warn(`Image exceeds max size: ${url.length} > ${maxSizeBytes}`)
    }
    return url
  }

  // If not an external URL, return as-is (relative path)
  if (!isExternalUrl(url)) {
    return url
  }

  // Convert external URL to base64 if requested
  if (convertExternal) {
    try {
      return await imageToBase64(url)
    } catch (error) {
      console.warn(`Failed to convert image to base64, using original URL: ${url}`)
      return url
    }
  }

  return url
}

/**
 * Batch process multiple image URLs
 *
 * @param urls - Array of image URLs to process
 * @param options - Processing options
 * @returns Promise resolving to array of processed URLs
 */
export async function processImageUrls(
  urls: string[],
  options: {
    convertExternal?: boolean
    maxSizeBytes?: number
    concurrency?: number
  } = {}
): Promise<string[]> {
  const { concurrency = 5 } = options

  // Process in batches to avoid overwhelming the server
  const results: string[] = []

  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map((url) => processImageUrl(url, options).catch(() => url))
    )
    results.push(...batchResults)
  }

  return results
}

/**
 * Extract all image URLs from a component's props
 *
 * @param props - Component props object
 * @returns Array of image URLs found in props
 */
export function extractImageUrls(props: Record<string, unknown>): string[] {
  const urls: string[] = []

  function extractFromValue(value: unknown): void {
    if (typeof value === 'string') {
      // Check if it looks like an image URL
      if (
        value.startsWith('http') ||
        value.startsWith('data:image') ||
        /\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i.test(value)
      ) {
        urls.push(value)
      }
    } else if (Array.isArray(value)) {
      value.forEach(extractFromValue)
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(extractFromValue)
    }
  }

  // Common prop names that contain image URLs
  const imageProps = ['src', 'url', 'imageUrl', 'image', 'backgroundImage']
  for (const prop of imageProps) {
    if (props[prop]) {
      extractFromValue(props[prop])
    }
  }

  // Also check all props for any image URLs
  Object.values(props).forEach(extractFromValue)

  // Return unique URLs
  return [...new Set(urls)]
}

/**
 * Asset processing result
 */
export interface ProcessedAssets {
  images: Record<string, string> // Original URL -> Processed URL
  errors: Array<{ url: string; error: string }>
}

/**
 * Process all assets in a canvas state
 *
 * @param nodes - Canvas nodes to process
 * @param options - Processing options
 * @returns Promise resolving to processed assets map
 */
export async function processCanvasAssets(
  nodes: Record<string, { props: Record<string, unknown> }>,
  options: {
    convertExternal?: boolean
    maxSizeBytes?: number
  } = {}
): Promise<ProcessedAssets> {
  const allUrls = new Set<string>()

  // Extract all image URLs from all nodes
  for (const node of Object.values(nodes)) {
    const urls = extractImageUrls(node.props)
    urls.forEach((url) => allUrls.add(url))
  }

  // Process all URLs
  const result: ProcessedAssets = {
    images: {},
    errors: [],
  }

  const urlArray = [...allUrls]
  const processedUrls = await processImageUrls(urlArray, options)

  urlArray.forEach((originalUrl, index) => {
    const processedUrl = processedUrls[index]
    if (processedUrl && processedUrl !== originalUrl) {
      result.images[originalUrl] = processedUrl
    }
  })

  return result
}
