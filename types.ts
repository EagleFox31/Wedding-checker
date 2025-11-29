export interface Table {
  id: string; // ex: "t_1"
  number: string | number; // ex: "1"
  name: string; // ex: "Honneur"
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  tableId?: string; // NOUVEAU: Clé étrangère vers la collection tables
  tableNumber: string | number; // Gardé pour fallback / affichage rapide
  tableName?: string; // Gardé pour fallback
  inviter: 'Serge' | 'Christiane' | 'Famille' | string;
  description?: string;
  hasArrived: boolean;
  isAbsent?: boolean;
  arrivedAt?: string;
  plusOne?: boolean;
}

export type PlanningCategory = 'matin' | 'mairie' | 'cocktail' | 'eglise' | 'soiree';

export interface TimelineItem {
  id: string;
  category: PlanningCategory;
  time: string;
  title: string;
  description?: string;
  completed: boolean;
  isHighlight?: boolean;
}

export interface AppPermissions {
  hostessCanUncheck: boolean;
}

export type GuestFilter = 'all' | 'arrived' | 'pending' | 'absent';
export type UserRole = 'admin' | 'hostess' | 'planner' | 'guest';

export interface DashboardStats {
  total: number;
  arrived: number;
  pending: number;
  absent: number;
  percentage: number;
}