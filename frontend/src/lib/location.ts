/**
 * Comprehensive Location & Reverse Geocoding Service for Waste2Worth AI
 * Supports:
 * 1. Photo EXIF GPS extraction (exact coordinates from phone camera capture)
 * 2. High-accuracy device GPS (navigator.geolocation)
 * 3. Network IP Geolocation (ipwho.is - unmetered & CORS-friendly)
 * 4. Google Maps style reverse geocoding with street, neighborhood, city, postal code
 * 5. Global address & landmark search lookup
 */

export interface LocationResult {
  latitude: number;
  longitude: number;
  address: string;
  source: "gps" | "photo_exif" | "network" | "manual" | "fallback";
  city?: string;
  neighborhood?: string;
  street?: string;
  postalCode?: string;
}

/**
 * Extracts GPS Latitude & Longitude from image EXIF metadata (JPEG/HEIC)
 */
export async function extractGpsFromImage(
  file: File | Blob
): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) {
        resolve(null);
        return;
      }
      try {
        const view = new DataView(buffer);
        if (view.byteLength < 32 || view.getUint16(0) !== 0xffd8) {
          resolve(null);
          return;
        }

        let offset = 2;
        while (offset < view.byteLength - 4) {
          if (view.getUint8(offset) !== 0xff) break;
          const marker = view.getUint8(offset + 1);
          const length = view.getUint16(offset + 2);

          if (marker === 0xe1) {
            // APP1 marker
            const isExif =
              view.getUint8(offset + 4) === 0x45 && // 'E'
              view.getUint8(offset + 5) === 0x78 && // 'x'
              view.getUint8(offset + 6) === 0x69 && // 'i'
              view.getUint8(offset + 7) === 0x66; // 'f'

            if (isExif) {
              const tiffStart = offset + 10;
              const endian = view.getUint16(tiffStart);
              const littleEndian = endian === 0x4949; // 'II' = little endian

              if (endian !== 0x4949 && endian !== 0x4d4d) {
                resolve(null);
                return;
              }

              const firstIfdOffset = view.getUint32(tiffStart + 4, littleEndian);
              if (tiffStart + firstIfdOffset >= view.byteLength) {
                resolve(null);
                return;
              }

              const numEntries = view.getUint16(tiffStart + firstIfdOffset, littleEndian);
              let gpsIfdOffset: number | null = null;

              for (let i = 0; i < numEntries; i++) {
                const entryOffset = tiffStart + firstIfdOffset + 2 + i * 12;
                if (entryOffset + 12 > view.byteLength) break;
                const tag = view.getUint16(entryOffset, littleEndian);
                if (tag === 0x8825) {
                  // GPS Info tag
                  gpsIfdOffset = view.getUint32(entryOffset + 8, littleEndian);
                  break;
                }
              }

              if (gpsIfdOffset !== null && tiffStart + gpsIfdOffset < view.byteLength) {
                const numGpsEntries = view.getUint16(tiffStart + gpsIfdOffset, littleEndian);
                let lat: number | null = null;
                let latRef = "N";
                let lng: number | null = null;
                let lngRef = "E";

                const readRational = (off: number) => {
                  const num = view.getUint32(off, littleEndian);
                  const den = view.getUint32(off + 4, littleEndian);
                  return den ? num / den : 0;
                };

                for (let i = 0; i < numGpsEntries; i++) {
                  const entryOffset = tiffStart + gpsIfdOffset + 2 + i * 12;
                  if (entryOffset + 12 > view.byteLength) break;
                  const tag = view.getUint16(entryOffset, littleEndian);
                  const valOffset = view.getUint32(entryOffset + 8, littleEndian);

                  if (tag === 0x0001) {
                    // GPSLatitudeRef
                    latRef = String.fromCharCode(view.getUint8(entryOffset + 8));
                  } else if (tag === 0x0002) {
                    // GPSLatitude
                    const absOff = tiffStart + valOffset;
                    if (absOff + 24 <= view.byteLength) {
                      const deg = readRational(absOff);
                      const min = readRational(absOff + 8);
                      const sec = readRational(absOff + 16);
                      lat = deg + min / 60 + sec / 3600;
                    }
                  } else if (tag === 0x0003) {
                    // GPSLongitudeRef
                    lngRef = String.fromCharCode(view.getUint8(entryOffset + 8));
                  } else if (tag === 0x0004) {
                    // GPSLongitude
                    const absOff = tiffStart + valOffset;
                    if (absOff + 24 <= view.byteLength) {
                      const deg = readRational(absOff);
                      const min = readRational(absOff + 8);
                      const sec = readRational(absOff + 16);
                      lng = deg + min / 60 + sec / 3600;
                    }
                  }
                }

                if (lat !== null && lng !== null) {
                  if (latRef === "S") lat = -lat;
                  if (lngRef === "W") lng = -lng;
                  resolve({
                    latitude: Number(lat.toFixed(6)),
                    longitude: Number(lng.toFixed(6)),
                  });
                  return;
                }
              }
            }
            offset += 2 + length;
          } else if (marker === 0xda || marker === 0xd9) {
            break;
          } else {
            offset += 2 + length;
          }
        }
      } catch (err) {
        console.warn("EXIF GPS parsing error:", err);
      }
      resolve(null);
    };
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Captures live hardware GPS from navigator.geolocation with high accuracy
 */
export async function getBrowserLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        });
      },
      (err) => {
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  });
}

/**
 * Reliable Network IP Geolocation via unthrottled ipwho.is
 */
export async function getIpLocation(): Promise<{
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  country: string;
  postalCode?: string;
}> {
  try {
    const res = await fetch("https://ipwho.is/", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false && data.latitude && data.longitude) {
        return {
          latitude: Number(Number(data.latitude).toFixed(6)),
          longitude: Number(Number(data.longitude).toFixed(6)),
          city: data.city || "",
          region: data.region || "",
          country: data.country || "",
          postalCode: data.postal || undefined,
        };
      }
    }
  } catch (err) {
    console.warn("ipwho.is query failed, trying secondary fallback:", err);
  }

  // Secondary fallback: BigDataCloud client API
  try {
    const res = await fetch(
      "https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en"
    );
    if (res.ok) {
      const data = await res.json();
      if (data.latitude && data.longitude) {
        return {
          latitude: Number(Number(data.latitude).toFixed(6)),
          longitude: Number(Number(data.longitude).toFixed(6)),
          city: data.city || data.locality || "",
          region: data.principalSubdivision || "",
          country: data.countryName || "",
        };
      }
    }
  } catch (err) {
    console.warn("BigDataCloud IP location failed:", err);
  }

  throw new Error("Unable to determine IP geolocation.");
}

/**
 * Converts Latitude/Longitude into a full Google Maps-style address string
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{
  address: string;
  road?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}> {
  // Try OpenStreetMap Nominatim with rich address details
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "en",
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data) {
        const addr = data.address || {};
        const road = addr.road || addr.pedestrian || addr.street;
        const neighborhood = addr.suburb || addr.neighbourhood || addr.residential;
        const city = addr.city || addr.town || addr.village || addr.municipality;
        const state = addr.state || addr.province;
        const postalCode = addr.postcode;
        const country = addr.country;

        // Build clean Google-style formatted address
        const components = [
          addr.amenity || addr.building || addr.house_number,
          road,
          neighborhood,
          city,
          state,
          postalCode,
          country,
        ].filter(Boolean);

        const formatted =
          components.length > 0 ? components.join(", ") : data.display_name;

        if (formatted) {
          return {
            address: formatted,
            road,
            neighborhood,
            city,
            state,
            postalCode,
          };
        }
      }
    }
  } catch (err) {
    console.warn("Nominatim reverse geocoding failed, trying BigDataCloud:", err);
  }

  // Secondary fallback: BigDataCloud Reverse Geocode
  try {
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (bdcRes.ok) {
      const data = await bdcRes.json();
      const parts = [
        data.locality || data.principalSubdivisionDistrict,
        data.city,
        data.principalSubdivision,
        data.countryName,
        data.postcode,
      ].filter(Boolean);

      if (parts.length > 0) {
        return {
          address: parts.join(", "),
          city: data.city,
          state: data.principalSubdivision,
          postalCode: data.postcode,
        };
      }
    }
  } catch (err) {
    console.warn("BigDataCloud reverse geocode failed:", err);
  }

  return {
    address: `GPS Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
  };
}

/**
 * Searches place names, landmarks, or street names using Nominatim
 */
export async function geocodeSearch(
  query: string
): Promise<Array<{ lat: number; lng: number; displayName: string }>> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query.trim()
      )}&format=json&limit=5&addressdetails=1`,
      {
        headers: { "Accept-Language": "en" },
      }
    );
    if (res.ok) {
      const data = await res.json();
      return (data || []).map((item: any) => ({
        lat: Number(parseFloat(item.lat).toFixed(6)),
        lng: Number(parseFloat(item.lon).toFixed(6)),
        displayName: item.display_name,
      }));
    }
  } catch (err) {
    console.warn("Geocode search error:", err);
  }
  return [];
}

/**
 * Unified smart resolver:
 * 1. Photo EXIF GPS (highest priority if captured photo has GPS)
 * 2. Device hardware GPS (if permitted)
 * 3. Network IP Location (unthrottled fallback)
 * 4. Reverse geocodes to full Google Maps address
 */
export async function resolveBestLocation(
  photoFile?: File | Blob | null
): Promise<LocationResult> {
  // 1. Try EXIF GPS from photo
  if (photoFile) {
    try {
      const exifGps = await extractGpsFromImage(photoFile);
      if (exifGps) {
        const rev = await reverseGeocode(exifGps.latitude, exifGps.longitude);
        return {
          latitude: exifGps.latitude,
          longitude: exifGps.longitude,
          address: rev.address,
          source: "photo_exif",
          city: rev.city,
          neighborhood: rev.neighborhood,
          street: rev.road,
          postalCode: rev.postalCode,
        };
      }
    } catch (e) {
      console.warn("EXIF extraction skipped:", e);
    }
  }

  // 2. Try Browser Geolocation API
  try {
    const browserGps = await getBrowserLocation();
    const rev = await reverseGeocode(browserGps.latitude, browserGps.longitude);
    return {
      latitude: browserGps.latitude,
      longitude: browserGps.longitude,
      address: rev.address,
      source: "gps",
      city: rev.city,
      neighborhood: rev.neighborhood,
      street: rev.road,
      postalCode: rev.postalCode,
    };
  } catch (e) {
    console.info("Browser GPS unavailable or blocked, falling back to network IP location");
  }

  // 3. Try Network IP Geolocation
  try {
    const ipLoc = await getIpLocation();
    const rev = await reverseGeocode(ipLoc.latitude, ipLoc.longitude);
    return {
      latitude: ipLoc.latitude,
      longitude: ipLoc.longitude,
      address:
        rev.address ||
        [ipLoc.city, ipLoc.region, ipLoc.country].filter(Boolean).join(", "),
      source: "network",
      city: ipLoc.city,
      postalCode: ipLoc.postalCode,
    };
  } catch (e) {
    console.warn("IP Geolocation failed:", e);
  }

  // 4. Default fallback
  return {
    latitude: 18.52043,
    longitude: 73.856744,
    address: "Civic Central Square, Downtown Sector",
    source: "fallback",
  };
}
