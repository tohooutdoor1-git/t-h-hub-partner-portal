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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          metadata: Json
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      banners: {
        Row: {
          active: boolean
          brand_id: string | null
          button_label: string | null
          category_id: string | null
          created_at: string
          id: string
          image_url: string | null
          link_url: string | null
          sort_order: number
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          brand_id?: string | null
          button_label?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          brand_id?: string | null
          button_label?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banners_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banners_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          active: boolean
          banner_url: string | null
          created_at: string
          description: string | null
          featured: boolean
          id: string
          logo_url: string | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          banner_url?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          banner_url?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      catalog_items: {
        Row: {
          brand_id: string | null
          id: string
          product_id: string | null
          section_id: string
          sort_order: number
        }
        Insert: {
          brand_id?: string | null
          id?: string
          product_id?: string | null
          section_id: string
          sort_order?: number
        }
        Update: {
          brand_id?: string | null
          id?: string
          product_id?: string | null
          section_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "catalog_items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "catalog_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_sections: {
        Row: {
          active: boolean
          banner_url: string | null
          id: string
          layout: string
          sort_order: number
          subtitle: string | null
          title: string
        }
        Insert: {
          active?: boolean
          banner_url?: string | null
          id?: string
          layout?: string
          sort_order?: number
          subtitle?: string | null
          title: string
        }
        Update: {
          active?: boolean
          banner_url?: string | null
          id?: string
          layout?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          brand_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          brand_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          brand_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      distributors: {
        Row: {
          accumulated_purchases: number
          active: boolean
          address: string | null
          company: string
          contact_name: string
          created_at: string
          email: string
          id: string
          last_activity: string | null
          level_code: string
          notes: string | null
          phone: string | null
          rfc: string | null
          seller_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accumulated_purchases?: number
          active?: boolean
          address?: string | null
          company: string
          contact_name: string
          created_at?: string
          email: string
          id?: string
          last_activity?: string | null
          level_code?: string
          notes?: string | null
          phone?: string | null
          rfc?: string | null
          seller_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accumulated_purchases?: number
          active?: boolean
          address?: string | null
          company?: string
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          last_activity?: string | null
          level_code?: string
          notes?: string | null
          phone?: string | null
          rfc?: string | null
          seller_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distributors_level_code_fkey"
            columns: ["level_code"]
            isOneToOne: false
            referencedRelation: "level_settings"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "distributors_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          distributor_id: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          distributor_id: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          distributor_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      level_settings: {
        Row: {
          code: string
          discount_pct: number
          name: string
          sort_order: number
          threshold: number
          updated_at: string
        }
        Insert: {
          code: string
          discount_pct: number
          name: string
          sort_order?: number
          threshold?: number
          updated_at?: string
        }
        Update: {
          code?: string
          discount_pct?: number
          name?: string
          sort_order?: number
          threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          channel: string
          created_at: string
          id: string
          payload: Json
          read_at: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          channel?: string
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          channel?: string
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          list_price: number
          name: string
          order_id: string
          product_id: string | null
          quantity: number
          sku: string
          unit_price: number
        }
        Insert: {
          id?: string
          list_price: number
          name: string
          order_id: string
          product_id?: string | null
          quantity?: number
          sku: string
          unit_price: number
        }
        Update: {
          id?: string
          list_price?: number
          name?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          sku?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          distributor_id: string
          folio: string
          id: string
          inventory_applied: boolean
          notes: string | null
          quote_id: string | null
          seller_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          distributor_id: string
          folio?: string
          id?: string
          inventory_applied?: boolean
          notes?: string | null
          quote_id?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          distributor_id?: string
          folio?: string
          id?: string
          inventory_applied?: boolean
          notes?: string | null
          quote_id?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt: string | null
          id: string
          product_id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt?: string | null
          id?: string
          product_id: string
          sort_order?: number
          url: string
        }
        Update: {
          alt?: string | null
          id?: string
          product_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          brand_id: string | null
          category_id: string | null
          created_at: string
          description: string | null
          extra_info: string | null
          featured: boolean
          features: string[]
          id: string
          is_new: boolean
          list_price: number
          main_image: string | null
          name: string
          short_description: string | null
          sku: string
          sort_order: number
          specs: Json
          stock: number
          stock_status: Database["public"]["Enums"]["stock_status"]
          subcategory_id: string | null
          times_quoted: number
          updated_at: string
          video_url: string | null
        }
        Insert: {
          active?: boolean
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          extra_info?: string | null
          featured?: boolean
          features?: string[]
          id?: string
          is_new?: boolean
          list_price?: number
          main_image?: string | null
          name: string
          short_description?: string | null
          sku: string
          sort_order?: number
          specs?: Json
          stock?: number
          stock_status?: Database["public"]["Enums"]["stock_status"]
          subcategory_id?: string | null
          times_quoted?: number
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          active?: boolean
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          extra_info?: string | null
          featured?: boolean
          features?: string[]
          id?: string
          is_new?: boolean
          list_price?: number
          main_image?: string | null
          name?: string
          short_description?: string | null
          sku?: string
          sort_order?: number
          specs?: Json
          stock?: number
          stock_status?: Database["public"]["Enums"]["stock_status"]
          subcategory_id?: string | null
          times_quoted?: number
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          active: boolean
          badge: string
          created_at: string
          ends_at: string | null
          id: string
          image_url: string | null
          product_id: string | null
          promo_price: number | null
          sort_order: number
          starts_at: string | null
          title: string | null
        }
        Insert: {
          active?: boolean
          badge?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          product_id?: string | null
          promo_price?: number | null
          sort_order?: number
          starts_at?: string | null
          title?: string | null
        }
        Update: {
          active?: boolean
          badge?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          product_id?: string | null
          promo_price?: number | null
          sort_order?: number
          starts_at?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string
          id: string
          list_price: number
          name: string
          product_id: string | null
          quantity: number
          quote_id: string
          sku: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          list_price: number
          name: string
          product_id?: string | null
          quantity?: number
          quote_id: string
          sku: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          list_price?: number
          name?: string
          product_id?: string | null
          quantity?: number
          quote_id?: string
          sku?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          comments: string | null
          created_at: string
          discount_amount: number
          discount_pct: number
          distributor_id: string
          folio: string
          id: string
          internal_notes: string | null
          level_code: string | null
          seller_id: string | null
          status: Database["public"]["Enums"]["quote_status"]
          submitted_at: string | null
          subtotal_list: number
          total: number
          updated_at: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          discount_amount?: number
          discount_pct?: number
          distributor_id: string
          folio?: string
          id?: string
          internal_notes?: string | null
          level_code?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          submitted_at?: string | null
          subtotal_list?: number
          total?: number
          updated_at?: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          discount_amount?: number
          discount_pct?: number
          distributor_id?: string
          folio?: string
          id?: string
          internal_notes?: string | null
          level_code?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          submitted_at?: string | null
          subtotal_list?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_categories: {
        Row: {
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      resources: {
        Row: {
          active: boolean
          category_id: string | null
          created_at: string
          description: string | null
          file_type: string | null
          file_url: string
          id: string
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          description?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          description?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "resource_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      approve_order: { Args: { _order_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      my_discount_pct: { Args: never; Returns: number }
      my_distributor_id: { Args: never; Returns: string }
      my_seller_id: { Args: never; Returns: string }
      next_folio: { Args: { _prefix: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "seller" | "distributor"
      order_status:
        | "received"
        | "in_review"
        | "availability_confirmed"
        | "approved"
        | "preparing"
        | "shipped"
        | "delivered"
        | "rejected"
        | "cancelled"
      quote_status:
        | "draft"
        | "pending"
        | "in_review"
        | "approved"
        | "confirmed"
        | "rejected"
        | "cancelled"
      stock_status: "available" | "low" | "inquire" | "out"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "seller", "distributor"],
      order_status: [
        "received",
        "in_review",
        "availability_confirmed",
        "approved",
        "preparing",
        "shipped",
        "delivered",
        "rejected",
        "cancelled",
      ],
      quote_status: [
        "draft",
        "pending",
        "in_review",
        "approved",
        "confirmed",
        "rejected",
        "cancelled",
      ],
      stock_status: ["available", "low", "inquire", "out"],
    },
  },
} as const
