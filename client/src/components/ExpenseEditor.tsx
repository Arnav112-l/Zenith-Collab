'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Save, Tag, Calendar, DollarSign, TrendingUp, PieChart as PieChartIcon } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'

interface ExpenseEditorProps {
  content: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

interface Category {
  id: string;
  name: string;
  color: string;
  budget?: number;
}

interface Expense {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  date: string;
  paidBy?: string;
}

interface ExpenseData {
  categories: Category[];
  expenses: Expense[];
  currency: string;
}

const COLORS = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c', '#22d3ee'];

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

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Food & Dining', color: '#f472b6' },
  { id: '2', name: 'Travel', color: '#60a5fa' },
  { id: '3', name: 'Shopping', color: '#34d399' },
  { id: '4', name: 'Entertainment', color: '#fbbf24' },
  { id: '5', name: 'Bills & Utilities', color: '#f87171' },
  { id: '6', name: 'Healthcare', color: '#a78bfa' },
  { id: '7', name: 'Transportation', color: '#fb923c' },
  { id: '8', name: 'Other', color: '#22d3ee' },
];

export default function ExpenseEditor({ content, onChange, readOnly }: ExpenseEditorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currency, setCurrency] = useState<string>('USD');

  // Form states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryBudget, setNewCategoryBudget] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseDescription, setNewExpenseDescription] = useState('');
  const [newExpenseDate, setNewExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [newExpensePaidBy, setNewExpensePaidBy] = useState('');

  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editPaidBy, setEditPaidBy] = useState('');

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Initialize data
  useEffect(() => {
    try {
      if (content && content.trim()) {
        const data: ExpenseData = JSON.parse(content);
        setCategories(data.categories || DEFAULT_CATEGORIES);
        setExpenses(data.expenses || []);
        setCurrency(data.currency || 'USD');
      } else {
        setCategories(DEFAULT_CATEGORIES);
        setExpenses([]);
        setCurrency('USD');
      }
    } catch (error) {
      console.error('Error parsing expense data:', error);
      setCategories(DEFAULT_CATEGORIES);
      setExpenses([]);
      setCurrency('USD');
    }
  }, [content]);

  const saveData = (cats: Category[], exps: Expense[], curr: string) => {
    const data: ExpenseData = {
      categories: cats,
      expenses: exps,
      currency: curr
    };
    onChange(JSON.stringify(data, null, 2));
  };

  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';

  // Category handlers
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      color: COLORS[categories.length % COLORS.length],
      budget: newCategoryBudget ? parseFloat(newCategoryBudget) : undefined
    };
    const updated = [...categories, newCategory];
    setCategories(updated);
    setNewCategoryName('');
    setNewCategoryBudget('');
    saveData(updated, expenses, currency);
  };

  const handleUpdateCategoryBudget = (categoryId: string, budget: number) => {
    const updated = categories.map(cat =>
      cat.id === categoryId ? { ...cat, budget } : cat
    );
    setCategories(updated);
    saveData(updated, expenses, currency);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const updated = categories.filter(cat => cat.id !== categoryId);
    const updatedExpenses = expenses.filter(exp => exp.categoryId !== categoryId);
    setCategories(updated);
    setExpenses(updatedExpenses);
    saveData(updated, updatedExpenses, currency);
  };

  // Expense handlers
  const handleAddExpense = () => {
    if (!newExpenseCategory || !newExpenseAmount || !newExpenseDescription.trim()) return;
    const newExpense: Expense = {
      id: Date.now().toString(),
      categoryId: newExpenseCategory,
      amount: parseFloat(newExpenseAmount),
      description: newExpenseDescription.trim(),
      date: newExpenseDate,
      paidBy: newExpensePaidBy.trim() || undefined
    };
    const updated = [...expenses, newExpense];
    setExpenses(updated);
    setNewExpenseCategory('');
    setNewExpenseAmount('');
    setNewExpenseDescription('');
    setNewExpenseDate(new Date().toISOString().split('T')[0]);
    setNewExpensePaidBy('');
    saveData(categories, updated, currency);
  };

  const handleStartEditExpense = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setEditAmount(expense.amount.toString());
    setEditDescription(expense.description);
    setEditDate(expense.date);
    setEditPaidBy(expense.paidBy || '');
  };

  const handleSaveExpense = (expenseId: string) => {
    const updated = expenses.map(exp =>
      exp.id === expenseId
        ? {
            ...exp,
            amount: parseFloat(editAmount),
            description: editDescription,
            date: editDate,
            paidBy: editPaidBy.trim() || undefined
          }
        : exp
    );
    setExpenses(updated);
    setEditingExpenseId(null);
    saveData(categories, updated, currency);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updated = expenses.filter(exp => exp.id !== expenseId);
    setExpenses(updated);
    saveData(categories, updated, currency);
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    saveData(categories, expenses, newCurrency);
  };

  // Calculations
  const getCategoryExpenses = (categoryId: string) => {
    return expenses
      .filter(exp => exp.categoryId === categoryId)
      .reduce((sum, exp) => sum + exp.amount, 0);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const categoryData = categories.map(cat => ({
    name: cat.name,
    value: getCategoryExpenses(cat.id),
    fill: cat.color
  })).filter(cat => cat.value > 0);

  // Filtered expenses
  const filteredExpenses = expenses.filter(exp => {
    if (filterCategory !== 'all' && exp.categoryId !== filterCategory) return false;
    if (filterDateFrom && exp.date < filterDateFrom) return false;
    if (filterDateTo && exp.date > filterDateTo) return false;
    return true;
  });

  const filteredTotal = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || 'Unknown';
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.color || '#888';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Expense Tracker</h2>
            <p className="text-[#a1a1aa]">Track and categorize your expenses</p>
          </div>
          <select
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            disabled={readOnly}
            className="bg-[#18181b] text-white px-4 py-2 rounded-lg border border-[#27272a] focus:outline-none focus:border-[#f472b6]"
          >
            {CURRENCIES.map(curr => (
              <option key={curr.code} value={curr.code}>
                {curr.symbol} {curr.name}
              </option>
            ))}
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#18181b] rounded-xl border border-[#27272a] p-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={20} className="text-[#f472b6]" />
              <h3 className="text-[#a1a1aa] font-medium text-sm">Total Expenses</h3>
            </div>
            <p className="text-3xl font-bold text-white">{currencySymbol}{totalExpenses.toLocaleString()}</p>
          </div>
          <div className="bg-[#18181b] rounded-xl border border-[#27272a] p-6">
            <div className="flex items-center gap-2 mb-2">
              <Tag size={20} className="text-[#60a5fa]" />
              <h3 className="text-[#a1a1aa] font-medium text-sm">Categories</h3>
            </div>
            <p className="text-3xl font-bold text-white">{categories.length}</p>
          </div>
          <div className="bg-[#18181b] rounded-xl border border-[#27272a] p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} className="text-[#34d399]" />
              <h3 className="text-[#a1a1aa] font-medium text-sm">Total Transactions</h3>
            </div>
            <p className="text-3xl font-bold text-white">{expenses.length}</p>
          </div>
        </div>

        {/* Visualization */}
        {categoryData.length > 0 && (
          <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon size={20} className="text-[#f472b6]" />
              <h3 className="text-white font-semibold text-lg">Expense Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${currencySymbol}${entry.value.toLocaleString()}`}
                  outerRadius={100}
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

        {/* Categories Management */}
        <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-6">
          <div className="flex items-center gap-2 mb-6">
            <Tag size={20} className="text-[#f472b6]" />
            <h3 className="text-white font-semibold text-lg">Expense Categories</h3>
          </div>

          <div className="space-y-4">
            {categories.map(cat => {
              const categoryTotal = getCategoryExpenses(cat.id);
              const isOverBudget = cat.budget && categoryTotal > cat.budget;

              return (
                <div key={cat.id} className="bg-[#27272a]/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-3 h-8 rounded" style={{ backgroundColor: cat.color }} />
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{cat.name}</h4>
                        <p className="text-[#a1a1aa] text-sm">
                          Spent: {currencySymbol}{categoryTotal.toLocaleString()}
                          {cat.budget && ` / ${currencySymbol}${cat.budget.toLocaleString()}`}
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

                  {cat.budget && (
                    <div className="mb-3">
                      <div className="h-2 bg-[#18181b] rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${Math.min((categoryTotal / cat.budget) * 100, 100)}%`,
                            backgroundColor: isOverBudget ? '#f87171' : cat.color
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {!readOnly && editingCategoryId === cat.id ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Budget (optional)"
                        value={cat.budget || ''}
                        onChange={(e) => handleUpdateCategoryBudget(cat.id, parseFloat(e.target.value) || 0)}
                        className="flex-1 bg-[#18181b] text-white text-sm rounded px-3 py-2 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
                      />
                      <button
                        onClick={() => setEditingCategoryId(null)}
                        className="bg-[#f472b6] hover:bg-[#ec4899] text-white px-3 py-2 rounded transition-colors"
                      >
                        <Save size={16} />
                      </button>
                    </div>
                  ) : (
                    !readOnly && (
                      <button
                        onClick={() => setEditingCategoryId(cat.id)}
                        className="text-[#a1a1aa] hover:text-[#f472b6] text-sm transition-colors flex items-center gap-1"
                      >
                        <Edit2 size={14} /> {cat.budget ? 'Edit Budget' : 'Set Budget'}
                      </button>
                    )
                  )}
                </div>
              );
            })}

            {!readOnly && (
              <div className="bg-[#27272a]/30 rounded-lg p-4 border-2 border-dashed border-[#3f3f46]">
                <h5 className="text-[#a1a1aa] text-sm font-semibold mb-3">Add Category</h5>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Category name (e.g., Travel)"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="bg-[#18181b] text-white text-sm rounded px-3 py-2 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
                  />
                  <input
                    type="number"
                    placeholder="Budget (optional)"
                    value={newCategoryBudget}
                    onChange={(e) => setNewCategoryBudget(e.target.value)}
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

        {/* Add Expense */}
        {!readOnly && (
          <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Plus size={20} className="text-[#f472b6]" />
              <h3 className="text-white font-semibold text-lg">Add Expense</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={newExpenseCategory}
                onChange={(e) => setNewExpenseCategory(e.target.value)}
                className="bg-[#27272a] text-white rounded px-4 py-2 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Amount"
                value={newExpenseAmount}
                onChange={(e) => setNewExpenseAmount(e.target.value)}
                className="bg-[#27272a] text-white rounded px-4 py-2 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
              />

              <input
                type="text"
                placeholder="Description (e.g., Lunch at restaurant)"
                value={newExpenseDescription}
                onChange={(e) => setNewExpenseDescription(e.target.value)}
                className="bg-[#27272a] text-white rounded px-4 py-2 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
              />

              <input
                type="date"
                value={newExpenseDate}
                onChange={(e) => setNewExpenseDate(e.target.value)}
                className="bg-[#27272a] text-white rounded px-4 py-2 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
              />

              <input
                type="text"
                placeholder="Paid by (optional)"
                value={newExpensePaidBy}
                onChange={(e) => setNewExpensePaidBy(e.target.value)}
                className="bg-[#27272a] text-white rounded px-4 py-2 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
              />

              <button
                onClick={handleAddExpense}
                className="bg-[#f472b6] hover:bg-[#ec4899] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Add Expense
              </button>
            </div>
          </div>
        )}

        {/* Expense List with Filters */}
        <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={20} className="text-[#f472b6]" />
            <h3 className="text-white font-semibold text-lg">Expense History</h3>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-[#27272a]/30 rounded-lg">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#18181b] text-white rounded px-4 py-2 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <input
              type="date"
              placeholder="From Date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="bg-[#18181b] text-white rounded px-4 py-2 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
            />

            <input
              type="date"
              placeholder="To Date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="bg-[#18181b] text-white rounded px-4 py-2 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
            />
          </div>

          {/* Filtered Total */}
          <div className="mb-4 p-3 bg-[#27272a]/30 rounded-lg">
            <p className="text-[#a1a1aa] text-sm">
              Showing {filteredExpenses.length} expense(s) - Total: <span className="text-white font-semibold">{currencySymbol}{filteredTotal.toLocaleString()}</span>
            </p>
          </div>

          {/* Expense List */}
          <div className="space-y-3">
            {filteredExpenses.length === 0 ? (
              <p className="text-[#a1a1aa] text-center py-8">No expenses found. Add your first expense above!</p>
            ) : (
              filteredExpenses
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(exp => (
                  <div key={exp.id} className="bg-[#27272a]/30 rounded-lg p-4">
                    {editingExpenseId === exp.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="bg-[#18181b] text-white text-sm rounded px-3 py-2 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
                          />
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="bg-[#18181b] text-white text-sm rounded px-3 py-2 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
                          />
                        </div>
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full bg-[#18181b] text-white text-sm rounded px-3 py-2 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
                        />
                        <input
                          type="text"
                          placeholder="Paid by (optional)"
                          value={editPaidBy}
                          onChange={(e) => setEditPaidBy(e.target.value)}
                          className="w-full bg-[#18181b] text-white text-sm rounded px-3 py-2 border border-[#3f3f46] focus:outline-none focus:border-[#f472b6]"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveExpense(exp.id)}
                            className="bg-[#f472b6] hover:bg-[#ec4899] text-white px-3 py-2 rounded transition-colors flex items-center gap-1"
                          >
                            <Save size={16} /> Save
                          </button>
                          <button
                            onClick={() => setEditingExpenseId(null)}
                            className="bg-[#3f3f46] hover:bg-[#52525b] text-white px-3 py-2 rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-1 h-12 rounded" style={{ backgroundColor: getCategoryColor(exp.categoryId) }} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-medium">{exp.description}</span>
                              <span className="text-xs bg-[#27272a] text-[#a1a1aa] px-2 py-1 rounded">
                                {getCategoryName(exp.categoryId)}
                              </span>
                            </div>
                            <div className="text-[#a1a1aa] text-sm flex items-center gap-3">
                              <span>{new Date(exp.date).toLocaleDateString()}</span>
                              {exp.paidBy && <span>• Paid by: {exp.paidBy}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold text-white">{currencySymbol}{exp.amount.toLocaleString()}</span>
                          {!readOnly && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleStartEditExpense(exp)}
                                className="text-[#a1a1aa] hover:text-[#f472b6] transition-colors"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="text-[#a1a1aa] hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
