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
      email_log: {
        Row: {
          created_at: string
          email_type: string
          error: string | null
          id: string
          order_id: string
          provider_id: string | null
          recipient: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_type: string
          error?: string | null
          id?: string
          order_id: string
          provider_id?: string | null
          recipient: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_type?: string
          error?: string | null
          id?: string
          order_id?: string
          provider_id?: string | null
          recipient?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          channel: string
          created_at: string | null
          error_message: string | null
          id: string
          order_id: string
          status: string
        }
        Insert: {
          channel?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          order_id: string
          status: string
        }
        Update: {
          channel?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          order_id?: string
          status?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          metadata: Json
          order_id: string | null
          read: boolean
          read_at: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json
          order_id?: string | null
          read?: boolean
          read_at?: string | null
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json
          order_id?: string | null
          read?: boolean
          read_at?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          confirmed_at: string | null
          courier_name: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          delivered_at: string | null
          estimated_delivery: string | null
          gst_amount: number
          id: string
          line_items: Json
          notes: string | null
          order_date: string
          order_number: string
          payment_method: string
          payment_status: string
          shipped_at: string | null
          shipping_address: string | null
          shipping_address2: string | null
          shipping_amount: number
          shipping_city: string | null
          shipping_cost: number | null
          shipping_method: string | null
          shipping_pincode: string | null
          shipping_state: string | null
          status: Database["public"]["Enums"]["order_status"]
          stock_deducted: boolean
          subtotal: number
          total_amount: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          confirmed_at?: string | null
          courier_name?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          delivered_at?: string | null
          estimated_delivery?: string | null
          gst_amount?: number
          id?: string
          line_items?: Json
          notes?: string | null
          order_date?: string
          order_number: string
          payment_method: string
          payment_status?: string
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_address2?: string | null
          shipping_amount?: number
          shipping_city?: string | null
          shipping_cost?: number | null
          shipping_method?: string | null
          shipping_pincode?: string | null
          shipping_state?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stock_deducted?: boolean
          subtotal?: number
          total_amount?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          confirmed_at?: string | null
          courier_name?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          delivered_at?: string | null
          estimated_delivery?: string | null
          gst_amount?: number
          id?: string
          line_items?: Json
          notes?: string | null
          order_date?: string
          order_number?: string
          payment_method?: string
          payment_status?: string
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_address2?: string | null
          shipping_amount?: number
          shipping_city?: string | null
          shipping_cost?: number | null
          shipping_method?: string | null
          shipping_pincode?: string | null
          shipping_state?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stock_deducted?: boolean
          subtotal?: number
          total_amount?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          edition: string | null
          featured: boolean
          grade: string | null
          id: string
          image_url: string | null
          in_stock: boolean
          is_in_stock: boolean
          is_new: boolean
          last_sale: number | null
          low_stock_threshold: number
          population: number | null
          price: number
          rarity: string | null
          series: string | null
          set_name: string | null
          stock: number
          stock_quantity: number
          title: string
          track_stock: boolean
          updated_at: string
          verified: boolean
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          edition?: string | null
          featured?: boolean
          grade?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          is_in_stock?: boolean
          is_new?: boolean
          last_sale?: number | null
          low_stock_threshold?: number
          population?: number | null
          price?: number
          rarity?: string | null
          series?: string | null
          set_name?: string | null
          stock?: number
          stock_quantity?: number
          title: string
          track_stock?: boolean
          updated_at?: string
          verified?: boolean
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          edition?: string | null
          featured?: boolean
          grade?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          is_in_stock?: boolean
          is_new?: boolean
          last_sale?: number | null
          low_stock_threshold?: number
          population?: number | null
          price?: number
          rarity?: string | null
          series?: string | null
          set_name?: string | null
          stock?: number
          stock_quantity?: number
          title?: string
          track_stock?: boolean
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          address2: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          pincode: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          address2?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          address2?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stock_log: {
        Row: {
          change_type: string
          created_at: string | null
          id: string
          note: string | null
          order_id: string | null
          product_id: string | null
          quantity: number
          stock_after: number
          stock_before: number
        }
        Insert: {
          change_type: string
          created_at?: string | null
          id?: string
          note?: string | null
          order_id?: string | null
          product_id?: string | null
          quantity: number
          stock_after: number
          stock_before: number
        }
        Update: {
          change_type?: string
          created_at?: string | null
          id?: string
          note?: string | null
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          stock_after?: number
          stock_before?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_cart_stock: {
        Args: { cart: Json }
        Returns: {
          available: number
          product_id: string
          requested: number
          title: string
        }[]
      }
      check_stock_availability: { Args: { p_items: Json }; Returns: Json }
      decrement_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: Json
      }
      decrement_stock_for_order: { Args: { p_order_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_order_public: {
        Args: { p_email: string; p_order_number: string }
        Returns: {
          confirmed_at: string | null
          courier_name: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          delivered_at: string | null
          estimated_delivery: string | null
          gst_amount: number
          id: string
          line_items: Json
          notes: string | null
          order_date: string
          order_number: string
          payment_method: string
          payment_status: string
          shipped_at: string | null
          shipping_address: string | null
          shipping_address2: string | null
          shipping_amount: number
          shipping_city: string | null
          shipping_cost: number | null
          shipping_method: string | null
          shipping_pincode: string | null
          shipping_state: string | null
          status: Database["public"]["Enums"]["order_status"]
          stock_deducted: boolean
          subtotal: number
          total_amount: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      restore_stock_for_order: { Args: { p_order_id: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "packed"
        | "shipped"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
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
      app_role: ["admin", "user"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "packed",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
