import React, { useState } from 'react';
import { PlannedItem, ActualItem } from '../types';
import { CURRENCY_FORMATTER, generateId, formatDate } from '../constants';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Plus, Trash2, Receipt, Edit2 } from 'lucide-react';

interface ActualSectionProps {
  items: ActualItem[];
  plannedItems: PlannedItem[];
  onAddActualItem: (item: ActualItem) => void;
  onDeleteActualItem: (id: string) => void;
  onUpdateActualItem: (item: ActualItem) => void;
  onUpdatePlannedItem: (item: PlannedItem) => void;
}

export const ActualSection: React.FC<ActualSectionProps> = ({ 
  items, 
  plannedItems,
  onAddActualItem, 
  onDeleteActualItem,
  onUpdateActualItem,
  onUpdatePlannedItem
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<ActualItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<ActualItem>>({
    name: '',
    quantity: 1,
    totalCost: 0,
    date: new Date().toISOString().split('T')[0],
    plannedItemId: ''
  });

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
        setEditingItem(null);
      } else {
        onAddActualItem(itemData);
        
        // If linked to a planned item, update its purchased quantity
        if (newItem.plannedItemId) {
          const plannedItem = plannedItems.find(p => p.id === newItem.plannedItemId);
          if (plannedItem) {
            onUpdatePlannedItem({
              ...plannedItem,
              purchasedQuantity: plannedItem.purchasedQuantity + (newItem.quantity || 1)
            });
          }
        }
      }

      setNewItem({ name: '', quantity: 1, totalCost: 0, date: new Date().toISOString().split('T')[0], plannedItemId: '' });
      setIsAdding(false);
    }
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
    setIsAdding(true);
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingItem(null);
    setNewItem({ name: '', quantity: 1, totalCost: 0, date: new Date().toISOString().split('T')[0], plannedItemId: '' });
  };

  const handlePlannedItemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedPlannedItem = plannedItems.find(p => p.id === selectedId);
    
    setNewItem(prev => ({
      ...prev,
      plannedItemId: selectedId,
      name: selectedPlannedItem ? selectedPlannedItem.name : prev.name
    }));
  };

  const sortedItems = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Spending Log</h2>
        <Button onClick={() => { setIsAdding(!isAdding); setEditingItem(null); setNewItem({ name: '', quantity: 1, totalCost: 0, date: new Date().toISOString().split('T')[0], plannedItemId: '' }); }} size="sm">
          <Plus size={16} className="mr-2" /> Log Expense
        </Button>
      </div>

      {isAdding && (
        <Card className="p-4 bg-slate-50 border-blue-100">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Link to Plan (Optional)</label>
              <select
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={newItem.plannedItemId || ''}
                onChange={handlePlannedItemSelect}
              >
                <option value="">-- Select Planned Item --</option>
                {plannedItems.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Item Name</label>
              <input
                type="text"
                required
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Coffee"
                value={newItem.name}
                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
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
              <label className="block text-xs font-medium text-slate-500 mb-1">Total Cost</label>
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
               <Button type="submit" className="flex-1">{editingItem ? 'Update' : 'Add'}</Button>
               <Button type="button" variant="secondary" onClick={cancelEdit}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {items.length === 0 && !isAdding && (
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
                <h4 className="font-medium text-slate-800">{item.name}</h4>
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
