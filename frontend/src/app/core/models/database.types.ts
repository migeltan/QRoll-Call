// PLACEHOLDER matching docs/CONTRACTS.md so Roles 4 and 5 can code right away.
// Owner: Role 2 (Database / Supabase).
//
// Role 2: once your migrations are applied locally, REPLACE this whole file by running
//   cd backend && npm run types
// The generated file has the same `Database` shape, so nothing else should break.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      attendees: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          organization: string;
          contact_number: string;
          qr_token: string;
          qr_image_path: string | null;
          email_sent_at: string | null;
          status: 'registered' | 'checked_in';
          checked_in_at: string | null;
          checked_in_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          organization: string;
          contact_number: string;
          qr_token?: string;
          qr_image_path?: string | null;
          email_sent_at?: string | null;
          status?: 'registered' | 'checked_in';
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          organization?: string;
          contact_number?: string;
          qr_token?: string;
          qr_image_path?: string | null;
          email_sent_at?: string | null;
          status?: 'registered' | 'checked_in';
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      register_attendee: {
        Args: {
          p_full_name: string;
          p_email: string;
          p_organization: string;
          p_contact_number: string;
        };
        Returns: string; // the new attendee id (uuid)
      };
      check_in: {
        Args: { p_token: string };
        Returns: Json; // see CheckInResult in core/models/check-in.model.ts
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
