
export type Team = 'red' | 'blue';

export interface ScoreEntry {
  id: string;
  team: Team;
  duration: number; // in milliseconds
  maxDb: number;
  score: number;    // maxDb * (duration / 1000) * multiplier
  timestamp: number;
  nickname?: string;
  commentary?: string;
  imageUrl?: string;
}

export interface AudioStats {
  currentDb: number;
  isAboveThreshold: boolean;
}
