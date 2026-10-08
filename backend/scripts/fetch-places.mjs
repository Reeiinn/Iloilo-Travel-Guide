// Fetches every named place of interest inside Iloilo City from OpenStreetMap
// (Overpass API) and writes backend/data/places.json.
//
//   node backend/scripts/fetch-places.mjs
//
// Places already hand-curated in src/landmarks.ts are skipped so they keep
// their photos. Data © OpenStreetMap contributors, ODbL.

import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const OUT_FILE = join(ROOT, "data", "places.json")

// OSM relation 3499101 = Iloilo City (admin_level 6); areas are relation id + 3600000000.
const CITY_AREA = 3603499101

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
]

const POI_QUERY = `[out:json][timeout:180];
area(${CITY_AREA})->.city;
(
  nwr["name"]["amenity"~"^(restaurant|fast_food|food_court|cafe|bar|pub|ice_cream|biergarten|library|coworking_space|place_of_worship|university|college|marketplace|cinema|theatre|arts_centre|events_venue)$"](area.city);
  nwr["name"]["shop"~"^(mall|department_store|bakery|coffee|tea|pastry|confectionery)$"](area.city);
  nwr["name"]["tourism"~"^(museum|gallery|attraction|viewpoint|hotel|guest_house|hostel|motel|apartment|artwork|theme_park|zoo)$"](area.city);
  nwr["name"]["historic"](area.city);
  nwr["name"]["leisure"~"^(park|garden|nature_reserve|stadium|sports_centre|water_park|fitness_centre)$"](area.city);
  nwr["name"]["office"="coworking"](area.city);
);
out center tags;`

// Districts (Jaro, Molo, La Paz, ...) and barangays, used to tell same-named branches apart.
const boundaryQuery = (adminLevel) => `[out:json][timeout:180];
area(${CITY_AREA})->.city;
rel["boundary"="administrative"]["admin_level"="${adminLevel}"](area.city);
out geom;`

// Public Overpass servers are often busy, so cycle through them a few times.
async function overpass(query, rounds = 4) {
  let lastError
  for (let round = 0; round < rounds; round++) {
    if (round > 0) await new Promise((resolve) => setTimeout(resolve, 15_000 * round))
    try {
      return await overpassOnce(query)
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

async function overpassOnce(query) {
  let lastError
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "iLOcate-data-fetch/1.0" },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(240_000),
      })
      const text = await res.text()
      if (!res.ok || !text.trimStart().startsWith("{")) throw new Error(`${res.status} ${text.slice(0, 200)}`)
      const json = JSON.parse(text)
      if (json.remark) throw new Error(json.remark)
      if (json.elements.length === 0) throw new Error("empty result")
      console.log(`  ${json.elements.length} elements from ${endpoint}`)
      return json
    } catch (error) {
      console.warn(`  ${endpoint} failed: ${String(error.message ?? error).slice(0, 160)}`)
      lastError = error
    }
  }
  throw lastError
}

/** Maps OSM tags to a landmark type the app understands, or null to skip. */
function classify(tags) {
  const { amenity, shop, tourism, leisure, historic, office } = tags
  const name = tags.name.toLowerCase()

  if (amenity === "library" || amenity === "coworking_space" || office === "coworking") return "Study"
  if (/study ?hub|study lounge|co-?working/.test(name)) return "Study"
  if (amenity === "cafe" || shop === "coffee" || shop === "tea") return "Cafe"
  if (amenity === "fast_food" || amenity === "food_court") return "Fast Food"
  if (amenity === "restaurant") return "Food"
  if (shop === "bakery" || shop === "pastry" || shop === "confectionery" || amenity === "ice_cream") return "Bakery"
  if (amenity === "bar" || amenity === "pub" || amenity === "biergarten") return "Bar"
  if (shop === "mall" || shop === "department_store") return "Mall"
  if (amenity === "place_of_worship") return !tags.religion || tags.religion === "christian" ? "Church" : "Temple"
  if (tourism === "museum" || tourism === "gallery") return "Museum"
  if (amenity === "university" || amenity === "college") return "School"
  if (amenity === "marketplace") return "Market"
  if (["hotel", "guest_house", "hostel", "motel", "apartment"].includes(tourism)) return "Hotel"
  if (["cinema", "theatre", "arts_centre", "events_venue"].includes(amenity)) return "Entertainment"
  if (["theme_park", "zoo", "water_park"].includes(tourism) || leisure === "water_park") return "Entertainment"
  if (["stadium", "sports_centre", "fitness_centre"].includes(leisure)) return "Sports"
  if (["park", "garden", "nature_reserve"].includes(leisure)) return "Park"
  if (historic || ["attraction", "viewpoint", "artwork"].includes(tourism)) return "Heritage"
  return null
}

function pointInRing([lat, lng], ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i]
    const [yj, xj] = ring[j]
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** Stitches a relation's outer ways into closed rings of [lat, lng]. */
function outerRings(relation) {
  const segments = relation.members
    .filter((m) => m.type === "way" && m.role === "outer" && m.geometry)
    .map((m) => m.geometry.map((p) => [p.lat, p.lon]))
  const rings = []
  const same = (a, b) => a[0] === b[0] && a[1] === b[1]
  while (segments.length) {
    let ring = segments.shift()
    let extended = true
    while (!same(ring[0], ring.at(-1)) && extended) {
      extended = false
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i]
        if (same(ring.at(-1), seg[0])) ring = ring.concat(seg.slice(1))
        else if (same(ring.at(-1), seg.at(-1))) ring = ring.concat(seg.slice(0, -1).reverse())
        else continue
        segments.splice(i, 1)
        extended = true
        break
      }
    }
    rings.push(ring)
  }
  return rings
}

function distanceMeters([lat1, lng1], [lat2, lng2]) {
  const rad = Math.PI / 180
  const x = (lng2 - lng1) * rad * Math.cos(((lat1 + lat2) / 2) * rad)
  const y = (lat2 - lat1) * rad
  return Math.sqrt(x * x + y * y) * 6_371_000
}

const normalize = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, "")

function curatedLandmarks() {
  const source = readFileSync(join(ROOT, "src", "landmarks.ts"), "utf8")
  return [...source.matchAll(/name: "([^"]+)",\s*type: "([^"]+)",\s*coordinates: \[([\d.]+), ([\d.]+)\]/g)].map((m) => ({
    name: m[1],
    type: m[2],
    coordinates: [Number(m[3]), Number(m[4])],
  }))
}

/** Returns a lookup from a [lat, lng] point to the name of the admin area containing it. */
async function fetchAreas(adminLevel) {
  const { elements } = await overpass(boundaryQuery(adminLevel))
  const areas = elements.map((rel) => ({ name: rel.tags["name:en"] || rel.tags.name, rings: outerRings(rel) }))
  return (point) => areas.find((a) => a.rings.some((ring) => pointInRing(point, ring)))?.name
}

async function main() {
  console.log("Fetching districts and barangays...")
  const districtOf = await fetchAreas(8)
  const barangayOf = await fetchAreas(10)

  console.log("Fetching places...")
  const elements = (await overpass(POI_QUERY)).elements

  const curated = curatedLandmarks()
  const isCurated = (name, coordinates) => {
    const key = normalize(name)
    return curated.some((c) => {
      const other = normalize(c.name)
      if (other === key) return true
      const overlaps = key.length >= 5 && other.length >= 5 && (other.includes(key) || key.includes(other))
      return overlaps && distanceMeters(c.coordinates, coordinates) < 300
    })
  }

  const places = []
  for (const el of elements) {
    const tags = el.tags
    const type = classify(tags)
    const lat = el.lat ?? el.center?.lat
    const lng = el.lon ?? el.center?.lon
    if (!type || lat == null || lng == null) continue

    const name = tags.name.trim().replace(/\s+/g, " ")
    const coordinates = [Number(lat.toFixed(6)), Number(lng.toFixed(6))]
    if (isCurated(name, coordinates)) continue
    // The same place mapped twice, e.g. as a point and a building outline (whose center can be far off)
    const isArea = (id) => !id.startsWith("node/")
    const duplicate = places.some((p) => {
      const radius = isArea(p.osmId) || el.type !== "node" ? 200 : 80
      return normalize(p.name) === normalize(name) && distanceMeters(p.coordinates, coordinates) < radius
    })
    if (duplicate) continue

    const street = tags["addr:street"]
    places.push({
      name,
      type,
      coordinates,
      ...(districtOf(coordinates) && { district: districtOf(coordinates) }),
      ...(barangayOf(coordinates) && { barangay: barangayOf(coordinates) }),
      ...(street && { street }),
      ...(tags.branch && { branch: tags.branch }),
      ...(tags.cuisine && { cuisine: tags.cuisine.replace(/_/g, " ").replace(/;/g, ", ") }),
      ...(tags.opening_hours && { openingHours: tags.opening_hours }),
      ...((tags.website || tags["contact:website"]) && { website: tags.website || tags["contact:website"] }),
      ...((tags.phone || tags["contact:phone"]) && { phone: tags.phone || tags["contact:phone"] }),
      osmId: `${el.type}/${el.id}`,
    })
  }

  // The app looks places up by name, so chain branches get a location suffix:
  // "Jollibee (SM City Iloilo)", "Jollibee (Iznart Street)", "Jollibee (Tabuc Suba)".
  const malls = [...curated, ...places].filter((p) => p.type === "Mall")
  const mallAt = (p) => malls.find((m) => m !== p && m.name !== p.name && distanceMeters(m.coordinates, p.coordinates) < 120)?.name
  const suffixLevels = [(p) => p.branch, mallAt, (p) => p.street, (p) => p.barangay, (p) => p.district]
  const branches = Object.values(Object.groupBy(places, (p) => p.name)).filter((group) => group.length > 1)
  for (const group of branches) {
    let unnamed = group
    for (const suffixOf of suffixLevels) {
      const labels = unnamed.map(suffixOf)
      unnamed = unnamed.filter((p, i) => {
        const label = labels[i]
        if (!label || labels.indexOf(label) !== labels.lastIndexOf(label)) return true
        const name = p.name.toLowerCase().includes(label.toLowerCase()) ? p.name : `${p.name} (${label})`
        if (group.some((other) => other !== p && other.name === name)) return true
        p.name = name
        return false
      })
    }
    unnamed.forEach((p, i) => (p.name = `${p.name} (${p.district ?? "Iloilo City"} ${i + 1})`))
  }

  places.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name))

  const header = { attribution: "© OpenStreetMap contributors, ODbL", fetchedAt: new Date().toISOString() }
  const body = places.map((p) => "  " + JSON.stringify(p)).join(",\n")
  writeFileSync(OUT_FILE, JSON.stringify(header).slice(0, -1) + `,"places":[\n${body}\n]}\n`)

  const byType = Object.groupBy(places, (p) => p.type)
  console.log(`\nWrote ${places.length} places to ${OUT_FILE}`)
  for (const [type, list] of Object.entries(byType)) console.log(`  ${type.padEnd(14)} ${list.length}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
