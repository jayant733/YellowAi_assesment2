# AI Log

Prompts used to design the parallel fetching, golden-flow, and error-handling pieces of this project.

## Parallel fetching

> Loop through orders.json and fetch the current weather for each city using the OpenWeatherMap API. Constraint: you must trigger these API calls concurrently with Promise.all in JavaScript, not one by one. Load the API key from a .env file. Do not hardcode secrets.

> Write a Node.js ESM function that maps every order to fetchCityWeather(order.city, apiKey) and awaits Promise.all so New York, Mumbai, London, and InvalidCity123 all start at the same time.

## Golden flow and weather-aware apology

> If weather.weather[0].main is Rain, Snow, or Extreme, update that order status to Delayed in orders.json.

> Write a Weather-Aware Apology function. Generate a personalized message like: "Hi Alice, your order to New York is delayed due to heavy rain. We appreciate your patience!" Use the customer's first name, city, and a human-readable weather phrase.

## Error handling

> The script must handle the InvalidCity123 case. Log the error for that city, but do not crash. Finish processing the other valid cities.

> Wrap each order's API call in its own try/catch inside the Promise.all mapper so a 404 from OpenWeatherMap for InvalidCity123 rejects only that promise's inner work, while the rest of the batch still writes results back to orders.json.
