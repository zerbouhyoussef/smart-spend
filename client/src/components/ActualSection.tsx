import React, { useState, useEffect } from 'react';
import { PlannedItem, ActualItem } from '../types';
import { CURRENCY_FORMATTER, generateId, formatDate } from '../constants';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Plus, Trash2, Receipt, Edit2, ShoppingBag, Zap, ArrowLeft } from 'lucide-react';

interface ActualSectionProps {
  items: ActualItem[];
  plannedItems: PlannedItem[];
  onAddActualItem: (item: ActualItem) => void;
  onDeleteActualItem: (id: string) => void;
  onUpdateActualItem: (item: ActualItem) => void;
  onUpdatePlannedItem: (item: PlannedItem) => void;
}

type Mode = 'list' | 'select-type' | 'pick-plan' | 'form';

export const ActualSection: React.FC<ActualSectionProps> = ({ 
  items, 
  plannedItems,
  onAddActualItem, 
  onDeleteActualItem,
  onUpdateActualItem,
  onUpdatePlannedItem
}) => {
  const [mode, setMode] = useState<Mode>('list');
  const [editingItem, setEditingItem] = useState<ActualItem | null>(null);
  
  // Form State
  const [newItem, setNewItem] = useState<Partial<ActualItem>>({
    name: '',
    quantity: 1,
    totalCost: 0,
    date: new Date().toISOString().split('T')[0],
    plannedItemId: ''
  });

  // Derived state for auto-calculation
  const selectedPlannedItem = plannedItems.find(p => p.id === newItem.plannedItemId);

  // Auto-calculate cost when quantity changes IF linked to a plan
  useEffect(() => {
    if (selectedPlannedItem && newItem.quantity) {
      const calculatedCost = selectedPlannedItem.pricePerUnit * newItem.quantity;
      setNewItem(prev => ({ ...prev, totalCost: calculatedCost }));
    }
  }, [newItem.quantity, selectedPlannedItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.name && newItem.totalCost !== undefined) {
      const itemData: ActualItem = {
        id: editingItem ? editingItem.id : generateId(),
        name: newItem.name,
        quantity: newItem.quantity || 1,
        totalCost: Number(newItem.totalCost),
        date: newItem.date || new Date().toISOString().split('T')[0],
        plannedItemId: newItem.plannedItemId || undefined
      };

      if (editingItem) {
        onUpdateActualItem(itemData);
      } else {
        onAddActualItem(itemData);
        // Trigger update logic is handled in App.tsx now via Optimistic UI
      }

      resetForm();
    }
  };

  const resetForm = () => {
    setNewItem({ name: '', quantity: 1, totalCost: 0, date: new Date().toISOString().split('T')[0], plannedItemId: '' });
    setEditingItem(null);
    setMode('list');
  };

  const startEditing = (item: ActualItem) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      quantity: item.quantity,
      totalCost: item.totalCost,
      date: item.date,
      plannedItemId: item.plannedItemId || ''
    });
    setMode('form');
  };

  const handlePickPlan = (plan: PlannedItem) => {
    setNewItem(prev => ({
      ...prev,
      plannedItemId: plan.id,
      name: plan.name,
      quantity: 1, // Default to 1
      totalCost: plan.pricePerUnit // Default to 1 unit cost
    }));
    setMode('form');
  };

  const handleQuickAdd = () => {
    setNewItem(prev => ({ ...prev, plannedItemId: '', name: '' }));
    setMode('form');
  };

  const sortedItems = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Spending Log</h2>
        {mode === 'list' && (
          <Button onClick={() => setMode('select-type')} size="sm">
            <Plus size={16} className="mr-2" /> Log Expense
          </Button>
        )}
      </div>

      {/* Mode: Select Type */}
      {mode === 'select-type' && (
        <Card className="p-6 bg-slate-50 border-blue-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-700">How do you want to add this?</h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><ArrowLeft size={20} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => setMode('pick-plan')}
              className="flex flex-col items-center p-6 bg-white border-2 border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ShoppingBag size={24} />
              </div>
              <span className="font-bold text-slate-700">Pick from Plan</span>
              <span className="text-xs text-slate-500 mt-1">Select an item you planned to buy</span>
            </button>

            <button 
              onClick={handleQuickAdd}
              className="flex flex-col items-center p-6 bg-white border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Zap size={24} />
              </div>
              <span className="font-bold text-slate-700">Quick Add</span>
              <span className="text-xs text-slate-500 mt-1">Log an unplanned expense</span>
            </button>
          </div>
        </Card>
      )}

      {/* Mode: Pick Plan */}
      {mode === 'pick-plan' && (
        <Card className="p-4 bg-slate-50 border-blue-100">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setMode('select-type')} className="p-1 hover:bg-slate-200 rounded"><ArrowLeft size={16} /></button>
            <h3 className="font-semibold text-slate-700">Select a Planned Item</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {plannedItems.length === 0 ? (
              <p className="col-span-full text-center text-slate-400 py-4">No planned items found.</p>
            ) : (
              plannedItems.map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePickPlan(p)}
                  className="text-left p-3 bg-white border border-slate-200 rounded-lg hover:border-emerald-500 hover:shadow-md transition-all"
                >
                  <div className="font-medium text-slate-800">{p.name}</div>
                  <div className="text-xs text-slate-500 flex justify-between mt-1">
                    <span>Qty: {p.targetQuantity - p.purchasedQuantity} left</span>
                    <span>{CURRENCY_FORMATTER.format(p.pricePerUnit)}/ea</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Mode: Form (Add/Edit) */}
      {mode === 'form' && (
        <Card className="p-4 bg-slate-50 border-blue-100">
          <div className="flex items-center gap-2 mb-4">
             {!editingItem && <button onClick={() => setMode('select-type')} className="p-1 hover:bg-slate-200 rounded"><ArrowLeft size={16} /></button>}
             <h3 className="font-semibold text-slate-700">{editingItem ? 'Edit Expense' : (newItem.plannedItemId ? 'Log Planned Expense' : 'Log Unplanned Expense')}</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Item Name</label>
              <input
                type="text"
                required
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Coffee"
                value={newItem.name}
                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                readOnly={!!newItem.plannedItemId} // Read-only if linked
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
              <input
                type="date"
                required
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={newItem.date}
                onChange={e => setNewItem({ ...newItem, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                required
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={newItem.quantity}
                onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Total Cost {selectedPlannedItem && <span className="text-emerald-600 text-[10px]">(Auto)</span>}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={newItem.totalCost}
                onChange={e => setNewItem({ ...newItem, totalCost: Number(e.target.value) })}
              />
            </div>
            <div className="flex gap-2 lg:col-span-6">
               <Button type="submit" className="flex-1">{editingItem ? 'Update' : 'Save Expense'}</Button>
               <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* List */}
      <div className="space-y-3">
        {items.length === 0 && mode === 'list' && (
          <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            <Receipt className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>No expenses logged yet.</p>
          </div>
        )}

        {sortedItems.map(item => (
          <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">
                {new Date(item.date).getDate()}
              </div>
              <div>
                <h4 className="font-medium text-slate-800 flex items-center gap-2">
                  {item.name}
                  {item.plannedItemId && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded-full">Planned</span>}
                </h4>
                <p className="text-xs text-slate-500">{formatDate(item.date)} • Qty: {item.quantity}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-slate-700">{CURRENCY_FORMATTER.format(item.totalCost)}</span>
              <button 
                onClick={() => startEditing(item)}
                className="p-1.5 text-slate-300 hover:text-blue-500 transition-colors"
                title="Edit"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => onDeleteActualItem(item.id)}
                className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
