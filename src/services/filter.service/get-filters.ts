import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"

export interface GetFiltersResponse extends ServiceResponseError {
  climbingTypes?: {climbingType: string, url: string}[]
  grades?: {
    climbingType: string,
    climbingTypeId: number,
    id: number, grade: string, order: number,
  }[]
}

export const getFilters = async (): Promise<GetFiltersResponse> => {
  try {
    const dbClimbingTypes = await db.selectFrom('climbingTypes').selectAll('climbingTypes').execute()
    const dbGrades = await db.selectFrom('grades')
      .leftJoin('climbingTypes', 'climbingTypes.id', 'grades.climbingTypeId')
      .selectAll('grades')
      .select(['climbingTypes.name as climbingTypeName', 'climbingTypes.id as climbingTypeId', 'climbingTypes.iconFileName'])
      .orderBy('grades.order', 'asc').execute()

    const climbingTypes = dbClimbingTypes.map(type => {
      const { name, iconFileName } = type
      return { climbingType: name, url: iconFileName }
    })

    const grades = dbGrades.map(grade => {
      const { id, us, french, order, climbingTypeId, climbingTypeName } = grade
      return {
        id,
        grade: `${us}|${french}`,
        order,
        climbingType: climbingTypeName,
        climbingTypeId,
      }
    })


    return { climbingTypes, grades }
  } catch (err) {
    const error = err as Error
    console.error('Error fetching locations', err)
    return { error: error.message }
  }

}
