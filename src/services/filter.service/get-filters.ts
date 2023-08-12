import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { getClimbingTypes } from "./get-climbing-types.js"
import { getGrades } from "./get-grades.js"
import { ClimbingType, Grade } from "./types.js"

export interface GetFiltersResponse extends ServiceResponseError {
  climbingTypes?: ClimbingType[]
  grades?: Grade[]
}

export const getFilters = async (): Promise<GetFiltersResponse> => {
  try {
    const { climbingTypes } = await getClimbingTypes()
    const { grades } = await getGrades()

    return { climbingTypes, grades }
  } catch (err) {
    const error = err as Error
    console.error('Error fetching locations', err)
    return { error: error.message }
  }

}
