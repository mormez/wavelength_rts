export type ConversationStatus =
  | "New Reply (Needs Response)"
  | "Replied (Waiting on Them)"
  | "Ongoing Conversation"
  | "Call Scheduled"
  | "Had Call"
  | "Follow-Up Needed"
  | "Inactive";

export type WaitingOn = "Me" | "Them" | "Scheduled" | "None";

// Auto-derives "Waiting On" from "Conversation Status".
// Applied automatically when status changes; user can override manually.
export const STATUS_TO_WAITING_ON: Record<ConversationStatus, WaitingOn> = {
  "New Reply (Needs Response)": "Me",
  "Replied (Waiting on Them)":  "Them",
  "Ongoing Conversation":       "None",
  "Call Scheduled":             "Scheduled",
  "Had Call":                   "Them",
  "Follow-Up Needed":           "Me",
  "Inactive":                   "None",
};

export type LastInteractionType = "Email" | "Call" | "DM" | "In-person";

export type FollowUpIn =
  | "Tomorrow"
  | "In 3 days"
  | "In 1 week"
  | "In 2 weeks"
  | "In 3 weeks"
  | "In 1 month"
  | "In 2 months"
  | "In 3 months"
  | "In 6 months"
  | "When they reach out";

export type ProjectType = "Mixing" | "Mastering" | "Recording" | "Production";

export type Priority = "High" | "Medium" | "Low";

export type VibeFit = "Great Fit" | "Good Fit" | "Unsure" | "Not a Fit";

export type EmailSource = "manual" | "carl_bcc" | "user_bcc";

export interface Contact {
  id: string;
  user_id: string;
  artist_band: string;
  contact_name: string | null;
  email: string | null;
  genre: string | null;
  song_title: string | null;
  spotify_track_link: string | null;
  referral_source: string | null;
  location: string | null;
  conversation_status: ConversationStatus | null;
  waiting_on: WaitingOn | null;
  first_contact_date: string | null;
  last_contact_date: string | null;
  last_interaction_type: LastInteractionType | null;
  follow_up_in: FollowUpIn | null;
  had_call: "Yes" | "No" | null;
  call_date: string | null;
  project_type: ProjectType | null;
  priority: Priority | null;
  vibe_fit: VibeFit | null;
  research_notes: string | null;
  relationship_notes: string | null;
  is_new: boolean;
  email_source: EmailSource;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  username: string;
  plan: "free" | "pro" | "team";
  created_at: string;
}

// Calculated fields — never stored in DB, computed on the frontend
export interface ContactWithCalculated extends Contact {
  follow_up_date: Date | null;
  days_until_follow_up: number | null;
  days_since_last_touchpoint: number | null;
}

export const FOLLOW_UP_IN_OFFSETS: Record<FollowUpIn, number | null> = {
  Tomorrow: 1,
  "In 3 days": 3,
  "In 1 week": 7,
  "In 2 weeks": 14,
  "In 3 weeks": 21,
  "In 1 month": 30,
  "In 2 months": 60,
  "In 3 months": 90,
  "In 6 months": 180,
  "When they reach out": null,
};

export const STATUS_COLORS: Record<ConversationStatus, string> = {
  "New Reply (Needs Response)": "bg-emerald-50 border-l-4 border-l-emerald-400",
  "Replied (Waiting on Them)": "bg-blue-50 border-l-4 border-l-blue-400",
  "Ongoing Conversation": "bg-violet-50 border-l-4 border-l-violet-400",
  "Call Scheduled": "bg-amber-50 border-l-4 border-l-amber-400",
  "Had Call": "bg-sky-50 border-l-4 border-l-sky-400",
  "Follow-Up Needed": "bg-orange-50 border-l-4 border-l-orange-400",
  Inactive: "bg-gray-50 border-l-4 border-l-gray-300",
};

export const STATUS_BADGE_COLORS: Record<ConversationStatus, string> = {
  "New Reply (Needs Response)": "bg-emerald-100 text-emerald-800",
  "Replied (Waiting on Them)": "bg-blue-100 text-blue-800",
  "Ongoing Conversation": "bg-violet-100 text-violet-800",
  "Call Scheduled": "bg-amber-100 text-amber-800",
  "Had Call": "bg-sky-100 text-sky-800",
  "Follow-Up Needed": "bg-orange-100 text-orange-800",
  Inactive: "bg-gray-100 text-gray-600",
};
