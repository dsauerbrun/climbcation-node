import db from "../../db/index.js";
import { Grade } from "./types.js";

interface GetGradesArgs {
  locationId: number;
}
interface GetGradesResponse {
  grades: Grade[]
}

export const getGrades = async ({ locationId }: GetGradesArgs): Promise<GetGradesResponse> => {
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
