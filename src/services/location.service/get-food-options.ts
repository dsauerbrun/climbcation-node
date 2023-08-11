import db from "../../db/index.js";
import { FoodOption } from "./types.js";

interface GetFoodOptionsArgs {
  locationId: number;
}
interface GetFoodOptionsResponse {
  foodOptions: FoodOption[]
}

export const getFoodOptions = async ({ locationId }: GetFoodOptionsArgs): Promise<GetFoodOptionsResponse> => {
  const dbFoodOptions = await db.selectFrom('foodOptionLocationDetails')
    .where('foodOptionLocationDetails.locationId', '=', locationId)
    .innerJoin('foodOptions', 'foodOptions.id', 'foodOptionLocationDetails.foodOptionId')
    .selectAll('foodOptions')
    .select(['foodOptionLocationDetails.cost', 'foodOptionLocationDetails.id as foodOptionLocationDetailId'])
    .execute()

  const foodOptions: FoodOption[] = dbFoodOptions.map(foodOption => {
    const { id, name, cost, foodOptionLocationDetailId } = foodOption
    return {
      id: foodOptionLocationDetailId,
      name,
      cost,
    }
  })
  return { foodOptions };
}
