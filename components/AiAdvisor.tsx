import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AppState } from '../types';
import { CURRENCY_FORMATTER } from '../constants';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Sparkles, Loader2, MessageSquare } from 'lucide-react';

interface AiAdvisorProps {
  state: AppState;
}

export const AiAdvisor: React.FC<AiAdvisorProps> = ({ state }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateAdvice = async () => {
    // Access API Key safely. In a real env, process.env.API_KEY is injected.
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      setError("API Key is missing. Please configure process.env.API_KEY.");
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        You are a financial advisor. Analyze the following monthly spending data and give me 3 short, actionable tips or observations.
        Be encouraging but realistic. Format the output as a simple Markdown list.
        
        Budget: ${CURRENCY_FORMATTER.format(state.budget)}
        
        Planned Items:
        ${state.plannedItems.map(i => `- ${i.name}: Plan ${i.targetQuantity}, Bought ${i.purchasedQuantity}. Cost/Unit: ${i.pricePerUnit}`).join('\n')}
        
        Actual Spending Log (Total: ${CURRENCY_FORMATTER.format(state.actualItems.reduce((acc, i) => acc + i.totalCost, 0))}):
        ${state.actualItems.map(i => `- ${i.name}: Cost ${i.totalCost}`).join('\n')}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setAdvice(response.text || "I couldn't generate advice at this moment.");
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the AI advisor. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <Sparkles className="text-purple-500" /> AI Spending Advisor
           </h2>
           <p className="text-slate-500 text-sm mt-1">Get personalized insights based on your current plan and spending habits.</p>
        </div>
        <Button 
          onClick={generateAdvice} 
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
        >
          {loading ? <><Loader2 className="animate-spin mr-2" size={18} /> Analyzing...</> : 'Analyze My Budget'}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-lg text-sm border border-rose-100">
          {error}
        </div>
      )}

      {advice && (
        <Card className="p-6 bg-purple-50 border border-purple-100">
          <div className="prose prose-sm prose-purple max-w-none">
            <h3 className="flex items-center gap-2 font-bold text-purple-800 text-lg mb-4">
              <MessageSquare className="w-5 h-5" /> Advisor Insights
            </h3>
            <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
              {advice}
            </div>
          </div>
        </Card>
      )}
      
      {!advice && !loading && !error && (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400">
           <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-20" />
           <p>Click "Analyze My Budget" to generate insights.</p>
        </div>
      )}
    </div>
  );
};