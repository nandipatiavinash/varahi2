import Link from "next/link";
import { notFound } from "next/navigation";
import { getBill } from "@/actions/bills";
import { listPaymentHistory } from "@/actions/credit-payments";
import { getCurrentBusiness } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { BillStatusBadge } from "@/components/sales/bill-status-badge";
import { RecordPaymentDialog } from "@/components/sales/record-payment-dialog";
import { PrintButton } from "@/components/sales/print-button";
import { formatCurrency, formatDate, formatDateTime, isSameDay } from "@/lib/utils";
import { Pencil } from "lucide-react";

export default async function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [bill, { business }] = await Promise.all([getBill(id), getCurrentBusiness()]);
  if (!bill) notFound();

  const payments = bill.status !== "credit" && bill.status !== "partial" ? [] : await listPaymentHistory(id);
  const editable = !bill.locked && isSameDay(bill.created_at) && bill.status !== "voided";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="no-print flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Bill {bill.bill_number}</h1>
          <p className="text-sm text-primary/50">Created {formatDateTime(bill.created_at)}</p>
        </div>
        <div className="flex gap-2">
          {editable && (
            <Button variant="outline" asChild>
              <Link href={`/sales/${bill.id}/edit`}><Pencil className="h-4 w-4" /> Edit</Link>
            </Button>
          )}
          <PrintButton />
        </div>
      </div>

      {!editable && bill.status !== "voided" && (
        <p className="no-print rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
          This bill was created on a previous day and is now locked — it can no longer be edited or deleted.
        </p>
      )}

      <Card className="print-page">
        <CardContent className="space-y-6 p-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary">{business.name}</h2>
              <p className="text-sm text-primary/50">{business.address}</p>
              <p className="text-sm text-primary/50">{business.phone} {business.email && `· ${business.email}`}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary/50">Invoice</p>
              <p className="text-lg font-semibold text-primary">{bill.bill_number}</p>
              <p className="text-sm text-primary/50">{formatDate(bill.bill_date)}</p>
              <div className="mt-1"><BillStatusBadge status={bill.status} /></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl bg-background p-4 text-sm">
            <div>
              <p className="text-primary/50">Customer</p>
              <p className="font-medium text-primary">{bill.customer_name}</p>
              <p className="text-primary/60">{bill.customer_mobile}</p>
            </div>
            <div>
              <p className="text-primary/50">Employee</p>
              <p className="font-medium text-primary">{bill.employees?.name ?? "Unassigned"}</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Purchase ₹</TableHead>
                <TableHead>Selling ₹</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bill.bill_items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product_name_snapshot}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatCurrency(item.purchase_price, business.currency)}</TableCell>
                  <TableCell>{formatCurrency(item.selling_price, business.currency)}</TableCell>
                  <TableCell>{formatCurrency(item.line_total, business.currency)}</TableCell>
                  <TableCell className="text-success">{formatCurrency(item.line_profit, business.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
            <Row label="Subtotal" value={formatCurrency(bill.subtotal, business.currency)} />
            <Row label="Discount" value={formatCurrency(bill.discount, business.currency)} />
            <Row label="Gross Profit" value={formatCurrency(bill.gross_profit, business.currency)} valueClass="text-success font-medium" />
            <Row label="Grand Total" value={formatCurrency(bill.grand_total, business.currency)} valueClass="font-semibold text-primary" />
            <Row label="Paid" value={formatCurrency(bill.paid_amount, business.currency)} />
            <Row
              label="Balance Due"
              value={formatCurrency(bill.balance_due, business.currency)}
              valueClass={bill.balance_due > 0 ? "text-danger font-semibold" : "text-success font-semibold"}
            />
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-primary/70">Payment Split</p>
            <div className="flex flex-wrap gap-2">
              {bill.payment_splits.map((s) => (
                <span key={s.id} className="rounded-full bg-background px-3 py-1 text-xs text-primary/70">
                  {s.method.toUpperCase()}: {formatCurrency(s.amount, business.currency)}
                </span>
              ))}
            </div>
          </div>

          {bill.notes && (
            <div>
              <p className="text-sm font-medium text-primary/70">Notes</p>
              <p className="text-sm text-primary/60">{bill.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {bill.balance_due > 0 && bill.status !== "voided" && (
        <Card className="no-print">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Outstanding Balance</p>
              <p className="text-sm text-primary/50">
                {formatCurrency(bill.balance_due, business.currency)} still due from {bill.customer_name}
              </p>
            </div>
            <RecordPaymentDialog billId={bill.id} balanceDue={bill.balance_due} />
          </CardContent>
        </Card>
      )}

      {payments.length > 0 && (
        <Card className="no-print">
          <CardContent>
            <p className="mb-3 text-sm font-medium text-primary/70">Payment History</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDateTime(p.paid_at)}</TableCell>
                    <TableCell>{p.method.toUpperCase()}</TableCell>
                    <TableCell>{formatCurrency(p.amount, business.currency)}</TableCell>
                    <TableCell className="text-primary/60">{p.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-primary/60">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
