// Utility functions for location management

export const getUserLocation = () => {
  try {
    const savedLocation = localStorage.getItem('userLocation')
    return savedLocation ? JSON.parse(savedLocation) : null
  } catch (error) {
    console.error('Error parsing saved location:', error)
    return null
  }
}

export const saveUserLocation = (locationData) => {
  try {
    // Only save if latitude and longitude are not null
    if (locationData && locationData.latitude !== null && locationData.longitude !== null) {
      localStorage.setItem('userLocation', JSON.stringify(locationData))
      return true
    } else {
      console.warn('Location not saved: Invalid coordinates')
      return false
    }
  } catch (error) {
    console.error('Error saving location:', error)
    return false
  }
}

export const clearUserLocation = () => {
  try {
    localStorage.removeItem('userLocation')
    return true
  } catch (error) {
    console.error('Error clearing location:', error)
    return false
  }
}

export const formatLocationDisplay = (location) => {
  if (!location) return "Location not set"
  
  if (location.city && location.state) {
    return `${location.city}, ${location.state}`
  }
  
  if (location.address && location.address !== 'Location not provided') {
    return location.address
  }
  
  return "Location not set"
}

export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        })
      },
      (error) => {
        let errorMessage
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable."
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out."
            break
          default:
            errorMessage = "An unknown error occurred while getting location."
        }
        reject(new Error(errorMessage))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  })
}

export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'LocalAwaaz-App/1.0'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch address')
    }
    
    const data = await response.json()
    
    return {
      latitude,
      longitude,
      address: data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
      state: data.address?.state || 'Unknown',
      country: data.address?.country || 'Unknown',
      postcode: data.address?.postcode || null
    }
  } catch (error) {
    console.error('Error in reverse geocoding:', error)
    // Return basic coordinates if geocoding fails
    return {
      latitude,
      longitude,
      address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      city: 'Unknown',
      state: 'Unknown',
      country: 'Unknown',
      postcode: null
    }
  }
}

export const getChosenLocation = () => {
  try {
    const savedLocation = localStorage.getItem('choosenLocation')
    return savedLocation ? JSON.parse(savedLocation) : null
  } catch (error) {
    console.error('Error parsing chosen location:', error)
    return null
  }
}

export const saveChosenLocation = (locationData) => {
  try {
    // Store only search data without coordinates
    const chosenData = {
      address: locationData.address,
      city: locationData.city,
      state: locationData.state,
      country: locationData.country,
      postcode: locationData.postcode
    }
    localStorage.setItem('choosenLocation', JSON.stringify(chosenData))
    return true
  } catch (error) {
    console.error('Error saving chosen location:', error)
    return false
  }
}

export const getCurrentLocationStored = () => {
  try {
    const savedLocation = localStorage.getItem('currentLocation')
    return savedLocation ? JSON.parse(savedLocation) : null
  } catch (error) {
    console.error('Error parsing current location:', error)
    return null
  }
}

export const saveCurrentLocation = (locationData) => {
  try {
    // Store only coordinates for current location
    const currentData = {
      latitude: locationData.latitude,
      longitude: locationData.longitude
    }
    localStorage.setItem('currentLocation', JSON.stringify(currentData))
    return true
  } catch (error) {
    console.error('Error saving current location:', error)
    return false
  }
}
