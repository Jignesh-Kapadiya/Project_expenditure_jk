
import React, { useState, useEffect } from 'react';
import { User, Project, Transaction, UserRole, TransactionType, BudgetHead } from './types';
import { INITIAL_USERS, INITIAL_PROJECTS, INITIAL_TRANSACTIONS, formatINR, BUDGET_HEAD_OPTIONS } from './constants';
import Layout from './components/Layout';
import ProjectDetail from './components/ProjectDetail';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('fin_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('fin_all_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('fin_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('fin_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isManagingUsers, setIsManagingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('fin_projects', JSON.stringify(projects));
    localStorage.setItem('fin_transactions', JSON.stringify(transactions));
    localStorage.setItem('fin_all_users', JSON.stringify(users));
  }, [projects, transactions, users]);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const user = users.find(u => u.username === username);
    
    if (user && user.password === password) {
      const { password: _, ...userWithoutPassword } = user;
      setCurrentUser(userWithoutPassword);
      localStorage.setItem('fin_user', JSON.stringify(userWithoutPassword));
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('fin_user');
    setSelectedProjectId(null);
  };

  const handleAddOrUpdateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;

    if (!editingUser && users.some(u => u.username === username)) {
      alert('Username already exists!');
      return;
    }

    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? {
        ...u,
        name: formData.get('name') as string,
        username: username,
        password: formData.get('password') as string || u.password
      } : u));
      setEditingUser(null);
    } else {
      const newUser: User = {
        id: `u${Date.now()}`,
        name: formData.get('name') as string,
        username: username,
        password: formData.get('password') as string,
        role: UserRole.INVESTIGATOR
      };
      setUsers([...users, newUser]);
    }
    e.currentTarget.reset();
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot delete your own account.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this investigator? All access will be revoked.")) {
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  const handleChangePassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPass = formData.get('newPassword') as string;
    const confirmPass = formData.get('confirmPassword') as string;

    if (newPass !== confirmPass) {
      alert("Passwords do not match!");
      return;
    }

    setUsers(users.map(u => u.id === currentUser?.id ? { ...u, password: newPass } : u));
    setIsChangingPassword(false);
    alert("Password updated successfully!");
  };

  const handleResetPassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const oldPassword = formData.get('oldPassword') as string;
    const newPass = formData.get('newPassword') as string;
    const confirmPass = formData.get('confirmPassword') as string;

    const user = users.find(u => u.username === username && u.password === oldPassword);

    if (!user) {
      alert("Verification failed. Incorrect username or old password.");
      return;
    }

    if (newPass !== confirmPass) {
      alert("New passwords do not match!");
      return;
    }

    setUsers(users.map(u => u.id === user.id ? { ...u, password: newPass } : u));
    setIsResettingPassword(false);
    alert("Password updated successfully. Please login with your new credentials.");
  };

  const handleAddOrUpdateProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const piId = formData.get('piId') as string;
    const piUser = users.find(u => u.id === piId);
    
    const heads: BudgetHead[] = BUDGET_HEAD_OPTIONS.map(name => ({
      name,
      allocated: Number(formData.get(`budget_${name}`) || 0)
    })).filter(h => h.allocated > 0);

    if (editingProject) {
      setProjects(projects.map(p => p.id === editingProject.id ? {
        ...p,
        title: formData.get('title') as string,
        piId: piId,
        piName: piUser?.name || 'Unknown PI',
        agency: formData.get('agency') as string,
        duration: formData.get('duration') as string,
        heads
      } : p));
      setEditingProject(null);
    } else {
      const projectId = `p${Date.now()}`;
      const newProject: Project = {
        id: projectId,
        title: formData.get('title') as string,
        piId: piId,
        piName: piUser?.name || 'Unknown PI',
        agency: formData.get('agency') as string,
        duration: formData.get('duration') as string,
        createdAt: new Date().toISOString().split('T')[0],
        heads
      };
      setProjects([...projects, newProject]);
    }
    setIsAddingProject(false);
  };

  const handleDeleteProject = (projectId: string) => {
    if (window.confirm("Are you sure you want to delete this project and all its transactions? This action is irreversible.")) {
      setProjects(projects.filter(p => p.id !== projectId));
      setTransactions(transactions.filter(t => t.projectId !== projectId));
      setUsers(users.map(u => u.projectId === projectId ? { ...u, projectId: undefined } : u));
    }
  };

  const handleAddTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...t,
      id: `t${Date.now()}`
    };
    setTransactions([...transactions, newTransaction]);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-indigo-100">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-indigo-600 p-4 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 text-center">Project Dashboard Portal</h2>
            <p className="text-gray-500 text-sm mt-2">Secure access to research funds</p>
          </div>

          {loginError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
              <input 
                name="username" 
                required 
                className="w-full border border-gray-200 rounded-xl p-3.5 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400" 
                placeholder="Enter username" 
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <button 
                  type="button" 
                  onClick={() => setIsResettingPassword(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <input 
                type="password"
                name="password" 
                required 
                className="w-full border border-gray-200 rounded-xl p-3.5 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400" 
                placeholder="••••••••" 
              />
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 mt-4">
              Sign In
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
             <p className="text-xs text-gray-400 leading-relaxed uppercase tracking-widest font-bold">
               Research Financial Portal
             </p>
          </div>

          {isResettingPassword && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[120] p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-8 animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Reset Password</h3>
                  <button onClick={() => setIsResettingPassword(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>
                <p className="text-sm text-gray-500 mb-6 font-medium italic">Update your security credentials by verifying your old password.</p>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Username</label>
                    <input name="username" required className="w-full border border-gray-200 rounded-xl p-3 focus:ring-4 focus:ring-indigo-100 outline-none" placeholder="Enter your username" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Old Password</label>
                    <input type="password" name="oldPassword" required className="w-full border border-gray-200 rounded-xl p-3 focus:ring-4 focus:ring-indigo-100 outline-none" placeholder="Enter current password" />
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">New Password</label>
                    <input type="password" name="newPassword" required className="w-full border border-gray-200 rounded-xl p-3 focus:ring-4 focus:ring-indigo-100 outline-none" placeholder="Enter new password" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirm New Password</label>
                    <input type="password" name="confirmPassword" required className="w-full border border-gray-200 rounded-xl p-3 focus:ring-4 focus:ring-indigo-100 outline-none" placeholder="Re-enter new password" />
                  </div>
                  <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all mt-4">
                    Update Password
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const filteredProjects = currentUser.role === UserRole.ADMIN 
    ? projects 
    : projects.filter(p => p.id === currentUser.projectId || p.piId === currentUser.id);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (selectedProject) {
    return (
      <Layout user={currentUser} onLogout={handleLogout} onChangePassword={() => setIsChangingPassword(true)}>
        <ProjectDetail 
          project={selectedProject} 
          transactions={transactions.filter(t => t.projectId === selectedProject.id)}
          userRole={currentUser.role}
          onAddTransaction={handleAddTransaction}
          onBack={() => setSelectedProjectId(null)}
        />
      </Layout>
    );
  }

  return (
    <Layout user={currentUser} onLogout={handleLogout} onChangePassword={() => setIsChangingPassword(true)}>
      <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Active Projects</h2>
            <p className="text-gray-500 mt-1">Summary of research grants and funding</p>
          </div>
          {currentUser.role === UserRole.ADMIN && (
            <div className="flex gap-3">
              <button 
                onClick={() => setIsManagingUsers(true)}
                className="inline-flex items-center px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-all active:scale-95"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Manage Investigators
              </button>
              <button 
                onClick={() => setIsAddingProject(true)}
                className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                New Project
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((p) => {
            const projectTrans = transactions.filter(t => t.projectId === p.id);
            const spent = projectTrans.filter(t => t.type === TransactionType.EXPENDITURE).reduce((acc, t) => acc + t.amount, 0);
            const total = p.heads.reduce((acc, h) => acc + h.allocated, 0);
            const percent = total > 0 ? (spent / total) * 100 : 0;

            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden flex flex-col relative">
                {currentUser.role === UserRole.ADMIN && (
                  <div className="absolute top-4 right-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingProject(p); setIsAddingProject(true); }}
                      className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-gray-100 text-gray-600 hover:text-indigo-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }}
                      className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-gray-100 text-gray-600 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                )}
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      {p.agency}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">{p.duration}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">{p.title}</h3>
                  <p className="text-sm text-gray-500 mb-6 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {p.piName}
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500 font-medium">Utilization</span>
                      <span className="text-gray-900 font-bold">{percent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${percent > 90 ? 'bg-red-500' : percent > 70 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-0.5">Spent</p>
                        <p className="text-sm font-bold text-gray-900">{formatINR(spent)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-0.5">Total</p>
                        <p className="text-sm font-bold text-gray-900">{formatINR(total)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedProjectId(p.id)}
                  className="w-full py-4 bg-gray-50 border-t border-gray-100 text-indigo-600 font-bold text-sm hover:bg-indigo-600 hover:text-white transition-all group-hover:border-indigo-600"
                >
                  View Details →
                </button>
              </div>
            );
          })}
        </div>

        {/* Investigator Management Modal */}
        {isManagingUsers && currentUser.role === UserRole.ADMIN && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">Investigator Directory</h3>
                            <p className="text-sm text-gray-500 mt-1">Manage project investigator accounts and access</p>
                        </div>
                        <button onClick={() => { setIsManagingUsers(false); setEditingUser(null); }} className="text-gray-400 hover:text-gray-600 text-3xl p-2 leading-none">×</button>
                    </div>
                    <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                        <div className="w-full md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-gray-100 overflow-y-auto">
                            <h4 className="text-lg font-bold text-gray-900 mb-6">{editingUser ? 'Update Investigator' : 'Add New Investigator'}</h4>
                            <form onSubmit={handleAddOrUpdateUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
                                    <input name="name" required defaultValue={editingUser?.name || ''} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-4 focus:ring-indigo-100 outline-none" placeholder="e.g. Dr. John Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Username</label>
                                    <input name="username" required defaultValue={editingUser?.username || ''} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-4 focus:ring-indigo-100 outline-none" placeholder="e.g. jdoe_pi" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">{editingUser ? 'New Password (leave blank to keep)' : 'Initial Password'}</label>
                                    <input type="text" name="password" required={!editingUser} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-4 focus:ring-indigo-100 outline-none" placeholder="••••••••" />
                                </div>
                                <div className="flex gap-2">
                                  {editingUser && (
                                    <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all mt-4">
                                      Cancel
                                    </button>
                                  )}
                                  <button type="submit" className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all mt-4">
                                      {editingUser ? 'Save Changes' : 'Create Account'}
                                  </button>
                                </div>
                            </form>
                        </div>
                        <div className="w-full md:w-1/2 p-8 bg-gray-50/30 overflow-y-auto">
                            <h4 className="text-lg font-bold text-gray-900 mb-6">Existing Investigators</h4>
                            <div className="space-y-3">
                                {users.filter(u => u.role === UserRole.INVESTIGATOR).map(u => (
                                    <div key={u.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                              <span className="font-bold text-gray-900 block">{u.name}</span>
                                              <span className="text-xs text-gray-500 font-medium">@{u.username}</span>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button onClick={() => setEditingUser(u)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                              </button>
                                              <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                              </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Project Create/Edit Modal */}
        {isAddingProject && currentUser.role === UserRole.ADMIN && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{editingProject ? 'Update Project' : 'Configure New Project'}</h3>
                  <p className="text-sm text-gray-500 mt-1">Setup budget heads and PI assignment</p>
                </div>
                <button onClick={() => { setIsAddingProject(false); setEditingProject(null); }} className="text-gray-400 hover:text-gray-600 text-3xl p-2 leading-none">×</button>
              </div>
              <form onSubmit={handleAddOrUpdateProject} className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Project Title</label>
                    <input name="title" required defaultValue={editingProject?.title || ''} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-4 focus:ring-indigo-100 outline-none" placeholder="e.g. AI Research for Climate Change" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Funding Agency</label>
                    <input name="agency" required defaultValue={editingProject?.agency || ''} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-4 focus:ring-indigo-100 outline-none" placeholder="e.g. DST, SERB, ICAR" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Duration</label>
                    <input name="duration" required defaultValue={editingProject?.duration || ''} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-4 focus:ring-indigo-100 outline-none" placeholder="e.g. 2024 - 2027" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Assigned Investigator (PI)</label>
                    <select name="piId" required defaultValue={editingProject?.piId || ''} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-4 focus:ring-indigo-100 outline-none">
                      <option value="">Select Investigator</option>
                      {users.filter(u => u.role === UserRole.INVESTIGATOR).map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    Budget Allocation (₹)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {BUDGET_HEAD_OPTIONS.map(head => {
                      const existingAlloc = editingProject?.heads.find(h => h.name === head)?.allocated || '';
                      return (
                        <div key={head} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-4">
                          <span className="text-sm font-semibold text-gray-700">{head}</span>
                          <input 
                            type="number" 
                            name={`budget_${head}`} 
                            defaultValue={existingAlloc}
                            className="w-32 bg-white border border-gray-200 rounded-lg p-2 text-right font-mono outline-none focus:ring-2 focus:ring-indigo-500" 
                            placeholder="0" 
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100 flex gap-4">
                  <button type="button" onClick={() => { setIsAddingProject(false); setEditingProject(null); }} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all">Cancel</button>
                  <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100">
                    {editingProject ? 'Save Changes' : 'Initialize Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Password Modal (For Logged-in Users) */}
        {isChangingPassword && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Security Settings</h3>
                <button onClick={() => setIsChangingPassword(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>
              <p className="text-sm text-gray-500 mb-6 italic font-medium">Updating security credentials for {currentUser.name}</p>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">New Password</label>
                  <input type="password" name="newPassword" required className="w-full border border-gray-200 rounded-xl p-3.5 focus:ring-4 focus:ring-indigo-100 outline-none" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirm New Password</label>
                  <input type="password" name="confirmPassword" required className="w-full border border-gray-200 rounded-xl p-3.5 focus:ring-4 focus:ring-indigo-100 outline-none" placeholder="••••••••" />
                </div>
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all mt-4">
                  Update Password
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
