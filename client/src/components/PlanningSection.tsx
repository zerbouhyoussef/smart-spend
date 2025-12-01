import React, { useState } from 'react';
import { PlannedItem, ActualItem } from '../types';
import { CURRENCY_FORMATTER, generateId } from '../constants';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Plus, Trash2, ShoppingCart, Edit2, X, Check } from 'lucide-react';

interface PlanningSectionProps {
  items: PlannedItem[];
  onAddPlannedItem: (item: PlannedItem) => void;
  onDeletePlannedItem: (id: string) => void;
  onUpdatePlannedItem: (item: PlannedItem) => void;
  onMarkPurchased: (plannedItem: PlannedItem, quantityBought: number, actualCost: number, date: string) => void;
}

export const PlanningSection: React.FC<PlanningSectionProps> = ({
  items,
  onAddPlannedItem,
  onDeletePlannedItem,
  onUpdatePlannedItem,
  onMarkPurchased
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<PlannedItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<PlannedItem>>({ name: '', targetQuantity: 1, pricePerUnit: 0 });
  const [purchaseModalItem, setPurchaseModalItem] = useState<PlannedItem | null>(null);

  // Purchase Modal State
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.name && newItem.targetQuantity && newItem.pricePerUnit !== undefined) {
      if (editingItem) {
        onUpdatePlannedItem({
          ...editingItem,
          name: newItem.name,
          targetQuantity: Number(newItem.targetQuantity),
          pricePerUnit: Number(newItem.pricePerUnit),
        });
        setEditingItem(null);
      } else {
        onAddPlannedItem({
          id: generateId(),
          name: newItem.name,
          targetQuantity: Number(newItem.targetQuantity),
          purchasedQuantity: 0,
          pricePerUnit: Number(newItem.pricePerUnit),
        });
      }
      setNewItem({ name: '', targetQuantity: 1, pricePerUnit: 0 });
      setIsAdding(false);
    }
  };

  const startEditing = (item: PlannedItem) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      targetQuantity: item.targetQuantity,
      pricePerUnit: item.pricePerUnit
    });
    setIsAdding(true);
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingItem(null);
    setNewItem({ name: '', targetQuantity: 1, pricePerUnit: 0 });
  };

  const openPurchaseModal = (item: PlannedItem) => {
    setPurchaseModalItem(item);
    const remaining = item.targetQuantity - item.purchasedQuantity;
    setPurchaseQty(remaining > 0 ? 1 : 0);
    setPurchasePrice(item.pricePerUnit); // Default to planned price
    setPurchaseDate(new Date().toISOString().split('T')[0]);
  };

  const confirmPurchase = () => {
    if (purchaseModalItem && purchaseQty > 0) {
      onMarkPurchased(purchaseModalItem, purchaseQty, purchasePrice * purchaseQty, purchaseDate);
      setPurchaseModalItem(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Monthly Plan</h2>
        <Button onClick={() => { setIsAdding(!isAdding); setEditingItem(null); setNewItem({ name: '', targetQuantity: 1, pricePerUnit: 0 }); }} size="sm">
          <Plus size={16} className="mr-2" /> Add Item
        </Button>
      </div>

      {isAdding && (
        <Card className="p-4 bg-slate-50 border-emerald-100">
          <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">Item Name</label>
              <input
                type="text"
                required
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. Groceries"
                value={newItem.name}
                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                required
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                value={newItem.targetQuantity}
                onChange={e => setNewItem({ ...newItem, targetQuantity: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Price / Unit</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                value={newItem.pricePerUnit}
                onChange={e => setNewItem({ ...newItem, pricePerUnit: Number(e.target.value) })}
              />
            </div>
            <div className="flex gap-2">
               <Button type="submit" className="flex-1">{editingItem ? 'Update' : 'Save'}</Button>
               <Button type="button" variant="secondary" onClick={cancelEdit}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4">
        {items.length === 0 && !isAdding && (
          <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>No planned items yet. Start planning!</p>
          </div>
        )}

        {items.map(item => {
          const isFullyPurchased = item.purchasedQuantity >= item.targetQuantity;
          const remaining = Math.max(0, item.targetQuantity - item.purchasedQuantity);

          return (
            <Card key={item.id} className={`p-4 transition-all ${isFullyPurchased ? 'bg-slate-50 opacity-75' : 'hover:shadow-md'}`}>
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold text-lg ${isFullyPurchased ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                      {item.name}
                    </h3>
                    {isFullyPurchased && <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">Completed</span>}
                  </div>
                  <div className="text-sm text-slate-500 flex gap-4 mt-1">
                     <span>Plan: {item.targetQuantity} @ {CURRENCY_FORMATTER.format(item.pricePerUnit)}</span>
                     <span className="text-slate-300">|</span>
                     <span className={remaining === 0 ? 'text-emerald-600 font-medium' : 'text-slate-600'}>
                        {item.purchasedQuantity} bought
                     </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                   <div className="text-right mr-4">
                      <div className="text-xs text-slate-400">Total Planned</div>
                      <div className="font-semibold">{CURRENCY_FORMATTER.format(item.targetQuantity * item.pricePerUnit)}</div>
                   </div>

                   <div className="flex gap-2">
                      {!isFullyPurchased && (
                        <Button size="sm" onClick={() => openPurchaseModal(item)} title="Mark as Purchased">
                           <Check size={16} className="mr-1" /> Buy
                        </Button>
                      )}
                      <button 
                        onClick={() => startEditing(item)}
                        className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                        title="Edit Item"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => onDeletePlannedItem(item.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 size={18} />
                      </button>
                   </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Purchase Modal Overlay */}
      {purchaseModalItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Mark "{purchaseModalItem.name}" as Bought</h3>
              <button onClick={() => setPurchaseModalItem(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  How many did you buy? (Remaining: {purchaseModalItem.targetQuantity - purchaseModalItem.purchasedQuantity})
                </label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full p-2 border border-slate-300 rounded focus:ring-emerald-500"
                  value={purchaseQty}
                  onChange={e => setPurchaseQty(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Price per unit (Actual)
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full p-2 border border-slate-300 rounded focus:ring-emerald-500"
                  value={purchasePrice}
                  onChange={e => setPurchasePrice(Number(e.target.value))}
                />
                <p className="text-xs text-slate-500 mt-1">Total cost will be logged as {CURRENCY_FORMATTER.format(purchasePrice * purchaseQty)}</p>
              </div>

              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                 <input 
                    type="date"
                    className="w-full p-2 border border-slate-300 rounded"
                    value={purchaseDate}
                    onChange={e => setPurchaseDate(e.target.value)}
                 />
              </div>

              <div className="flex gap-3 mt-6">
                <Button className="flex-1" onClick={confirmPurchase}>Confirm Purchase</Button>
                <Button variant="secondary" onClick={() => setPurchaseModalItem(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
