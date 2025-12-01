export interface PlannedItem {
  id: string;
  name: string;
  targetQuantity: number;
  purchasedQuantity: number;
  pricePerUnit: number;
}

export interface ActualItem {
  id: string;
  name: string;
  quantity: number;
  totalCost: number;
  date: string;
  plannedItemId?: string; // Link back to planned item if applicable
}

export interface AppState {
  budget: number;
  plannedItems: PlannedItem[];
  actualItems: ActualItem[];
}

export type TabView = 'dashboard' | 'plan' | 'actual' | 'advisor';
