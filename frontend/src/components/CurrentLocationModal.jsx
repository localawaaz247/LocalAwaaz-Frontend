import { useState, useEffect } from 'react'
import { MapPin, Loader2, X } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { reverseGeocode } from '../utils/locationUtils'

const CurrentLocationModal = ({ isOpen, onClose, onLocationCaptured }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [location, setLocation] = useState(null)

  useEffect(() => {
    // Reset state when modal opens
    if (isOpen) {
      setError('')
      setLocation(null)
    }
  }, [isOpen])

  const getCurrentLocation = () => {
    setIsLoading(true)
    setError('')

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      setIsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Latitude:", position.coords.latitude);
        console.log("Longitude:", position.coords.longitude);
        
        // Get address from coordinates using reverse geocoding
        reverseGeocode(position.coords.latitude, position.coords.longitude)
          .then(locationData => {
            if (locationData.latitude !== null && locationData.longitude !== null) {
              setLocation(locationData)
              
              // Pass location data to parent component
              setTimeout(() => {
                onLocationCaptured(locationData)
                onClose()
              }, 1500)
            } else {
              setError('Invalid location coordinates. Please try again.')
            }
          })
          .catch(err => {
            setError('Failed to get location address. Please try again.')
          })
          .finally(() => {
            setIsLoading(false)
          })
      },
      (error) => {
        console.log("Error:", error.message)
        setIsLoading(false)
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
        setError(errorMessage)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent" />
            Get Current Location
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              We'll use your current location to tag this issue. This helps authorities locate and resolve the problem faster.
            </p>
            
            {location && (
              <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                <p className="text-sm font-medium text-accent">
                  ✓ Location captured successfully
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {location.address}
                </p>
              </div>
            )}
            
            {error && (
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-sm text-destructive">
                  {error}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={getCurrentLocation}
              disabled={isLoading || !!location}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting Location...
                </>
              ) : location ? (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Location Captured
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Get Current Location
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Location access is required to post issues in your area
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CurrentLocationModal
