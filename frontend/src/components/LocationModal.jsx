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

  // --- 500ms DEBOUNCE AUTO-SEARCH LOGIC ---
  useEffect(() => {
    // Wait 500ms after the user stops typing
    const delayDebounceFn = setTimeout(async () => {
      // Only search if they typed at least 3 characters
      if (searchQuery.trim().length > 2) {
        setIsSearching(true)
        setError('')
        try {
          const response = await axiosInstance.get('/locations', {
            params: { keyword: searchQuery }
          })
          setSearchResults(response.data.data || [])
        } catch (err) {
          setError('Failed to search location. Please try again.')
          console.error('Search error:', err)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([]) // Clear results if input is cleared or too short
      }
    }, 500)

    // Cleanup function cancels the previous timer if user keeps typing
    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

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
          setSearchQuery('') // Reset input for next time
          setSearchResults([])
        }, 1000) // Sped up the close animation slightly
      } else {
        setError('Failed to save location. Please try again.')
      }
    } catch (err) {
      console.error(err)
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

          // ✅ SYNC WITH FEED & LOKAI ASSISTANT 2-HOUR CACHE
          localStorage.setItem('cached_geo_location', JSON.stringify({
             ...fullLocationData,
             timestamp: Date.now()
          }));

          setTimeout(() => {
            onClose()
          }, 1000)
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

          {/* Search Input (Dynamic) */}
          <div className="relative">
            {isSearching ? (
              <Loader2 className="absolute left-3 top-3.5 h-5 w-5 text-cyan-600 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
            )}
            <input
              type="text"
              placeholder="Search for a city, pincode, or area..."
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

          {/* Search Results */}
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
                    <p className="text-sm font-medium text-foreground">No locations found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try searching for a broader area or pincode</p>
                  </div>
                )
              )}
            </>
          )}

          {location && (
            <div className="p-3 bg-accent/10 rounded-xl border border-accent/20 animate-fade-in">
              <p className="text-sm font-medium text-accent flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Location updated successfully
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 pl-6">
                {location.city && location.state 
                  ? `${location.city}, ${location.state}`
                  : location.address || 'Location saved'
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
              Location is required to view your local feed.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default LocationModal