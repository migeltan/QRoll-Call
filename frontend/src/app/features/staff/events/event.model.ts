// Shapes used by the staff Events pages. Owner: Role 5 (Staff Auth + Check-in Scanner).
// The SQL side (create_event / list_events) is described in the events proposal for Role 2.

export interface EventRow {
  id: string;
  /** Code attendees type when they register, e.g. QR-7K2M9X */
  code: string;
  title: string;
  details: string | null;
  /** Calendar date of the event, YYYY-MM-DD */
  event_date: string;
  /** The code and every QR pass for this event stop working at this moment (end of event_date, Manila time) */
  expires_at: string;
  accepted_organizations: string[];
  max_attendees: number | null;
  restrict_to_list: boolean;
  allowed_names_count: number;
  registered_count: number;
  created_at: string;
}

export interface AllowedName {
  full_name: string;
  email: string | null;
}

export interface NewEventInput {
  title: string;
  details: string;
  event_date: string;
  accepted_organizations: string[];
  max_attendees: number | null;
  allowed_names: AllowedName[];
}
