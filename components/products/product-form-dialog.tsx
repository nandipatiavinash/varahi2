"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { productSchema, type ProductInput, PRODUCT_CATEGORIES } from "@/lib/validations/product";
import { createProduct, updateProduct } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { Database } from "@/types/database.types";

type Product = Database["public"]["Tables"]["products"]["Row"];

export function ProductFormDialog({
  product,
  trigger,
}: {
  product?: Product;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(product);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: product ?? {
      name: "",
      category: PRODUCT_CATEGORIES[0],
      default_purchase_price: 0,
      default_selling_price: 0,
      status: "active",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset(
        product ?? {
          name: "",
          category: PRODUCT_CATEGORIES[0],
          default_purchase_price: 0,
          default_selling_price: 0,
          status: "active",
        }
      );
    }
  }, [open, product, reset]);

  async function onSubmit(values: ProductInput) {
    const result = isEdit ? await updateProduct(product!.id, values) : await createProduct(values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Product updated" : "Product added");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Product Name</Label>
            <Input id="name" {...register("name")} placeholder="e.g. UltraTech Cement (50kg)" />
            {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={watch("category")} onValueChange={(v) => setValue("category", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="default_purchase_price">Default Purchase Price</Label>
              <Input
                id="default_purchase_price"
                type="number"
                step="0.01"
                {...register("default_purchase_price")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="default_selling_price">Default Selling Price</Label>
              <Input
                id="default_selling_price"
                type="number"
                step="0.01"
                {...register("default_selling_price")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={watch("status")} onValueChange={(v) => setValue("status", v as "active" | "inactive")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Add Product"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
