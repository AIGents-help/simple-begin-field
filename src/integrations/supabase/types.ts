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
      advisor_records: {
        Row: {
          address: string | null
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
          scope: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
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
          scope?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
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
          category: string | null
          contact_info: string | null
          created_at: string | null
          id: string
          institution: string
          is_na: boolean | null
          notes: string | null
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
          category?: string | null
          contact_info?: string | null
          created_at?: string | null
          id?: string
          institution: string
          is_na?: boolean | null
          notes?: string | null
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
          category?: string | null
          contact_info?: string | null
          created_at?: string | null
          id?: string
          institution?: string
          is_na?: boolean | null
          notes?: string | null
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
          created_at: string | null
          email: string | null
          id: string
          is_na: boolean | null
          name: string
          packet_id: string | null
          phone: string | null
          relationship: string | null
          reminder_notes: string | null
          scope: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          birthday?: string | null
          category?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_na?: boolean | null
          name: string
          packet_id?: string | null
          phone?: string | null
          relationship?: string | null
          reminder_notes?: string | null
          scope?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          birthday?: string | null
          category?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_na?: boolean | null
          name?: string
          packet_id?: string | null
          phone?: string | null
          relationship?: string | null
          reminder_notes?: string | null
          scope?: string | null
          status?: string | null
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
        ]
      }
      funeral_records: {
        Row: {
          additional_instructions: string | null
          burial_or_cremation: string | null
          category: string | null
          cemetery_plot_details: string | null
          created_at: string | null
          funeral_director: string | null
          funeral_home: string | null
          id: string
          is_na: boolean | null
          notes: string | null
          obituary_notes: string | null
          packet_id: string | null
          prepaid_arrangements: string | null
          religious_cultural_preferences: string | null
          scope: string | null
          service_preferences: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          additional_instructions?: string | null
          burial_or_cremation?: string | null
          category?: string | null
          cemetery_plot_details?: string | null
          created_at?: string | null
          funeral_director?: string | null
          funeral_home?: string | null
          id?: string
          is_na?: boolean | null
          notes?: string | null
          obituary_notes?: string | null
          packet_id?: string | null
          prepaid_arrangements?: string | null
          religious_cultural_preferences?: string | null
          scope?: string | null
          service_preferences?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          additional_instructions?: string | null
          burial_or_cremation?: string | null
          category?: string | null
          cemetery_plot_details?: string | null
          created_at?: string | null
          funeral_director?: string | null
          funeral_home?: string | null
          id?: string
          is_na?: boolean | null
          notes?: string | null
          obituary_notes?: string | null
          packet_id?: string | null
          prepaid_arrangements?: string | null
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
      medical_records: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_na: boolean | null
          notes: string | null
          packet_id: string | null
          phone: string | null
          provider_name: string
          scope: string | null
          specialty: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_na?: boolean | null
          notes?: string | null
          packet_id?: string | null
          phone?: string | null
          provider_name: string
          scope?: string | null
          specialty?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_na?: boolean | null
          notes?: string | null
          packet_id?: string | null
          phone?: string | null
          provider_name?: string
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
      personal_property_records: {
        Row: {
          beneficiary: string | null
          category: string | null
          created_at: string | null
          description: string | null
          estimated_value: number | null
          id: string
          is_na: boolean | null
          item_name: string | null
          location: string | null
          notes: string | null
          packet_id: string | null
          scope: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          beneficiary?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          is_na?: boolean | null
          item_name?: string | null
          location?: string | null
          notes?: string | null
          packet_id?: string | null
          scope?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          beneficiary?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          is_na?: boolean | null
          item_name?: string | null
          location?: string | null
          notes?: string | null
          packet_id?: string | null
          scope?: string | null
          status?: string | null
          updated_at?: string | null
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
      pet_records: {
        Row: {
          age: string | null
          care_instructions: string | null
          category: string | null
          created_at: string | null
          emergency_notes: string | null
          feeding_instructions: string | null
          id: string
          is_na: boolean | null
          medications: string | null
          microchip_info: string | null
          packet_id: string | null
          pet_name: string | null
          scope: string | null
          species_breed: string | null
          status: string | null
          updated_at: string | null
          veterinarian_contact: string | null
        }
        Insert: {
          age?: string | null
          care_instructions?: string | null
          category?: string | null
          created_at?: string | null
          emergency_notes?: string | null
          feeding_instructions?: string | null
          id?: string
          is_na?: boolean | null
          medications?: string | null
          microchip_info?: string | null
          packet_id?: string | null
          pet_name?: string | null
          scope?: string | null
          species_breed?: string | null
          status?: string | null
          updated_at?: string | null
          veterinarian_contact?: string | null
        }
        Update: {
          age?: string | null
          care_instructions?: string | null
          category?: string | null
          created_at?: string | null
          emergency_notes?: string | null
          feeding_instructions?: string | null
          id?: string
          is_na?: boolean | null
          medications?: string | null
          microchip_info?: string | null
          packet_id?: string | null
          pet_name?: string | null
          scope?: string | null
          species_breed?: string | null
          status?: string | null
          updated_at?: string | null
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
          consent_timestamp: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          legal_version_accepted: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          affiliate_id?: string | null
          consent_timestamp?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          legal_version_accepted?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          affiliate_id?: string | null
          consent_timestamp?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
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
      purchases: {
        Row: {
          affiliate_code_used: string | null
          affiliate_referral_id: string | null
          billing_type: string | null
          created_at: string | null
          current_period_end: string | null
          id: string
          packet_id: string | null
          pricing_plan_id: string | null
          status: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          affiliate_code_used?: string | null
          affiliate_referral_id?: string | null
          billing_type?: string | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          packet_id?: string | null
          pricing_plan_id?: string | null
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          affiliate_code_used?: string | null
          affiliate_referral_id?: string | null
          billing_type?: string | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          packet_id?: string | null
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
          category: string | null
          created_at: string | null
          id: string
          insurance_details: string | null
          is_na: boolean | null
          notes: string | null
          packet_id: string | null
          property_label: string
          scope: string | null
          security_system_details: string | null
          status: string | null
          updated_at: string | null
          utilities_account_numbers: Json | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          insurance_details?: string | null
          is_na?: boolean | null
          notes?: string | null
          packet_id?: string | null
          property_label: string
          scope?: string | null
          security_system_details?: string | null
          status?: string | null
          updated_at?: string | null
          utilities_account_numbers?: Json | null
        }
        Update: {
          address?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          insurance_details?: string | null
          is_na?: boolean | null
          notes?: string | null
          packet_id?: string | null
          property_label?: string
          scope?: string | null
          security_system_details?: string | null
          status?: string | null
          updated_at?: string | null
          utilities_account_numbers?: Json | null
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
      vehicle_records: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          insurance: string | null
          is_na: boolean | null
          license_plate: string | null
          lien_info: string | null
          make: string | null
          model: string | null
          notes: string | null
          packet_id: string | null
          scope: string | null
          status: string | null
          updated_at: string | null
          vin: string | null
          year: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          insurance?: string | null
          is_na?: boolean | null
          license_plate?: string | null
          lien_info?: string | null
          make?: string | null
          model?: string | null
          notes?: string | null
          packet_id?: string | null
          scope?: string | null
          status?: string | null
          updated_at?: string | null
          vin?: string | null
          year?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          insurance?: string | null
          is_na?: boolean | null
          license_plate?: string | null
          lien_info?: string | null
          make?: string | null
          model?: string | null
          notes?: string | null
          packet_id?: string | null
          scope?: string | null
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
