import { useState, useEffect } from 'react'
import { MapPin, X, Loader2, Search, Navigation } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { getUserLocation, reverseGeocode, saveChosenLocation, getCurrentPosition, saveCurrentLocation } from '../utils/locationUtils'
import axiosInstance from '../utils/axios'

const LocationModal = ({ isOpen, onClose, forceLocation = false }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [location, setLocation] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    // Check if location is already saved
    const savedLocation = getUserLocation()
    if (savedLocation) {
      setLocation(savedLocation)
    }
  }, [])

  const searchLocation = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    setError('')
    
    try {
      const response = await axiosInstance.get('/locations', {
        params: {
          keyword: searchQuery
        }
      })
      
      
      setSearchResults(response.data.data || [])
    } catch (err) {
      setError('Failed to search location. Please try again.')
      console.error('Search error:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const selectLocation = async (result) => {
    setIsLoading(true)
    setError('')
    
    try {
      // Save the location data from your backend API response
      const locationData = {
        latitude: null,
        longitude: null,
        address: result.fullAddress,
        city: result.name,
        state: result.state,
        country: 'India', // Default since API seems to be for Indian locations
        postcode: result.pincode === 'N/A' ? null : result.pincode
      }
      
      // Remove currentLocation from localStorage if user is selecting typed location
      localStorage.removeItem('currentLocation');
      
      const success = saveChosenLocation(locationData)
      if (success) {
        setLocation(locationData)
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setError('Failed to save location. Please try again.')
      }
    } catch (err) {
      console.log(err)
      setError('Failed to save location. Please try again.')
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
        // Save the full location data (including coords) to chosen location
        const fullLocationData = {
          ...locationData,
          latitude: position.latitude,
          longitude: position.longitude
        }
        const success = saveChosenLocation(fullLocationData)
        // Also save coordinates separately for current location API calls
        const coordsSaved = saveCurrentLocation({
          latitude: position.latitude,
          longitude: position.longitude
        })
        if (success && coordsSaved) {
          setLocation(fullLocationData)
          setTimeout(() => {
            onClose()
          }, 1500)
        } else {
          setError('Failed to save location. Please try again.')
        }
      } else {
        setError('Invalid location coordinates. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'Failed to get current location. Please enable location permissions.')
    } finally {
      setIsLoading(false)
    }
  }

 

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Prevent closing if forceLocation is true and no location is set
      if (forceLocation && !location && open === false) {
        return
      }
      onClose()
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent" />
            {forceLocation ? 'Set Your Location' : 'Change Location'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {forceLocation 
              ? 'Please set your location to continue. You can use your current location or search for any area.'
              : 'Search for any location to view issues from that area.'
            }
          </p>
          
          {/* Current Location Button */}
          <Button 
            onClick={handleCurrentLocation}
            disabled={isLoading || isSearching}
            className="w-full hover:bg-transparent"
            variant="outline"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                <Navigation className="mr-2 h-4 w-4" />
                Use Current Location
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or search manually
              </span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for a city, pincode, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-border bg-background outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search Button */}
          <Button 
            onClick={searchLocation}
            disabled={isSearching || !searchQuery.trim()}
            className="w-full"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search Location
              </>
            )}
          </Button>

          {/* Search Results */}
          {searchQuery.trim() && (
            <>
              {searchResults.length > 0 ? (
                <div className="max-h-40 overflow-y-auto space-y-2 rounded-lg border border-border">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => selectLocation(result)}
                      className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="text-sm font-medium text-foreground">
                        {result.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {result.state}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                !isSearching && (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    No locations found for "{searchQuery}"
                  </div>
                )
              )}
            </>
          )}

          {location && (
            <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
              <p className="text-sm font-medium text-accent">
                ✓ Location updated successfully
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {location.city && location.state 
                  ? `${location.city}, ${location.state}`
                  : location.address || 'Location not set'
                }
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
          
          {forceLocation && (
            <p className="text-xs text-muted-foreground text-center">
              Location is required to continue. You can change this later.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default LocationModal
