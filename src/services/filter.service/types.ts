import { ClimbingType, Grade } from '../location.service/index.js'

export interface FilterLocation {
  id: number
  latitude: number
  longitude: number
  dateRange: string
  name: string
  homeThumb: string
  rating: number
  slug: string
  climbingTypes: ClimbingType[]
  walkingDistance: boolean
  soloFriendly: boolean
  grades: Grade[]
  distance?: number
}

