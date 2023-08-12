import db from "../../db/index.js";
import { Grade } from "./types.js";

interface GetGradesForLocationArgs {
  locationId: number;
}
interface GetGradesForLocationResponse {
  grades: Grade[]
}

export const getGradesForLocation = async ({ locationId }: GetGradesForLocationArgs): Promise<GetGradesForLocationResponse> => {
  const dbGrades = await db.selectFrom('gradesLocations')
    .where('gradesLocations.locationId', '=', locationId)
    .innerJoin('grades', 'grades.id', 'gradesLocations.gradeId')
    .innerJoin('climbingTypes', 'climbingTypes.id', 'grades.climbingTypeId')
    .selectAll('grades')
    .select(['climbingTypes.name as climbingTypeName', 'climbingTypes.id as climbingTypeId', 'climbingTypes.iconFileName'])
    .execute()

  const grades: Grade[] = dbGrades.map(grade => {
    const { id, us, french, climbingTypeId, climbingTypeName, iconFileName } = grade 
    return {
      id,
      grade: `${us}|${french}`,
      type: {
        id: climbingTypeId,
        name: climbingTypeName,
        url: iconFileName
      }
    }
  })
  return { grades };
}

interface GetGradesForLocationsArgs {
  locationIds: number[];
}
interface GetGradesForLocationsResponse {
  grades: {[locationId: number]: Grade[]}
}

export const getGradesForLocations = async ({ locationIds }: GetGradesForLocationsArgs): Promise<GetGradesForLocationsResponse> => {
  if (locationIds.length === 0) {
    return { grades: {} }
  }
  const dbGrades = await db.selectFrom('gradesLocations')
    .where('gradesLocations.locationId', 'in', locationIds)
    .innerJoin('grades', 'grades.id', 'gradesLocations.gradeId')
    .innerJoin('climbingTypes', 'climbingTypes.id', 'grades.climbingTypeId')
    .selectAll('grades')
    .select(['climbingTypes.name as climbingTypeName', 'climbingTypes.id as climbingTypeId', 'climbingTypes.iconFileName', 'gradesLocations.locationId'])
    .execute()

  const grades: {[locationId: number]: Grade[]} = {}
  dbGrades.forEach(grade => {
    const { id, us, french, climbingTypeId, climbingTypeName, iconFileName, locationId } = grade
    if(!grades[locationId]) {
      grades[locationId] = []
    }
    grades[locationId].push({
      id,
      grade: `${us}|${french}`,
      type: {
        id: climbingTypeId,
        name: climbingTypeName,
        url: iconFileName
      }
    })
  })
  return { grades };
}
