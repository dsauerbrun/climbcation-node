import db from "../../db/index.js";
import { ClimbingType } from "./types.js";

export const getClimbingTypesForLocation = async ({ locationId }: { locationId: number }): Promise<ClimbingType[]> => {
  const climbingTypes = await db.selectFrom('climbingTypes')
    .innerJoin('climbingTypesLocations', 'climbingTypesLocations.climbingTypeId', 'climbingTypes.id') 
    .select(['climbingTypes.id', 'climbingTypes.name', 'climbingTypes.iconFileName as url'])
    .where('climbingTypesLocations.locationId', '=', locationId)
    .execute()
  return climbingTypes
}

interface GetClimbingTypesResponse {
  [locationId: number]: ClimbingType[]
}
export const getClimbingTypes = async ({ locationIds }: { locationIds: number[] }): Promise<GetClimbingTypesResponse> => {
  if (locationIds.length === 0) {
    return {}
  }
  const climbingTypes = await db.selectFrom('climbingTypes')
    .innerJoin('climbingTypesLocations', 'climbingTypesLocations.climbingTypeId', 'climbingTypes.id') 
    .select(['climbingTypes.id', 'climbingTypes.name', 'climbingTypes.iconFileName as url', 'climbingTypesLocations.locationId'])
    .where('climbingTypesLocations.locationId', 'in', locationIds)
    .execute()

  const climbingTypesByLocationId = climbingTypes.reduce((acc, climbingType) => {
    if (!acc[climbingType.locationId]) {
      acc[climbingType.locationId] = []
    }
    acc[climbingType.locationId].push(climbingType)
    return acc
  }, {} as GetClimbingTypesResponse)

  return climbingTypesByLocationId
}