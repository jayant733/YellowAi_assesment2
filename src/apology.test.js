import { test } from "node:test";
import assert from "node:assert/strict";
import { weatherAwareApology } from "./checkWeather.js";

test("weather-aware apology uses first name, city, and rain phrasing", () => {
  const message = weatherAwareApology("Alice Smith", "New York", "Rain", "heavy intensity rain");
  assert.equal(
    message,
    "Hi Alice, your order to New York is delayed due to heavy rain. We appreciate your patience!"
  );
});

test("weather-aware apology maps snow and extreme weather", () => {
  assert.match(weatherAwareApology("Bob Jones", "Mumbai", "Snow", "snow"), /snowfall/);
  assert.match(weatherAwareApology("Charlie Green", "London", "Extreme", "tornado"), /extreme weather/);
});
