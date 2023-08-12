import { ClimbingType as LocationClimbingType, Grade as LocationGrade } from '../location.service/index.js'

export interface FilterLocation {
  id: number
  latitude: number
  longitude: number
  dateRange: string
  name: string
  homeThumb: string
  rating: number
  slug: string
  climbingTypes: LocationClimbingType[]
  walkingDistance: boolean
  soloFriendly: boolean
  grades: LocationGrade[]
  distance?: number
}

export interface ClimbingType {id: number, climbingType: string, url: string}
export interface Grade {
  climbingType: string,
  climbingTypeId: number,
  id: number, grade: string, order: number,
}