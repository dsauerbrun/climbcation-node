
export interface Accommodation {
  id: number;
  name: string;
  ranges: string[];
  url: string;
}

export interface FoodOption {
  id: number;
  name: string;
  ranges: string[];
}

export interface Month {
  name: string;
  id: number;
  numericalValue: number;
}

export interface Transportation {
  name: string;
  id: number;
  ranges: string[];
}