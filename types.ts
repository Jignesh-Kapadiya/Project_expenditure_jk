
export enum UserRole {
  ADMIN = 'ADMIN',
  INVESTIGATOR = 'INVESTIGATOR'
}

export interface User {
  id: string;
  username: string;
  password?: string; // Optional for safety, but used during auth
  role: UserRole;
  name: string;
  projectId?: string; // For Investigators
}

export interface BudgetHead {
  name: string;
  allocated: number;
}

export interface Project {
  id: string;
  title: string;
  piId: string;
  piName: string;
  agency: string;
  duration: string;
  heads: BudgetHead[];
  createdAt: string;
}

export enum TransactionType {
  RECEIPT = 'RECEIPT',
  EXPENDITURE = 'EXPENDITURE'
}

export interface Transaction {
  id: string;
  projectId: string;
  headName: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
}

export interface ProjectStats {
  totalAllocated: number;
  totalReceived: number;
  totalSpent: number;
  balance: number;
  headWise: {
    [key: string]: {
      allocated: number;
      spent: number;
      received: number;
      balance: number;
    }
  };
}
