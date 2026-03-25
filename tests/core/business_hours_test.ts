import { assertEquals } from "jsr:@std/assert";
import { businessHours } from "../../src/core/business_hours.ts";

Deno.test("same timestamp returns 0", () => {
  const t = new Date("2026-03-16T10:00:00Z"); // Monday
  assertEquals(businessHours(t, t), 0);
});

Deno.test("end before start returns 0", () => {
  const start = new Date("2026-03-16T12:00:00Z");
  const end = new Date("2026-03-16T10:00:00Z");
  assertEquals(businessHours(start, end), 0);
});

Deno.test("weekday hours count fully", () => {
  // Monday 9am to Monday 5pm = 8 hours
  const start = new Date("2026-03-16T09:00:00Z"); // Monday
  const end = new Date("2026-03-16T17:00:00Z");
  assertEquals(businessHours(start, end), 8);
});

Deno.test("full weekday = 24 hours", () => {
  // Monday midnight to Tuesday midnight
  const start = new Date("2026-03-16T00:00:00Z"); // Monday
  const end = new Date("2026-03-17T00:00:00Z"); // Tuesday
  assertEquals(businessHours(start, end), 24);
});

Deno.test("weekend days are skipped entirely", () => {
  // Saturday midnight to Monday midnight = 0 business hours
  const start = new Date("2026-03-14T00:00:00Z"); // Saturday
  const end = new Date("2026-03-16T00:00:00Z"); // Monday
  assertEquals(businessHours(start, end), 0);
});

Deno.test("Friday to Monday skips weekend", () => {
  // Friday 12:00 to Monday 12:00
  // Friday: 12 hours remaining, Sat: 0, Sun: 0, Monday: 12 hours = 24 hours
  const start = new Date("2026-03-13T12:00:00Z"); // Friday
  const end = new Date("2026-03-16T12:00:00Z"); // Monday
  assertEquals(businessHours(start, end), 24);
});

Deno.test("full working week = 120 hours", () => {
  // Monday to Saturday (5 full weekdays)
  const start = new Date("2026-03-16T00:00:00Z"); // Monday
  const end = new Date("2026-03-21T00:00:00Z"); // Saturday
  assertEquals(businessHours(start, end), 120);
});

Deno.test("span across two weekends", () => {
  // Monday to next Monday = 5 weekdays + weekend + 0 = 120 hours
  const start = new Date("2026-03-16T00:00:00Z"); // Monday
  const end = new Date("2026-03-23T00:00:00Z"); // Next Monday
  assertEquals(businessHours(start, end), 120);
});

Deno.test("partial Friday and partial Monday", () => {
  // Friday 18:00 to Monday 06:00
  // Friday: 6 hours remaining, Sat: 0, Sun: 0, Monday: 6 hours = 12 hours
  const start = new Date("2026-03-13T18:00:00Z"); // Friday
  const end = new Date("2026-03-16T06:00:00Z"); // Monday
  assertEquals(businessHours(start, end), 12);
});

Deno.test("Saturday only returns 0", () => {
  const start = new Date("2026-03-14T08:00:00Z"); // Saturday
  const end = new Date("2026-03-14T20:00:00Z"); // Saturday
  assertEquals(businessHours(start, end), 0);
});
