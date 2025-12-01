import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { AlertTriangle, TrendingUp, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { AppState } from '../types';
import { CURRENCY_FORMATTER } from '../constants';
import { Card } from './ui/Card';

interface DashboardProps {
  state: AppState;
}

export const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  const { budget, plannedItems, actualItems } = state;

  const totalPlanned = plannedItems.reduce((acc, item) => acc + (item.pricePerUnit * item.targetQuantity), 0);
  const totalActual = actualItems.reduce((acc, item) => acc + item.totalCost, 0);
  const remainingBudget = budget - totalActual;
  
  const plannedItemsCount = plannedItems.length;
  const fullyPurchasedCount = plannedItems.filter(i => i.purchasedQuantity >= i.targetQuantity).length;

  const spendingProgress = Math.min((totalActual / budget) * 100, 100);
  const isOverBudget = totalActual > budget;
  const isPlanOverBudget = totalPlanned > budget;

  const chartData = [
    { name: 'Spent', value: totalActual },
    { name: 'Remaining', value: Math.max(0, remainingBudget) },
  ];
  const chartColors = ['#10b981', '#e2e8f0']; // Emerald-500, Slate-200
  if (isOverBudget) chartColors[0] = '#ef4444'; // Red-500

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Alerts */}
      {isOverBudget && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r flex items-start">
          <AlertCircle className="w-5 h-5 text-rose-600 mr-3 mt-0.5" />
          <div>
            <h3 className="text-rose-800 font-bold">Budget Exceeded</h3>
            <p className="text-rose-700 text-sm">You have spent {CURRENCY_FORMATTER.format(totalActual - budget)} over your monthly budget.</p>
          </div>
        </div>
      )}
      {!isOverBudget && isPlanOverBudget && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r flex items-start">
          <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 mt-0.5" />
          <div>
            <h3 className="text-amber-800 font-bold">Plan Exceeds Budget</h3>
            <p className="text-amber-700 text-sm">Your planned spending is {CURRENCY_FORMATTER.format(totalPlanned - budget)} higher than your budget.</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-medium uppercase">Budget</p>
              <h2 className="text-2xl font-bold text-slate-800">{CURRENCY_FORMATTER.format(budget)}</h2>
            </div>
            <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Monthly Limit</p>
        </Card>

        <Card className="p-4 border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-medium uppercase">Planned</p>
              <h2 className="text-2xl font-bold text-slate-800">{CURRENCY_FORMATTER.format(totalPlanned)}</h2>
            </div>
            <div className="p-2 bg-blue-100 rounded-full text-blue-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">{plannedItemsCount} items to buy</p>
        </Card>

        <Card className={`p-4 border-l-4 ${isOverBudget ? 'border-rose-500' : 'border-slate-500'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-medium uppercase">Actual Spent</p>
              <h2 className={`text-2xl font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-800'}`}>
                {CURRENCY_FORMATTER.format(totalActual)}
              </h2>
            </div>
            <div className={`p-2 rounded-full ${isOverBudget ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
              <CheckCircle size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {isOverBudget ? 'Over budget!' : `${CURRENCY_FORMATTER.format(remainingBudget)} remaining`}
          </p>
        </Card>
      </div>

      {/* Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Budget Usage</h3>
          <div className="h-64 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number) => CURRENCY_FORMATTER.format(value)} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Shopping Progress</h3>
          <div className="flex flex-col h-full justify-center space-y-6">
             <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Spending Progress</span>
                  <span className="font-semibold">{Math.round(spendingProgress)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${Math.min(spendingProgress, 100)}%` }}
                  ></div>
                </div>
             </div>

             <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Item Completion</span>
                  <span className="font-semibold">{fullyPurchasedCount} / {plannedItemsCount} Items</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full" 
                    style={{ width: `${plannedItemsCount ? (fullyPurchasedCount / plannedItemsCount) * 100 : 0}%` }}
                  ></div>
                </div>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
