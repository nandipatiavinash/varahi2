"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TrendPoint {
  date: string;
  revenue: number;
  profit: number;
  bills: number;
}

interface EmployeeRow {
  employee_name: string;
  revenue_generated: number;
  profit_generated: number;
}

export function RevenueProfitChart({ data, currency }: { data: TrendPoint[]; currency: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue & Profit Trend</CardTitle>
      </CardHeader>
      <CardContent className="h-72 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#16A34A" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#16A34A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" tickFormatter={(d) => formatDate(d)} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v, currency).replace(/\.00$/, "")} width={80} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value, currency)}
              labelFormatter={(d) => formatDate(d as string)}
            />
            <Area type="monotone" dataKey="revenue" stroke="#2563EB" fill="url(#revenueGradient)" strokeWidth={2} name="Revenue" />
            <Area type="monotone" dataKey="profit" stroke="#16A34A" fill="url(#profitGradient)" strokeWidth={2} name="Profit" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function DailySalesChart({ data }: { data: TrendPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Bills</CardTitle>
      </CardHeader>
      <CardContent className="h-72 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" tickFormatter={(d) => formatDate(d)} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} width={40} allowDecimals={false} />
            <Tooltip labelFormatter={(d) => formatDate(d as string)} />
            <Bar dataKey="bills" fill="#111827" radius={[6, 6, 0, 0]} name="Bills" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function EmployancePerformanceChart({ data, currency }: { data: EmployeeRow[]; currency: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Performance</CardTitle>
      </CardHeader>
      <CardContent className="h-72 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="employee_name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v, currency).replace(/\.00$/, "")} width={80} />
            <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
            <Legend />
            <Bar dataKey="revenue_generated" fill="#2563EB" radius={[6, 6, 0, 0]} name="Revenue" />
            <Bar dataKey="profit_generated" fill="#16A34A" radius={[6, 6, 0, 0]} name="Profit" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
