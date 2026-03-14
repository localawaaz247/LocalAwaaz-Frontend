import { useState, useEffect } from 'react'
import { MapPin, Loader2, X } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { reverseGeocode } from '../utils/locationUtils'
import { useTranslation } from "react-i18next";

const CurrentLocationModal = ({ isOpen, onClose, onLocationCaptured }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [location, setLocation] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setError('')
      setLocation(null)
    }
  }, [isOpen])

  const getCurrentLocation = () => {
    setIsLoading(true)
    setError('')

    if (!navigator.geolocation) {
      setError(t('geo_not_supported'))
      setIsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        reverseGeocode(position.coords.latitude, position.coords.longitude)
          .then(locationData => {
            const fullLocationData = {
              ...locationData,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
            
            if (fullLocationData.latitude !== null && fullLocationData.longitude !== null) {
              setLocation(fullLocationData)
              
              setTimeout(() => {
                onLocationCaptured(fullLocationData)
                onClose()
              }, 1500)
            } else {
              setError(t('invalid_coords'))
            }
          })
          .catch(err => {
            setError(t('failed_get_address'))
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
            errorMessage = t('location_denied')
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = t('location_unavailable')
            break
          case error.TIMEOUT:
            errorMessage = t('location_timeout')
            break
          default:
            errorMessage = t('location_unknown_error')
        }
        setError(errorMessage)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent" />
            {t('get_current_location')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {t('location_modal_desc')}
            </p>
            
            {location && (
              <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                <p className="text-sm font-medium text-accent">
                  ✓ {t('location_captured_success')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {location.city && location.state 
                    ? `${location.city}, ${location.state}`
                    : `Lat: ${location.latitude?.toFixed(4)}, Lng: ${location.longitude?.toFixed(4)}`}
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
                  {t('getting_location')}
                </>
              ) : location ? (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  {t('location_captured_btn')}
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  {t('get_current_location')}
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
              className="w-full"
            >
              {t('cancel')}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            {t('location_access_required')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CurrentLocationModal