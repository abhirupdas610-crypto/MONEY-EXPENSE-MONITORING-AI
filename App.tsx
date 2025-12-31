
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  History, 
  Scan, 
  Settings as SettingsIcon, 
  Plus,
  Bell,
  Sparkles
} from 'lucide-react';
import { Expense, AppSettings, AppTab, UserProfile } from './types';
import { STORAGE_KEY, SETTINGS_KEY, USER_KEY, CATEGORIES } from './constants';
import Dashboard from './components/Dashboard';
import BillScanner from './components/BillScanner';
import ImageEditor from './components/ImageEditor';
import RegistrationForm from './components/RegistrationForm';
import { subMonths, isAfter, parseISO, format } from 'date-fns';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    weeklyLimit: 5000,
    phoneNumber: ''
  });
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    amount: 0,
    category: 'Other',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [notifications, setNotifications] = useState<string[]>([]);

  // Load data
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    if (stored) {
      const parsed = JSON.parse(stored) as Expense[];
      // Keep only 2 months data
      const twoMonthsAgo = subMonths(new Date(), 2);
      const filtered = parsed.filter(e => isAfter(parseISO(e.date), twoMonthsAgo));
      setExpenses(filtered);
    }
    
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
  }, []);

  // Save data
  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [expenses, settings, user]);

  const handleRegister = (profile: UserProfile) => {
    setUser(profile);
    setSettings(prev => ({ ...prev, phoneNumber: `+91 ${profile.mobile}` }));
  };

  const addExpense = (exp: Partial<Expense>) => {
    const fullExpense: Expense = {
      id: crypto.randomUUID(),
      amount: exp.amount || 0,
      category: exp.category || 'Other',
      description: exp.description || '',
      date: exp.date || new Date().toISOString()
    };
    
    const updatedExpenses = [fullExpense, ...expenses];
    setExpenses(updatedExpenses);
    
    // Check limit for current week
    const currentWeekTotal = updatedExpenses.reduce((sum, e) => {
        // Simple logic for the demo: sum up everything added to check if it triggers limit
        // In real app we'd calculate start of week to now
        return sum + e.amount;
    }, 0); 
    
    if (currentWeekTotal > settings.weeklyLimit) {
      const msg = `ALERT: Weekly limit of ₹${settings.weeklyLimit} exceeded! SMS sent to ${settings.phoneNumber}`;
      setNotifications(prev => [msg, ...prev]);
    }
    
    setShowAddForm(false);
    setActiveTab(AppTab.DASHBOARD);
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense(newExpense);
    setNewExpense({
      amount: 0,
      category: 'Other',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const NavButton = ({ tab, icon: Icon, label }: { tab: AppTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex flex-col items-center py-2 px-4 transition-all ${
        activeTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <Icon size={24} className={activeTab === tab ? 'scale-110' : ''} />
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
  );

  if (!user) {
    return <RegistrationForm onRegister={handleRegister} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-600 leading-tight">
              SpendWise AI
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Hi, {user.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all">
            <Bell size={24} />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pt-6">
        {notifications.length > 0 && (
          <div className="mb-6 space-y-2">
            {notifications.slice(0, 1).map((note, idx) => (
              <div key={idx} className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-bounce-short">
                <div className="flex items-center">
                  <Bell className="mr-2" size={18} />
                  <span className="text-sm font-medium">{note}</span>
                </div>
                <button onClick={() => setNotifications([])} className="text-red-400 hover:text-red-600">
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === AppTab.DASHBOARD && <Dashboard expenses={expenses} settings={settings} />}
        
        {activeTab === AppTab.SCANNER && <BillScanner onExpenseExtracted={addExpense} />}
        
        {activeTab === AppTab.EDITOR && <ImageEditor />}

        {activeTab === AppTab.HISTORY && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-black">Recent Transactions</h3>
              <span className="text-xs text-slate-400">Past 2 months</span>
            </div>
            <div className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  No expenses found. Start tracking!
                </div>
              ) : (
                expenses.map(exp => (
                  <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                        {exp.category[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-black">{exp.description || exp.category}</p>
                        <p className="text-xs text-slate-400">{format(parseISO(exp.date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <p className="font-bold text-black">-₹{exp.amount.toLocaleString('en-IN')}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === AppTab.SETTINGS && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-lg mx-auto">
            <h3 className="text-xl font-bold text-black mb-6">Application Settings</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Weekly Expense Limit (₹)</label>
                <input 
                  type="number" 
                  value={settings.weeklyLimit}
                  onChange={(e) => setSettings({...settings, weeklyLimit: Number(e.target.value)})}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">SMS Notification Number</label>
                <input 
                  type="tel" 
                  disabled
                  value={settings.phoneNumber}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1">Number linked to your profile</p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-xl text-indigo-700 text-sm">
                <p><strong>Note:</strong> Data is automatically pruned to keep only the last 2 months of history for optimal performance.</p>
              </div>
              <button 
                onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                }}
                className="w-full py-3 text-red-500 font-semibold border border-red-100 rounded-xl hover:bg-red-50 transition-colors"
              >
                Reset App & Profile
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Add Button */}
      {activeTab !== AppTab.EDITOR && (
        <button 
          onClick={() => setShowAddForm(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
        >
          <Plus size={32} />
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 py-1 flex justify-around items-center z-50 safe-area-inset-bottom shadow-2xl">
        <NavButton tab={AppTab.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
        <NavButton tab={AppTab.HISTORY} icon={History} label="History" />
        <div className="w-12"></div>
        <NavButton tab={AppTab.SCANNER} icon={Scan} label="Scan Bill" />
        <NavButton tab={AppTab.EDITOR} icon={Sparkles} label="AI Editor" />
        <NavButton tab={AppTab.SETTINGS} icon={SettingsIcon} label="Settings" />
      </nav>

      {/* Manual Add Form Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-black">Add Expense</h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
                Cancel
              </button>
            </div>
            <form onSubmit={handleManualAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Amount (₹)</label>
                <input 
                  autoFocus
                  required
                  type="number" 
                  step="0.01"
                  value={newExpense.amount || ''}
                  onChange={(e) => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 text-xl font-bold text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
                <select 
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 text-black font-medium"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
                <input 
                  type="text" 
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 text-black font-medium"
                  placeholder="What was this for?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
                <input 
                  type="date" 
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 text-black font-medium"
                />
              </div>
              <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all mt-4">
                Save Expense
              </button>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-short {
          animation: bounce-short 1s infinite ease-in-out;
        }
      `}} />
    </div>
  );
};

export default App;
