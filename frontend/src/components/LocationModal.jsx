import { useState, useEffect } from 'react'
import { MapPin, X, Loader2, Search } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { getUserLocation, saveUserLocation, reverseGeocode, saveChosenLocation } from '../utils/locationUtils'

const LocationModal = ({ isOpen, onClose }) => {
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
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
        {
          headers: {
            'User-Agent': 'LocalAwaaz-App/1.0'
          }
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to search location')
      }
      
      const data = await response.json()
      setSearchResults(data || [])
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
      // Get detailed address for selected location
      const locationData = await reverseGeocode(result.lat, result.lon)
      
      if (locationData.latitude !== null && locationData.longitude !== null) {
        const success = saveChosenLocation(locationData)
        if (success) {
          setLocation(locationData)
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
      setError('Failed to save location. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    // Save default location or skip
    const defaultLocation = {
      address: 'Location not provided',
      city: 'Unknown',
      state: 'Unknown',
      country: 'Unknown',
      postcode: null
    }
    saveChosenLocation(defaultLocation)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent" />
            Change Location
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Search for any location to view issues from that area.
          </p>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for a city, area, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-border bg-background outline-none transition-all focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
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
                        {result.display_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {result.display_name.split(',')[0]}
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
          
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading || isSearching}
              className="w-full"
            >
              Cancel
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              You can change this later by clicking "Change Area"
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default LocationModal
