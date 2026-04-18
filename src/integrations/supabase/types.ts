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
          category: string | null
          created_at: string | null
          email: string | null
          firm: string | null
          id: string
          is_na: boolean | null
          name: string | null
          notes: string | null
          packet_id: string | null
          phone: string | null
          photo_path: string | null
          scope: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          advisor_status?: string
          advisor_type?: string | null
          category?: string | null
          created_at?: string | null
          email?: string | null
          firm?: string | null
          id?: string
          is_na?: boolean | null
          name?: string | null
          notes?: string | null
          packet_id?: string | null
          phone?: string | null
          photo_path?: string | null
          scope?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          advisor_status?: string
          advisor_type?: string | null
          category?: string | null
          created_at?: string | null
          email?: string | null
          firm?: string | null
          id?: string
          is_na?: boolean | null
          name?: string | null
          notes?: string | null
          packet_id?: string | null
          phone?: string | null
          photo_path?: string | null
          scope?: string | null
          status?: string | null
          updated_at?: string | null
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
      banking_records: {
        Row: {
          account_number_encrypted: string | null
          account_number_masked: string | null
          account_type: string | null
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
      family_members: {
        Row: {
          address: string | null
          birthday: string | null
          category: string | null
          cause_of_death: string | null
          created_at: string | null
          date_of_death: string | null
          divorce_attorney: string | null
          divorce_finalized_date: string | null
          divorce_jurisdiction: string | null
          divorce_settlement_notes: string | null
          email: string | null
          employer: string | null
          first_name: string | null
          id: string
          is_deceased: boolean
          is_na: boolean | null
          last_name: string | null
          marital_status: string | null
          marriage_certificate_on_file: boolean | null
          marriage_date: string | null
          marriage_place: string | null
          middle_name: string | null
          name: string
          occupation: string | null
          packet_id: string | null
          parent_member_id: string | null
          phone: string | null
          photo_path: string | null
          place_of_birth: string | null
          place_of_death: string | null
          preferred_name: string | null
          relationship: string | null
          reminder_notes: string | null
          scope: string | null
          separation_date: string | null
          ssn_encrypted: string | null
          ssn_masked: string | null
          status: string | null
          suffix: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          birthday?: string | null
          category?: string | null
          cause_of_death?: string | null
          created_at?: string | null
          date_of_death?: string | null
          divorce_attorney?: string | null
          divorce_finalized_date?: string | null
          divorce_jurisdiction?: string | null
          divorce_settlement_notes?: string | null
          email?: string | null
          employer?: string | null
          first_name?: string | null
          id?: string
          is_deceased?: boolean
          is_na?: boolean | null
          last_name?: string | null
          marital_status?: string | null
          marriage_certificate_on_file?: boolean | null
          marriage_date?: string | null
          marriage_place?: string | null
          middle_name?: string | null
          name: string
          occupation?: string | null
          packet_id?: string | null
          parent_member_id?: string | null
          phone?: string | null
          photo_path?: string | null
          place_of_birth?: string | null
          place_of_death?: string | null
          preferred_name?: string | null
          relationship?: string | null
          reminder_notes?: string | null
          scope?: string | null
          separation_date?: string | null
          ssn_encrypted?: string | null
          ssn_masked?: string | null
          status?: string | null
          suffix?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          birthday?: string | null
          category?: string | null
          cause_of_death?: string | null
          created_at?: string | null
          date_of_death?: string | null
          divorce_attorney?: string | null
          divorce_finalized_date?: string | null
          divorce_jurisdiction?: string | null
          divorce_settlement_notes?: string | null
          email?: string | null
          employer?: string | null
          first_name?: string | null
          id?: string
          is_deceased?: boolean
          is_na?: boolean | null
          last_name?: string | null
          marital_status?: string | null
          marriage_certificate_on_file?: boolean | null
          marriage_date?: string | null
          marriage_place?: string | null
          middle_name?: string | null
          name?: string
          occupation?: string | null
          packet_id?: string | null
          parent_member_id?: string | null
          phone?: string | null
          photo_path?: string | null
          place_of_birth?: string | null
          place_of_death?: string | null
          preferred_name?: string | null
          relationship?: string | null
          reminder_notes?: string | null
          scope?: string | null
          separation_date?: string | null
          ssn_encrypted?: string | null
          ssn_masked?: string | null
          status?: string | null
          suffix?: string | null
          updated_at?: string | null
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
        ]
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
      info_records: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
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
          attorney_firm: string | null
          attorney_name: string | null
          attorney_phone: string | null
          category: string | null
          created_at: string
          document_date: string | null
          document_type: string
          id: string
          is_na: boolean | null
          notes: string | null
          original_location: string | null
          packet_id: string
          scope: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          attorney_firm?: string | null
          attorney_name?: string | null
          attorney_phone?: string | null
          category?: string | null
          created_at?: string
          document_date?: string | null
          document_type: string
          id?: string
          is_na?: boolean | null
          notes?: string | null
          original_location?: string | null
          packet_id: string
          scope?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          attorney_firm?: string | null
          attorney_name?: string | null
          attorney_phone?: string | null
          category?: string | null
          created_at?: string
          document_date?: string | null
          document_type?: string
          id?: string
          is_na?: boolean | null
          notes?: string | null
          original_location?: string | null
          packet_id?: string
          scope?: string | null
          status?: string | null
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
          category: string | null
          created_at: string | null
          group_number: string | null
          id: string
          insurance_provider: string | null
          is_na: boolean | null
          member_id: string | null
          notes: string | null
          packet_id: string | null
          phone: string | null
          provider_name: string
          referring_physician: string | null
          scope: string | null
          specialty: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          created_at?: string | null
          group_number?: string | null
          id?: string
          insurance_provider?: string | null
          is_na?: boolean | null
          member_id?: string | null
          notes?: string | null
          packet_id?: string | null
          phone?: string | null
          provider_name: string
          referring_physician?: string | null
          scope?: string | null
          specialty?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          created_at?: string | null
          group_number?: string | null
          id?: string
          insurance_provider?: string | null
          is_na?: boolean | null
          member_id?: string | null
          notes?: string | null
          packet_id?: string | null
          phone?: string | null
          provider_name?: string
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
          created_at: string
          dose: string | null
          frequency: string | null
          id: string
          is_na: boolean | null
          name: string
          notes: string | null
          packet_id: string
          pharmacy: string | null
          prescribing_doctor: string | null
          scope: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dose?: string | null
          frequency?: string | null
          id?: string
          is_na?: boolean | null
          name: string
          notes?: string | null
          packet_id: string
          pharmacy?: string | null
          prescribing_doctor?: string | null
          scope?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dose?: string | null
          frequency?: string | null
          id?: string
          is_na?: boolean | null
          name?: string
          notes?: string | null
          packet_id?: string
          pharmacy?: string | null
          prescribing_doctor?: string | null
          scope?: string | null
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
          category: string | null
          created_at: string | null
          id: string
          is_na: boolean | null
          notes: string | null
          packet_id: string | null
          password_encrypted: string | null
          password_masked: string | null
          recovery_email: string | null
          requires_reauth: boolean | null
          scope: string | null
          service_name: string
          status: string | null
          two_fa_notes: string | null
          updated_at: string | null
          username: string | null
          who_should_access: string | null
        }
        Insert: {
          access_instructions?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_na?: boolean | null
          notes?: string | null
          packet_id?: string | null
          password_encrypted?: string | null
          password_masked?: string | null
          recovery_email?: string | null
          requires_reauth?: boolean | null
          scope?: string | null
          service_name: string
          status?: string | null
          two_fa_notes?: string | null
          updated_at?: string | null
          username?: string | null
          who_should_access?: string | null
        }
        Update: {
          access_instructions?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_na?: boolean | null
          notes?: string | null
          packet_id?: string | null
          password_encrypted?: string | null
          password_masked?: string | null
          recovery_email?: string | null
          requires_reauth?: boolean | null
          scope?: string | null
          service_name?: string
          status?: string | null
          two_fa_notes?: string | null
          updated_at?: string | null
          username?: string | null
          who_should_access?: string | null
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
          household_mode: string | null
          id: string
          is_active: boolean | null
          name: string
          plan_key: string
          price_cents: number
          stripe_price_id: string | null
          stripe_product_id: string | null
        }
        Insert: {
          billing_type?: string | null
          created_at?: string | null
          description?: string | null
          household_mode?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          plan_key: string
          price_cents: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
        }
        Update: {
          billing_type?: string | null
          created_at?: string | null
          description?: string | null
          household_mode?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          plan_key?: string
          price_cents?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
        }
        Relationships: []
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
          checkin_frequency: string | null
          checkin_opted_out: boolean | null
          consent_timestamp: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          last_checkin_acknowledged_at: string | null
          last_checkin_sent_at: string | null
          legal_version_accepted: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          affiliate_id?: string | null
          checkin_frequency?: string | null
          checkin_opted_out?: boolean | null
          consent_timestamp?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          last_checkin_acknowledged_at?: string | null
          last_checkin_sent_at?: string | null
          legal_version_accepted?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          affiliate_id?: string | null
          checkin_frequency?: string | null
          checkin_opted_out?: boolean | null
          consent_timestamp?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_checkin_acknowledged_at?: string | null
          last_checkin_sent_at?: string | null
          legal_version_accepted?: string | null
          role?: string | null
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
          beneficiary_notes: string | null
          category: string | null
          contact_info: string | null
          created_at: string | null
          id: string
          institution: string | null
          is_na: boolean | null
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
          beneficiary_notes?: string | null
          category?: string | null
          contact_info?: string | null
          created_at?: string | null
          id?: string
          institution?: string | null
          is_na?: boolean | null
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
          beneficiary_notes?: string | null
          category?: string | null
          contact_info?: string | null
          created_at?: string | null
          id?: string
          institution?: string | null
          is_na?: boolean | null
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
      trusted_contacts: {
        Row: {
          access_granted: boolean | null
          access_granted_at: string | null
          access_level: string | null
          assigned_sections: string[] | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string | null
          date_of_death: string | null
          id: string
          invite_sent_at: string | null
          invite_token: string | null
          is_deceased: boolean
          notes: string | null
          notify_on: string | null
          notify_on_updates: boolean | null
          packet_id: string
          photo_path: string | null
          relationship: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_granted?: boolean | null
          access_granted_at?: string | null
          access_level?: string | null
          assigned_sections?: string[] | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string | null
          date_of_death?: string | null
          id?: string
          invite_sent_at?: string | null
          invite_token?: string | null
          is_deceased?: boolean
          notes?: string | null
          notify_on?: string | null
          notify_on_updates?: boolean | null
          packet_id: string
          photo_path?: string | null
          relationship?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_granted?: boolean | null
          access_granted_at?: string | null
          access_level?: string | null
          assigned_sections?: string[] | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string | null
          date_of_death?: string | null
          id?: string
          invite_sent_at?: string | null
          invite_token?: string | null
          is_deceased?: boolean
          notes?: string | null
          notify_on?: string | null
          notify_on_updates?: boolean | null
          packet_id?: string
          photo_path?: string | null
          relationship?: string | null
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
      vehicle_records: {
        Row: {
          agent_contact: string | null
          category: string | null
          created_at: string | null
          garaging_address: string | null
          id: string
          insurance: string | null
          is_na: boolean | null
          lender_name: string | null
          license_plate: string | null
          lien_info: string | null
          make: string | null
          model: string | null
          monthly_payment: number | null
          notes: string | null
          packet_id: string | null
          payoff_amount: number | null
          policy_number: string | null
          scope: string | null
          state: string | null
          status: string | null
          updated_at: string | null
          vin: string | null
          year: string | null
        }
        Insert: {
          agent_contact?: string | null
          category?: string | null
          created_at?: string | null
          garaging_address?: string | null
          id?: string
          insurance?: string | null
          is_na?: boolean | null
          lender_name?: string | null
          license_plate?: string | null
          lien_info?: string | null
          make?: string | null
          model?: string | null
          monthly_payment?: number | null
          notes?: string | null
          packet_id?: string | null
          payoff_amount?: number | null
          policy_number?: string | null
          scope?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          vin?: string | null
          year?: string | null
        }
        Update: {
          agent_contact?: string | null
          category?: string | null
          created_at?: string | null
          garaging_address?: string | null
          id?: string
          insurance?: string | null
          is_na?: boolean | null
          lender_name?: string | null
          license_plate?: string | null
          lien_info?: string | null
          make?: string | null
          model?: string | null
          monthly_payment?: number | null
          notes?: string | null
          packet_id?: string | null
          payoff_amount?: number | null
          policy_number?: string | null
          scope?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
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
    }
    Functions: {
      current_user_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_member_of_packet_in_path: {
        Args: { file_path: string }
        Returns: boolean
      }
      is_packet_member: { Args: { p_id: string }; Returns: boolean }
      is_professional: { Args: never; Returns: boolean }
      validate_referral_code: {
        Args: { code_input: string }
        Returns: {
          brand_color: string
          is_valid: boolean
          logo_url: string
          professional_name: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
