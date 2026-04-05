export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          role: 'customer' | 'admin' | 'professional' | null
          affiliate_id: string | null
          consent_timestamp: string | null
          legal_version_accepted: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          role?: 'customer' | 'admin' | 'professional' | null
          affiliate_id?: string | null
          consent_timestamp?: string | null
          legal_version_accepted?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string | null
          role?: 'customer' | 'admin' | 'professional' | null
          affiliate_id?: string | null
          consent_timestamp?: string | null
          legal_version_accepted?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      packets: {
        Row: {
          id: string
          owner_user_id: string | null
          household_mode: 'single' | 'couple'
          title: string | null
          person_a_name: string | null
          person_b_name: string | null
          created_at: string
          updated_at: string
          affiliate_code: string | null
          affiliate_referrer_id: string | null
          last_opened_at: string | null
        }
        Insert: {
          id?: string
          owner_user_id?: string | null
          household_mode: 'single' | 'couple'
          title?: string | null
          person_a_name?: string | null
          person_b_name?: string | null
          created_at?: string
          updated_at?: string
          affiliate_code?: string | null
          affiliate_referrer_id?: string | null
          last_opened_at?: string | null
        }
        Update: {
          id?: string
          owner_user_id?: string | null
          household_mode?: 'single' | 'couple'
          title?: string | null
          person_a_name?: string | null
          person_b_name?: string | null
          created_at?: string
          updated_at?: string
          affiliate_code?: string | null
          affiliate_referrer_id?: string | null
          last_opened_at?: string | null
        }
      }
      packet_members: {
        Row: {
          id: string
          packet_id: string | null
          user_id: string | null
          role: 'owner' | 'partner' | 'viewer' | 'editor' | null
          household_scope: 'personA' | 'personB' | 'shared' | 'full' | null
          created_at: string
        }
        Insert: {
          id?: string
          packet_id?: string | null
          user_id?: string | null
          role?: 'owner' | 'partner' | 'viewer' | 'editor' | null
          household_scope?: 'personA' | 'personB' | 'shared' | 'full' | null
          created_at?: string
        }
        Update: {
          id?: string
          packet_id?: string | null
          user_id?: string | null
          role?: 'owner' | 'partner' | 'viewer' | 'editor' | null
          household_scope?: 'personA' | 'personB' | 'shared' | 'full' | null
          created_at?: string
        }
      }
      packet_invites: {
        Row: {
          id: string
          packet_id: string
          invited_email: string
          invited_name: string | null
          invited_by_user_id: string
          token: string
          expires_at: string
          role: string | null
          household_scope: string | null
          status: 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked' | null
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          packet_id: string
          invited_email: string
          invited_name?: string | null
          invited_by_user_id: string
          token: string
          expires_at: string
          role?: string | null
          household_scope?: string | null
          status?: 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked' | null
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          packet_id?: string
          invited_email?: string
          invited_name?: string | null
          invited_by_user_id?: string
          token?: string
          expires_at?: string
          role?: string | null
          household_scope?: string | null
          status?: 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked' | null
          accepted_at?: string | null
          created_at?: string
        }
      }
      section_completion: {
        Row: {
          id: string
          packet_id: string | null
          section_key: string | null
          scope: 'personA' | 'personB' | 'shared' | null
          status: 'empty' | 'in_progress' | 'complete' | 'not_applicable' | null
          percent_complete: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          packet_id?: string | null
          section_key?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          status?: 'empty' | 'in_progress' | 'complete' | 'not_applicable' | null
          percent_complete?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          packet_id?: string | null
          section_key?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          status?: 'empty' | 'in_progress' | 'complete' | 'not_applicable' | null
          percent_complete?: number | null
          updated_at?: string
        }
      }
      family_members: {
        Row: {
          id: string
          packet_id: string | null
          scope: 'personA' | 'personB' | 'shared' | null
          name: string
          address: string | null
          relationship: string | null
          phone: string | null
          email: string | null
          birthday: string | null
          reminder_notes: string | null
          status: 'empty' | 'completed' | 'not_applicable'
          is_na: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          name: string
          address?: string | null
          relationship?: string | null
          phone?: string | null
          email?: string | null
          birthday?: string | null
          reminder_notes?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          name?: string
          address?: string | null
          relationship?: string | null
          phone?: string | null
          email?: string | null
          birthday?: string | null
          reminder_notes?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      real_estate_records: {
        Row: {
          id: string
          packet_id: string | null
          scope: 'personA' | 'personB' | 'shared' | null
          property_label: string
          address: string | null
          utilities_account_numbers: Json | null
          insurance_details: string | null
          security_system_details: string | null
          notes: string | null
          status: 'empty' | 'completed' | 'not_applicable'
          is_na: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          property_label: string
          address?: string | null
          utilities_account_numbers?: Json | null
          insurance_details?: string | null
          security_system_details?: string | null
          notes?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          property_label?: string
          address?: string | null
          utilities_account_numbers?: Json | null
          insurance_details?: string | null
          security_system_details?: string | null
          notes?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      banking_records: {
        Row: {
          id: string
          packet_id: string | null
          scope: 'personA' | 'personB' | 'shared' | null
          institution: string
          account_type: string | null
          account_number_encrypted: string | null
          account_number_masked: string | null
          routing_number_encrypted: string | null
          routing_number_masked: string | null
          contact_info: string | null
          notes: string | null
          status: 'empty' | 'completed' | 'not_applicable'
          is_na: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          institution: string
          account_type?: string | null
          account_number_encrypted?: string | null
          account_number_masked?: string | null
          routing_number_encrypted?: string | null
          routing_number_masked?: string | null
          contact_info?: string | null
          notes?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          institution?: string
          account_type?: string | null
          account_number_encrypted?: string | null
          account_number_masked?: string | null
          routing_number_encrypted?: string | null
          routing_number_masked?: string | null
          contact_info?: string | null
          notes?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      retirement_records: {
        Row: {
          id: string
          packet_id: string | null
          scope: 'personA' | 'personB' | 'shared' | null
          account_type: string | null
          institution: string | null
          account_number_encrypted: string | null
          account_number_masked: string | null
          beneficiary_notes: string | null
          contact_info: string | null
          notes: string | null
          status: 'empty' | 'completed' | 'not_applicable'
          is_na: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          account_type?: string | null
          institution?: string | null
          account_number_encrypted?: string | null
          account_number_masked?: string | null
          beneficiary_notes?: string | null
          contact_info?: string | null
          notes?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          account_type?: string | null
          institution?: string | null
          account_number_encrypted?: string | null
          account_number_masked?: string | null
          beneficiary_notes?: string | null
          contact_info?: string | null
          notes?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      vehicle_records: {
        Row: {
          id: string
          packet_id: string | null
          scope: 'personA' | 'personB' | 'shared' | null
          year: string | null
          make: string | null
          model: string | null
          vin: string | null
          license_plate: string | null
          insurance: string | null
          lien_info: string | null
          notes: string | null
          status: 'empty' | 'completed' | 'not_applicable'
          is_na: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          year?: string | null
          make?: string | null
          model?: string | null
          vin?: string | null
          license_plate?: string | null
          insurance?: string | null
          lien_info?: string | null
          notes?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          year?: string | null
          make?: string | null
          model?: string | null
          vin?: string | null
          license_plate?: string | null
          insurance?: string | null
          lien_info?: string | null
          notes?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      advisor_records: {
        Row: {
          id: string
          packet_id: string | null
          scope: 'personA' | 'personB' | 'shared' | null
          advisor_type: string | null
          name: string | null
          firm: string | null
          address: string | null
          phone: string | null
          email: string | null
          notes: string | null
          status: 'empty' | 'completed' | 'not_applicable'
          is_na: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          advisor_type?: string | null
          name?: string | null
          firm?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          notes?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          advisor_type?: string | null
          name?: string | null
          firm?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          notes?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      password_records: {
        Row: {
          id: string
          packet_id: string | null
          scope: 'personA' | 'personB' | 'shared' | null
          service_name: string
          username: string | null
          password_encrypted: string | null
          password_masked: string | null
          recovery_email: string | null
          two_fa_notes: string | null
          access_instructions: string | null
          who_should_access: string | null
          notes: string | null
          requires_reauth: boolean | null
          status: 'empty' | 'completed' | 'not_applicable'
          is_na: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          service_name: string
          username?: string | null
          password_encrypted?: string | null
          password_masked?: string | null
          recovery_email?: string | null
          two_fa_notes?: string | null
          access_instructions?: string | null
          who_should_access?: string | null
          notes?: string | null
          requires_reauth?: boolean | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          service_name?: string
          username?: string | null
          password_encrypted?: string | null
          password_masked?: string | null
          recovery_email?: string | null
          two_fa_notes?: string | null
          access_instructions?: string | null
          who_should_access?: string | null
          notes?: string | null
          requires_reauth?: boolean | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      personal_property_records: {
        Row: {
          id: string
          packet_id: string | null
          scope: 'personA' | 'personB' | 'shared' | null
          item_name: string | null
          description: string | null
          estimated_value: number | null
          location: string | null
          beneficiary: string | null
          notes: string | null
          status: 'empty' | 'completed' | 'not_applicable'
          is_na: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          item_name?: string | null
          description?: string | null
          estimated_value?: number | null
          location?: string | null
          beneficiary?: string | null
          notes?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          item_name?: string | null
          description?: string | null
          estimated_value?: number | null
          location?: string | null
          beneficiary?: string | null
          notes?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      pet_records: {
        Row: {
          id: string
          packet_id: string | null
          scope: 'personA' | 'personB' | 'shared' | null
          pet_name: string | null
          species_breed: string | null
          age: string | null
          veterinarian_contact: string | null
          medications: string | null
          feeding_instructions: string | null
          care_instructions: string | null
          emergency_notes: string | null
          microchip_info: string | null
          status: 'empty' | 'completed' | 'not_applicable'
          is_na: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          pet_name?: string | null
          species_breed?: string | null
          age?: string | null
          veterinarian_contact?: string | null
          medications?: string | null
          feeding_instructions?: string | null
          care_instructions?: string | null
          emergency_notes?: string | null
          microchip_info?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          pet_name?: string | null
          species_breed?: string | null
          age?: string | null
          veterinarian_contact?: string | null
          medications?: string | null
          feeding_instructions?: string | null
          care_instructions?: string | null
          emergency_notes?: string | null
          microchip_info?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      funeral_records: {
        Row: {
          id: string
          packet_id: string | null
          scope: 'personA' | 'personB' | 'shared' | null
          funeral_home: string | null
          funeral_director: string | null
          burial_or_cremation: string | null
          service_preferences: string | null
          religious_cultural_preferences: string | null
          obituary_notes: string | null
          additional_instructions: string | null
          cemetery_plot_details: string | null
          prepaid_arrangements: string | null
          notes: string | null
          status: 'empty' | 'completed' | 'not_applicable'
          is_na: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          funeral_home?: string | null
          funeral_director?: string | null
          burial_or_cremation?: string | null
          service_preferences?: string | null
          religious_cultural_preferences?: string | null
          obituary_notes?: string | null
          additional_instructions?: string | null
          cemetery_plot_details?: string | null
          prepaid_arrangements?: string | null
          notes?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          funeral_home?: string | null
          funeral_director?: string | null
          burial_or_cremation?: string | null
          service_preferences?: string | null
          religious_cultural_preferences?: string | null
          obituary_notes?: string | null
          additional_instructions?: string | null
          cemetery_plot_details?: string | null
          prepaid_arrangements?: string | null
          notes?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      private_items: {
        Row: {
          id: string
          packet_id: string | null
          scope: 'personA' | 'personB' | 'shared' | null
          title: string
          description: string | null
          visibility: 'only_me' | 'me_and_partner' | 'release_later' | null
          owner_user_id: string | null
          is_locked: boolean | null
          notes: string | null
          status: 'empty' | 'completed' | 'not_applicable'
          is_na: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          title: string
          description?: string | null
          visibility?: 'only_me' | 'me_and_partner' | 'release_later' | null
          owner_user_id?: string | null
          is_locked?: boolean | null
          notes?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          title?: string
          description?: string | null
          visibility?: 'only_me' | 'me_and_partner' | 'release_later' | null
          owner_user_id?: string | null
          is_locked?: boolean | null
          notes?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      info_records: {
        Row: {
          id: string
          packet_id: string | null
          scope: 'personA' | 'personB' | 'shared' | null
          category: string
          title: string
          notes: string | null
          created_by: string | null
          status: 'empty' | 'completed' | 'not_applicable'
          is_na: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          category: string
          title: string
          notes?: string | null
          created_by?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          category?: string
          title?: string
          notes?: string | null
          created_by?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          packet_id: string | null
          related_table: string | null
          related_record_id: string | null
          scope: 'personA' | 'personB' | 'shared' | null
          section_key: string | null
          category: string | null
          file_name: string | null
          file_path: string
          mime_type: string | null
          file_size: number | null
          uploaded_by: string | null
          is_private: boolean | null
          status: 'empty' | 'completed' | 'not_applicable'
          is_na: boolean
          created_at: string
        }
        Insert: {
          id?: string
          packet_id?: string | null
          related_table?: string | null
          related_record_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          section_key?: string | null
          category?: string | null
          file_name?: string | null
          file_path: string
          mime_type?: string | null
          file_size?: number | null
          uploaded_by?: string | null
          is_private?: boolean | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          packet_id?: string | null
          related_table?: string | null
          related_record_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          section_key?: string | null
          category?: string | null
          file_name?: string | null
          file_path?: string
          mime_type?: string | null
          file_size?: number | null
          uploaded_by?: string | null
          is_private?: boolean | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
        }
      }
      medical_records: {
        Row: {
          id: string
          packet_id: string | null
          scope: 'personA' | 'personB' | 'shared' | null
          provider_name: string
          specialty: string | null
          phone: string | null
          notes: string | null
          status: 'empty' | 'completed' | 'not_applicable'
          is_na: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          provider_name: string
          specialty?: string | null
          phone?: string | null
          notes?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          packet_id?: string | null
          scope?: 'personA' | 'personB' | 'shared' | null
          provider_name?: string
          specialty?: string | null
          phone?: string | null
          notes?: string | null
          status?: 'empty' | 'completed' | 'not_applicable'
          is_na?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      affiliate_referrals: {
        Row: {
          id: string
          affiliate_code: string
          affiliate_name: string | null
          affiliate_email: string | null
          affiliate_type: string | null
          payout_type: 'percent' | 'flat' | null
          payout_value: number | null
          customer_discount_type: 'percent' | 'flat' | null
          customer_discount_value: number | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          affiliate_code: string
          affiliate_name?: string | null
          affiliate_email?: string | null
          affiliate_type?: string | null
          payout_type?: 'percent' | 'flat' | null
          payout_value?: number | null
          customer_discount_type?: 'percent' | 'flat' | null
          customer_discount_value?: number | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          affiliate_code?: string
          affiliate_name?: string | null
          affiliate_email?: string | null
          affiliate_type?: string | null
          payout_type?: 'percent' | 'flat' | null
          payout_value?: number | null
          customer_discount_type?: 'percent' | 'flat' | null
          customer_discount_value?: number | null
          is_active?: boolean | null
          created_at?: string
        }
      }
      affiliate_conversions: {
        Row: {
          id: string
          affiliate_referral_id: string | null
          purchase_id: string | null
          packet_id: string | null
          referred_user_id: string | null
          code_used: string | null
          conversion_status: 'lead' | 'signup' | 'purchase' | 'paid_out' | null
          created_at: string
        }
        Insert: {
          id?: string
          affiliate_referral_id?: string | null
          purchase_id?: string | null
          packet_id?: string | null
          referred_user_id?: string | null
          code_used?: string | null
          conversion_status?: 'lead' | 'signup' | 'purchase' | 'paid_out' | null
          created_at?: string
        }
        Update: {
          id?: string
          affiliate_referral_id?: string | null
          purchase_id?: string | null
          packet_id?: string | null
          referred_user_id?: string | null
          code_used?: string | null
          conversion_status?: 'lead' | 'signup' | 'purchase' | 'paid_out' | null
          created_at?: string
        }
      }
      pricing_plans: {
        Row: {
          id: string
          plan_key: string
          name: string
          description: string | null
          billing_type: 'one_time' | 'monthly' | 'annual' | null
          household_mode: 'single' | 'couple' | null
          price_cents: number
          stripe_price_id: string | null
          stripe_product_id: string | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          plan_key: string
          name: string
          description?: string | null
          billing_type?: 'one_time' | 'monthly' | 'annual' | null
          household_mode?: 'single' | 'couple' | null
          price_cents: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          plan_key?: string
          name?: string
          description?: string | null
          billing_type?: 'one_time' | 'monthly' | 'annual' | null
          household_mode?: 'single' | 'couple' | null
          price_cents?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          is_active?: boolean | null
          created_at?: string
        }
      }
      customer_billing_profiles: {
        Row: {
          id: string
          user_id: string | null
          stripe_customer_id: string | null
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          stripe_customer_id?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          stripe_customer_id?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      purchases: {
        Row: {
          id: string
          user_id: string | null
          packet_id: string | null
          pricing_plan_id: string | null
          stripe_checkout_session_id: string | null
          stripe_subscription_id: string | null
          stripe_payment_intent_id: string | null
          status: 'pending' | 'active' | 'canceled' | 'expired' | 'failed' | 'one_time_paid' | null
          billing_type: 'one_time' | 'monthly' | 'annual' | null
          current_period_end: string | null
          affiliate_referral_id: string | null
          affiliate_code_used: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          packet_id?: string | null
          pricing_plan_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_subscription_id?: string | null
          stripe_payment_intent_id?: string | null
          status?: 'pending' | 'active' | 'canceled' | 'expired' | 'failed' | 'one_time_paid' | null
          billing_type?: 'one_time' | 'monthly' | 'annual' | null
          current_period_end?: string | null
          affiliate_referral_id?: string | null
          affiliate_code_used?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          packet_id?: string | null
          pricing_plan_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_subscription_id?: string | null
          stripe_payment_intent_id?: string | null
          status?: 'pending' | 'active' | 'canceled' | 'expired' | 'failed' | 'one_time_paid' | null
          billing_type?: 'one_time' | 'monthly' | 'annual' | null
          current_period_end?: string | null
          affiliate_referral_id?: string | null
          affiliate_code_used?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_packet_member: {
        Args: {
          p_id: string
        }
        Returns: boolean
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
