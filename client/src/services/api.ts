import { PlannedItem, ActualItem } from '../types';

const API_URL = 'http://localhost:3001/api';

// --- Budget ---

export const fetchBudget = async (): Promise<number> => {
  try {
    const res = await fetch(`${API_URL}/budget`);
    if (!res.ok) throw new Error('Failed to fetch budget');
    const data = await res.json();
    return data.amount;
  } catch (e) {
    console.error(e);
    return 0;
  }
};

export const updateBudget = async (amount: number): Promise<void> => {
  await fetch(`${API_URL}/budget`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
};

// --- Planned Items ---

export const fetchPlannedItems = async (): Promise<PlannedItem[]> => {
  try {
    const res = await fetch(`${API_URL}/planned-items`);
    if (!res.ok) throw new Error('Failed to fetch planned items');
    return res.json();
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const addPlannedItem = async (item: PlannedItem): Promise<void> => {
  await fetch(`${API_URL}/planned-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
};

export const updatePlannedItem = async (item: PlannedItem): Promise<void> => {
  await fetch(`${API_URL}/planned-items/${item.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
};

export const deletePlannedItem = async (id: string): Promise<void> => {
  await fetch(`${API_URL}/planned-items/${id}`, {
    method: 'DELETE',
  });
};

// --- Actual Items ---

export const fetchActualItems = async (): Promise<ActualItem[]> => {
  try {
    const res = await fetch(`${API_URL}/actual-items`);
    if (!res.ok) throw new Error('Failed to fetch actual items');
    return res.json();
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const addActualItem = async (item: ActualItem): Promise<void> => {
  await fetch(`${API_URL}/actual-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
};

export const updateActualItem = async (item: ActualItem): Promise<void> => {
  await fetch(`${API_URL}/actual-items/${item.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
};

export const deleteActualItem = async (id: string): Promise<void> => {
  await fetch(`${API_URL}/actual-items/${id}`, {
    method: 'DELETE',
  });
};
