
import { User, Project, UserRole, Transaction, TransactionType } from './types';

export const BUDGET_HEAD_OPTIONS = [
  'Manpower',
  'Consumables',
  'Travel',
  'Contingency',
  'Equipment',
  'Overhead',
  'Field Work'
];

export const INITIAL_USERS: User[] = [
  { id: 'u1', username: 'admin', password: 'admin123', name: 'System Administrator', role: UserRole.ADMIN },
  { id: 'u2', username: 'pi_sharma', password: 'pi123', name: 'Dr. Rajesh Sharma', role: UserRole.INVESTIGATOR, projectId: 'p1' },
  { id: 'u3', username: 'pi_verma', password: 'pi123', name: 'Dr. Anita Verma', role: UserRole.INVESTIGATOR, projectId: 'p2' }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'AI Based Crop Disease Detection',
    piId: 'u2',
    piName: 'Dr. Rajesh Sharma',
    agency: 'ICAR',
    duration: '2023-2025',
    createdAt: '2023-01-15',
    heads: [
      { name: 'Manpower', allocated: 1500000 },
      { name: 'Equipment', allocated: 800000 },
      { name: 'Consumables', allocated: 300000 },
      { name: 'Travel', allocated: 100000 }
    ]
  },
  {
    id: 'p2',
    title: 'Smart Grid Optimization',
    piId: 'u3',
    piName: 'Dr. Anita Verma',
    agency: 'DST',
    duration: '2024-2026',
    createdAt: '2024-02-10',
    heads: [
      { name: 'Manpower', allocated: 1200000 },
      { name: 'Equipment', allocated: 1500000 },
      { name: 'Consumables', allocated: 200000 }
    ]
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    projectId: 'p1',
    headName: 'Manpower',
    type: TransactionType.RECEIPT,
    amount: 500000,
    date: '2023-02-01',
    description: 'First installment release'
  },
  {
    id: 't2',
    projectId: 'p1',
    headName: 'Manpower',
    type: TransactionType.EXPENDITURE,
    amount: 45000,
    date: '2023-03-01',
    description: 'RA Salary Feb 2023'
  }
];

export const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};
