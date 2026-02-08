
import React, { useState, useEffect } from 'react';
import { Project, Transaction, TransactionType, UserRole, ProjectStats } from '../types';
import { formatINR, BUDGET_HEAD_OPTIONS } from '../constants';
import StatCard from './StatCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { getFinancialHealthReport } from '../geminiService';

interface ProjectDetailProps {
  project: Project;
  transactions: Transaction[];
  userRole: UserRole;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onBack: () => void;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, transactions, userRole, onAddTransaction, onBack }) => {
  const [showModal, setShowModal] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const isAdmin = userRole === UserRole.ADMIN;

  const stats: ProjectStats = React.useMemo(() => {
    const s: ProjectStats = {
      totalAllocated: project.heads.reduce((acc, h) => acc + h.allocated, 0),
      totalReceived: 0,
      totalSpent: 0,
      balance: 0,
      headWise: {}
    };

    project.heads.forEach(h => {
      s.headWise[h.name] = { allocated: h.allocated, received: 0, spent: 0, balance: h.allocated };
    });

    transactions.forEach(t => {
      if (!s.headWise[t.headName]) return;
      if (t.type === TransactionType.RECEIPT) {
        s.headWise[t.headName].received += t.amount;
        s.totalReceived += t.amount;
      } else {
        s.headWise[t.headName].spent += t.amount;
        s.totalSpent += t.amount;
      }
    });

    Object.keys(s.headWise).forEach(key => {
      s.headWise[key].balance = s.headWise[key].allocated - s.headWise[key].spent;
    });

    s.balance = s.totalAllocated - s.totalSpent;
    return s;
  }, [project, transactions]);

  const chartData = project.heads.map(h => ({
    name: h.name,
    allocated: h.allocated,
    spent: stats.headWise[h.name]?.spent || 0,
    balance: stats.headWise[h.name]?.balance || 0
  }));

  const pieData = Object.entries(stats.headWise).map(([name, s]) => ({
    name,
    value: s.spent
  })).filter(d => d.value > 0);

  const fetchAiReport = async () => {
    setLoadingAi(true);
    const report = await getFinancialHealthReport(project, stats);
    setAiReport(report);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Projects
          </button>
          <h2 className="text-3xl font-bold text-gray-900">{project.title}</h2>
          <p className="text-gray-500 mt-1">
            PI: <span className="font-semibold">{project.piName}</span> • 
            Agency: <span className="font-semibold">{project.agency}</span> • 
            Duration: <span className="font-semibold">{project.duration}</span>
          </p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={fetchAiReport}
            disabled={loadingAi}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium flex items-center gap-2 border border-indigo-200"
          >
            {loadingAi ? 'Analyzing...' : 'AI Analysis'}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
          {isAdmin && (
            <button 
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm font-medium"
            >
              Add Transaction
            </button>
          )}
        </div>
      </div>

      {aiReport && (
        <div className="bg-indigo-900 text-indigo-50 p-6 rounded-2xl shadow-xl border border-indigo-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            ✨ Gemini AI Financial Insight
          </h3>
          <p className="text-indigo-200 leading-relaxed text-sm md:text-base">{aiReport}</p>
          <button onClick={() => setAiReport(null)} className="absolute top-4 right-4 text-indigo-400 hover:text-white">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Allocated" value={formatINR(stats.totalAllocated)} colorClass="bg-blue-100 text-blue-600" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Total Received" value={formatINR(stats.totalReceived)} colorClass="bg-green-100 text-green-600" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>} />
        <StatCard label="Total Spent" value={formatINR(stats.totalSpent)} colorClass="bg-red-100 text-red-600" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>} />
        <StatCard label="Balance Available" value={formatINR(stats.balance)} colorClass="bg-amber-100 text-amber-600" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Head-wise Spending (₹)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatINR(Number(value))} />
                <Legend />
                <Bar dataKey="spent" fill="#4F46E5" name="Spent" radius={[4, 4, 0, 0]} />
                <Bar dataKey="balance" fill="#D1D5DB" name="Unspent" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Expense Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => formatINR(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold">Financial Statements</h3>
          <span className="text-sm text-gray-500">{transactions.length} Records found</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Budget Head</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600">{t.date}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium px-2 py-1 rounded bg-gray-100 text-gray-700">{t.headName}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{t.description}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${t.type === TransactionType.RECEIPT ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === TransactionType.RECEIPT ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === TransactionType.RECEIPT ? '+' : '-'}{formatINR(t.amount)}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">No transactions recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">New Transaction</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              onAddTransaction({
                projectId: project.id,
                headName: formData.get('headName') as string,
                type: formData.get('type') as TransactionType,
                amount: Number(formData.get('amount')),
                date: formData.get('date') as string,
                description: formData.get('description') as string,
              });
              setShowModal(false);
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Head</label>
                <select name="headName" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                  {project.heads.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="type" value={TransactionType.EXPENDITURE} defaultChecked /> 
                    <span className="text-sm font-medium">Expenditure</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="type" value={TransactionType.RECEIPT} /> 
                    <span className="text-sm font-medium text-green-600">Receipt</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input type="number" name="amount" required className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" required className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" rows={3} placeholder="Add transaction details..."></textarea>
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 mt-2">
                Save Transaction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
