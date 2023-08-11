import db from "../../db/index.js";
import { Transportation } from "./types.js";

interface GetTransportationsArgs {
  locationId: number;
}
interface GetTransportationsResponse {
  transportations: Transportation[]
}

export const getTransportations = async ({ locationId }: GetTransportationsArgs): Promise<GetTransportationsResponse> => {
  const dbTransportations = await db.selectFrom('locationsTransportations')
    .where('locationsTransportations.locationId', '=', locationId)
    .leftJoin('transportations', 'locationsTransportations.transportationId', 'transportations.id')
    .leftJoin('primaryTransportations', join => 
      join.onRef('locationsTransportations.transportationId', '=', 'primaryTransportations.transportationId')
        .onRef('locationsTransportations.locationId', '=', 'primaryTransportations.locationId')
    )
    .selectAll('transportations')
    .select('primaryTransportations.cost')
    .execute()

  const transportations: Transportation[] = dbTransportations.map(transportation => {
    const { id, name, cost } = transportation
    return {
      id,
      name,
      cost,
    }
  })
  return { transportations };
}
