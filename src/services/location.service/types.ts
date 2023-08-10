
export interface Location {
  id: number
  latitude: number
  longitude: number
  name: string
}

export interface FullLocation extends Location {
  dateRange: string
  nearby: NearbyLocation[]
  infoSections: InfoSection[]
  climbingTypes: ClimbingType[]

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