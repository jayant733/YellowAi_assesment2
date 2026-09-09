import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ORDERS_PATH = path.join(__dirname, "..", "orders.json");
const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";

function getApiKey() {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    throw new Error(
      "Missing OPENWEATHERMAP_API_KEY. Copy .env.example to .env and add your OpenWeatherMap key."
    );
  }
  return apiKey;
}

async function fetchCityWeather(city, apiKey) {
  const url = `${WEATHER_URL}?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `OpenWeatherMap request failed for "${city}" (${response.status}): ${body}`
    );
  }

  return response.json();
}

async function loadOrders() {
  const raw = await readFile(ORDERS_PATH, "utf8");
  return JSON.parse(raw);
}

async function saveOrders(orders) {
  await writeFile(ORDERS_PATH, `${JSON.stringify(orders, null, 2)}\n`, "utf8");
}

async function main() {
  const apiKey = getApiKey();
  const orders = await loadOrders();

  console.log(`Fetching weather for ${orders.length} orders in parallel...`);

  const weatherResults = await Promise.all(
    orders.map((order) => fetchCityWeather(order.city, apiKey))
  );

  weatherResults.forEach((weather, index) => {
    const order = orders[index];
    const condition = weather.weather?.[0]?.main ?? "Unknown";
    console.log(
      `Order ${order.order_id} (${order.city}): ${condition} — ${weather.weather?.[0]?.description ?? "n/a"}`
    );
  });

  await saveOrders(orders);
}

main().catch((error) => {
  console.error("Fatal error:", error.message);
  process.exit(1);
});
