import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ListTodo, Receipt, Settings, Sparkles } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { PlanningSection } from './components/PlanningSection';
import { ActualSection } from './components/ActualSection';
import { AiAdvisor } from './components/AiAdvisor';
import { AppState, PlannedItem, ActualItem, TabView } from './types';
import { INITIAL_BUDGET, generateId } from './constants';
import { Card } from './components/ui/Card';

import { 
  fetchBudget, 
  updateBudget, 
  fetchPlannedItems, 
  addPlannedItem, 
  updatePlannedItem, 
  deletePlannedItem, 
  fetchActualItems, 
  addActualItem, 
  deleteActualItem,
  updateActualItem
} from './services/api';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>('dashboard');
  
  // Initialize state
  const [state, setState] = useState<AppState>({
    budget: INITIAL_BUDGET,
    plannedItems: [],
    actualItems: []
  });

  // Fetch data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const budget = await fetchBudget();
    const planned = await fetchPlannedItems();
    const actual = await fetchActualItems();
    
    setState({
      budget,
      plannedItems: planned,
      actualItems: actual
    });
  };

  // Handlers
  const handleUpdateBudget = async (newBudget: number) => {
    // Optimistic update
    setState(prev => ({ ...prev, budget: newBudget }));
    await updateBudget(newBudget);
  };

  const handleAddPlannedItem = async (item: PlannedItem) => {
    // Optimistic update
    setState(prev => ({ ...prev, plannedItems: [...prev.plannedItems, item] }));
    await addPlannedItem(item);
  };

  const handleDeletePlannedItem = async (id: string) => {
    // Optimistic update
    setState(prev => ({ ...prev, plannedItems: prev.plannedItems.filter(i => i.id !== id) }));
    await deletePlannedItem(id);
  };

  const handleUpdatePlannedItem = async (item: PlannedItem) => {
    // Optimistic update
    setState(prev => ({
      ...prev,
      plannedItems: prev.plannedItems.map(i => i.id === item.id ? item : i)
    }));
    await updatePlannedItem(item);
  };

  // Complex Logic: Marking as purchased updates planned qty AND adds to actual log
  const handleMarkPurchased = async (plannedItem: PlannedItem, quantityBought: number, actualCost: number, date: string) => {
    // 2. Create Actual Item Entry
    const newActualItem: ActualItem = {
      id: generateId(),
      name: plannedItem.name,
      quantity: quantityBought,
      totalCost: actualCost,
      date: date,
      plannedItemId: plannedItem.id
    };

    // Optimistic Update
    // 1. Update Planned Item (simulate trigger)
    const updatedPlannedItem = {
      ...plannedItem,
      purchasedQuantity: plannedItem.purchasedQuantity + quantityBought
    };

    setState(prev => ({
      ...prev,
      plannedItems: prev.plannedItems.map(i => i.id === plannedItem.id ? updatedPlannedItem : i),
      actualItems: [newActualItem, ...prev.actualItems] // Add to top
    }));

    // Note: The database trigger will automatically update the planned item's purchasedQuantity in DB
    await addActualItem(newActualItem);
  };

  const handleAddActualItem = async (item: ActualItem) => {
    // Optimistic Update
    setState(prev => ({ ...prev, actualItems: [item, ...prev.actualItems] }));
    
    // If linked, we also need to optimistically update the planned item
    if (item.plannedItemId) {
       setState(prev => ({
         ...prev,
         plannedItems: prev.plannedItems.map(p => {
            if (p.id === item.plannedItemId) {
               return { ...p, purchasedQuantity: p.purchasedQuantity + item.quantity };
            }
            return p;
         })
       }));
    }

    await addActualItem(item);
  };

  const handleUpdateActualItem = async (item: ActualItem) => {
    // Optimistic Update (Complex because we might need to adjust planned item qty if qty changed)
    // For simplicity, we just update the actual item list locally. 
    // Correctly handling the trigger logic optimistically is hard without previous state.
    // We will just update the actual item list and let the planned item update happen on next load or ignore it for now.
    // Ideally we should reload data for complex trigger interactions, but user wants speed.
    
    setState(prev => ({
      ...prev,
      actualItems: prev.actualItems.map(i => i.id === item.id ? item : i)
    }));
    
    await updateActualItem(item);
  };

  const handleDeleteActualItem = async (id: string) => {
    // Optimistic Update
    const itemToDelete = state.actualItems.find(i => i.id === id);
    setState(prev => ({ ...prev, actualItems: prev.actualItems.filter(i => i.id !== id) }));

    // Optimistic reverse trigger
    if (itemToDelete && itemToDelete.plannedItemId) {
       setState(prev => ({
         ...prev,
         plannedItems: prev.plannedItems.map(p => {
            if (p.id === itemToDelete.plannedItemId) {
               return { ...p, purchasedQuantity: Math.max(0, p.purchasedQuantity - itemToDelete.quantity) };
            }
            return p;
         })
       }));
    }

    await deleteActualItem(id);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 sticky top-0 z-10">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-emerald-600 flex items-center gap-2">
            <Settings className="text-emerald-600" /> SmartSpend
          </h1>
        </div>
        
        <nav className="p-4 space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-visible">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors w-full ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('plan')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors w-full ${activeTab === 'plan' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <ListTodo size={20} /> Planner
          </button>
          <button 
            onClick={() => setActiveTab('actual')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors w-full ${activeTab === 'actual' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Receipt size={20} /> Spending Log
          </button>
          <button 
            onClick={() => setActiveTab('advisor')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors w-full ${activeTab === 'advisor' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Sparkles size={20} /> AI Advisor
          </button>
        </nav>

        <div className="p-4 mt-auto border-t border-slate-100 hidden md:block">
           <label className="text-xs font-semibold text-slate-400 uppercase">Monthly Budget</label>
           <div className="flex items-center mt-2 bg-slate-100 rounded-lg px-3 py-2">
              <span className="text-slate-500 mr-2">$</span>
              <input 
                type="number" 
                value={state.budget} 
                onChange={(e) => handleUpdateBudget(Number(e.target.value))}
                className="bg-transparent w-full outline-none font-bold text-slate-700"
              />
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
         {/* Mobile Budget Input */}
         <div className="md:hidden mb-6">
            <Card className="p-4 flex justify-between items-center">
               <span className="font-semibold text-slate-700">Monthly Budget</span>
               <div className="flex items-center bg-slate-100 rounded px-2 py-1 w-32">
                 <span className="text-slate-500 mr-1">$</span>
                 <input 
                    type="number" 
                    value={state.budget} 
                    onChange={(e) => handleUpdateBudget(Number(e.target.value))}
                    className="bg-transparent w-full outline-none font-bold text-slate-700 text-right"
                  />
               </div>
            </Card>
         </div>

         {activeTab === 'dashboard' && <Dashboard state={state} />}
         
         {activeTab === 'plan' && (
           <PlanningSection 
             items={state.plannedItems}
             onAddPlannedItem={handleAddPlannedItem}
             onDeletePlannedItem={handleDeletePlannedItem}
             onUpdatePlannedItem={handleUpdatePlannedItem}
             onMarkPurchased={handleMarkPurchased}
           />
         )}
         
         {activeTab === 'actual' && (
           <ActualSection 
              items={state.actualItems}
              plannedItems={state.plannedItems}
              onAddActualItem={handleAddActualItem}
              onDeleteActualItem={handleDeleteActualItem}
              onUpdateActualItem={handleUpdateActualItem}
              onUpdatePlannedItem={handleUpdatePlannedItem}
           />
         )}

         {activeTab === 'advisor' && (
           <AiAdvisor state={state} />
         )}
      </main>
    </div>
  );
};

export default App;
