import { useState, useEffect } from 'react'
import { MapPin, X, Loader2, Search, Navigation } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { getUserLocation, reverseGeocode, saveChosenLocation, getCurrentPosition, saveCurrentLocation } from '../utils/locationUtils'
import axiosInstance from '../utils/axios'
import { useTranslation } from "react-i18next";

const LocationModal = ({ isOpen, onClose, forceLocation = false }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [location, setLocation] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const savedLocation = getUserLocation()
    if (savedLocation) {
      setLocation(savedLocation)
    }
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        setIsSearching(true)
        setError('')
        try {
          const response = await axiosInstance.get('/locations', {
            params: { keyword: searchQuery }
          })
          setSearchResults(response.data.data || [])
        } catch (err) {
          setError(t('failed_search_location'))
          console.error('Search error:', err)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, t])

  const selectLocation = async (result) => {
    setIsLoading(true)
    setError('')

    try {
      const locationData = {
        latitude: null,
        longitude: null,
        address: result.fullAddress,
        city: result.name,
        state: result.state,
        country: 'India',
        postcode: result.pincode === 'N/A' ? null : result.pincode
      }

      localStorage.removeItem('currentLocation');

      const success = saveChosenLocation(locationData)
      if (success) {
        setLocation(locationData)
        setTimeout(() => {
          onClose()
          setSearchQuery('')
          setSearchResults([])
        }, 1000)
      } else {
        setError(t('failed_save_location'))
      }
    } catch (err) {
      console.error(err)
      setError(t('failed_save_location'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCurrentLocation = async () => {
    setIsLoading(true)
    setError('')

    try {
      const position = await getCurrentPosition();
      const locationData = await reverseGeocode(position.latitude, position.longitude);

      if (locationData.latitude !== null && locationData.longitude !== null) {
        const fullLocationData = {
          ...locationData,
          latitude: position.latitude,
          longitude: position.longitude
        }
        const success = saveChosenLocation(fullLocationData)

        const coordsSaved = saveCurrentLocation({
          latitude: position.latitude,
          longitude: position.longitude
        })

        if (success && coordsSaved) {
          setLocation(fullLocationData)

          localStorage.setItem('cached_geo_location', JSON.stringify({
            ...fullLocationData,
            timestamp: Date.now()
          }));

          setTimeout(() => {
            onClose()
          }, 1000)
        } else {
          setError(t('failed_save_location'))
        }
      } else {
        setError(t('invalid_coords'))
      }
    } catch (err) {
      setError(err.message || t('failed_get_current_location'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (forceLocation && !location && open === false) {
        return
      }
      onClose()
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent" />
            {forceLocation ? t('set_your_location') : t('change_location')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {forceLocation
              ? t('set_location_desc')
              : t('search_location_desc')
            }
          </p>

          <Button
            onClick={handleCurrentLocation}
            disabled={isLoading || isSearching}
            className="w-full hover:bg-transparent"
            variant="outline"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('getting_location')}
              </>
            ) : (
              <>
                <Navigation className="mr-2 h-4 w-4" />
                {t('use_current_location')}
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t('or_search_manually')}
              </span>
            </div>
          </div>

          <div className="relative">
            {isSearching ? (
              <Loader2 className="absolute left-3 top-3.5 h-5 w-5 text-cyan-600 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
            )}
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-border bg-background outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {searchQuery.trim().length > 2 && (
            <>
              {searchResults.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-xl border border-border bg-muted/30 p-1.5 custom-scrollbar">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => selectLocation(result)}
                      className="w-full text-left p-3 rounded-lg hover:bg-background hover:shadow-sm border border-transparent hover:border-border transition-all"
                    >
                      <div className="text-sm font-semibold text-foreground">
                        {result.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {result.fullAddress || result.state}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                !isSearching && (
                  <div className="p-4 text-center bg-muted/30 rounded-xl border border-border">
                    <p className="text-sm font-medium text-foreground">{t('no_locations_found')}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('try_broader_search')}</p>
                  </div>
                )
              )}
            </>
          )}

          {location && (
            <div className="p-3 bg-accent/10 rounded-xl border border-accent/20 animate-fade-in">
              <p className="text-sm font-medium text-accent flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {t('location_updated_success')}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 pl-6">
                {location.city && location.state
                  ? `${location.city}, ${location.state}`
                  : location.address || t('location_saved')
                }
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 animate-fade-in">
              <p className="text-sm text-red-500 font-medium">
                {error}
              </p>
            </div>
          )}

          {forceLocation && !location && (
            <p className="text-xs text-muted-foreground text-center font-medium">
              {t('location_required_feed')}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default LocationModal