export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  tableNumber: string | number;
  inviter: 'Serge' | 'Christiane' | 'Famille' | string; // Qui les a invité
  description?: string; // Relation ou note (ex: "Cousine du marié")
  hasArrived: boolean;
  isAbsent?: boolean; // Marqué comme ne venant pas
  arrivedAt?: string; // ISO date string
  plusOne?: boolean; // Vient avec quelqu'un ?
}

export type PlanningCategory = 'matin' | 'mairie' | 'cocktail' | 'eglise' | 'soiree';

export interface TimelineItem {
  id: string;
  category: PlanningCategory;
  time: string;
  title: string;
  description?: string;
  completed: boolean;
  isHighlight?: boolean; // Pour les moments clés
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