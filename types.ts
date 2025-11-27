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

export type GuestFilter = 'all' | 'arrived' | 'pending' | 'absent';

export interface DashboardStats {
  total: number;
  arrived: number;
  pending: number;
  absent: number;
  percentage: number;
}