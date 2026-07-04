import { listEmployees } from "@/actions/employees";
import { EmployeesTable } from "@/components/employees/employees-table";
import { EmployeeFormDialog } from "@/components/employees/employee-form-dialog";

export default async function EmployeesPage() {
  const employees = await listEmployees();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Employees</h1>
          <p className="text-sm text-primary/50">Track who&apos;s selling — no payroll, no commission math.</p>
        </div>
        <EmployeeFormDialog />
      </div>
      <EmployeesTable employees={employees} />
    </div>
  );
}
