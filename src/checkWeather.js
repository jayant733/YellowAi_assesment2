import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ORDERS_PATH = path.join(__dirname, "..", "orders.json");
const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const DELAY_CONDITIONS = new Set(["Rain", "Snow", "Extreme"]);

function getApiKey() {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    throw new Error(
      "Missing OPENWEATHERMAP_API_KEY. Copy .env.example to .env and add your OpenWeatherMap key."
    );
  }
  return apiKey;
}

/**
 * Weather-Aware Apology
 * Turns a delay condition into a short, personal customer message.
 */
export function weatherAwareApology(customer, city, weatherMain, description) {
  const firstName = String(customer).trim().split(/\s+/)[0] || "there";
  const phrases = {
    Rain: "heavy rain",
    Snow: "snowfall",
    Extreme: "extreme weather",
  };
  const weatherPhrase =
    phrases[weatherMain] ?? (description ? description.toLowerCase() : "severe weather");

  return `Hi ${firstName}, your order to ${city} is delayed due to ${weatherPhrase}. We appreciate your patience!`;
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

function applyGoldenFlow(order, weather) {
  const condition = weather.weather?.[0]?.main ?? "Unknown";
  const description = weather.weather?.[0]?.description ?? "";

  order.weather = {
    main: condition,
    description,
    temperature_c: weather.main?.temp ?? null,
  };

  if (DELAY_CONDITIONS.has(condition)) {
    order.status = "Delayed";
    order.apology_message = weatherAwareApology(
      order.customer,
      order.city,
      condition,
      description
    );
    return { condition, description };
  }

  order.status = "Pending";
  delete order.apology_message;
  return { condition, description };
}

function applyWeatherError(order, error) {
  order.status = "Pending";
  order.weather_error = error.message;
  delete order.apology_message;
  delete order.weather;
}

async function processOrder(order, apiKey) {
  try {
    const weather = await fetchCityWeather(order.city, apiKey);
    const { condition, description } = applyGoldenFlow(order, weather);
    console.log(
      `Order ${order.order_id} (${order.city}): ${condition} — ${description || "n/a"} [${order.status}]`
    );
    if (order.apology_message) {
      console.log(`  Apology: ${order.apology_message}`);
    }
  } catch (error) {
    applyWeatherError(order, error);
    console.error(
      `Order ${order.order_id}: could not fetch weather for "${order.city}". ${error.message}`
    );
    console.error("  Continuing with remaining orders...");
  }

  return order;
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

  // Each order catches its own failures so Promise.all never rejects on InvalidCity123.
  await Promise.all(orders.map((order) => processOrder(order, apiKey)));

  await saveOrders(orders);
  console.log(`Updated ${ORDERS_PATH}`);
}

main().catch((error) => {
  console.error("Fatal error:", error.message);
  process.exit(1);
});
