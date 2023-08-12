import {DateTime} from 'luxon'
export interface Location {
  id: number
  latitude: number
  longitude: number
  name: string
  active: boolean
  homeThumb: string
  rating: number
  slug: string
  createdAt: DateTime
  updatedAt: DateTime


}

export interface LocationName{ name: string, slug: string }

export interface FullLocation extends Location {
  airportCode: string
  dateRange: string
  nearby: NearbyLocation[]
  infoSections: InfoSection[]
  climbingTypes: ClimbingType[]
  accommodationNotes: string
  accommodations: Accommodation[]
  bestTransportation: Transportation
  closestAccommodation: string
  commonExpensesNotes: string
  continent: string
  country: string
  foodOptions: FoodOption[]
  gettingInNotes: string
  grades: Grade[]
  savingMoneyTips: string
  soloFriendly: boolean
  transportations: Transportation[]
  walkingDistance: boolean
}

export interface Grade {
  grade: string
  id: number
  type: ClimbingType
}

export interface FoodOption {
  name: string
  cost: string
  id: number
}

export interface Transportation {
  name: string
  cost?: string
  id: number
}


export interface Accommodation {
  id: number
  name: string
  cost: string
  url: string
}

export interface NearbyLocation {
  latitude: number;
  longitude: number;
  slug: string;
  name: string;
  homeThumb: string;
  country: string;
  distance: number;
  climbingTypes: ClimbingType[];
  dateRange: string;
}

export interface ClimbingType {
  url: string;
  name: string;
  id: number;
}

interface InfoSection {
  id: number,
  title: string,
  body: string,
}