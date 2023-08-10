interface ServiceResponseError {
  error?: string
}

interface LocationRequest {
  locationSlug: string
}

interface Location {
  id: number
  location: string
  slug: string
}

interface LocationResponse extends ServiceResponseError {
  location?: Location
}

export const getLocation = async ({ locationSlug }: LocationRequest): Promise<LocationResponse> => {

  if (!locationSlug) {
    return { error: 'no location slug found.' }
  }

  try {
    // fetch location

    return {
      location: {
        id: 1,
        location: 'New York, NY',
        slug: locationSlug,
      }
    }

  } catch (err) {
    const error = err as Error
    console.error('Error fetching location', err)
    return { error: error.message }
  }

}