export interface Customer {
  id: string;
  customer_code: string;
  customer_name: string;
  email: string | null;
  phone: string | null;
  billing_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerAlias {
  id: string;
  customer_id: string;
  alias_name: string;
  created_at: string;
}

export interface CustomerInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  currency: string;
  total_amount: number;
  outstanding_amount: number;
  status: string;
  created_at: string;
}

export interface CustomerPayment {
  id: string;
  payment_upload_id: string;
  payment_reference: string | null;
  payment_amount: number;
  payment_date: string;
  currency: string;
  status: string;
  created_at: string;
}

export interface CustomerCredit {
  id: string;
  payment_id: string;
  credit_amount: number;
  status: string;
  created_at: string;
}

export interface CustomerDetail {
  customer: Customer;
  aliases: string[];
  invoices: CustomerInvoice[];
  payments: CustomerPayment[];
  credits: CustomerCredit[];
}
