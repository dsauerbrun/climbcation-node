import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { ClimbingType, getClimbingTypes, getGrades, Grade } from "../filter.service/index.js"
import { Accommodation, FoodOption, Month, Transportation } from "./types.js"

export interface GetAttributeOptionsResponse extends ServiceResponseError {
  climbingTypes?: ClimbingType[]
  grades?: Grade[]
  accommodations?: Accommodation[]
  foodOptions?: FoodOption[]
  transportations?: Transportation[]
  months?: Month[]
}

export const getAttributeOptions = async (): Promise<GetAttributeOptionsResponse> => {
  try {
    // get accommodations
    const dbAccommodations = await db.selectFrom('accommodations')
      .selectAll('accommodations').execute()
    const accommodations = dbAccommodations.map(accommodation => {
      const { id, name, iconFileName, costRanges } = accommodation
      return {
        id,
        name,
        url: iconFileName,
        ranges: costRanges,
      }
    })
    // get food options
    const dbFoodOptions = await db.selectFrom('foodOptions')
      .selectAll('foodOptions').execute()
    const foodOptions = dbFoodOptions.map(foodOption => {
      const { id, name, costRanges } = foodOption
      return {
        id,
        name,
        ranges: costRanges,
      }
    })
    // get transports
    const dbTransportations = await db.selectFrom('transportations')
      .selectAll('transportations').execute()
    const transportations = dbTransportations.map(transportation => {
      const { id, name, costRanges } = transportation
      return {
        id,
        name,
        ranges: costRanges,
      }
    })
    // get seasons
    const dbSeasons = await db.selectFrom('seasons')
      .selectAll('seasons').orderBy('numericalValue', 'asc').execute()
    const months = dbSeasons.map(season => {
      const { id, name, numericalValue } = season
      return {
        id,
        name,
        numericalValue,
      }
    })
    const { climbingTypes } = await getClimbingTypes()
    const { grades } = await getGrades()


    return { climbingTypes, grades, accommodations, foodOptions, transportations, months }
  } catch (err) {
    const error = err as Error
    console.error('Error fetching locations', err)
    return { error: error.message }
  }

}
