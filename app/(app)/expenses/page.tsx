import { listExpenses } from "@/actions/expenses";
import { getCurrentBusiness } from "@/lib/supabase/server";
import { ExpensesTable } from "@/components/expenses/expenses-table";
import { ExpenseFormDialog } from "@/components/expenses/expense-form-dialog";
import { formatCurrency } from "@/lib/utils";

export default async function ExpensesPage() {
  const [expenses, { business }] = await Promise.all([listExpenses(), getCurrentBusiness()]);
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Expenses</h1>
          <p className="text-sm text-primary/50">
            Total recorded: <span className="font-medium text-danger">{formatCurrency(total, business.currency)}</span>
          </p>
        </div>
        <ExpenseFormDialog />
      </div>
      <ExpensesTable expenses={expenses} currency={business.currency} />
    </div>
  );
}
