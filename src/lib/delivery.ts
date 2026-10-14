import { env } from "./env";

export interface DeliverySlot { id: string; label: string; date: string; startHour: number; endHour: number }
export interface FulfillmentConfig {
  areaName: string;
  zips: string[];
  zoneNote: string;
  slots: DeliverySlot[];
  pickup: { enabled: boolean; location: string; note: string };
  shipping: { flatCents: number; freeOverCents: number };
  cod: boolean;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseSlotSpec(spec: string): { weekday: number; start: number; end: number }[] {
  return spec.split(",").map((part) => {
    const [day, hours] = part.split(":").map((x) => x.trim());
    const weekday = DAYS.findIndex((d) => d.toLowerCase() === (day ?? "").slice(0, 3).toLowerCase());
    const [start, end] = (hours ?? "").split("-").map((n) => Number(n));
    return { weekday, start, end };
  }).filter((s) => s.weekday >= 0 && Number.isFinite(s.start) && Number.isFinite(s.end));
}

function hourLabel(h: number): string {
  const ampm = h >= 12 ? "pm" : "am";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}${ampm}`;
}

/** Upcoming delivery windows, from `now`, honouring a same-day cut-off of the slot's start hour minus 4h. */
export function upcomingSlots(now = new Date(), weeks = env.deliverySlotWeeks): DeliverySlot[] {
  const specs = parseSlotSpec(env.deliverySlots);
  if (!specs.length) return [];
  const out: DeliverySlot[] = [];
  for (let d = 0; d < weeks * 7; d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    for (const s of specs) {
      if (day.getDay() !== s.weekday) continue;
      const cutoff = new Date(day); cutoff.setHours(s.start - 4, 0, 0, 0);
      if (cutoff.getTime() <= now.getTime()) continue; // too late to prep
      const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
      const nice = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(day);
      out.push({ id: `${iso}_${s.start}`, date: iso, startHour: s.start, endHour: s.end, label: `${nice}, ${hourLabel(s.start)}–${hourLabel(s.end)}` });
    }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id)).slice(0, 8);
}

export function fulfillmentConfig(now = new Date()): FulfillmentConfig {
  return {
    areaName: env.deliveryAreaName,
    zips: env.deliveryZips,
    zoneNote: env.deliveryZoneNote,
    slots: upcomingSlots(now),
    pickup: { enabled: env.pickupEnabled, location: env.pickupLocation, note: env.pickupNote },
    shipping: { flatCents: env.shippingFlatCents, freeOverCents: env.freeShippingOverCents },
    cod: env.codEnabled,
  };
}

export function normalizePostal(code: string): string {
  return (code ?? "").trim().replace(/\s+/g, "").split("-")[0].toUpperCase();
}

/** Whether we deliver to a postal code. No configured list = deliver anywhere. */
export function servesPostal(code: string): boolean {
  const zips = env.deliveryZips;
  if (!zips.length) return true;
  return zips.map(normalizePostal).includes(normalizePostal(code));
}

export function outOfZoneMessage(): string {
  return `We currently deliver to ${env.deliveryAreaName} only${env.deliveryZips.length ? ` (${env.deliveryZips.join(", ")})` : ""}.${env.pickupEnabled ? " Local pickup is available for other addresses." : ""}`;
}

/** Validates a chosen slot id against the currently offered windows. */
export function isValidSlot(id: string | null | undefined, now = new Date()): boolean {
  if (!id) return false;
  return upcomingSlots(now).some((s) => s.id === id);
}
export function slotLabel(id: string | null | undefined, now = new Date()): string | null {
  return upcomingSlots(now).find((s) => s.id === id)?.label ?? null;
}
