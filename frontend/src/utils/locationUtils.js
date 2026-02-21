// Utility functions for location management

import axiosInstance from "./axios";

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
    const response = await axiosInstance.post('/get-location-from-coords', {
      lat: latitude,
      lng: longitude
    })
    
    const data = response.data?.data;
    
    return {
      city: data.city || 'Unknown',
      state: data.state || 'Unknown',
      country: data.country || 'Unknown',
    }
  } catch (error) {
    console.error('Error in reverse geocoding:', error)
    // Return basic coordinates if geocoding fails
    return {
      city: 'Unknown',
      state: 'Unknown',
      country: 'Unknown',
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
