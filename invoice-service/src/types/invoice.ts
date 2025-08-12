export interface InvoiceItem {
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  _id?: string;
  customerId: string;
  createdAt: Date;      
  currency: string;
  items: InvoiceItem[];
  invoiceTotal: number;
}
