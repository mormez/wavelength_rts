import {
  Contact,
  ContactWithCalculated,
  FOLLOW_UP_IN_OFFSETS,
  FollowUpIn,
} from "./types";

export function computeCalculatedFields(contact: Contact): ContactWithCalculated {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let follow_up_date: Date | null = null;
  let days_until_follow_up: number | null = null;
  let days_since_last_touchpoint: number | null = null;

  if (contact.last_contact_date && contact.follow_up_in) {
    const offset = FOLLOW_UP_IN_OFFSETS[contact.follow_up_in as FollowUpIn];
    if (offset !== null) {
      const base = new Date(contact.last_contact_date);
      base.setHours(0, 0, 0, 0);
      follow_up_date = new Date(base);
      follow_up_date.setDate(follow_up_date.getDate() + offset);
      days_until_follow_up = Math.floor(
        (follow_up_date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
    }
  }

  if (contact.last_contact_date) {
    const last = new Date(contact.last_contact_date);
    last.setHours(0, 0, 0, 0);
    days_since_last_touchpoint = Math.floor(
      (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  return { ...contact, follow_up_date, days_until_follow_up, days_since_last_touchpoint };
}

export function daysUntilColor(days: number | null): string {
  if (days === null) return "text-gray-400";
  if (days <= 0) return "text-red-600 font-semibold";
  if (days <= 7) return "text-amber-600 font-semibold";
  return "text-green-700";
}

export function daysUntilBgColor(days: number | null): string {
  if (days === null) return "";
  if (days <= 0) return "bg-red-100 text-red-700";
  if (days <= 7) return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function extractLocalPart(email: string): string {
  return email.split("@")[0] ?? "";
}

export function isAppleRelayEmail(email: string): boolean {
  return email.includes("privaterelay.appleid.com");
}
