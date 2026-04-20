export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          action: string
          admin_email: string | null
          admin_user_id: string | null
          created_at: string
          id: string
          new_value: Json | null
          note: string | null
          old_value: Json | null
          target_user_email: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_email?: string | null
          admin_user_id?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          note?: string | null
          old_value?: Json | null
          target_user_email?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_email?: string | null
          admin_user_id?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          note?: string | null
          old_value?: Json | null
          target_user_email?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      advisor_records: {
        Row: {
          address: string | null
          advisor_status: string
          advisor_type: string | null
          agency_name: string | null
          areas_handled: string[] | null
          aum_estimate: number | null
          category: string | null
          client_reference: string | null
          created_at: string | null
          date_of_death: string | null
          death_certificate_path: string | null
          details: Json
          email: string | null
          fee_structure: string | null
          firm: string | null
          firm_regulatory_status: string | null
          first_name: string | null
          id: string
          insurance_lines: string[] | null
          is_deceased: boolean
          is_na: boolean | null
          last_name: string | null
          legacy_notes: string | null
          license_expiry_date: string | null
          license_number: string | null
          license_states: string[] | null
          license_type: string | null
          name: string | null
          notes: string | null
          packet_id: string | null
          phone: string | null
          photo_path: string | null
          realtor_specialties: string[] | null
          scope: string | null
          software_used: string[] | null
          specialty: string | null
          status: string | null
          tax_reminders: boolean
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          advisor_status?: string
          advisor_type?: string | null
          agency_name?: string | null
          areas_handled?: string[] | null
          aum_estimate?: number | null
          category?: string | null
          client_reference?: string | null
          created_at?: string | null
          date_of_death?: string | null
          death_certificate_path?: string | null
          details?: Json
          email?: string | null
          fee_structure?: string | null
          firm?: string | null
          firm_regulatory_status?: string | null
          first_name?: string | null
          id?: string
          insurance_lines?: string[] | null
          is_deceased?: boolean
          is_na?: boolean | null
          last_name?: string | null
          legacy_notes?: string | null
          license_expiry_date?: string | null
          license_number?: string | null
          license_states?: string[] | null
          license_type?: string | null
          name?: string | null
          notes?: string | null
          packet_id?: string | null
          phone?: string | null
          photo_path?: string | null
          realtor_specialties?: string[] | null
          scope?: string | null
          software_used?: string[] | null
          specialty?: string | null
          status?: string | null
          tax_reminders?: boolean
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          advisor_status?: string
          advisor_type?: string | null
          agency_name?: string | null
          areas_handled?: string[] | null
          aum_estimate?: number | null
          category?: string | null
          client_reference?: string | null
          created_at?: string | null
          date_of_death?: string | null
          death_certificate_path?: string | null
          details?: Json
          email?: string | null
          fee_structure?: string | null
          firm?: string | null
          firm_regulatory_status?: string | null
          first_name?: string | null
          id?: string
          insurance_lines?: string[] | null
          is_deceased?: boolean
          is_na?: boolean | null
          last_name?: string | null
          legacy_notes?: string | null
          license_expiry_date?: string | null
          license_number?: string | null
          license_states?: string[] | null
          license_type?: string | null
          name?: string | null
          notes?: string | null
          packet_id?: string | null
          phone?: string | null
          photo_path?: string | null
          realtor_specialties?: string[] | null
          scope?: string | null
          software_used?: string[] | null
          specialty?: string | null
          status?: string | null
          tax_reminders?: boolean
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advisor_records_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_conversions: {
        Row: {
          affiliate_referral_id: string | null
          code_used: string | null
          conversion_status: string | null
          created_at: string | null
          id: string
          packet_id: string | null
          purchase_id: string | null
          referred_user_id: string | null
        }
        Insert: {
          affiliate_referral_id?: string | null
          code_used?: string | null
          conversion_status?: string | null
          created_at?: string | null
          id?: string
          packet_id?: string | null
          purchase_id?: string | null
          referred_user_id?: string | null
        }
        Update: {
          affiliate_referral_id?: string | null
          code_used?: string | null
          conversion_status?: string | null
          created_at?: string | null
          id?: string
          packet_id?: string | null
          purchase_id?: string | null
          referred_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_conversions_affiliate_referral_id_fkey"
            columns: ["affiliate_referral_id"]
            isOneToOne: false
            referencedRelation: "affiliate_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_code: string
          affiliate_email: string | null
          affiliate_name: string | null
          affiliate_type: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          owner_id: string | null
          payout_type: string | null
          payout_value: number | null
          status: string
        }
        Insert: {
          affiliate_code: string
          affiliate_email?: string | null
          affiliate_name?: string | null
          affiliate_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          owner_id?: string | null
          payout_type?: string | null
          payout_value?: number | null
          status?: string
        }
        Update: {
          affiliate_code?: string
          affiliate_email?: string | null
          affiliate_name?: string | null
          affiliate_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          owner_id?: string | null
          payout_type?: string | null
          payout_value?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      banking_records: {
        Row: {
          account_number_encrypted: string | null
          account_number_masked: string | null
          account_type: string | null
          approximate_balance: number | null
          beneficiary_notes: string | null
          category: string | null
          contact_info: string | null
          created_at: string | null
          id: string
          institution: string
          is_na: boolean | null
          joint_account_holder: string | null
          notes: string | null
          online_login_instructions: string | null
          packet_id: string | null
          routing_number_encrypted: string | null
          routing_number_masked: string | null
          scope: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          account_number_encrypted?: string | null
          account_number_masked?: string | null
          account_type?: string | null
          approximate_balance?: number | null
          beneficiary_notes?: string | null
          category?: string | null
          contact_info?: string | null
          created_at?: string | null
          id?: string
          institution: string
          is_na?: boolean | null
          joint_account_holder?: string | null
          notes?: string | null
          online_login_instructions?: string | null
          packet_id?: string | null
          routing_number_encrypted?: string | null
          routing_number_masked?: string | null
          scope?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          account_number_encrypted?: string | null
          account_number_masked?: string | null
          account_type?: string | null
          approximate_balance?: number | null
          beneficiary_notes?: string | null
          category?: string | null
          contact_info?: string | null
          created_at?: string | null
          id?: string
          institution?: string
          is_na?: boolean | null
          joint_account_holder?: string | null
          notes?: string | null
          online_login_instructions?: string | null
          packet_id?: string | null
          routing_number_encrypted?: string | null
          routing_number_masked?: string | null
          scope?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banking_records_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_events: {
        Row: {
          checked_in_at: string | null
          created_at: string
          id: string
          notes: string | null
          reminder_count: number
          scheduled_at: string
          sent_at: string | null
          status: string
          token: string | null
          token_expires_at: string | null
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          reminder_count?: number
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          token?: string | null
          token_expires_at?: string | null
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          reminder_count?: number
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          token?: string | null
          token_expires_at?: string | null
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      checkin_settings: {
        Row: {
          checkin_method: string
          created_at: string
          frequency_days: number
          grace_period_days: number
          id: string
          is_enabled: boolean
          is_paused: boolean
          pause_until: string | null
          release_behavior: string
          selected_contact_ids: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          checkin_method?: string
          created_at?: string
          frequency_days?: number
          grace_period_days?: number
          id?: string
          is_enabled?: boolean
          is_paused?: boolean
          pause_until?: string | null
          release_behavior?: string
          selected_contact_ids?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          checkin_method?: string
          created_at?: string
          frequency_days?: number
          grace_period_days?: number
          id?: string
          is_enabled?: boolean
          is_paused?: boolean
          pause_until?: string | null
          release_behavior?: string
          selected_contact_ids?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      corporate_accounts: {
        Row: {
          admin_user_id: string
          billing_email: string | null
          company_logo_url: string | null
          company_name: string
          created_at: string
          feature_tier: string
          id: string
          plan_key: string
          seat_limit: number
          stripe_payment_intent_id: string | null
          total_paid: number | null
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          billing_email?: string | null
          company_logo_url?: string | null
          company_name: string
          created_at?: string
          feature_tier?: string
          id?: string
          plan_key: string
          seat_limit?: number
          stripe_payment_intent_id?: string | null
          total_paid?: number | null
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          billing_email?: string | null
          company_logo_url?: string | null
          company_name?: string
          created_at?: string
          feature_tier?: string
          id?: string
          plan_key?: string
          seat_limit?: number
          stripe_payment_intent_id?: string | null
          total_paid?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      corporate_seats: {
        Row: {
          activated_at: string | null
          corporate_account_id: string
          created_at: string
          id: string
          invite_expires_at: string | null
          invite_token: string | null
          invited_at: string
          invited_email: string
          invited_name: string | null
          revoked_at: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          activated_at?: string | null
          corporate_account_id: string
          created_at?: string
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_at?: string
          invited_email: string
          invited_name?: string | null
          revoked_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          activated_at?: string | null
          corporate_account_id?: string
          created_at?: string
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_at?: string
          invited_email?: string
          invited_name?: string | null
          revoked_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corporate_seats_corporate_account_id_fkey"
            columns: ["corporate_account_id"]
            isOneToOne: false
            referencedRelation: "corporate_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_activity: {
        Row: {
          action_type: Database["public"]["Enums"]["couple_activity_action"]
          couple_link_id: string
          created_at: string
          description: string | null
          id: string
          record_id: string | null
          record_table: string | null
          section_key: string | null
          user_id: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["couple_activity_action"]
          couple_link_id: string
          created_at?: string
          description?: string | null
          id?: string
          record_id?: string | null
          record_table?: string | null
          section_key?: string | null
          user_id: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["couple_activity_action"]
          couple_link_id?: string
          created_at?: string
          description?: string | null
          id?: string
          record_id?: string | null
          record_table?: string | null
          section_key?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_activity_couple_link_id_fkey"
            columns: ["couple_link_id"]
            isOneToOne: false
            referencedRelation: "couple_links"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_links: {
        Row: {
          created_at: string
          email_notifications_enabled: boolean
          id: string
          initiated_by: string
          invite_email: string | null
          invite_expires_at: string | null
          invite_token: string | null
          last_review_at: string | null
          linked_at: string | null
          status: Database["public"]["Enums"]["couple_link_status"]
          unlinked_at: string | null
          unlinked_by: string | null
          updated_at: string
          user_id_1: string
          user_id_2: string | null
        }
        Insert: {
          created_at?: string
          email_notifications_enabled?: boolean
          id?: string
          initiated_by: string
          invite_email?: string | null
          invite_expires_at?: string | null
          invite_token?: string | null
          last_review_at?: string | null
          linked_at?: string | null
          status?: Database["public"]["Enums"]["couple_link_status"]
          unlinked_at?: string | null
          unlinked_by?: string | null
          updated_at?: string
          user_id_1: string
          user_id_2?: string | null
        }
        Update: {
          created_at?: string
          email_notifications_enabled?: boolean
          id?: string
          initiated_by?: string
          invite_email?: string | null
          invite_expires_at?: string | null
          invite_token?: string | null
          last_review_at?: string | null
          linked_at?: string | null
          status?: Database["public"]["Enums"]["couple_link_status"]
          unlinked_at?: string | null
          unlinked_by?: string | null
          updated_at?: string
          user_id_1?: string
          user_id_2?: string | null
        }
        Relationships: []
      }
      couple_notifications: {
        Row: {
          actor_user_id: string
          body: string | null
          couple_link_id: string
          created_at: string
          id: string
          is_read: boolean
          link_to: string | null
          notification_type: string
          recipient_user_id: string
          title: string
        }
        Insert: {
          actor_user_id: string
          body?: string | null
          couple_link_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          link_to?: string | null
          notification_type: string
          recipient_user_id: string
          title: string
        }
        Update: {
          actor_user_id?: string
          body?: string | null
          couple_link_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link_to?: string | null
          notification_type?: string
          recipient_user_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_notifications_couple_link_id_fkey"
            columns: ["couple_link_id"]
            isOneToOne: false
            referencedRelation: "couple_links"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_permissions: {
        Row: {
          couple_link_id: string
          created_at: string
          granting_user_id: string
          id: string
          permission_level: Database["public"]["Enums"]["couple_permission_level"]
          receiving_user_id: string
          section_key: string
          updated_at: string
        }
        Insert: {
          couple_link_id: string
          created_at?: string
          granting_user_id: string
          id?: string
          permission_level?: Database["public"]["Enums"]["couple_permission_level"]
          receiving_user_id: string
          section_key: string
          updated_at?: string
        }
        Update: {
          couple_link_id?: string
          created_at?: string
          granting_user_id?: string
          id?: string
          permission_level?: Database["public"]["Enums"]["couple_permission_level"]
          receiving_user_id?: string
          section_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_permissions_couple_link_id_fkey"
            columns: ["couple_link_id"]
            isOneToOne: false
            referencedRelation: "couple_links"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_review_log: {
        Row: {
          completed_by: string
          couple_link_id: string
          created_at: string
          id: string
          notes: string | null
        }
        Insert: {
          completed_by: string
          couple_link_id: string
          created_at?: string
          id?: string
          notes?: string | null
        }
        Update: {
          completed_by?: string
          couple_link_id?: string
          created_at?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "couple_review_log_couple_link_id_fkey"
            columns: ["couple_link_id"]
            isOneToOne: false
            referencedRelation: "couple_links"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_cards: {
        Row: {
          card_type: string | null
          category: string | null
          created_at: string
          credit_limit: number | null
          id: string
          is_na: boolean | null
          issuer: string
          last_four: string | null
          notes: string | null
          online_login_instructions: string | null
          packet_id: string
          scope: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          card_type?: string | null
          category?: string | null
          created_at?: string
          credit_limit?: number | null
          id?: string
          is_na?: boolean | null
          issuer: string
          last_four?: string | null
          notes?: string | null
          online_login_instructions?: string | null
          packet_id: string
          scope?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          card_type?: string | null
          category?: string | null
          created_at?: string
          credit_limit?: number | null
          id?: string
          is_na?: boolean | null
          issuer?: string
          last_four?: string | null
          notes?: string | null
          online_login_instructions?: string | null
          packet_id?: string
          scope?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_section_records: {
        Row: {
          created_at: string
          custom_section_id: string
          entry_date: string | null
          id: string
          notes: string | null
          packet_id: string
          scope: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_section_id: string
          entry_date?: string | null
          id?: string
          notes?: string | null
          packet_id: string
          scope?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_section_id?: string
          entry_date?: string | null
          id?: string
          notes?: string | null
          packet_id?: string
          scope?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_section_records_custom_section_id_fkey"
            columns: ["custom_section_id"]
            isOneToOne: false
            referencedRelation: "custom_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_section_records_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_sections: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          packet_id: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          packet_id: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          packet_id?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_sections_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_billing_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          stripe_customer_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          stripe_customer_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          stripe_customer_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_billing_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_alerts: {
        Row: {
          alert_sent_0: boolean
          alert_sent_14: boolean
          alert_sent_30: boolean
          alert_sent_60: boolean
          alert_sent_7: boolean
          alert_sent_90: boolean
          alert_sent_overdue: boolean
          created_at: string
          document_name: string | null
          document_type: string
          expiry_date: string
          id: string
          is_dismissed: boolean
          last_alert_sent_at: string | null
          packet_id: string
          record_id: string
          related_table: string
          section_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_sent_0?: boolean
          alert_sent_14?: boolean
          alert_sent_30?: boolean
          alert_sent_60?: boolean
          alert_sent_7?: boolean
          alert_sent_90?: boolean
          alert_sent_overdue?: boolean
          created_at?: string
          document_name?: string | null
          document_type: string
          expiry_date: string
          id?: string
          is_dismissed?: boolean
          last_alert_sent_at?: string | null
          packet_id: string
          record_id: string
          related_table: string
          section_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_sent_0?: boolean
          alert_sent_14?: boolean
          alert_sent_30?: boolean
          alert_sent_60?: boolean
          alert_sent_7?: boolean
          alert_sent_90?: boolean
          alert_sent_overdue?: boolean
          created_at?: string
          document_name?: string | null
          document_type?: string
          expiry_date?: string
          id?: string
          is_dismissed?: boolean
          last_alert_sent_at?: string | null
          packet_id?: string
          record_id?: string
          related_table?: string
          section_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          complexity: string
          created_at: string
          description: string | null
          guidance_notes: Json
          icon: string | null
          id: string
          is_active: boolean
          name: string
          state_specific: boolean
          template_content: Json
          template_type: string
          updated_at: string
          version: string
        }
        Insert: {
          complexity?: string
          created_at?: string
          description?: string | null
          guidance_notes?: Json
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          state_specific?: boolean
          template_content?: Json
          template_type: string
          updated_at?: string
          version?: string
        }
        Update: {
          complexity?: string
          created_at?: string
          description?: string | null
          guidance_notes?: Json
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          state_specific?: boolean
          template_content?: Json
          template_type?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string | null
          created_at: string | null
          file_name: string | null
          file_path: string
          file_size: number | null
          id: string
          is_na: boolean | null
          is_private: boolean | null
          mime_type: string | null
          packet_id: string | null
          related_record_id: string | null
          related_table: string | null
          scope: string | null
          section_key: string | null
          status: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          file_name?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          is_na?: boolean | null
          is_private?: boolean | null
          mime_type?: string | null
          packet_id?: string | null
          related_record_id?: string | null
          related_table?: string | null
          scope?: string | null
          section_key?: string | null
          status?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          file_name?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          is_na?: boolean | null
          is_private?: boolean | null
          mime_type?: string | null
          packet_id?: string | null
          related_record_id?: string | null
          related_table?: string | null
          scope?: string | null
          section_key?: string | null
          status?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_access_log: {
        Row: {
          accessed_at: string
          browser: string | null
          city: string | null
          country: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          pin_correct: boolean
          region: string | null
          sections_viewed: Json | null
          token_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accessed_at?: string
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          pin_correct?: boolean
          region?: string | null
          sections_viewed?: Json | null
          token_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accessed_at?: string
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          pin_correct?: boolean
          region?: string | null
          sections_viewed?: Json | null
          token_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_access_log_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "emergency_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_tokens: {
        Row: {
          bypass_consent_agreed_at: string | null
          bypass_consent_version: string | null
          bypass_enabled: boolean
          bypass_fields: Json
          created_at: string
          custom_field_text: string | null
          failed_attempts: number
          id: string
          is_active: boolean
          locked_until: string | null
          packet_id: string
          pin_hash: string
          pin_hint: string | null
          regenerated_at: string | null
          token: string
          updated_at: string
          user_id: string
          visible_sections: Json
        }
        Insert: {
          bypass_consent_agreed_at?: string | null
          bypass_consent_version?: string | null
          bypass_enabled?: boolean
          bypass_fields?: Json
          created_at?: string
          custom_field_text?: string | null
          failed_attempts?: number
          id?: string
          is_active?: boolean
          locked_until?: string | null
          packet_id: string
          pin_hash: string
          pin_hint?: string | null
          regenerated_at?: string | null
          token?: string
          updated_at?: string
          user_id: string
          visible_sections?: Json
        }
        Update: {
          bypass_consent_agreed_at?: string | null
          bypass_consent_version?: string | null
          bypass_enabled?: boolean
          bypass_fields?: Json
          created_at?: string
          custom_field_text?: string | null
          failed_attempts?: number
          id?: string
          is_active?: boolean
          locked_until?: string | null
          packet_id?: string
          pin_hash?: string
          pin_hint?: string | null
          regenerated_at?: string | null
          token?: string
          updated_at?: string
          user_id?: string
          visible_sections?: Json
        }
        Relationships: [
          {
            foreignKeyName: "emergency_tokens_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_leads: {
        Row: {
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          estimated_seats: number | null
          id: string
          message: string | null
          status: string
        }
        Insert: {
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          estimated_seats?: number | null
          id?: string
          message?: string | null
          status?: string
        }
        Update: {
          company_name?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          estimated_seats?: number | null
          id?: string
          message?: string | null
          status?: string
        }
        Relationships: []
      }
      estate_liabilities: {
        Row: {
          account_number_masked: string | null
          autopay_account: string | null
          autopay_enabled: boolean | null
          balance: number
          contact_address: string | null
          contact_phone: string | null
          created_at: string
          id: string
          interest_rate: number | null
          is_joint: boolean | null
          is_na: boolean | null
          joint_holder_name: string | null
          lender_name: string | null
          liability_type: string
          login_url: string | null
          monthly_payment: number | null
          notes: string | null
          original_balance: number | null
          packet_id: string
          payment_due_day: number | null
          payment_frequency: string | null
          payoff_date: string | null
          scope: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number_masked?: string | null
          autopay_account?: string | null
          autopay_enabled?: boolean | null
          balance?: number
          contact_address?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          interest_rate?: number | null
          is_joint?: boolean | null
          is_na?: boolean | null
          joint_holder_name?: string | null
          lender_name?: string | null
          liability_type: string
          login_url?: string | null
          monthly_payment?: number | null
          notes?: string | null
          original_balance?: number | null
          packet_id: string
          payment_due_day?: number | null
          payment_frequency?: string | null
          payoff_date?: string | null
          scope?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number_masked?: string | null
          autopay_account?: string | null
          autopay_enabled?: boolean | null
          balance?: number
          contact_address?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          interest_rate?: number | null
          is_joint?: boolean | null
          is_na?: boolean | null
          joint_holder_name?: string | null
          lender_name?: string | null
          liability_type?: string
          login_url?: string | null
          monthly_payment?: number | null
          notes?: string | null
          original_balance?: number | null
          packet_id?: string
          payment_due_day?: number | null
          payment_frequency?: string | null
          payoff_date?: string | null
          scope?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estate_liabilities_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          address: string | null
          birthday: string | null
          category: string | null
          cause_of_death: string | null
          created_at: string | null
          date_of_death: string | null
          divorce_attorney: string | null
          divorce_finalized: boolean | null
          divorce_finalized_date: string | null
          divorce_jurisdiction: string | null
          divorce_settlement_notes: string | null
          email: string | null
          employer: string | null
          first_name: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relationship: string | null
          has_special_needs: boolean | null
          id: string
          inlaw_subtype: string | null
          is_beneficiary: boolean | null
          is_deceased: boolean
          is_dependent: boolean | null
          is_na: boolean | null
          last_name: string | null
          legacy_notes: string | null
          lives_with_user: boolean | null
          marital_status: string | null
          marriage_certificate_on_file: boolean | null
          marriage_date: string | null
          marriage_place: string | null
          middle_name: string | null
          name: string
          occupation: string | null
          packet_id: string | null
          parent_member_id: string | null
          parent_side: string | null
          phone: string | null
          photo_path: string | null
          place_of_birth: string | null
          place_of_death: string | null
          preferred_name: string | null
          related_to_spouse_id: string | null
          relationship: string | null
          relationship_subtype: string | null
          reminder_notes: string | null
          school_name: string | null
          scope: string | null
          separation_date: string | null
          special_needs_notes: string | null
          ssn_encrypted: string | null
          ssn_masked: string | null
          status: string | null
          suffix: string | null
          updated_at: string | null
          which_parent: string | null
        }
        Insert: {
          address?: string | null
          birthday?: string | null
          category?: string | null
          cause_of_death?: string | null
          created_at?: string | null
          date_of_death?: string | null
          divorce_attorney?: string | null
          divorce_finalized?: boolean | null
          divorce_finalized_date?: string | null
          divorce_jurisdiction?: string | null
          divorce_settlement_notes?: string | null
          email?: string | null
          employer?: string | null
          first_name?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          has_special_needs?: boolean | null
          id?: string
          inlaw_subtype?: string | null
          is_beneficiary?: boolean | null
          is_deceased?: boolean
          is_dependent?: boolean | null
          is_na?: boolean | null
          last_name?: string | null
          legacy_notes?: string | null
          lives_with_user?: boolean | null
          marital_status?: string | null
          marriage_certificate_on_file?: boolean | null
          marriage_date?: string | null
          marriage_place?: string | null
          middle_name?: string | null
          name: string
          occupation?: string | null
          packet_id?: string | null
          parent_member_id?: string | null
          parent_side?: string | null
          phone?: string | null
          photo_path?: string | null
          place_of_birth?: string | null
          place_of_death?: string | null
          preferred_name?: string | null
          related_to_spouse_id?: string | null
          relationship?: string | null
          relationship_subtype?: string | null
          reminder_notes?: string | null
          school_name?: string | null
          scope?: string | null
          separation_date?: string | null
          special_needs_notes?: string | null
          ssn_encrypted?: string | null
          ssn_masked?: string | null
          status?: string | null
          suffix?: string | null
          updated_at?: string | null
          which_parent?: string | null
        }
        Update: {
          address?: string | null
          birthday?: string | null
          category?: string | null
          cause_of_death?: string | null
          created_at?: string | null
          date_of_death?: string | null
          divorce_attorney?: string | null
          divorce_finalized?: boolean | null
          divorce_finalized_date?: string | null
          divorce_jurisdiction?: string | null
          divorce_settlement_notes?: string | null
          email?: string | null
          employer?: string | null
          first_name?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          has_special_needs?: boolean | null
          id?: string
          inlaw_subtype?: string | null
          is_beneficiary?: boolean | null
          is_deceased?: boolean
          is_dependent?: boolean | null
          is_na?: boolean | null
          last_name?: string | null
          legacy_notes?: string | null
          lives_with_user?: boolean | null
          marital_status?: string | null
          marriage_certificate_on_file?: boolean | null
          marriage_date?: string | null
          marriage_place?: string | null
          middle_name?: string | null
          name?: string
          occupation?: string | null
          packet_id?: string | null
          parent_member_id?: string | null
          parent_side?: string | null
          phone?: string | null
          photo_path?: string | null
          place_of_birth?: string | null
          place_of_death?: string | null
          preferred_name?: string | null
          related_to_spouse_id?: string | null
          relationship?: string | null
          relationship_subtype?: string | null
          reminder_notes?: string | null
          school_name?: string | null
          scope?: string | null
          separation_date?: string | null
          special_needs_notes?: string | null
          ssn_encrypted?: string | null
          ssn_masked?: string | null
          status?: string | null
          suffix?: string | null
          updated_at?: string | null
          which_parent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_members_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_parent_member_id_fkey"
            columns: ["parent_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_related_to_spouse_id_fkey"
            columns: ["related_to_spouse_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      family_plan_members: {
        Row: {
          activated_at: string | null
          created_at: string
          family_plan_id: string
          id: string
          invite_expires_at: string | null
          invite_token: string | null
          invited_at: string
          invited_email: string
          invited_name: string | null
          removed_at: string | null
          share_completion_pct: boolean | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          family_plan_id: string
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_at?: string
          invited_email: string
          invited_name?: string | null
          removed_at?: string | null
          share_completion_pct?: boolean | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          family_plan_id?: string
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_at?: string
          invited_email?: string
          invited_name?: string | null
          removed_at?: string | null
          share_completion_pct?: boolean | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_plan_members_family_plan_id_fkey"
            columns: ["family_plan_id"]
            isOneToOne: false
            referencedRelation: "family_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      family_plans: {
        Row: {
          created_at: string
          feature_tier: string
          id: string
          owner_user_id: string
          plan_key: string
          seat_limit: number
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          feature_tier?: string
          id?: string
          owner_user_id: string
          plan_key: string
          seat_limit?: number
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          feature_tier?: string
          id?: string
          owner_user_id?: string
          plan_key?: string
          seat_limit?: number
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      featured_professionals: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          email: string | null
          firm: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          name: string
          phone: string | null
          profession_type: string
          service_area_states: string[] | null
          service_area_zips: string[] | null
          state: string | null
          updated_at: string | null
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          email?: string | null
          firm?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          name: string
          phone?: string | null
          profession_type: string
          service_area_states?: string[] | null
          service_area_zips?: string[] | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          email?: string | null
          firm?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          name?: string
          phone?: string | null
          profession_type?: string
          service_area_states?: string[] | null
          service_area_zips?: string[] | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      funeral_music: {
        Row: {
          artist: string | null
          created_at: string
          display_order: number | null
          funeral_record_id: string
          id: string
          notes: string | null
          packet_id: string
          song_title: string
          updated_at: string
          when_to_play: string | null
        }
        Insert: {
          artist?: string | null
          created_at?: string
          display_order?: number | null
          funeral_record_id: string
          id?: string
          notes?: string | null
          packet_id: string
          song_title: string
          updated_at?: string
          when_to_play?: string | null
        }
        Update: {
          artist?: string | null
          created_at?: string
          display_order?: number | null
          funeral_record_id?: string
          id?: string
          notes?: string | null
          packet_id?: string
          song_title?: string
          updated_at?: string
          when_to_play?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funeral_music_funeral_record_id_fkey"
            columns: ["funeral_record_id"]
            isOneToOne: false
            referencedRelation: "funeral_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funeral_music_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      funeral_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          display_order: number | null
          file_path: string
          funeral_record_id: string
          id: string
          is_hero: boolean | null
          packet_id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          file_path: string
          funeral_record_id: string
          id?: string
          is_hero?: boolean | null
          packet_id: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          file_path?: string
          funeral_record_id?: string
          id?: string
          is_hero?: boolean | null
          packet_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funeral_photos_funeral_record_id_fkey"
            columns: ["funeral_record_id"]
            isOneToOne: false
            referencedRelation: "funeral_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funeral_photos_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funeral_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      funeral_readings: {
        Row: {
          author: string | null
          created_at: string
          display_order: number | null
          full_text: string | null
          funeral_record_id: string
          id: string
          packet_id: string
          reader_name: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          display_order?: number | null
          full_text?: string | null
          funeral_record_id: string
          id?: string
          packet_id: string
          reader_name?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          created_at?: string
          display_order?: number | null
          full_text?: string | null
          funeral_record_id?: string
          id?: string
          packet_id?: string
          reader_name?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funeral_readings_funeral_record_id_fkey"
            columns: ["funeral_record_id"]
            isOneToOne: false
            referencedRelation: "funeral_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funeral_readings_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      funeral_records: {
        Row: {
          additional_instructions: string | null
          attorney_to_notify: string | null
          burial_or_cremation: string | null
          category: string | null
          cemetery_plot_details: string | null
          created_at: string | null
          eulogy_author: string | null
          eulogy_text: string | null
          flowers_preferences: string | null
          funeral_director: string | null
          funeral_home: string | null
          funeral_home_email: string | null
          funeral_home_phone: string | null
          id: string
          is_na: boolean | null
          last_sent_to_email: string | null
          last_sent_to_funeral_home_at: string | null
          notes: string | null
          obituary_notes: string | null
          obituary_text: string | null
          packet_id: string | null
          personal_messages: string | null
          prepaid_arrangements: string | null
          reception_wishes: string | null
          religious_cultural_preferences: string | null
          scope: string | null
          service_preferences: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          additional_instructions?: string | null
          attorney_to_notify?: string | null
          burial_or_cremation?: string | null
          category?: string | null
          cemetery_plot_details?: string | null
          created_at?: string | null
          eulogy_author?: string | null
          eulogy_text?: string | null
          flowers_preferences?: string | null
          funeral_director?: string | null
          funeral_home?: string | null
          funeral_home_email?: string | null
          funeral_home_phone?: string | null
          id?: string
          is_na?: boolean | null
          last_sent_to_email?: string | null
          last_sent_to_funeral_home_at?: string | null
          notes?: string | null
          obituary_notes?: string | null
          obituary_text?: string | null
          packet_id?: string | null
          personal_messages?: string | null
          prepaid_arrangements?: string | null
          reception_wishes?: string | null
          religious_cultural_preferences?: string | null
          scope?: string | null
          service_preferences?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          additional_instructions?: string | null
          attorney_to_notify?: string | null
          burial_or_cremation?: string | null
          category?: string | null
          cemetery_plot_details?: string | null
          created_at?: string | null
          eulogy_author?: string | null
          eulogy_text?: string | null
          flowers_preferences?: string | null
          funeral_director?: string | null
          funeral_home?: string | null
          funeral_home_email?: string | null
          funeral_home_phone?: string | null
          id?: string
          is_na?: boolean | null
          last_sent_to_email?: string | null
          last_sent_to_funeral_home_at?: string | null
          notes?: string | null
          obituary_notes?: string | null
          obituary_text?: string | null
          packet_id?: string | null
          personal_messages?: string | null
          prepaid_arrangements?: string | null
          reception_wishes?: string | null
          religious_cultural_preferences?: string | null
          scope?: string | null
          service_preferences?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funeral_records_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      funeral_send_log: {
        Row: {
          created_at: string
          funeral_record_id: string | null
          id: string
          packet_id: string
          payload_summary: Json | null
          sent_by: string | null
          sent_to_email: string
        }
        Insert: {
          created_at?: string
          funeral_record_id?: string | null
          id?: string
          packet_id: string
          payload_summary?: Json | null
          sent_by?: string | null
          sent_to_email: string
        }
        Update: {
          created_at?: string
          funeral_record_id?: string | null
          id?: string
          packet_id?: string
          payload_summary?: Json | null
          sent_by?: string | null
          sent_to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "funeral_send_log_funeral_record_id_fkey"
            columns: ["funeral_record_id"]
            isOneToOne: false
            referencedRelation: "funeral_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funeral_send_log_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_codes: {
        Row: {
          code: string
          created_at: string
          delivered_at: string | null
          delivery_date: string | null
          expires_at: string
          id: string
          personal_message: string | null
          plan_key: string
          purchased_by_user_id: string | null
          recipient_email: string | null
          recipient_name: string | null
          redeemed_at: string | null
          redeemed_by_user_id: string | null
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          delivered_at?: string | null
          delivery_date?: string | null
          expires_at?: string
          id?: string
          personal_message?: string | null
          plan_key: string
          purchased_by_user_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by_user_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          delivered_at?: string | null
          delivery_date?: string | null
          expires_at?: string
          id?: string
          personal_message?: string | null
          plan_key?: string
          purchased_by_user_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by_user_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      health_score_history: {
        Row: {
          id: string
          packet_id: string
          recorded_at: string
          section_scores: Json
          total_score: number
          user_id: string
        }
        Insert: {
          id?: string
          packet_id: string
          recorded_at?: string
          section_scores?: Json
          total_score: number
          user_id: string
        }
        Update: {
          id?: string
          packet_id?: string
          recorded_at?: string
          section_scores?: Json
          total_score?: number
          user_id?: string
        }
        Relationships: []
      }
      health_scores: {
        Row: {
          calculated_at: string
          created_at: string
          critical_gaps: Json
          id: string
          packet_id: string
          previous_score: number
          score_change: number
          section_scores: Json
          total_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          calculated_at?: string
          created_at?: string
          critical_gaps?: Json
          id?: string
          packet_id: string
          previous_score?: number
          score_change?: number
          section_scores?: Json
          total_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          calculated_at?: string
          created_at?: string
          critical_gaps?: Json
          id?: string
          packet_id?: string
          previous_score?: number
          score_change?: number
          section_scores?: Json
          total_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      info_records: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          details: Json
          expiry_date: string | null
          id: string
          is_na: boolean | null
          notes: string | null
          packet_id: string | null
          scope: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          details?: Json
          expiry_date?: string | null
          id?: string
          is_na?: boolean | null
          notes?: string | null
          packet_id?: string | null
          scope?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          details?: Json
          expiry_date?: string | null
          id?: string
          is_na?: boolean | null
          notes?: string | null
          packet_id?: string | null
          scope?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "info_records_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_records: {
        Row: {
          account_nickname: string | null
          account_number_encrypted: string | null
          account_number_masked: string | null
          account_phone: string | null
          account_type: string | null
          advisor_email: string | null
          advisor_name: string | null
          advisor_phone: string | null
          allocation_bonds_pct: number | null
          allocation_cash_pct: number | null
          allocation_other_pct: number | null
          allocation_stocks_pct: number | null
          approximate_value: number | null
          branch_address: string | null
          category: string | null
          co_owner_name: string | null
          contingent_beneficiary: string | null
          created_at: string | null
          crypto_exchange_name: string | null
          crypto_hardware_wallet_location: string | null
          crypto_seed_phrase_location: string | null
          crypto_wallet_type: string | null
          disposition_action: string | null
          disposition_instructions: string | null
          id: string
          institution: string
          is_joint_account: boolean | null
          is_na: boolean | null
          last_statement_date: string | null
          notes: string | null
          packet_id: string | null
          password_hint: string | null
          pi_amount_invested: number | null
          pi_company_contact: string | null
          pi_company_name: string | null
          pi_current_value: number | null
          pi_investment_date: string | null
          pi_investment_stage: string | null
          pi_shareholder_agreement_notes: string | null
          primary_beneficiary: string | null
          primary_holdings_description: string | null
          restricted_stock_notes: string | null
          scope: string | null
          status: string | null
          tod_on_file: boolean | null
          updated_at: string | null
          username_encrypted: string | null
          username_masked: string | null
          website_url: string | null
        }
        Insert: {
          account_nickname?: string | null
          account_number_encrypted?: string | null
          account_number_masked?: string | null
          account_phone?: string | null
          account_type?: string | null
          advisor_email?: string | null
          advisor_name?: string | null
          advisor_phone?: string | null
          allocation_bonds_pct?: number | null
          allocation_cash_pct?: number | null
          allocation_other_pct?: number | null
          allocation_stocks_pct?: number | null
          approximate_value?: number | null
          branch_address?: string | null
          category?: string | null
          co_owner_name?: string | null
          contingent_beneficiary?: string | null
          created_at?: string | null
          crypto_exchange_name?: string | null
          crypto_hardware_wallet_location?: string | null
          crypto_seed_phrase_location?: string | null
          crypto_wallet_type?: string | null
          disposition_action?: string | null
          disposition_instructions?: string | null
          id?: string
          institution: string
          is_joint_account?: boolean | null
          is_na?: boolean | null
          last_statement_date?: string | null
          notes?: string | null
          packet_id?: string | null
          password_hint?: string | null
          pi_amount_invested?: number | null
          pi_company_contact?: string | null
          pi_company_name?: string | null
          pi_current_value?: number | null
          pi_investment_date?: string | null
          pi_investment_stage?: string | null
          pi_shareholder_agreement_notes?: string | null
          primary_beneficiary?: string | null
          primary_holdings_description?: string | null
          restricted_stock_notes?: string | null
          scope?: string | null
          status?: string | null
          tod_on_file?: boolean | null
          updated_at?: string | null
          username_encrypted?: string | null
          username_masked?: string | null
          website_url?: string | null
        }
        Update: {
          account_nickname?: string | null
          account_number_encrypted?: string | null
          account_number_masked?: string | null
          account_phone?: string | null
          account_type?: string | null
          advisor_email?: string | null
          advisor_name?: string | null
          advisor_phone?: string | null
          allocation_bonds_pct?: number | null
          allocation_cash_pct?: number | null
          allocation_other_pct?: number | null
          allocation_stocks_pct?: number | null
          approximate_value?: number | null
          branch_address?: string | null
          category?: string | null
          co_owner_name?: string | null
          contingent_beneficiary?: string | null
          created_at?: string | null
          crypto_exchange_name?: string | null
          crypto_hardware_wallet_location?: string | null
          crypto_seed_phrase_location?: string | null
          crypto_wallet_type?: string | null
          disposition_action?: string | null
          disposition_instructions?: string | null
          id?: string
          institution?: string
          is_joint_account?: boolean | null
          is_na?: boolean | null
          last_statement_date?: string | null
          notes?: string | null
          packet_id?: string | null
          password_hint?: string | null
          pi_amount_invested?: number | null
          pi_company_contact?: string | null
          pi_company_name?: string | null
          pi_current_value?: number | null
          pi_investment_date?: string | null
          pi_investment_stage?: string | null
          pi_shareholder_agreement_notes?: string | null
          primary_beneficiary?: string | null
          primary_holdings_description?: string | null
          restricted_stock_notes?: string | null
          scope?: string | null
          status?: string | null
          tod_on_file?: boolean | null
          updated_at?: string | null
          username_encrypted?: string | null
          username_masked?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_records_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          agent_email: string | null
          agent_name: string | null
          agent_phone: string | null
          alternate_agent_name: string | null
          alternate_executor_name: string | null
          alternate_guardian_name: string | null
          artificial_nutrition_preference: string | null
          assets_in_trust: string | null
          attorney_email: string | null
          attorney_firm: string | null
          attorney_name: string | null
          attorney_phone: string | null
          category: string | null
          created_at: string
          details: Json | null
          document_date: string | null
          document_name: string | null
          document_type: string
          effective_when: string | null
          executor_name: string | null
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_reasoning: string | null
          id: string
          is_durable: boolean | null
          is_na: boolean | null
          last_reviewed_date: string | null
          legacy_notes: string | null
          life_sustaining_preference: string | null
          notes: string | null
          organ_donation_preference: string | null
          original_location: string | null
          other_subtype: string | null
          packet_id: string
          pain_management_preference: string | null
          parties_involved: string | null
          scope: string | null
          status: string | null
          successor_trustee_name: string | null
          trust_type: string | null
          trustee_name: string | null
          updated_at: string
        }
        Insert: {
          agent_email?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          alternate_agent_name?: string | null
          alternate_executor_name?: string | null
          alternate_guardian_name?: string | null
          artificial_nutrition_preference?: string | null
          assets_in_trust?: string | null
          attorney_email?: string | null
          attorney_firm?: string | null
          attorney_name?: string | null
          attorney_phone?: string | null
          category?: string | null
          created_at?: string
          details?: Json | null
          document_date?: string | null
          document_name?: string | null
          document_type: string
          effective_when?: string | null
          executor_name?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_reasoning?: string | null
          id?: string
          is_durable?: boolean | null
          is_na?: boolean | null
          last_reviewed_date?: string | null
          legacy_notes?: string | null
          life_sustaining_preference?: string | null
          notes?: string | null
          organ_donation_preference?: string | null
          original_location?: string | null
          other_subtype?: string | null
          packet_id: string
          pain_management_preference?: string | null
          parties_involved?: string | null
          scope?: string | null
          status?: string | null
          successor_trustee_name?: string | null
          trust_type?: string | null
          trustee_name?: string | null
          updated_at?: string
        }
        Update: {
          agent_email?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          alternate_agent_name?: string | null
          alternate_executor_name?: string | null
          alternate_guardian_name?: string | null
          artificial_nutrition_preference?: string | null
          assets_in_trust?: string | null
          attorney_email?: string | null
          attorney_firm?: string | null
          attorney_name?: string | null
          attorney_phone?: string | null
          category?: string | null
          created_at?: string
          details?: Json | null
          document_date?: string | null
          document_name?: string | null
          document_type?: string
          effective_when?: string | null
          executor_name?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_reasoning?: string | null
          id?: string
          is_durable?: boolean | null
          is_na?: boolean | null
          last_reviewed_date?: string | null
          legacy_notes?: string | null
          life_sustaining_preference?: string | null
          notes?: string | null
          organ_donation_preference?: string | null
          original_location?: string | null
          other_subtype?: string | null
          packet_id?: string
          pain_management_preference?: string | null
          parties_involved?: string | null
          scope?: string | null
          status?: string | null
          successor_trustee_name?: string | null
          trust_type?: string | null
          trustee_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_documents_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          address: string | null
          allergies: string | null
          blood_type: string | null
          category: string | null
          conditions: string | null
          created_at: string | null
          details: Json
          dnr_status: string | null
          expiry_date: string | null
          group_number: string | null
          id: string
          insurance_group_number: string | null
          insurance_member_id: string | null
          insurance_phone: string | null
          insurance_provider: string | null
          insurance_renewal_date: string | null
          is_na: boolean | null
          legacy_notes: string | null
          member_id: string | null
          next_appointment_date: string | null
          notes: string | null
          organ_donor: boolean | null
          packet_id: string | null
          phone: string | null
          provider_name: string
          record_type: string | null
          referring_physician: string | null
          scope: string | null
          specialty: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          blood_type?: string | null
          category?: string | null
          conditions?: string | null
          created_at?: string | null
          details?: Json
          dnr_status?: string | null
          expiry_date?: string | null
          group_number?: string | null
          id?: string
          insurance_group_number?: string | null
          insurance_member_id?: string | null
          insurance_phone?: string | null
          insurance_provider?: string | null
          insurance_renewal_date?: string | null
          is_na?: boolean | null
          legacy_notes?: string | null
          member_id?: string | null
          next_appointment_date?: string | null
          notes?: string | null
          organ_donor?: boolean | null
          packet_id?: string | null
          phone?: string | null
          provider_name: string
          record_type?: string | null
          referring_physician?: string | null
          scope?: string | null
          specialty?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          allergies?: string | null
          blood_type?: string | null
          category?: string | null
          conditions?: string | null
          created_at?: string | null
          details?: Json
          dnr_status?: string | null
          expiry_date?: string | null
          group_number?: string | null
          id?: string
          insurance_group_number?: string | null
          insurance_member_id?: string | null
          insurance_phone?: string | null
          insurance_provider?: string | null
          insurance_renewal_date?: string | null
          is_na?: boolean | null
          legacy_notes?: string | null
          member_id?: string | null
          next_appointment_date?: string | null
          notes?: string | null
          organ_donor?: boolean | null
          packet_id?: string | null
          phone?: string | null
          provider_name?: string
          record_type?: string | null
          referring_physician?: string | null
          scope?: string | null
          specialty?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          condition_treated: string | null
          created_at: string
          details: Json
          dose: string | null
          dose_unit: string | null
          frequency: string | null
          id: string
          is_critical: boolean
          is_generic_available: boolean | null
          is_na: boolean | null
          legacy_notes: string | null
          name: string
          notes: string | null
          packet_id: string
          pharmacy: string | null
          pharmacy_phone: string | null
          prescribing_doctor: string | null
          prescription_number: string | null
          refill_due_date: string | null
          route: string | null
          scope: string | null
          side_effects: string | null
          special_instructions: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          condition_treated?: string | null
          created_at?: string
          details?: Json
          dose?: string | null
          dose_unit?: string | null
          frequency?: string | null
          id?: string
          is_critical?: boolean
          is_generic_available?: boolean | null
          is_na?: boolean | null
          legacy_notes?: string | null
          name: string
          notes?: string | null
          packet_id: string
          pharmacy?: string | null
          pharmacy_phone?: string | null
          prescribing_doctor?: string | null
          prescription_number?: string | null
          refill_due_date?: string | null
          route?: string | null
          scope?: string | null
          side_effects?: string | null
          special_instructions?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          condition_treated?: string | null
          created_at?: string
          details?: Json
          dose?: string | null
          dose_unit?: string | null
          frequency?: string | null
          id?: string
          is_critical?: boolean
          is_generic_available?: boolean | null
          is_na?: boolean | null
          legacy_notes?: string | null
          name?: string
          notes?: string | null
          packet_id?: string
          pharmacy?: string | null
          pharmacy_phone?: string | null
          prescribing_doctor?: string | null
          prescription_number?: string | null
          refill_due_date?: string | null
          route?: string | null
          scope?: string | null
          side_effects?: string | null
          special_instructions?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          content: string | null
          created_at: string
          date_written: string | null
          delivery_instructions: string | null
          entry_type: string
          id: string
          media_mime: string | null
          media_path: string | null
          notes: string | null
          packet_id: string
          recipient: string | null
          scope: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          date_written?: string | null
          delivery_instructions?: string | null
          entry_type: string
          id?: string
          media_mime?: string | null
          media_path?: string | null
          notes?: string | null
          packet_id: string
          recipient?: string | null
          scope?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          date_written?: string | null
          delivery_instructions?: string | null
          entry_type?: string
          id?: string
          media_mime?: string | null
          media_path?: string | null
          notes?: string | null
          packet_id?: string
          recipient?: string | null
          scope?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_album_photos: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number | null
          file_path: string
          id: string
          memory_id: string
          packet_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          file_path: string
          id?: string
          memory_id: string
          packet_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          file_path?: string
          id?: string
          memory_id?: string
          packet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_album_photos_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_album_photos_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_bucket_items: {
        Row: {
          completed: boolean | null
          created_at: string
          display_order: number | null
          id: string
          item_text: string
          memory_id: string
          packet_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          display_order?: number | null
          id?: string
          item_text: string
          memory_id: string
          packet_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          display_order?: number | null
          id?: string
          item_text?: string
          memory_id?: string
          packet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_bucket_items_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_bucket_items_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          alert_14_days: boolean
          alert_30_days: boolean
          alert_60_days: boolean
          alert_7_days: boolean
          alert_90_days: boolean
          alert_on_day: boolean
          alert_overdue: boolean
          created_at: string
          delivery_method: string
          expiration_alerts_enabled: boolean
          id: string
          monitored_sections: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_14_days?: boolean
          alert_30_days?: boolean
          alert_60_days?: boolean
          alert_7_days?: boolean
          alert_90_days?: boolean
          alert_on_day?: boolean
          alert_overdue?: boolean
          created_at?: string
          delivery_method?: string
          expiration_alerts_enabled?: boolean
          id?: string
          monitored_sections?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_14_days?: boolean
          alert_30_days?: boolean
          alert_60_days?: boolean
          alert_7_days?: boolean
          alert_90_days?: boolean
          alert_on_day?: boolean
          alert_overdue?: boolean
          created_at?: string
          delivery_method?: string
          expiration_alerts_enabled?: boolean
          id?: string
          monitored_sections?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      packet_download_history: {
        Row: {
          created_at: string
          download_type: string
          downloaded_by: string | null
          downloader_email: string | null
          downloader_role: string
          file_name: string | null
          format_option: string
          id: string
          include_sensitive: boolean
          notes: string | null
          packet_id: string
          sections_included: string[]
        }
        Insert: {
          created_at?: string
          download_type?: string
          downloaded_by?: string | null
          downloader_email?: string | null
          downloader_role?: string
          file_name?: string | null
          format_option?: string
          id?: string
          include_sensitive?: boolean
          notes?: string | null
          packet_id: string
          sections_included?: string[]
        }
        Update: {
          created_at?: string
          download_type?: string
          downloaded_by?: string | null
          downloader_email?: string | null
          downloader_role?: string
          file_name?: string | null
          format_option?: string
          id?: string
          include_sensitive?: boolean
          notes?: string | null
          packet_id?: string
          sections_included?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "packet_download_history_downloaded_by_fkey"
            columns: ["downloaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packet_download_history_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      packet_members: {
        Row: {
          created_at: string | null
          household_scope: string | null
          id: string
          packet_id: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          household_scope?: string | null
          id?: string
          packet_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          household_scope?: string | null
          id?: string
          packet_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "packet_members_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packet_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      packets: {
        Row: {
          affiliate_code: string | null
          affiliate_referrer_id: string | null
          created_at: string | null
          household_mode: string | null
          id: string
          last_opened_at: string | null
          owner_user_id: string | null
          person_a_name: string | null
          person_b_name: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          affiliate_code?: string | null
          affiliate_referrer_id?: string | null
          created_at?: string | null
          household_mode?: string | null
          id?: string
          last_opened_at?: string | null
          owner_user_id?: string | null
          person_a_name?: string | null
          person_b_name?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          affiliate_code?: string | null
          affiliate_referrer_id?: string | null
          created_at?: string | null
          household_mode?: string | null
          id?: string
          last_opened_at?: string | null
          owner_user_id?: string | null
          person_a_name?: string | null
          person_b_name?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "packets_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_invites: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          invited_by: string | null
          invited_email: string | null
          invited_name: string | null
          packet_id: string | null
          status: string | null
          token: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          invited_email?: string | null
          invited_name?: string | null
          packet_id?: string | null
          status?: string | null
          token: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          invited_email?: string | null
          invited_name?: string | null
          packet_id?: string | null
          status?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_invites_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      password_records: {
        Row: {
          access_instructions: string | null
          account_created_date: string | null
          account_phone: string | null
          after_death_action: string | null
          authenticator_app: string | null
          backup_codes_location: string | null
          category: string | null
          created_at: string | null
          crypto_exchange: string | null
          details: Json | null
          download_archive_instructions: string | null
          emergency_instructions: string | null
          handler_contact_id: string | null
          hardware_wallet_location: string | null
          hr_contact_name: string | null
          hr_contact_phone: string | null
          id: string
          is_na: boolean | null
          legacy_notes: Json | null
          manager_name: string | null
          master_password_location: string | null
          memorial_contact_name: string | null
          notes: string | null
          packet_id: string | null
          password_encrypted: string | null
          password_masked: string | null
          recovery_email: string | null
          recovery_key_location: string | null
          renewal_date: string | null
          requires_reauth: boolean | null
          scope: string | null
          security_question_hint: string | null
          seed_phrase_location: string | null
          service_name: string
          special_instructions: string | null
          status: string | null
          subscription_cost: number | null
          trusted_person_name: string | null
          two_fa_enabled: boolean | null
          two_fa_method: string | null
          two_fa_notes: string | null
          updated_at: string | null
          username: string | null
          wallet_type: string | null
          website_url: string | null
          who_should_access: string | null
          work_company_name: string | null
        }
        Insert: {
          access_instructions?: string | null
          account_created_date?: string | null
          account_phone?: string | null
          after_death_action?: string | null
          authenticator_app?: string | null
          backup_codes_location?: string | null
          category?: string | null
          created_at?: string | null
          crypto_exchange?: string | null
          details?: Json | null
          download_archive_instructions?: string | null
          emergency_instructions?: string | null
          handler_contact_id?: string | null
          hardware_wallet_location?: string | null
          hr_contact_name?: string | null
          hr_contact_phone?: string | null
          id?: string
          is_na?: boolean | null
          legacy_notes?: Json | null
          manager_name?: string | null
          master_password_location?: string | null
          memorial_contact_name?: string | null
          notes?: string | null
          packet_id?: string | null
          password_encrypted?: string | null
          password_masked?: string | null
          recovery_email?: string | null
          recovery_key_location?: string | null
          renewal_date?: string | null
          requires_reauth?: boolean | null
          scope?: string | null
          security_question_hint?: string | null
          seed_phrase_location?: string | null
          service_name: string
          special_instructions?: string | null
          status?: string | null
          subscription_cost?: number | null
          trusted_person_name?: string | null
          two_fa_enabled?: boolean | null
          two_fa_method?: string | null
          two_fa_notes?: string | null
          updated_at?: string | null
          username?: string | null
          wallet_type?: string | null
          website_url?: string | null
          who_should_access?: string | null
          work_company_name?: string | null
        }
        Update: {
          access_instructions?: string | null
          account_created_date?: string | null
          account_phone?: string | null
          after_death_action?: string | null
          authenticator_app?: string | null
          backup_codes_location?: string | null
          category?: string | null
          created_at?: string | null
          crypto_exchange?: string | null
          details?: Json | null
          download_archive_instructions?: string | null
          emergency_instructions?: string | null
          handler_contact_id?: string | null
          hardware_wallet_location?: string | null
          hr_contact_name?: string | null
          hr_contact_phone?: string | null
          id?: string
          is_na?: boolean | null
          legacy_notes?: Json | null
          manager_name?: string | null
          master_password_location?: string | null
          memorial_contact_name?: string | null
          notes?: string | null
          packet_id?: string | null
          password_encrypted?: string | null
          password_masked?: string | null
          recovery_email?: string | null
          recovery_key_location?: string | null
          renewal_date?: string | null
          requires_reauth?: boolean | null
          scope?: string | null
          security_question_hint?: string | null
          seed_phrase_location?: string | null
          service_name?: string
          special_instructions?: string | null
          status?: string | null
          subscription_cost?: number | null
          trusted_person_name?: string | null
          two_fa_enabled?: boolean | null
          two_fa_method?: string | null
          two_fa_notes?: string | null
          updated_at?: string | null
          username?: string | null
          wallet_type?: string | null
          website_url?: string | null
          who_should_access?: string | null
          work_company_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "password_records_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_property_photos: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number | null
          file_path: string
          id: string
          is_hero: boolean | null
          packet_id: string
          property_record_id: string
          updated_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          file_path: string
          id?: string
          is_hero?: boolean | null
          packet_id: string
          property_record_id: string
          updated_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          file_path?: string
          id?: string
          is_hero?: boolean | null
          packet_id?: string
          property_record_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_property_photos_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_property_photos_property_record_id_fkey"
            columns: ["property_record_id"]
            isOneToOne: false
            referencedRelation: "personal_property_records"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_property_records: {
        Row: {
          acquired_from: string | null
          acquisition_method: string | null
          acquisition_price: number | null
          appraised_value: number | null
          appraiser_company: string | null
          appraiser_name: string | null
          beneficiary: string | null
          brand: string | null
          category: string | null
          chain_of_custody: string | null
          condition: string | null
          created_at: string | null
          description: string | null
          disposition_action: string | null
          estimated_sale_price: number | null
          estimated_value: number | null
          firearm_action_type: string | null
          firearm_ammunition_location: string | null
          firearm_attorney_to_contact: string | null
          firearm_barrel_length: string | null
          firearm_caliber: string | null
          firearm_ccw_expiration: string | null
          firearm_ccw_permit: boolean | null
          firearm_ccw_state: string | null
          firearm_country_origin: string | null
          firearm_disposition_action: string | null
          firearm_disposition_recipient: string | null
          firearm_ffl_dealer: string | null
          firearm_finish: string | null
          firearm_is_loaded: boolean | null
          firearm_is_registered: boolean | null
          firearm_make: string | null
          firearm_model: string | null
          firearm_purchase_date: string | null
          firearm_purchased_from_type: string | null
          firearm_registration_state: string | null
          firearm_safe_code_encrypted: string | null
          firearm_safe_code_masked: string | null
          firearm_serial_encrypted: string | null
          firearm_serial_masked: string | null
          firearm_special_instructions: string | null
          firearm_storage_location: string | null
          firearm_transfer_restrictions: string | null
          firearm_type: string | null
          firearm_who_has_access: string | null
          firearm_year_manufactured: number | null
          has_certificate_of_authenticity: boolean | null
          id: string
          insurance_company: string | null
          insurance_coverage_amount: number | null
          insurance_policy_number: string | null
          insurance_rider: boolean | null
          insurance_rider_renewal_date: string | null
          is_na: boolean | null
          item_name: string | null
          last_appraisal_date: string | null
          location: string | null
          model_serial: string | null
          notes: string | null
          packet_id: string | null
          preferred_selling_method: string | null
          scope: string | null
          sentimental_notes: string | null
          special_handling: string | null
          specific_recipient: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          year_acquired: number | null
        }
        Insert: {
          acquired_from?: string | null
          acquisition_method?: string | null
          acquisition_price?: number | null
          appraised_value?: number | null
          appraiser_company?: string | null
          appraiser_name?: string | null
          beneficiary?: string | null
          brand?: string | null
          category?: string | null
          chain_of_custody?: string | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          disposition_action?: string | null
          estimated_sale_price?: number | null
          estimated_value?: number | null
          firearm_action_type?: string | null
          firearm_ammunition_location?: string | null
          firearm_attorney_to_contact?: string | null
          firearm_barrel_length?: string | null
          firearm_caliber?: string | null
          firearm_ccw_expiration?: string | null
          firearm_ccw_permit?: boolean | null
          firearm_ccw_state?: string | null
          firearm_country_origin?: string | null
          firearm_disposition_action?: string | null
          firearm_disposition_recipient?: string | null
          firearm_ffl_dealer?: string | null
          firearm_finish?: string | null
          firearm_is_loaded?: boolean | null
          firearm_is_registered?: boolean | null
          firearm_make?: string | null
          firearm_model?: string | null
          firearm_purchase_date?: string | null
          firearm_purchased_from_type?: string | null
          firearm_registration_state?: string | null
          firearm_safe_code_encrypted?: string | null
          firearm_safe_code_masked?: string | null
          firearm_serial_encrypted?: string | null
          firearm_serial_masked?: string | null
          firearm_special_instructions?: string | null
          firearm_storage_location?: string | null
          firearm_transfer_restrictions?: string | null
          firearm_type?: string | null
          firearm_who_has_access?: string | null
          firearm_year_manufactured?: number | null
          has_certificate_of_authenticity?: boolean | null
          id?: string
          insurance_company?: string | null
          insurance_coverage_amount?: number | null
          insurance_policy_number?: string | null
          insurance_rider?: boolean | null
          insurance_rider_renewal_date?: string | null
          is_na?: boolean | null
          item_name?: string | null
          last_appraisal_date?: string | null
          location?: string | null
          model_serial?: string | null
          notes?: string | null
          packet_id?: string | null
          preferred_selling_method?: string | null
          scope?: string | null
          sentimental_notes?: string | null
          special_handling?: string | null
          specific_recipient?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          year_acquired?: number | null
        }
        Update: {
          acquired_from?: string | null
          acquisition_method?: string | null
          acquisition_price?: number | null
          appraised_value?: number | null
          appraiser_company?: string | null
          appraiser_name?: string | null
          beneficiary?: string | null
          brand?: string | null
          category?: string | null
          chain_of_custody?: string | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          disposition_action?: string | null
          estimated_sale_price?: number | null
          estimated_value?: number | null
          firearm_action_type?: string | null
          firearm_ammunition_location?: string | null
          firearm_attorney_to_contact?: string | null
          firearm_barrel_length?: string | null
          firearm_caliber?: string | null
          firearm_ccw_expiration?: string | null
          firearm_ccw_permit?: boolean | null
          firearm_ccw_state?: string | null
          firearm_country_origin?: string | null
          firearm_disposition_action?: string | null
          firearm_disposition_recipient?: string | null
          firearm_ffl_dealer?: string | null
          firearm_finish?: string | null
          firearm_is_loaded?: boolean | null
          firearm_is_registered?: boolean | null
          firearm_make?: string | null
          firearm_model?: string | null
          firearm_purchase_date?: string | null
          firearm_purchased_from_type?: string | null
          firearm_registration_state?: string | null
          firearm_safe_code_encrypted?: string | null
          firearm_safe_code_masked?: string | null
          firearm_serial_encrypted?: string | null
          firearm_serial_masked?: string | null
          firearm_special_instructions?: string | null
          firearm_storage_location?: string | null
          firearm_transfer_restrictions?: string | null
          firearm_type?: string | null
          firearm_who_has_access?: string | null
          firearm_year_manufactured?: number | null
          has_certificate_of_authenticity?: boolean | null
          id?: string
          insurance_company?: string | null
          insurance_coverage_amount?: number | null
          insurance_policy_number?: string | null
          insurance_rider?: boolean | null
          insurance_rider_renewal_date?: string | null
          is_na?: boolean | null
          item_name?: string | null
          last_appraisal_date?: string | null
          location?: string | null
          model_serial?: string | null
          notes?: string | null
          packet_id?: string | null
          preferred_selling_method?: string | null
          scope?: string | null
          sentimental_notes?: string | null
          special_handling?: string | null
          specific_recipient?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          year_acquired?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_property_records_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_medications: {
        Row: {
          created_at: string
          dose: string | null
          frequency: string | null
          id: string
          name: string
          notes: string | null
          packet_id: string
          pet_record_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dose?: string | null
          frequency?: string | null
          id?: string
          name: string
          notes?: string | null
          packet_id: string
          pet_record_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dose?: string | null
          frequency?: string | null
          id?: string
          name?: string
          notes?: string | null
          packet_id?: string
          pet_record_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_medications_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_medications_pet_record_id_fkey"
            columns: ["pet_record_id"]
            isOneToOne: false
            referencedRelation: "pet_records"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_records: {
        Row: {
          age: string | null
          allergies_dietary: string | null
          behavioral_notes: string | null
          boarding_instructions: string | null
          breed: string | null
          care_instructions: string | null
          category: string | null
          color_markings: string | null
          created_at: string | null
          date_of_birth: string | null
          date_of_death: string | null
          deceased_notes: string | null
          emergency_notes: string | null
          emergency_vet_clinic: string | null
          emergency_vet_name: string | null
          emergency_vet_phone: string | null
          feeding_frequency: string | null
          feeding_instructions: string | null
          food_amount: string | null
          food_brand: string | null
          gender: string | null
          grooming_notes: string | null
          id: string
          insurance_policy_number: string | null
          insurance_provider: string | null
          is_deceased: boolean
          is_na: boolean | null
          medications: string | null
          microchip_info: string | null
          microchip_number: string | null
          microchip_registry: string | null
          packet_id: string | null
          pet_name: string | null
          photo_path: string | null
          scope: string | null
          spayed_neutered: boolean | null
          special_needs: string | null
          species: string | null
          species_breed: string | null
          status: string | null
          tag_license_number: string | null
          updated_at: string | null
          vet_address: string | null
          vet_clinic: string | null
          vet_name: string | null
          vet_phone: string | null
          veterinarian_contact: string | null
        }
        Insert: {
          age?: string | null
          allergies_dietary?: string | null
          behavioral_notes?: string | null
          boarding_instructions?: string | null
          breed?: string | null
          care_instructions?: string | null
          category?: string | null
          color_markings?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          date_of_death?: string | null
          deceased_notes?: string | null
          emergency_notes?: string | null
          emergency_vet_clinic?: string | null
          emergency_vet_name?: string | null
          emergency_vet_phone?: string | null
          feeding_frequency?: string | null
          feeding_instructions?: string | null
          food_amount?: string | null
          food_brand?: string | null
          gender?: string | null
          grooming_notes?: string | null
          id?: string
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          is_deceased?: boolean
          is_na?: boolean | null
          medications?: string | null
          microchip_info?: string | null
          microchip_number?: string | null
          microchip_registry?: string | null
          packet_id?: string | null
          pet_name?: string | null
          photo_path?: string | null
          scope?: string | null
          spayed_neutered?: boolean | null
          special_needs?: string | null
          species?: string | null
          species_breed?: string | null
          status?: string | null
          tag_license_number?: string | null
          updated_at?: string | null
          vet_address?: string | null
          vet_clinic?: string | null
          vet_name?: string | null
          vet_phone?: string | null
          veterinarian_contact?: string | null
        }
        Update: {
          age?: string | null
          allergies_dietary?: string | null
          behavioral_notes?: string | null
          boarding_instructions?: string | null
          breed?: string | null
          care_instructions?: string | null
          category?: string | null
          color_markings?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          date_of_death?: string | null
          deceased_notes?: string | null
          emergency_notes?: string | null
          emergency_vet_clinic?: string | null
          emergency_vet_name?: string | null
          emergency_vet_phone?: string | null
          feeding_frequency?: string | null
          feeding_instructions?: string | null
          food_amount?: string | null
          food_brand?: string | null
          gender?: string | null
          grooming_notes?: string | null
          id?: string
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          is_deceased?: boolean
          is_na?: boolean | null
          medications?: string | null
          microchip_info?: string | null
          microchip_number?: string | null
          microchip_registry?: string | null
          packet_id?: string | null
          pet_name?: string | null
          photo_path?: string | null
          scope?: string | null
          spayed_neutered?: boolean | null
          special_needs?: string | null
          species?: string | null
          species_breed?: string | null
          status?: string | null
          tag_license_number?: string | null
          updated_at?: string | null
          vet_address?: string | null
          vet_clinic?: string | null
          vet_name?: string | null
          vet_phone?: string | null
          veterinarian_contact?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_records_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_plans: {
        Row: {
          billing_type: string | null
          created_at: string | null
          description: string | null
          display_order: number
          feature_tier: string
          household_mode: string | null
          id: string
          is_active: boolean | null
          is_corporate_per_seat: boolean
          name: string
          plan_category: string
          plan_key: string
          price_cents: number
          seat_limit: number
          stripe_price_id: string | null
          stripe_product_id: string | null
          upgrade_target_plan_id: string | null
        }
        Insert: {
          billing_type?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          feature_tier?: string
          household_mode?: string | null
          id?: string
          is_active?: boolean | null
          is_corporate_per_seat?: boolean
          name: string
          plan_category?: string
          plan_key: string
          price_cents: number
          seat_limit?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          upgrade_target_plan_id?: string | null
        }
        Update: {
          billing_type?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          feature_tier?: string
          household_mode?: string | null
          id?: string
          is_active?: boolean | null
          is_corporate_per_seat?: boolean
          name?: string
          plan_category?: string
          plan_key?: string
          price_cents?: number
          seat_limit?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          upgrade_target_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_plans_upgrade_target_plan_id_fkey"
            columns: ["upgrade_target_plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      private_items: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_locked: boolean | null
          is_na: boolean | null
          notes: string | null
          owner_user_id: string | null
          packet_id: string | null
          scope: string | null
          status: string | null
          title: string
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_locked?: boolean | null
          is_na?: boolean | null
          notes?: string | null
          owner_user_id?: string | null
          packet_id?: string | null
          scope?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_locked?: boolean | null
          is_na?: boolean | null
          notes?: string | null
          owner_user_id?: string | null
          packet_id?: string | null
          scope?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "private_items_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_items_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          affiliate_id: string | null
          avatar_path: string | null
          checkin_frequency: string | null
          checkin_opted_out: boolean | null
          checkin_status: string | null
          consent_timestamp: string | null
          created_at: string | null
          current_address_city: string | null
          current_address_state: string | null
          current_address_street: string | null
          current_address_zip: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          gender: string | null
          id: string
          last_checkin_acknowledged_at: string | null
          last_checkin_at: string | null
          last_checkin_sent_at: string | null
          last_login_at: string | null
          last_name: string | null
          legal_version_accepted: string | null
          mailing_address_city: string | null
          mailing_address_state: string | null
          mailing_address_street: string | null
          mailing_address_zip: string | null
          mailing_same_as_current: boolean | null
          marital_status: string | null
          middle_name: string | null
          nationality: string | null
          place_of_birth: string | null
          preferred_name: string | null
          primary_phone: string | null
          role: string | null
          suffix: string | null
          updated_at: string | null
        }
        Insert: {
          affiliate_id?: string | null
          avatar_path?: string | null
          checkin_frequency?: string | null
          checkin_opted_out?: boolean | null
          checkin_status?: string | null
          consent_timestamp?: string | null
          created_at?: string | null
          current_address_city?: string | null
          current_address_state?: string | null
          current_address_street?: string | null
          current_address_zip?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          last_checkin_acknowledged_at?: string | null
          last_checkin_at?: string | null
          last_checkin_sent_at?: string | null
          last_login_at?: string | null
          last_name?: string | null
          legal_version_accepted?: string | null
          mailing_address_city?: string | null
          mailing_address_state?: string | null
          mailing_address_street?: string | null
          mailing_address_zip?: string | null
          mailing_same_as_current?: boolean | null
          marital_status?: string | null
          middle_name?: string | null
          nationality?: string | null
          place_of_birth?: string | null
          preferred_name?: string | null
          primary_phone?: string | null
          role?: string | null
          suffix?: string | null
          updated_at?: string | null
        }
        Update: {
          affiliate_id?: string | null
          avatar_path?: string | null
          checkin_frequency?: string | null
          checkin_opted_out?: boolean | null
          checkin_status?: string | null
          consent_timestamp?: string | null
          created_at?: string | null
          current_address_city?: string | null
          current_address_state?: string | null
          current_address_street?: string | null
          current_address_zip?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          last_checkin_acknowledged_at?: string | null
          last_checkin_at?: string | null
          last_checkin_sent_at?: string | null
          last_login_at?: string | null
          last_name?: string | null
          legal_version_accepted?: string | null
          mailing_address_city?: string | null
          mailing_address_state?: string | null
          mailing_address_street?: string | null
          mailing_address_zip?: string | null
          mailing_same_as_current?: boolean | null
          marital_status?: string | null
          middle_name?: string | null
          nationality?: string | null
          place_of_birth?: string | null
          preferred_name?: string | null
          primary_phone?: string | null
          role?: string | null
          suffix?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_affiliate"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      property_utilities: {
        Row: {
          account_number: string | null
          agent_contact: string | null
          annual_amount: number | null
          contact_phone: string | null
          created_at: string
          due_date: string | null
          id: string
          monthly_amount: number | null
          notes: string | null
          packet_id: string
          pin: string | null
          policy_number: string | null
          property_record_id: string
          provider_name: string | null
          updated_at: string
          utility_type: string
        }
        Insert: {
          account_number?: string | null
          agent_contact?: string | null
          annual_amount?: number | null
          contact_phone?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          monthly_amount?: number | null
          notes?: string | null
          packet_id: string
          pin?: string | null
          policy_number?: string | null
          property_record_id: string
          provider_name?: string | null
          updated_at?: string
          utility_type: string
        }
        Update: {
          account_number?: string | null
          agent_contact?: string | null
          annual_amount?: number | null
          contact_phone?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          monthly_amount?: number | null
          notes?: string | null
          packet_id?: string
          pin?: string | null
          policy_number?: string | null
          property_record_id?: string
          provider_name?: string | null
          updated_at?: string
          utility_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_utilities_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_utilities_property_record_id_fkey"
            columns: ["property_record_id"]
            isOneToOne: false
            referencedRelation: "real_estate_records"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          admin_note: string | null
          affiliate_code_used: string | null
          affiliate_referral_id: string | null
          billing_type: string | null
          comp_expires_at: string | null
          comp_granted_by: string | null
          created_at: string | null
          current_period_end: string | null
          id: string
          is_comp: boolean
          packet_id: string | null
          pause_note: string | null
          pause_resumes_at: string | null
          paused_at: string | null
          paused_by: string | null
          pricing_plan_id: string | null
          status: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_note?: string | null
          affiliate_code_used?: string | null
          affiliate_referral_id?: string | null
          billing_type?: string | null
          comp_expires_at?: string | null
          comp_granted_by?: string | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          is_comp?: boolean
          packet_id?: string | null
          pause_note?: string | null
          pause_resumes_at?: string | null
          paused_at?: string | null
          paused_by?: string | null
          pricing_plan_id?: string | null
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_note?: string | null
          affiliate_code_used?: string | null
          affiliate_referral_id?: string | null
          billing_type?: string | null
          comp_expires_at?: string | null
          comp_granted_by?: string | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          is_comp?: boolean
          packet_id?: string | null
          pause_note?: string | null
          pause_resumes_at?: string | null
          paused_at?: string | null
          paused_by?: string | null
          pricing_plan_id?: string | null
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_affiliate_referral_id_fkey"
            columns: ["affiliate_referral_id"]
            isOneToOne: false
            referencedRelation: "affiliate_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_pricing_plan_id_fkey"
            columns: ["pricing_plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      real_estate_records: {
        Row: {
          address: string | null
          alarm_code: string | null
          annual_property_tax_amount: number | null
          category: string | null
          created_at: string | null
          electric_account_number: string | null
          electric_company_name: string | null
          electric_monthly_estimate: number | null
          electric_phone: string | null
          estimated_value: number | null
          flood_insurance_renewal_date: string | null
          garage_code: string | null
          gas_account_number: string | null
          gas_company_name: string | null
          gas_monthly_estimate: number | null
          gas_phone: string | null
          gate_code: string | null
          has_mortgage: boolean
          hoa_account_number: string | null
          hoa_management_company: string | null
          hoa_monthly_fee: number | null
          hoa_name: string | null
          hoa_phone: string | null
          home_warranty_expiry_date: string | null
          id: string
          insurance_agent_name: string | null
          insurance_agent_phone: string | null
          insurance_annual_premium: number | null
          insurance_coverage_amount: number | null
          insurance_details: string | null
          insurance_policy_number: string | null
          insurance_policy_renewal_date: string | null
          insurance_provider_name: string | null
          internet_cable_account_number: string | null
          internet_cable_monthly_estimate: number | null
          internet_cable_phone: string | null
          internet_cable_provider: string | null
          is_na: boolean | null
          joint_owner_name: string | null
          key_location: string | null
          key_location_notes: string | null
          lockbox_code: string | null
          maintenance_contact_name: string | null
          maintenance_contact_phone: string | null
          mortgage_account_number: string | null
          mortgage_arm_adjustment_date: string | null
          mortgage_interest_rate: number | null
          mortgage_lender_name: string | null
          mortgage_lender_phone: string | null
          mortgage_lender_website: string | null
          mortgage_loan_type: string | null
          mortgage_monthly_payment: number | null
          mortgage_payoff_date: string | null
          municipality_contact: string | null
          notes: string | null
          ownership_type: string | null
          packet_id: string | null
          property_label: string
          property_manager_company: string | null
          property_manager_email: string | null
          property_manager_name: string | null
          property_manager_phone: string | null
          property_tax_account_number: string | null
          property_type: string | null
          purchase_price: number | null
          realtor_agency: string | null
          realtor_email: string | null
          realtor_name: string | null
          realtor_phone: string | null
          scope: string | null
          security_account_number: string | null
          security_company_name: string | null
          security_monitoring_phone: string | null
          security_system_details: string | null
          status: string | null
          tax_due_date: string | null
          trash_recycling_account_number: string | null
          trash_recycling_pickup_day: string | null
          trash_recycling_provider: string | null
          umbrella_policy_renewal_date: string | null
          updated_at: string | null
          utilities_account_numbers: Json | null
          water_sewer_account_number: string | null
          water_sewer_company_name: string | null
          water_sewer_monthly_estimate: number | null
          water_sewer_phone: string | null
          year_purchased: number | null
        }
        Insert: {
          address?: string | null
          alarm_code?: string | null
          annual_property_tax_amount?: number | null
          category?: string | null
          created_at?: string | null
          electric_account_number?: string | null
          electric_company_name?: string | null
          electric_monthly_estimate?: number | null
          electric_phone?: string | null
          estimated_value?: number | null
          flood_insurance_renewal_date?: string | null
          garage_code?: string | null
          gas_account_number?: string | null
          gas_company_name?: string | null
          gas_monthly_estimate?: number | null
          gas_phone?: string | null
          gate_code?: string | null
          has_mortgage?: boolean
          hoa_account_number?: string | null
          hoa_management_company?: string | null
          hoa_monthly_fee?: number | null
          hoa_name?: string | null
          hoa_phone?: string | null
          home_warranty_expiry_date?: string | null
          id?: string
          insurance_agent_name?: string | null
          insurance_agent_phone?: string | null
          insurance_annual_premium?: number | null
          insurance_coverage_amount?: number | null
          insurance_details?: string | null
          insurance_policy_number?: string | null
          insurance_policy_renewal_date?: string | null
          insurance_provider_name?: string | null
          internet_cable_account_number?: string | null
          internet_cable_monthly_estimate?: number | null
          internet_cable_phone?: string | null
          internet_cable_provider?: string | null
          is_na?: boolean | null
          joint_owner_name?: string | null
          key_location?: string | null
          key_location_notes?: string | null
          lockbox_code?: string | null
          maintenance_contact_name?: string | null
          maintenance_contact_phone?: string | null
          mortgage_account_number?: string | null
          mortgage_arm_adjustment_date?: string | null
          mortgage_interest_rate?: number | null
          mortgage_lender_name?: string | null
          mortgage_lender_phone?: string | null
          mortgage_lender_website?: string | null
          mortgage_loan_type?: string | null
          mortgage_monthly_payment?: number | null
          mortgage_payoff_date?: string | null
          municipality_contact?: string | null
          notes?: string | null
          ownership_type?: string | null
          packet_id?: string | null
          property_label: string
          property_manager_company?: string | null
          property_manager_email?: string | null
          property_manager_name?: string | null
          property_manager_phone?: string | null
          property_tax_account_number?: string | null
          property_type?: string | null
          purchase_price?: number | null
          realtor_agency?: string | null
          realtor_email?: string | null
          realtor_name?: string | null
          realtor_phone?: string | null
          scope?: string | null
          security_account_number?: string | null
          security_company_name?: string | null
          security_monitoring_phone?: string | null
          security_system_details?: string | null
          status?: string | null
          tax_due_date?: string | null
          trash_recycling_account_number?: string | null
          trash_recycling_pickup_day?: string | null
          trash_recycling_provider?: string | null
          umbrella_policy_renewal_date?: string | null
          updated_at?: string | null
          utilities_account_numbers?: Json | null
          water_sewer_account_number?: string | null
          water_sewer_company_name?: string | null
          water_sewer_monthly_estimate?: number | null
          water_sewer_phone?: string | null
          year_purchased?: number | null
        }
        Update: {
          address?: string | null
          alarm_code?: string | null
          annual_property_tax_amount?: number | null
          category?: string | null
          created_at?: string | null
          electric_account_number?: string | null
          electric_company_name?: string | null
          electric_monthly_estimate?: number | null
          electric_phone?: string | null
          estimated_value?: number | null
          flood_insurance_renewal_date?: string | null
          garage_code?: string | null
          gas_account_number?: string | null
          gas_company_name?: string | null
          gas_monthly_estimate?: number | null
          gas_phone?: string | null
          gate_code?: string | null
          has_mortgage?: boolean
          hoa_account_number?: string | null
          hoa_management_company?: string | null
          hoa_monthly_fee?: number | null
          hoa_name?: string | null
          hoa_phone?: string | null
          home_warranty_expiry_date?: string | null
          id?: string
          insurance_agent_name?: string | null
          insurance_agent_phone?: string | null
          insurance_annual_premium?: number | null
          insurance_coverage_amount?: number | null
          insurance_details?: string | null
          insurance_policy_number?: string | null
          insurance_policy_renewal_date?: string | null
          insurance_provider_name?: string | null
          internet_cable_account_number?: string | null
          internet_cable_monthly_estimate?: number | null
          internet_cable_phone?: string | null
          internet_cable_provider?: string | null
          is_na?: boolean | null
          joint_owner_name?: string | null
          key_location?: string | null
          key_location_notes?: string | null
          lockbox_code?: string | null
          maintenance_contact_name?: string | null
          maintenance_contact_phone?: string | null
          mortgage_account_number?: string | null
          mortgage_arm_adjustment_date?: string | null
          mortgage_interest_rate?: number | null
          mortgage_lender_name?: string | null
          mortgage_lender_phone?: string | null
          mortgage_lender_website?: string | null
          mortgage_loan_type?: string | null
          mortgage_monthly_payment?: number | null
          mortgage_payoff_date?: string | null
          municipality_contact?: string | null
          notes?: string | null
          ownership_type?: string | null
          packet_id?: string | null
          property_label?: string
          property_manager_company?: string | null
          property_manager_email?: string | null
          property_manager_name?: string | null
          property_manager_phone?: string | null
          property_tax_account_number?: string | null
          property_type?: string | null
          purchase_price?: number | null
          realtor_agency?: string | null
          realtor_email?: string | null
          realtor_name?: string | null
          realtor_phone?: string | null
          scope?: string | null
          security_account_number?: string | null
          security_company_name?: string | null
          security_monitoring_phone?: string | null
          security_system_details?: string | null
          status?: string | null
          tax_due_date?: string | null
          trash_recycling_account_number?: string | null
          trash_recycling_pickup_day?: string | null
          trash_recycling_provider?: string | null
          umbrella_policy_renewal_date?: string | null
          updated_at?: string | null
          utilities_account_numbers?: Json | null
          water_sewer_account_number?: string | null
          water_sewer_company_name?: string | null
          water_sewer_monthly_estimate?: number | null
          water_sewer_phone?: string | null
          year_purchased?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "real_estate_records_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          brand_color: string | null
          code: string
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          owner_id: string | null
          professional_name: string | null
          stripe_account_id: string | null
        }
        Insert: {
          brand_color?: string | null
          code: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          owner_id?: string | null
          professional_name?: string | null
          stripe_account_id?: string | null
        }
        Update: {
          brand_color?: string | null
          code?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          owner_id?: string | null
          professional_name?: string | null
          stripe_account_id?: string | null
        }
        Relationships: []
      }
      retirement_records: {
        Row: {
          account_number_encrypted: string | null
          account_number_masked: string | null
          account_type: string | null
          approximate_value: number | null
          beneficiary_last_reviewed_date: string | null
          beneficiary_notes: string | null
          category: string | null
          contact_info: string | null
          created_at: string | null
          details: Json
          employer_name: string | null
          id: string
          institution: string | null
          is_na: boolean | null
          legacy_notes: string | null
          loan_balance: number | null
          nickname: string | null
          notes: string | null
          packet_id: string | null
          scope: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          account_number_encrypted?: string | null
          account_number_masked?: string | null
          account_type?: string | null
          approximate_value?: number | null
          beneficiary_last_reviewed_date?: string | null
          beneficiary_notes?: string | null
          category?: string | null
          contact_info?: string | null
          created_at?: string | null
          details?: Json
          employer_name?: string | null
          id?: string
          institution?: string | null
          is_na?: boolean | null
          legacy_notes?: string | null
          loan_balance?: number | null
          nickname?: string | null
          notes?: string | null
          packet_id?: string | null
          scope?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          account_number_encrypted?: string | null
          account_number_masked?: string | null
          account_type?: string | null
          approximate_value?: number | null
          beneficiary_last_reviewed_date?: string | null
          beneficiary_notes?: string | null
          category?: string | null
          contact_info?: string | null
          created_at?: string | null
          details?: Json
          employer_name?: string | null
          id?: string
          institution?: string | null
          is_na?: boolean | null
          legacy_notes?: string | null
          loan_balance?: number | null
          nickname?: string | null
          notes?: string | null
          packet_id?: string | null
          scope?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retirement_records_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      section_completion: {
        Row: {
          id: string
          packet_id: string | null
          percent_complete: number | null
          scope: string | null
          section_key: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          packet_id?: string | null
          percent_complete?: number | null
          scope?: string | null
          section_key?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          packet_id?: string | null
          percent_complete?: number | null
          scope?: string | null
          section_key?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "section_completion_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_contact_access_log: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          packet_id: string
          section_key: string | null
          trusted_contact_id: string | null
          trusted_contact_user_id: string | null
        }
        Insert: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          packet_id: string
          section_key?: string | null
          trusted_contact_id?: string | null
          trusted_contact_user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          packet_id?: string
          section_key?: string | null
          trusted_contact_id?: string | null
          trusted_contact_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trusted_contact_access_log_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trusted_contact_access_log_trusted_contact_id_fkey"
            columns: ["trusted_contact_id"]
            isOneToOne: false
            referencedRelation: "trusted_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_contact_permissions: {
        Row: {
          created_at: string
          id: string
          is_permitted: boolean
          packet_id: string
          section_key: string
          trusted_contact_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_permitted?: boolean
          packet_id: string
          section_key: string
          trusted_contact_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_permitted?: boolean
          packet_id?: string
          section_key?: string
          trusted_contact_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trusted_contact_permissions_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trusted_contact_permissions_trusted_contact_id_fkey"
            columns: ["trusted_contact_id"]
            isOneToOne: false
            referencedRelation: "trusted_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_contacts: {
        Row: {
          access_granted: boolean | null
          access_granted_at: string | null
          access_level: string | null
          access_released: boolean
          access_released_at: string | null
          assigned_sections: string[] | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string | null
          date_of_death: string | null
          id: string
          inactivity_days: number | null
          invite_accepted_at: string | null
          invite_sent_at: string | null
          invite_token: string | null
          is_deceased: boolean
          notes: string | null
          notify_on: string | null
          notify_on_updates: boolean | null
          packet_id: string
          photo_path: string | null
          relationship: string | null
          release_method: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_granted?: boolean | null
          access_granted_at?: string | null
          access_level?: string | null
          access_released?: boolean
          access_released_at?: string | null
          assigned_sections?: string[] | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string | null
          date_of_death?: string | null
          id?: string
          inactivity_days?: number | null
          invite_accepted_at?: string | null
          invite_sent_at?: string | null
          invite_token?: string | null
          is_deceased?: boolean
          notes?: string | null
          notify_on?: string | null
          notify_on_updates?: boolean | null
          packet_id: string
          photo_path?: string | null
          relationship?: string | null
          release_method?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_granted?: boolean | null
          access_granted_at?: string | null
          access_level?: string | null
          access_released?: boolean
          access_released_at?: string | null
          assigned_sections?: string[] | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string | null
          date_of_death?: string | null
          id?: string
          inactivity_days?: number | null
          invite_accepted_at?: string | null
          invite_sent_at?: string | null
          invite_token?: string | null
          is_deceased?: boolean
          notes?: string | null
          notify_on?: string | null
          notify_on_updates?: boolean | null
          packet_id?: string
          photo_path?: string | null
          relationship?: string | null
          release_method?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trusted_contacts_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_template_drafts: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_complete: boolean
          last_saved_at: string
          packet_id: string
          placeholder_values: Json
          share_token: string | null
          share_token_expires_at: string | null
          template_type: string
          template_version: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          is_complete?: boolean
          last_saved_at?: string
          packet_id: string
          placeholder_values?: Json
          share_token?: string | null
          share_token_expires_at?: string | null
          template_type: string
          template_version: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_complete?: boolean
          last_saved_at?: string
          packet_id?: string
          placeholder_values?: Json
          share_token?: string | null
          share_token_expires_at?: string | null
          template_type?: string
          template_version?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicle_photos: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number | null
          file_path: string
          id: string
          is_hero: boolean | null
          packet_id: string
          updated_at: string
          vehicle_record_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          file_path: string
          id?: string
          is_hero?: boolean | null
          packet_id: string
          updated_at?: string
          vehicle_record_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          file_path?: string
          id?: string
          is_hero?: boolean | null
          packet_id?: string
          updated_at?: string
          vehicle_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_photos_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_photos_vehicle_record_id_fkey"
            columns: ["vehicle_record_id"]
            isOneToOne: false
            referencedRelation: "vehicle_records"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_records: {
        Row: {
          agent_contact: string | null
          appraised_value: number | null
          asking_price: number | null
          body_style: string | null
          category: string | null
          condition_notes: string | null
          coverage_type: string | null
          created_at: string | null
          disposition_action: string | null
          disposition_instructions: string | null
          disposition_recipient: string | null
          donation_organization: string | null
          estimated_value: number | null
          exterior_color: string | null
          finance_status: string | null
          garage_opener_code: string | null
          garaging_address: string | null
          has_garage_opener: boolean | null
          id: string
          inspection_due_date: string | null
          insurance: string | null
          insurance_agent_name: string | null
          insurance_agent_phone: string | null
          insurance_provider: string | null
          insurance_renewal_date: string | null
          interest_rate: number | null
          interior_color: string | null
          is_na: boolean | null
          key_fob_notes: string | null
          key_location: string | null
          known_issues: string | null
          last_oil_change_date: string | null
          last_oil_change_mileage: number | null
          last_tire_rotation_date: string | null
          lease_end_date: string | null
          lease_mileage_allowance: number | null
          lease_mileage_overage: number | null
          lease_start_date: string | null
          lease_turnin_notes: string | null
          leasing_company: string | null
          lender_account_number: string | null
          lender_name: string | null
          lender_phone: string | null
          license_plate: string | null
          lien_info: string | null
          loan_payoff_date: string | null
          loan_start_date: string | null
          make: string | null
          mechanic_name: string | null
          mechanic_phone: string | null
          model: string | null
          monthly_payment: number | null
          next_service_due_date: string | null
          next_service_due_mileage: number | null
          notes: string | null
          number_of_keys: number | null
          odometer_reading: number | null
          odometer_recorded_date: string | null
          owner_is_deceased: boolean | null
          ownership_type: string | null
          packet_id: string | null
          parking_location: string | null
          payoff_amount: number | null
          policy_number: string | null
          premium_amount: number | null
          premium_frequency: string | null
          primary_driver: string | null
          purchase_date: string | null
          purchase_price: number | null
          purchased_from: string | null
          registration_expiry_date: string | null
          registration_state: string | null
          remaining_balance: number | null
          roadside_assistance: boolean | null
          roadside_phone: string | null
          scope: string | null
          sentimental_notes: string | null
          service_history_notes: string | null
          state: string | null
          status: string | null
          tire_brand: string | null
          tire_size: string | null
          title_holder_name: string | null
          title_status: string | null
          trim_package: string | null
          updated_at: string | null
          valuation_reference_date: string | null
          vin: string | null
          year: string | null
        }
        Insert: {
          agent_contact?: string | null
          appraised_value?: number | null
          asking_price?: number | null
          body_style?: string | null
          category?: string | null
          condition_notes?: string | null
          coverage_type?: string | null
          created_at?: string | null
          disposition_action?: string | null
          disposition_instructions?: string | null
          disposition_recipient?: string | null
          donation_organization?: string | null
          estimated_value?: number | null
          exterior_color?: string | null
          finance_status?: string | null
          garage_opener_code?: string | null
          garaging_address?: string | null
          has_garage_opener?: boolean | null
          id?: string
          inspection_due_date?: string | null
          insurance?: string | null
          insurance_agent_name?: string | null
          insurance_agent_phone?: string | null
          insurance_provider?: string | null
          insurance_renewal_date?: string | null
          interest_rate?: number | null
          interior_color?: string | null
          is_na?: boolean | null
          key_fob_notes?: string | null
          key_location?: string | null
          known_issues?: string | null
          last_oil_change_date?: string | null
          last_oil_change_mileage?: number | null
          last_tire_rotation_date?: string | null
          lease_end_date?: string | null
          lease_mileage_allowance?: number | null
          lease_mileage_overage?: number | null
          lease_start_date?: string | null
          lease_turnin_notes?: string | null
          leasing_company?: string | null
          lender_account_number?: string | null
          lender_name?: string | null
          lender_phone?: string | null
          license_plate?: string | null
          lien_info?: string | null
          loan_payoff_date?: string | null
          loan_start_date?: string | null
          make?: string | null
          mechanic_name?: string | null
          mechanic_phone?: string | null
          model?: string | null
          monthly_payment?: number | null
          next_service_due_date?: string | null
          next_service_due_mileage?: number | null
          notes?: string | null
          number_of_keys?: number | null
          odometer_reading?: number | null
          odometer_recorded_date?: string | null
          owner_is_deceased?: boolean | null
          ownership_type?: string | null
          packet_id?: string | null
          parking_location?: string | null
          payoff_amount?: number | null
          policy_number?: string | null
          premium_amount?: number | null
          premium_frequency?: string | null
          primary_driver?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          purchased_from?: string | null
          registration_expiry_date?: string | null
          registration_state?: string | null
          remaining_balance?: number | null
          roadside_assistance?: boolean | null
          roadside_phone?: string | null
          scope?: string | null
          sentimental_notes?: string | null
          service_history_notes?: string | null
          state?: string | null
          status?: string | null
          tire_brand?: string | null
          tire_size?: string | null
          title_holder_name?: string | null
          title_status?: string | null
          trim_package?: string | null
          updated_at?: string | null
          valuation_reference_date?: string | null
          vin?: string | null
          year?: string | null
        }
        Update: {
          agent_contact?: string | null
          appraised_value?: number | null
          asking_price?: number | null
          body_style?: string | null
          category?: string | null
          condition_notes?: string | null
          coverage_type?: string | null
          created_at?: string | null
          disposition_action?: string | null
          disposition_instructions?: string | null
          disposition_recipient?: string | null
          donation_organization?: string | null
          estimated_value?: number | null
          exterior_color?: string | null
          finance_status?: string | null
          garage_opener_code?: string | null
          garaging_address?: string | null
          has_garage_opener?: boolean | null
          id?: string
          inspection_due_date?: string | null
          insurance?: string | null
          insurance_agent_name?: string | null
          insurance_agent_phone?: string | null
          insurance_provider?: string | null
          insurance_renewal_date?: string | null
          interest_rate?: number | null
          interior_color?: string | null
          is_na?: boolean | null
          key_fob_notes?: string | null
          key_location?: string | null
          known_issues?: string | null
          last_oil_change_date?: string | null
          last_oil_change_mileage?: number | null
          last_tire_rotation_date?: string | null
          lease_end_date?: string | null
          lease_mileage_allowance?: number | null
          lease_mileage_overage?: number | null
          lease_start_date?: string | null
          lease_turnin_notes?: string | null
          leasing_company?: string | null
          lender_account_number?: string | null
          lender_name?: string | null
          lender_phone?: string | null
          license_plate?: string | null
          lien_info?: string | null
          loan_payoff_date?: string | null
          loan_start_date?: string | null
          make?: string | null
          mechanic_name?: string | null
          mechanic_phone?: string | null
          model?: string | null
          monthly_payment?: number | null
          next_service_due_date?: string | null
          next_service_due_mileage?: number | null
          notes?: string | null
          number_of_keys?: number | null
          odometer_reading?: number | null
          odometer_recorded_date?: string | null
          owner_is_deceased?: boolean | null
          ownership_type?: string | null
          packet_id?: string | null
          parking_location?: string | null
          payoff_amount?: number | null
          policy_number?: string | null
          premium_amount?: number | null
          premium_frequency?: string | null
          primary_driver?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          purchased_from?: string | null
          registration_expiry_date?: string | null
          registration_state?: string | null
          remaining_balance?: number | null
          roadside_assistance?: boolean | null
          roadside_phone?: string | null
          scope?: string | null
          sentimental_notes?: string | null
          service_history_notes?: string | null
          state?: string | null
          status?: string | null
          tire_brand?: string | null
          tire_size?: string | null
          title_holder_name?: string | null
          title_status?: string | null
          trim_package?: string | null
          updated_at?: string | null
          valuation_reference_date?: string | null
          vin?: string | null
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_records_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "packets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      section_records: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          packet_id: string | null
          section_key: string | null
          title: string | null
        }
        Relationships: []
      }
      v_user_feature_tier: {
        Row: {
          created_at: string | null
          feature_tier: string | null
          is_comp: boolean | null
          plan_category: string | null
          plan_key: string | null
          seat_limit: number | null
          status: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      bump_checkin_reminder: {
        Args: { p_event_id: string }
        Returns: undefined
      }
      calculate_estate_summary: { Args: { p_packet_id: string }; Returns: Json }
      calculate_estate_summary_for_viewer: {
        Args: { p_packet_id: string }
        Returns: Json
      }
      calculate_health_score: { Args: { p_packet_id: string }; Returns: Json }
      check_beneficiary_alignment: {
        Args: { p_user_id?: string }
        Returns: Json
      }
      complete_checkin_by_token: {
        Args: { p_token: string }
        Returns: {
          message: string
          next_due: string
          success: boolean
          user_id: string
        }[]
      }
      current_user_role: { Args: never; Returns: string }
      generate_gift_code: { Args: never; Returns: string }
      get_checkin_status: {
        Args: { p_user_id: string }
        Returns: {
          last_checkin_at: string
          next_due_at: string
          status: string
        }[]
      }
      get_combined_family_tree: {
        Args: { p_user_id?: string }
        Returns: {
          birthday: string
          email: string
          id: string
          is_deceased: boolean
          name: string
          owner_side: string
          packet_id: string
          parent_member_id: string
          phone: string
          photo_path: string
          relationship: string
        }[]
      }
      get_couple_link_id: { Args: { p_user_id?: string }; Returns: string }
      get_emergency_pin_hint: { Args: { p_token: string }; Returns: Json }
      get_partner_document_gaps: { Args: { p_user_id?: string }; Returns: Json }
      get_partner_health_score: { Args: { p_user_id?: string }; Returns: Json }
      get_partner_id: { Args: { p_user_id?: string }; Returns: string }
      get_template_draft_by_share_token: {
        Args: { p_token: string }
        Returns: Json
      }
      get_template_for_share: {
        Args: { p_template_type: string; p_version: string }
        Returns: Json
      }
      has_couple_access: {
        Args: {
          p_min_level?: Database["public"]["Enums"]["couple_permission_level"]
          p_owner_user_id: string
          p_section_key: string
        }
        Returns: boolean
      }
      has_trusted_access: {
        Args: { p_packet_id: string; p_section_key: string }
        Returns: boolean
      }
      hash_emergency_pin: { Args: { p_pin: string }; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_member_of_packet_in_path: {
        Args: { file_path: string }
        Returns: boolean
      }
      is_packet_member: { Args: { p_id: string }; Returns: boolean }
      is_professional: { Args: never; Returns: boolean }
      issue_checkin_token: {
        Args: { p_grace_days?: number; p_user_id: string }
        Returns: {
          event_id: string
          expires_at: string
          token: string
        }[]
      }
      log_couple_activity: {
        Args: {
          p_action: Database["public"]["Enums"]["couple_activity_action"]
          p_description?: string
          p_record_id?: string
          p_record_table?: string
          p_section_key?: string
          p_user_id?: string
        }
        Returns: undefined
      }
      manual_check_in: { Args: never; Returns: undefined }
      mark_checkin_triggered: {
        Args: { p_event_id: string }
        Returns: undefined
      }
      mark_couple_review_completed: {
        Args: { p_notes?: string }
        Returns: undefined
      }
      notify_partner: {
        Args: {
          p_body?: string
          p_link_to?: string
          p_notification_type: string
          p_title: string
        }
        Returns: string
      }
      packet_owner: { Args: { p_packet_id: string }; Returns: string }
      partner_can_access_packet_section: {
        Args: {
          p_min_level?: Database["public"]["Enums"]["couple_permission_level"]
          p_packet_id: string
          p_section_key: string
        }
        Returns: boolean
      }
      redeem_gift_code: { Args: { p_code: string }; Returns: Json }
      regenerate_emergency_token: { Args: never; Returns: string }
      run_inactivity_release_sweep: {
        Args: never
        Returns: {
          owner_id: string
          packet_id: string
          released_contact_id: string
        }[]
      }
      seed_default_couple_permissions: {
        Args: { p_link_id: string }
        Returns: undefined
      }
      set_emergency_pin: {
        Args: { p_hint?: string; p_pin: string }
        Returns: undefined
      }
      touch_last_login: { Args: never; Returns: undefined }
      upsert_document_alert: {
        Args: {
          p_document_name: string
          p_document_type: string
          p_expiry_date: string
          p_packet_id: string
          p_record_id: string
          p_related_table: string
          p_section_key: string
        }
        Returns: undefined
      }
      validate_referral_code: {
        Args: { code_input: string }
        Returns: {
          brand_color: string
          is_valid: boolean
          logo_url: string
          professional_name: string
        }[]
      }
      verify_emergency_pin: {
        Args: {
          p_browser?: string
          p_city?: string
          p_country?: string
          p_device_type?: string
          p_ip?: string
          p_pin: string
          p_region?: string
          p_token: string
          p_user_agent?: string
        }
        Returns: Json
      }
      viewer_permitted_sections: {
        Args: { p_packet_id: string }
        Returns: string[]
      }
      viewer_released_packet_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      couple_activity_action:
        | "added"
        | "edited"
        | "deleted"
        | "uploaded"
        | "permission_changed"
        | "linked"
        | "unlinked"
      couple_link_status: "pending" | "active" | "unlinked"
      couple_permission_level: "hidden" | "view" | "collaborate"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      couple_activity_action: [
        "added",
        "edited",
        "deleted",
        "uploaded",
        "permission_changed",
        "linked",
        "unlinked",
      ],
      couple_link_status: ["pending", "active", "unlinked"],
      couple_permission_level: ["hidden", "view", "collaborate"],
    },
  },
} as const
