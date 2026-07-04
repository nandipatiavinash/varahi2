"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { employeeSchema, type EmployeeInput } from "@/lib/validations/employee";
import { createEmployee, updateEmployee } from "@/actions/employees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { Database } from "@/types/database.types";

type Employee = Database["public"]["Tables"]["employees"]["Row"];

function toFormValues(employee?: Employee): EmployeeInput {
  return {
    name: employee?.name ?? "",
    mobile: employee?.mobile ?? "",
    status: employee?.status ?? "active",
  };
}

export function EmployeeFormDialog({ employee, trigger }: { employee?: Employee; trigger?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(employee);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } =
    useForm<EmployeeInput>({
      resolver: zodResolver(employeeSchema),
      defaultValues: toFormValues(employee),
    });

  React.useEffect(() => {
    if (open) reset(toFormValues(employee));
  }, [open, employee, reset]);

  async function onSubmit(values: EmployeeInput) {
    const result = isEdit ? await updateEmployee(employee!.id, values) : await createEmployee(values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Employee updated" : "Employee added");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm"><Plus className="h-4 w-4" /> Add Employee</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Employee" : "Add Employee"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Employee Name</Label>
            <Input id="name" {...register("name")} placeholder="e.g. Ravi Kumar" />
            {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input id="mobile" {...register("mobile")} placeholder="9876500000" />
            {errors.mobile && <p className="text-xs text-danger">{errors.mobile.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={watch("status")} onValueChange={(v) => setValue("status", v as "active" | "inactive")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Add Employee"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
