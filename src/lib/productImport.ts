// Automatischer Produkt-Import per Link (siehe Konzept, Kapitel "Erstellung per URL").
//
// Wichtiger Hintergrund: Diese App läuft komplett ohne eigenen Server (nur
// Browser + Supabase). Browser dürfen aus Sicherheitsgründen (CORS) nicht
// einfach beliebige fremde Webseiten per fetch() auslesen. Deshalb nutzen wir
// einen kostenlosen, öffentlichen Vermittlungsdienst (CORS-Proxy), der die
// Seite stellvertretend abruft. Das funktioniert bei den meisten Online-Shops
// gut, aber nicht überall (manche Seiten blockieren das, manche laden Preise
// erst per JavaScript nach) – daher immer mit Fallback auf manuelle Eingabe.

export interface ScrapedProduct {
  title?: string
  description?: string
  imageUrl?: string
  priceEuro?: number
}

const CORS_PROXY = 'https://api.allorigins.win/raw?url='

export async function fetchProductInfo(url: string): Promise<ScrapedProduct> {
  let html: string
  try {
    const res = await fetch(CORS_PROXY + encodeURIComponent(url))
    if (!res.ok) throw new Error(`Seite antwortete mit Status ${res.status}`)
    html = await res.text()
  } catch {
    throw new Error(
      'Seite konnte nicht abgerufen werden. Manche Shops blockieren das automatische Auslesen – bitte Titel, Bild und Preis in diesem Fall manuell eintragen.'
    )
  }

  const doc = new DOMParser().parseFromString(html, 'text/html')

  const meta = (nameOrProperty: string): string | undefined =>
    doc.querySelector(`meta[property="${nameOrProperty}"]`)?.getAttribute('content')?.trim() ||
    doc.querySelector(`meta[name="${nameOrProperty}"]`)?.getAttribute('content')?.trim() ||
    undefined

  const title = meta('og:title') ?? doc.querySelector('title')?.textContent?.trim()
  const description = meta('og:description') ?? meta('description')
  const imageUrl = meta('og:image')

  let priceEuro = parsePriceString(
    meta('product:price:amount') ?? meta('og:price:amount') ?? meta('twitter:data1')
  )

  if (priceEuro === undefined) {
    priceEuro = findPriceInJsonLd(doc)
  }

  if (priceEuro === undefined) {
    // Letzter Versuch: ein Preis-Muster wie "19,99 €" oder "€19.99" im HTML suchen
    const match = html.match(/(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s?€|€\s?(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/)
    if (match) priceEuro = parsePriceString(match[1] ?? match[2])
  }

  return { title, description, imageUrl, priceEuro }
}

function parsePriceString(raw: string | undefined): number | undefined {
  if (!raw) return undefined
  const cleaned = raw.replace(/[^\d.,]/g, '')
  if (!cleaned) return undefined

  let normalized: string
  if (cleaned.includes(',') && cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
    // Deutsches Format, z. B. "1.234,56"
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else {
    // Englisches Format, z. B. "1,234.56"
    normalized = cleaned.replace(/,/g, '')
  }

  const value = parseFloat(normalized)
  return Number.isFinite(value) ? value : undefined
}

function findPriceInJsonLd(doc: Document): number | undefined {
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent ?? '')
      const found = searchPriceInObject(data)
      if (found !== undefined) return found
    } catch {
      // Ungültiges JSON-LD einfach überspringen
    }
  }
  return undefined
}

function searchPriceInObject(data: unknown): number | undefined {
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = searchPriceInObject(item)
      if (found !== undefined) return found
    }
    return undefined
  }
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (obj.offers) {
      const offers = Array.isArray(obj.offers) ? obj.offers[0] : obj.offers
      const offersObj = offers as Record<string, unknown> | undefined
      const direct = parsePriceString(offersObj?.price != null ? String(offersObj.price) : undefined)
      if (direct !== undefined) return direct
      const spec = offersObj?.priceSpecification as Record<string, unknown> | undefined
      const specPrice = parsePriceString(spec?.price != null ? String(spec.price) : undefined)
      if (specPrice !== undefined) return specPrice
    }
    if (obj.price != null) {
      const found = parsePriceString(String(obj.price))
      if (found !== undefined) return found
    }
  }
  return undefined
}
