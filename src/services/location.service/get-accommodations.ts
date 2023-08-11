import db from "../../db/index.js";
import { Accommodation } from "./types.js";

interface GetAccommodationsArgs {
  locationId: number;
}
interface GetAccommodationsResponse {
  accommodations: Accommodation[]
}

export const getAccommodations = async ({ locationId }: GetAccommodationsArgs): Promise<GetAccommodationsResponse> => {
  const dbAccommodations = await db.selectFrom('accommodationLocationDetails')
    .where('accommodationLocationDetails.locationId', '=', locationId)
    .innerJoin('accommodations', 'accommodations.id', 'accommodationLocationDetails.accommodationId')
    .selectAll('accommodations')
    .select(['accommodationLocationDetails.cost', 'accommodationLocationDetails.id as accommodationLocationDetailId'])
    .execute()

  const accommodations: Accommodation[] = dbAccommodations.map(accommodation => {
    const { cost, accommodationLocationDetailId, name, iconFileName } = accommodation
    return {
      id: accommodationLocationDetailId,
      cost,
      name,
      url: iconFileName,
    }
  })
  return { accommodations };
}
