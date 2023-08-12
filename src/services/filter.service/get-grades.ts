import db from "../../db/index.js"
import { Grade } from "./types.js"

export interface GetGradesResponse {
  grades?: Grade[]
  error?: string
}

export const getGrades = async (): Promise<GetGradesResponse> => {
  try {
    const dbGrades = await db.selectFrom('grades')
      .leftJoin('climbingTypes', 'climbingTypes.id', 'grades.climbingTypeId')
      .selectAll('grades')
      .select(['climbingTypes.name as climbingTypeName', 'climbingTypes.id as climbingTypeId', 'climbingTypes.iconFileName'])
      .orderBy('grades.order', 'asc').execute()

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

    return { grades }
  } catch (err) {
    const error = err as Error
    console.error('Error fetching grades', err)
    return { error: error.message }
  }

}
