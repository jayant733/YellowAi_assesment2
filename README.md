# Weather-Aware Order Delay Checker

Flags delivery delays by checking live weather for each order city with the OpenWeatherMap Current Weather API (free tier).

## Setup

1. Copy the env template and add your [OpenWeatherMap](https://openweathermap.org/api) API key:

```bash
cp .env.example .env
```

2. Install dependencies and run:

```bash
npm install
npm start
```

The script reads `orders.json`, fetches weather for every city **in parallel**, updates delayed orders, and writes the result back to `orders.json`.

## Golden-flow rules

If OpenWeatherMap `weather[0].main` is `Rain`, `Snow`, or `Extreme`, the order status becomes `Delayed` and a weather-aware apology is stored on the order.

Invalid cities are logged and skipped. The rest of the batch still completes.
