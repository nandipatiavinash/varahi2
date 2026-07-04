export type PaymentMethod = "cash" | "upi" | "bank" | "credit" | "advance";
export type BillStatus = "paid" | "partial" | "credit" | "voided";
export type AdvanceStatus = "pending" | "completed" | "cancelled";
export type ExpenseCategory =
  | "Rent"
  | "Electricity"
  | "Fuel"
  | "Transport"
  | "Maintenance"
  | "Miscellaneous";
export type EntityStatus = "active" | "inactive";

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          logo_url: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["businesses"]["Row"]> & {
          owner_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["businesses"]["Row"]>;
        Relationships: [];
      };
      employees: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          mobile: string | null;
          status: EntityStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["employees"]["Row"]> & {
          business_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["employees"]["Row"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          category: string;
          default_purchase_price: number;
          default_selling_price: number;
          status: EntityStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & {
          business_id: string;
          name: string;
          category: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
        Relationships: [];
      };
      bills: {
        Row: {
          id: string;
          business_id: string;
          bill_number: string;
          bill_date: string;
          customer_name: string;
          customer_mobile: string | null;
          employee_id: string | null;
          subtotal: number;
          discount: number;
          grand_total: number;
          gross_profit: number;
          paid_amount: number;
          balance_due: number;
          status: BillStatus;
          notes: string | null;
          voided_at: string | null;
          locked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["bills"]["Row"]> & {
          business_id: string;
          bill_number: string;
          customer_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["bills"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "bills_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
        ];
      };
      bill_items: {
        Row: {
          id: string;
          bill_id: string;
          product_id: string | null;
          product_name_snapshot: string;
          quantity: number;
          purchase_price: number;
          selling_price: number;
          line_profit: number;
          line_total: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["bill_items"]["Row"]> & {
          bill_id: string;
          product_name_snapshot: string;
          quantity: number;
          purchase_price: number;
          selling_price: number;
        };
        Update: Partial<Database["public"]["Tables"]["bill_items"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "bill_items_bill_id_fkey";
            columns: ["bill_id"];
            isOneToOne: false;
            referencedRelation: "bills";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bill_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_splits: {
        Row: {
          id: string;
          bill_id: string;
          method: PaymentMethod;
          amount: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["payment_splits"]["Row"]> & {
          bill_id: string;
          method: PaymentMethod;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["payment_splits"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "payment_splits_bill_id_fkey";
            columns: ["bill_id"];
            isOneToOne: false;
            referencedRelation: "bills";
            referencedColumns: ["id"];
          },
        ];
      };
      advance_orders: {
        Row: {
          id: string;
          business_id: string;
          customer_name: string;
          customer_mobile: string | null;
          advance_amount: number;
          expected_delivery_date: string | null;
          notes: string | null;
          status: AdvanceStatus;
          converted_bill_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["advance_orders"]["Row"]> & {
          business_id: string;
          customer_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["advance_orders"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "advance_orders_converted_bill_id_fkey";
            columns: ["converted_bill_id"];
            isOneToOne: false;
            referencedRelation: "bills";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_payments: {
        Row: {
          id: string;
          bill_id: string;
          amount: number;
          method: "cash" | "upi" | "bank";
          paid_at: string;
          notes: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["credit_payments"]["Row"]> & {
          bill_id: string;
          amount: number;
          method: "cash" | "upi" | "bank";
        };
        Update: Partial<Database["public"]["Tables"]["credit_payments"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "credit_payments_bill_id_fkey";
            columns: ["bill_id"];
            isOneToOne: false;
            referencedRelation: "bills";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          id: string;
          business_id: string;
          date: string;
          category: ExpenseCategory;
          amount: number;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["expenses"]["Row"]> & {
          business_id: string;
          category: ExpenseCategory;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Row"]>;
        Relationships: [];
      };
      activity_log: {
        Row: {
          id: string;
          business_id: string;
          entity_type: string;
          entity_id: string;
          action: "created" | "updated" | "voided" | "deleted";
          detail: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["activity_log"]["Row"]> & {
          business_id: string;
          entity_type: string;
          entity_id: string;
          action: "created" | "updated" | "voided" | "deleted";
        };
        Update: Partial<Database["public"]["Tables"]["activity_log"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      v_daily_summary: {
        Row: {
          business_id: string;
          date: string;
          bill_count: number;
          revenue: number;
          gross_profit: number;
          cash_collection: number;
          upi_collection: number;
          bank_collection: number;
          credit_sales: number;
          advance_payments: number;
        };
        Relationships: [];
      };
      v_monthly_summary: {
        Row: {
          business_id: string;
          month: string;
          bill_count: number;
          revenue: number;
          gross_profit: number;
          avg_bill_value: number;
        };
        Relationships: [];
      };
      v_employee_performance: {
        Row: {
          employee_id: string;
          business_id: string;
          employee_name: string;
          bills_created: number;
          sales_amount: number;
          revenue_generated: number;
          profit_generated: number;
          avg_bill_value: number;
          credit_sales_count: number;
        };
        Relationships: [];
      };
      v_credit_outstanding: {
        Row: {
          bill_id: string;
          business_id: string;
          bill_number: string;
          customer_name: string;
          customer_mobile: string | null;
          grand_total: number;
          paid_amount: number;
          balance_due: number;
          bill_date: string;
          is_overdue: boolean;
        };
        Relationships: [];
      };
      v_expense_breakdown: {
        Row: {
          business_id: string;
          month: string;
          category: ExpenseCategory;
          total_amount: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
