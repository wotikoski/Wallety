export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  role?: string;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense" | "both";
  icon: string | null;
  color: string | null;
  isDefault: boolean;
  groupId: string | null;
  userId: string | null;
}

export interface Bank {
  id: string;
  name: string;
  code: string | null;
  color: string | null;
  logoUrl: string | null;
  isDefault: boolean;
  groupId: string | null;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  bankId: string | null;
  isDefault: boolean;
  groupId: string | null;
}

export interface Transaction {
  id: string;
  date: string;
  type: "income" | "expense";
  categoryId: string | null;
  description: string;
  value: string;
  paymentMethodId: string | null;
  bankId: string | null;
  installmentGroupId: string | null;
  installmentCurrent: number | null;
  installmentTotal: number | null;
  installmentValue: string | null;
  isPaid: boolean;
  isFixed: boolean;
  notes: string | null;
  userId: string;
  groupId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyBudget {
  id: string;
  userId: string;
  groupId: string | null;
  year: number;
  month: number;
  plannedIncome: string;
  plannedFixedExpenses: string;
  notes: string | null;
}
