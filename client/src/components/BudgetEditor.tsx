"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Plus, Trash2, ChevronDown, ChevronUp, Edit2, Save, Target, Repeat } from "lucide-react";

interface BudgetEditorProps {
  content: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

interface BudgetCategory {
  id: string;
  name: string;
  allocatedAmount: number;
  spentAmount: number;
  color: string;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  isMonthly: boolean;
}

interface RecurringItem {
  id: string;
  name: string;
  amount: number;
  categoryId?: string;
  type: 'rent' | 'emi' | 'subscription' | 'bill' | 'other';
}

interface BudgetData {
  monthlyIncome: number;
  categories: BudgetCategory[];
  savingsGoals: SavingsGoal[];
  recurringItems: RecurringItem[];
  currency: string;
}

const COLORS = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#0088FE', '#00C49F'];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
];

export default function BudgetEditor({ content, onChange, readOnly }: BudgetEditorProps) {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(() => {
    try {
      if (!content || content.trim() === '') return 0;
      const parsed = JSON.parse(content);
      return parsed.monthlyIncome || 0;
    } catch {
      return 0;
    }
  });

  const [categories, setCategories] = useState<BudgetCategory[]>(() => {
    try {
      if (!content || content.trim() === '') return [];
      const parsed = JSON.parse(content);
      return parsed.categories || [];
    } catch {
      return [];
    }
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    try {
      if (!content || content.trim() === '') return [];
      const parsed = JSON.parse(content);
      return parsed.savingsGoals || [];
    } catch {
      return [];
    }
  });

  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>(() => {
    try {
      if (!content || content.trim() === '') return [];
      const parsed = JSON.parse(content);
      return parsed.recurringItems || [];
    } catch {
      return [];
    }
  });

  const [currency, setCurrency] = useState<string>(() => {
    try {
      if (!content || content.trim() === '') return 'USD';
      const parsed = JSON.parse(content);
      return parsed.currency || 'USD';
    } catch {
      return 'USD';
    }
  });

  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';

  // UI State
  const [tempIncome, setTempIncome] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryAmount, setNewCategoryAmount] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState('');
  
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  const [newGoalIsMonthly, setNewGoalIsMonthly] = useState(false);
  
  const [newRecurringName, setNewRecurringName] = useState('');
  const [newRecurringAmount, setNewRecurringAmount] = useState('');
  const [newRecurringType, setNewRecurringType] = useState<'rent' | 'emi' | 'subscription' | 'bill' | 'other'>('bill');
  const [newRecurringCategory, setNewRecurringCategory] = useState('');

  const saveData = (
    income: number,
    cats: BudgetCategory[],
    goals: SavingsGoal[],
    recurring: RecurringItem[],
    curr?: string
  ) => {
    const data: BudgetData = {
      monthlyIncome: income,
      categories: cats,
      savingsGoals: goals,
      recurringItems: recurring,
      currency: curr || currency
    };
    onChange(JSON.stringify(data));
  };

  // Income handlers
  const handleSetIncome = () => {
    if (!tempIncome) return;
    const income = parseFloat(tempIncome);
    setMonthlyIncome(income);
    setTempIncome('');
    saveData(income, categories, savingsGoals, recurringItems);
  };

  // Category handlers
  const handleAddCategory = () => {
    if (!newCategoryName.trim() || !newCategoryAmount) return;
    
    const newCategory: BudgetCategory = {
      id: crypto.randomUUID(),
      name: newCategoryName,
      allocatedAmount: parseFloat(newCategoryAmount),
      spentAmount: 0,
      color: COLORS[categories.length % COLORS.length]
    };
    
    const updated = [...categories, newCategory];
    setCategories(updated);
    setNewCategoryName('');
    setNewCategoryAmount('');
    saveData(monthlyIncome, updated, savingsGoals, recurringItems);
  };

  const handleUpdateCategoryAllocation = (categoryId: string, amount: number) => {
    const updated = categories.map(cat =>
      cat.id === categoryId ? { ...cat, allocatedAmount: amount } : cat
    );
    setCategories(updated);
    saveData(monthlyIncome, updated, savingsGoals, recurringItems);
  };

  const handleUpdateCategorySpent = (categoryId: string, amount: number) => {
    const updated = categories.map(cat =>
      cat.id === categoryId ? { ...cat, spentAmount: amount } : cat
    );
    setCategories(updated);
    saveData(monthlyIncome, updated, savingsGoals, recurringItems);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const updated = categories.filter(cat => cat.id !== categoryId);
    setCategories(updated);
    saveData(monthlyIncome, updated, savingsGoals, recurringItems);
  };

  // Savings goal handlers
  const handleAddSavingsGoal = () => {
    if (!newGoalName.trim() || !newGoalTarget) return;
    
    const newGoal: SavingsGoal = {
      id: crypto.randomUUID(),
      name: newGoalName,
      targetAmount: parseFloat(newGoalTarget),
      currentAmount: 0,
      deadline: newGoalDeadline || undefined,
      isMonthly: newGoalIsMonthly
    };
    
    const updated = [...savingsGoals, newGoal];
    setSavingsGoals(updated);
    setNewGoalName('');
    setNewGoalTarget('');
    setNewGoalDeadline('');
    setNewGoalIsMonthly(false);
    saveData(monthlyIncome, categories, updated, recurringItems);
  };

  const handleUpdateGoalProgress = (goalId: string, amount: number) => {
    const updated = savingsGoals.map(goal =>
      goal.id === goalId ? { ...goal, currentAmount: amount } : goal
    );
    setSavingsGoals(updated);
    saveData(monthlyIncome, categories, updated, recurringItems);
  };

  const handleDeleteGoal = (goalId: string) => {
    const updated = savingsGoals.filter(goal => goal.id !== goalId);
    setSavingsGoals(updated);
    saveData(monthlyIncome, categories, updated, recurringItems);
  };

  // Recurring item handlers
  const handleAddRecurringItem = () => {
    if (!newRecurringName.trim() || !newRecurringAmount) return;
    
    const newItem: RecurringItem = {
      id: crypto.randomUUID(),
      name: newRecurringName,
      amount: parseFloat(newRecurringAmount),
      categoryId: newRecurringCategory || undefined,
      type: newRecurringType
    };
    
    const updated = [...recurringItems, newItem];
    setRecurringItems(updated);
    setNewRecurringName('');
    setNewRecurringAmount('');
    setNewRecurringCategory('');
    saveData(monthlyIncome, categories, savingsGoals, updated);
  };

  const handleDeleteRecurringItem = (itemId: string) => {
    const updated = recurringItems.filter(item => item.id !== itemId);
    setRecurringItems(updated);
    saveData(monthlyIncome, categories, savingsGoals, updated);
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    saveData(monthlyIncome, categories, savingsGoals, recurringItems, newCurrency);
  };

  // Calculations
  const totalAllocated = categories.reduce((sum, cat) => sum + cat.allocatedAmount, 0);
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
  const totalRecurring = recurringItems.reduce((sum, item) => sum + item.amount, 0);
  const totalMonthlySavings = savingsGoals.filter(g => g.isMonthly).reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCommitted = totalAllocated + totalRecurring + totalMonthlySavings;
  const unassigned = monthlyIncome - totalCommitted;

  const categoryData = categories.map(cat => ({
    name: cat.name,
    value: cat.allocatedAmount,
    fill: cat.color
  })).filter(d => d.value > 0);

  return (
    <div className="h-full w-full bg-[#0a0a0a] p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-white">Monthly Budget Manager</h2>
            {!readOnly && (
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="bg-[#27272a] text-white rounded-lg px-4 py-2 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.name} ({curr.code})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Monthly Income Section */}
        <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Monthly Income</h3>
          {!readOnly ? (
            <div className="flex gap-3 mb-4">
              <input
                type="number"
                placeholder="Enter your monthly income..."
                value={tempIncome}
                onChange={(e) => setTempIncome(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSetIncome()}
                className="flex-1 bg-[#27272a] text-white rounded-lg px-4 py-3 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
              />
              <button
                onClick={handleSetIncome}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
              >
                Set Income
              </button>
            </div>
          ) : null}
          <div className="text-4xl font-bold text-green-500">
            {currencySymbol}{monthlyIncome.toLocaleString()}
          </div>
        </div>

        {/* Dashboard Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#18181b] p-6 rounded-2xl border border-[#27272a]">
            <h3 className="text-[#a1a1aa] font-medium mb-2 text-sm">Total Planned Budget</h3>
            <p className="text-2xl font-bold text-white">{currencySymbol}{totalAllocated.toLocaleString()}</p>
          </div>
          <div className="bg-[#18181b] p-6 rounded-2xl border border-[#27272a]">
            <h3 className="text-[#a1a1aa] font-medium mb-2 text-sm">Recurring Expenses</h3>
            <p className="text-2xl font-bold text-orange-400">{currencySymbol}{totalRecurring.toLocaleString()}</p>
          </div>
          <div className="bg-[#18181b] p-6 rounded-2xl border border-[#27272a]">
            <h3 className="text-[#a1a1aa] font-medium mb-2 text-sm">Monthly Savings</h3>
            <p className="text-2xl font-bold text-blue-400">{currencySymbol}{totalMonthlySavings.toLocaleString()}</p>
          </div>
          <div className="bg-[#18181b] p-6 rounded-2xl border border-[#27272a]">
            <h3 className="text-[#a1a1aa] font-medium mb-2 text-sm">Unassigned Money</h3>
            <p className={`text-2xl font-bold ${unassigned >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {currencySymbol}{unassigned.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Budget Visualization */}
        {categoryData.length > 0 && (
          <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-6">
            <h3 className="text-white font-semibold mb-4 text-lg">Budget Allocation</h3>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${currencySymbol}${entry.value.toLocaleString()}`}
                  outerRadius={130}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${currencySymbol}${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Budget Categories */}
        <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold text-lg">Budget Categories</h3>
          </div>

          <div className="space-y-4">
            {categories.map(cat => (
              <div key={cat.id} className="bg-[#27272a]/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-3 h-8 rounded" style={{ backgroundColor: cat.color }} />
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{cat.name}</h4>
                      <p className="text-[#a1a1aa] text-sm">
                        Spent: {currencySymbol}{cat.spentAmount.toLocaleString()} / {currencySymbol}{cat.allocatedAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!readOnly && (
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-[#a1a1aa] hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="h-2 bg-[#18181b] rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${Math.min((cat.spentAmount / cat.allocatedAmount) * 100, 100)}%`,
                        backgroundColor: cat.spentAmount > cat.allocatedAmount ? '#f87171' : cat.color
                      }}
                    />
                  </div>
                </div>

                {!readOnly && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[#a1a1aa] text-xs mb-1 block">Allocated</label>
                      <input
                        type="number"
                        value={cat.allocatedAmount}
                        onChange={(e) => handleUpdateCategoryAllocation(cat.id, parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#18181b] text-white text-sm rounded px-3 py-2 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
                      />
                    </div>
                    <div>
                      <label className="text-[#a1a1aa] text-xs mb-1 block">Spent</label>
                      <input
                        type="number"
                        value={cat.spentAmount}
                        onChange={(e) => handleUpdateCategorySpent(cat.id, parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#18181b] text-white text-sm rounded px-3 py-2 border border-[#3f3f46] focus:outline-none focus:border-red-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {!readOnly && (
              <div className="bg-[#27272a]/30 rounded-lg p-4 border-2 border-dashed border-[#3f3f46]">
                <h5 className="text-[#a1a1aa] text-sm font-semibold mb-3">Add Budget Category</h5>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Category name (e.g., Food)"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="bg-[#18181b] text-white text-sm rounded px-3 py-2 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
                  />
                  <input
                    type="number"
                    placeholder="Budget amount"
                    value={newCategoryAmount}
                    onChange={(e) => setNewCategoryAmount(e.target.value)}
                    className="bg-[#18181b] text-white text-sm rounded px-3 py-2 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
                  />
                </div>
                <button
                  onClick={handleAddCategory}
                  className="w-full bg-[#f472b6] hover:bg-[#ec4899] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Add Category
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recurring Expenses */}
        <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-6">
          <div className="flex items-center gap-2 mb-6">
            <Repeat size={20} className="text-[#f472b6]" />
            <h3 className="text-white font-semibold text-lg">Recurring Expenses</h3>
          </div>

          <div className="space-y-3">
            {recurringItems.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-[#27272a]/30 rounded-lg p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-white font-medium">{item.name}</h4>
                    <span className="text-xs bg-[#3f3f46] text-[#a1a1aa] px-2 py-1 rounded">{item.type}</span>
                  </div>
                  <p className="text-[#a1a1aa] text-sm mt-1">
                    {currencySymbol}{item.amount.toLocaleString()} per month
                  </p>
                </div>
                {!readOnly && (
                  <button
                    onClick={() => handleDeleteRecurringItem(item.id)}
                    className="text-[#a1a1aa] hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}

            {!readOnly && (
              <div className="bg-[#27272a]/30 rounded-lg p-4 border-2 border-dashed border-[#3f3f46]">
                <h5 className="text-[#a1a1aa] text-sm font-semibold mb-3">Add Recurring Expense</h5>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Name (e.g., Rent)"
                    value={newRecurringName}
                    onChange={(e) => setNewRecurringName(e.target.value)}
                    className="bg-[#18181b] text-white text-sm rounded px-3 py-2 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newRecurringAmount}
                    onChange={(e) => setNewRecurringAmount(e.target.value)}
                    className="bg-[#18181b] text-white text-sm rounded px-3 py-2 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
                  />
                </div>
                <select
                  value={newRecurringType}
                  onChange={(e) => setNewRecurringType(e.target.value as any)}
                  className="w-full bg-[#18181b] text-white text-sm rounded px-3 py-2 mb-3 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
                >
                  <option value="rent">Rent</option>
                  <option value="emi">EMI</option>
                  <option value="subscription">Subscription</option>
                  <option value="bill">Bill</option>
                  <option value="other">Other</option>
                </select>
                <button
                  onClick={handleAddRecurringItem}
                  className="w-full bg-[#f472b6] hover:bg-[#ec4899] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Add Recurring Expense
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Savings Goals */}
        <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-6">
          <div className="flex items-center gap-2 mb-6">
            <Target size={20} className="text-green-500" />
            <h3 className="text-white font-semibold text-lg">Savings Goals</h3>
          </div>

          <div className="space-y-4">
            {savingsGoals.map(goal => (
              <div key={goal.id} className="bg-[#27272a]/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-medium">{goal.name}</h4>
                      {goal.isMonthly && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Monthly</span>
                      )}
                    </div>
                    <p className="text-[#a1a1aa] text-sm mt-1">
                      {currencySymbol}{goal.currentAmount.toLocaleString()} / {currencySymbol}{goal.targetAmount.toLocaleString()}
                      {goal.deadline && ` • Due: ${new Date(goal.deadline).toLocaleDateString()}`}
                    </p>
                  </div>
                  {!readOnly && (
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-[#a1a1aa] hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="h-3 bg-[#18181b] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                      style={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#a1a1aa] mt-1 text-right">
                    {((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}% Complete
                  </p>
                </div>

                {!readOnly && (
                  <div>
                    <label className="text-[#a1a1aa] text-xs mb-1 block">Update Progress</label>
                    <input
                      type="number"
                      value={goal.currentAmount}
                      onChange={(e) => handleUpdateGoalProgress(goal.id, parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#18181b] text-white text-sm rounded px-3 py-2 border border-[#3f3f46] focus:outline-none focus:border-green-500"
                    />
                  </div>
                )}
              </div>
            ))}

            {!readOnly && (
              <div className="bg-[#27272a]/30 rounded-lg p-4 border-2 border-dashed border-[#3f3f46]">
                <h5 className="text-[#a1a1aa] text-sm font-semibold mb-3">Add Savings Goal</h5>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Goal name (e.g., Emergency Fund)"
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                    className="w-full bg-[#18181b] text-white text-sm rounded px-3 py-2 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Target amount"
                      value={newGoalTarget}
                      onChange={(e) => setNewGoalTarget(e.target.value)}
                      className="bg-[#18181b] text-white text-sm rounded px-3 py-2 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
                    />
                    <input
                      type="date"
                      placeholder="Deadline (optional)"
                      value={newGoalDeadline}
                      onChange={(e) => setNewGoalDeadline(e.target.value)}
                      className="bg-[#18181b] text-white text-sm rounded px-3 py-2 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-white text-sm">
                    <input
                      type="checkbox"
                      checked={newGoalIsMonthly}
                      onChange={(e) => setNewGoalIsMonthly(e.target.checked)}
                      className="rounded"
                    />
                    Monthly savings goal
                  </label>
                  <button
                    onClick={handleAddSavingsGoal}
                    className="w-full bg-[#f472b6] hover:bg-[#ec4899] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Add Savings Goal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
