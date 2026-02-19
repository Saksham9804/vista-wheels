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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      active_bookings: {
        Row: {
          booking_id: string
          created_at: string
          customer_id: string
          driver_id: string | null
          drop_lat: number | null
          drop_lng: number | null
          id: string
          pickup_lat: number | null
          pickup_lng: number | null
          status: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          customer_id: string
          driver_id?: string | null
          drop_lat?: number | null
          drop_lng?: number | null
          id?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          customer_id?: string
          driver_id?: string | null
          drop_lat?: number | null
          drop_lng?: number | null
          id?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          actual_hours: number | null
          amount: number
          base_rent: number | null
          billed_days: number | null
          created_at: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          delivery_charge: number | null
          duration: string | null
          gateway_fee: number | null
          id: string
          notes: string | null
          partner_id: string
          payment_status: string | null
          pickup_location: string | null
          pickup_time: string
          pickup_type: string | null
          platform_fee: number | null
          return_time: string
          security_deposit: number | null
          status: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          actual_hours?: number | null
          amount: number
          base_rent?: number | null
          billed_days?: number | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_charge?: number | null
          duration?: string | null
          gateway_fee?: number | null
          id?: string
          notes?: string | null
          partner_id: string
          payment_status?: string | null
          pickup_location?: string | null
          pickup_time: string
          pickup_type?: string | null
          platform_fee?: number | null
          return_time: string
          security_deposit?: number | null
          status?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          actual_hours?: number | null
          amount?: number
          base_rent?: number | null
          billed_days?: number | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_charge?: number | null
          duration?: string | null
          gateway_fee?: number | null
          id?: string
          notes?: string | null
          partner_id?: string
          payment_status?: string | null
          pickup_location?: string | null
          pickup_time?: string
          pickup_type?: string | null
          platform_fee?: number | null
          return_time?: string
          security_deposit?: number | null
          status?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_locations: {
        Row: {
          booking_id: string
          driver_id: string
          id: string
          is_active: boolean
          lat: number
          lng: number
          updated_at: string
        }
        Insert: {
          booking_id: string
          driver_id: string
          id?: string
          is_active?: boolean
          lat: number
          lng: number
          updated_at?: string
        }
        Update: {
          booking_id?: string
          driver_id?: string
          id?: string
          is_active?: boolean
          lat?: number
          lng?: number
          updated_at?: string
        }
        Relationships: []
      }
      partner_documents: {
        Row: {
          document_type: string
          document_url: string
          id: string
          partner_id: string
          uploaded_at: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          document_type: string
          document_url: string
          id?: string
          partner_id: string
          uploaded_at?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          document_type?: string
          document_url?: string
          id?: string
          partner_id?: string
          uploaded_at?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_documents_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          business_name: string
          business_type: Database["public"]["Enums"]["business_type"]
          city: string
          created_at: string
          email: string
          id: string
          latitude: number | null
          longitude: number | null
          number_of_vehicles: number | null
          phone: string
          phone_verified: boolean | null
          pin_code: string | null
          profile_photo: string | null
          rating: number | null
          rejection_reason: string | null
          shop_address: string | null
          state: string | null
          status: Database["public"]["Enums"]["partner_status"] | null
          total_bookings: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          business_name: string
          business_type?: Database["public"]["Enums"]["business_type"]
          city: string
          created_at?: string
          email: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          number_of_vehicles?: number | null
          phone: string
          phone_verified?: boolean | null
          pin_code?: string | null
          profile_photo?: string | null
          rating?: number | null
          rejection_reason?: string | null
          shop_address?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["partner_status"] | null
          total_bookings?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          business_name?: string
          business_type?: Database["public"]["Enums"]["business_type"]
          city?: string
          created_at?: string
          email?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          number_of_vehicles?: number | null
          phone?: string
          phone_verified?: boolean | null
          pin_code?: string | null
          profile_photo?: string | null
          rating?: number | null
          rejection_reason?: string | null
          shop_address?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["partner_status"] | null
          total_bookings?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          aadhar_back_url: string | null
          aadhar_front_url: string | null
          aadhar_number: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          documents_verified: boolean | null
          driving_license_back_url: string | null
          driving_license_expiry: string | null
          driving_license_front_url: string | null
          driving_license_number: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          gender: string | null
          id: string
          last_login: string | null
          latitude: number | null
          longitude: number | null
          phone: string | null
          phone_verified: boolean | null
          postal_code: string | null
          profile_completed: boolean | null
          profile_photo: string | null
          state: string | null
          updated_at: string
          user_id: string
          verification_status: string | null
        }
        Insert: {
          aadhar_back_url?: string | null
          aadhar_front_url?: string | null
          aadhar_number?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          documents_verified?: boolean | null
          driving_license_back_url?: string | null
          driving_license_expiry?: string | null
          driving_license_front_url?: string | null
          driving_license_number?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          gender?: string | null
          id?: string
          last_login?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          phone_verified?: boolean | null
          postal_code?: string | null
          profile_completed?: boolean | null
          profile_photo?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
        }
        Update: {
          aadhar_back_url?: string | null
          aadhar_front_url?: string | null
          aadhar_number?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          documents_verified?: boolean | null
          driving_license_back_url?: string | null
          driving_license_expiry?: string | null
          driving_license_front_url?: string | null
          driving_license_number?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          last_login?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          phone_verified?: boolean | null
          postal_code?: string | null
          profile_completed?: boolean | null
          profile_photo?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          available: boolean | null
          brand: string
          color: string | null
          created_at: string
          engine_capacity: number | null
          features: string[] | null
          fuel_type: string | null
          id: string
          max_rental_duration: string | null
          mileage: number | null
          min_rental_duration: string | null
          model: string | null
          name: string
          partner_id: string
          photos: string[] | null
          pickup_location: string | null
          price_per_day: number
          price_per_month: number | null
          price_per_week: number | null
          registration_number: string
          seat_capacity: number | null
          security_deposit: number | null
          status: string | null
          transmission: string | null
          updated_at: string
          vehicle_type: string
          year: number | null
        }
        Insert: {
          available?: boolean | null
          brand: string
          color?: string | null
          created_at?: string
          engine_capacity?: number | null
          features?: string[] | null
          fuel_type?: string | null
          id?: string
          max_rental_duration?: string | null
          mileage?: number | null
          min_rental_duration?: string | null
          model?: string | null
          name: string
          partner_id: string
          photos?: string[] | null
          pickup_location?: string | null
          price_per_day: number
          price_per_month?: number | null
          price_per_week?: number | null
          registration_number: string
          seat_capacity?: number | null
          security_deposit?: number | null
          status?: string | null
          transmission?: string | null
          updated_at?: string
          vehicle_type: string
          year?: number | null
        }
        Update: {
          available?: boolean | null
          brand?: string
          color?: string | null
          created_at?: string
          engine_capacity?: number | null
          features?: string[] | null
          fuel_type?: string | null
          id?: string
          max_rental_duration?: string | null
          mileage?: number | null
          min_rental_duration?: string | null
          model?: string | null
          name?: string
          partner_id?: string
          photos?: string[] | null
          pickup_location?: string | null
          price_per_day?: number
          price_per_month?: number | null
          price_per_week?: number | null
          registration_number?: string
          seat_capacity?: number | null
          security_deposit?: number | null
          status?: string | null
          transmission?: string | null
          updated_at?: string
          vehicle_type?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_partner_id: { Args: { _user_id: string }; Returns: string }
      get_profile_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "customer" | "partner" | "admin"
      business_type:
        | "individual"
        | "small_business"
        | "rental_company"
        | "franchise"
      partner_status:
        | "pending_verification"
        | "approved"
        | "rejected"
        | "suspended"
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
      app_role: ["customer", "partner", "admin"],
      business_type: [
        "individual",
        "small_business",
        "rental_company",
        "franchise",
      ],
      partner_status: [
        "pending_verification",
        "approved",
        "rejected",
        "suspended",
      ],
    },
  },
} as const
