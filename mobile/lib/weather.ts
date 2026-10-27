// Open-Meteo weather service — free, no API key required.
// Icons served from OpenWeatherMap CDN (no key needed for static assets).
import * as Location from "expo-location"

const BASE = "https://api.open-meteo.com/v1/forecast"

export type CurrentWeather = {
  temp: number
  feels_like: number
  humidity: number
  wind_kph: number
  description: string
  iconCode: string // OWM icon code e.g. "01d"
  city: string
  wmo: number
}

export type ForecastDay = {
  day: string // e.g. "Mon"
  iconCode: string
  high: number
  low: number
}

export type WeatherData = {
  current: CurrentWeather
  forecast: ForecastDay[]
  trigger: string | null
  lat: number
  lon: number
}

// WMO weather code → OWM icon code + description
function wmoToMeta(code: number, isDay = true): { icon: string desc: string } {
  const d = isDay ? "d" : "n"
  if (code === 0) return { icon: `01${d}`, desc: "Clear sky" }
  if (code === 1) return { icon: `02${d}`, desc: "Mainly clear" }
  if (code === 2) return { icon: `03${d}`, desc: "Partly cloudy" }
  if (code === 3) return { icon: `04${d}`, desc: "Overcast" }
  if (code <= 48) return { icon: `50${d}`, desc: "Foggy" }
  if (code <= 55) return { icon: `09${d}`, desc: "Drizzle" }
  if (code <= 65) return { icon: `10${d}`, desc: "Rain" }
  if (code <= 77) return { icon: `13${d}`, desc: "Snow" }
  if (code <= 82) return { icon: `09${d}`, desc: "Rain showers" }
  if (code <= 86) return { icon: `13${d}`, desc: "Snow showers" }
  if (code === 95) return { icon: `11${d}`, desc: "Thunderstorm" }
  return { icon: `11${d}`, desc: "Severe storm" }
}

export function iconUrl(code: string) {
  return `https://openweathermap.org/img/wn/${code}@2x.png`
}

function seizureTrigger(
  temp: number,
  wmo: number,
  humidity: number,
): string | null {
  if (temp > 35)
    return "Extreme heat can lower seizure threshold. Stay cool and hydrated."
  if (wmo >= 95)
    return "Thunderstorms bring rapid barometric changes that can affect some people with epilepsy."
  if (humidity > 85 && temp > 30)
    return "High heat and humidity increase dehydration risk. Drink water regularly."
  return null
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const places = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lon,
    })
    return places[0]?.city ?? places[0]?.district ?? "Your location"
  } catch {
    return "Your location"
  }
}

export async function getWeather(): Promise<WeatherData | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync()
    if (status !== "granted") return null

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })
    const { latitude: lat, longitude: lon } = pos.coords

    const url =
      `${BASE}?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&timezone=auto&forecast_days=5`

    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()

    const c = data.current
    const wmo = c.weather_code as number
    const meta = wmoToMeta(wmo, c.is_day === 1)

    const city = await reverseGeocode(lat, lon)

    const current: CurrentWeather = {
      temp: Math.round(c.temperature_2m),
      feels_like: Math.round(c.apparent_temperature),
      humidity: c.relative_humidity_2m,
      wind_kph: Math.round(c.wind_speed_10m),
      description: meta.desc,
      iconCode: meta.icon,
      city,
      wmo,
    }

    const forecast: ForecastDay[] = (data.daily.time as string[]).map(
      (t: string, i: number) => ({
        day: new Date(t).toLocaleDateString("en-KE", { weekday: "short" }),
        iconCode: wmoToMeta(data.daily.weather_code[i]).icon,
        high: Math.round(data.daily.temperature_2m_max[i]),
        low: Math.round(data.daily.temperature_2m_min[i]),
      }),
    )

    return {
      current,
      forecast,
      trigger: seizureTrigger(current.temp, wmo, current.humidity),
      lat,
      lon,
    }
  } catch {
    return null
  }
}
