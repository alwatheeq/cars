import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Save, X, Search, Loader, Navigation } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AddressEditorProps {
  userId: string;
  currentAddress?: string;
  onSave: (address: string) => void;
  onCancel: () => void;
}

interface GooglePlace {
  formatted_address: string;
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  place_id: string;
  address_components: any[];
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

const AddressEditor: React.FC<AddressEditorProps> = ({
  userId,
  currentAddress = '',
  onSave,
  onCancel
}) => {
  const [address, setAddress] = useState(currentAddress);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<GooglePlace | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);

  useEffect(() => {
    loadGoogleMapsScript();
  }, []);

  const loadGoogleMapsScript = () => {
    if (window.google && window.google.maps) {
      setGoogleLoaded(true);
      initializeGoogleMaps();
      return;
    }

    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Script is already loading
      window.initGoogleMaps = () => {
        setGoogleLoaded(true);
        initializeGoogleMaps();
      };
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCuWDtewcE-Gftux7_CMDBeAl2Id4jLySw&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    
    window.initGoogleMaps = () => {
      setGoogleLoaded(true);
      initializeGoogleMaps();
    };

    document.head.appendChild(script);
  };

  const initializeGoogleMaps = () => {
    if (!window.google) return;

    // Initialize geocoder
    geocoderRef.current = new window.google.maps.Geocoder();

    // Initialize autocomplete
    if (inputRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: ['us', 'ca', 'gb', 'au'] },
        }
      );

      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
    }

    // Initialize map
    if (mapRef.current) {
      const defaultCenter = { lat: 40.7128, lng: -74.0060 }; // New York City default
      
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        center: defaultCenter,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      // Initialize marker
      markerRef.current = new window.google.maps.Marker({
        position: defaultCenter,
        map: mapInstanceRef.current,
        draggable: true,
        title: 'Drag me to select your address'
      });

      // Add click listener to map
      mapInstanceRef.current.addListener('click', handleMapClick);
      
      // Add drag listener to marker
      markerRef.current.addListener('dragend', handleMarkerDrag);

      // Try to get user's current location
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setCenter(location);
          markerRef.current.setPosition(location);
          reverseGeocode(location);
        }
        setGettingLocation(false);
      },
      (error) => {
        console.warn('Could not get current location:', error);
        setGettingLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current.getPlace();
    
    if (!place.geometry || !place.geometry.location) {
      setError('Please select a valid address from the dropdown');
      return;
    }

    updateLocationFromPlace(place);
  };

  const handleMapClick = (event: any) => {
    const location = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };
    
    if (markerRef.current) {
      markerRef.current.setPosition(location);
    }
    
    reverseGeocode(location);
  };

  const handleMarkerDrag = () => {
    if (!markerRef.current) return;
    
    const position = markerRef.current.getPosition();
    const location = {
      lat: position.lat(),
      lng: position.lng()
    };
    
    reverseGeocode(location);
  };

  const reverseGeocode = (location: {lat: number, lng: number}) => {
    if (!geocoderRef.current) return;

    geocoderRef.current.geocode(
      { location: location },
      (results: any[], status: string) => {
        if (status === 'OK' && results[0]) {
          const place = {
            formatted_address: results[0].formatted_address,
            geometry: {
              location: {
                lat: () => location.lat,
                lng: () => location.lng
              }
            },
            place_id: results[0].place_id,
            address_components: results[0].address_components
          };
          
          setSelectedPlace(place);
          setAddress(place.formatted_address);
          setError(null);
        } else {
          setError('Could not find address for this location');
        }
      }
    );
  };

  const updateLocationFromPlace = (place: any) => {
    setSelectedPlace(place);
    setAddress(place.formatted_address);
    setError(null);

    if (mapInstanceRef.current && markerRef.current) {
      const location = place.geometry.location;
      mapInstanceRef.current.setCenter(location);
      markerRef.current.setPosition(location);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    setSelectedPlace(null);
  };

  const handleUseCurrentLocation = () => {
    getCurrentLocation();
  };

  const handleSave = async () => {
    if (!selectedPlace) {
      setError('Please select an address from the map or search results');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const location = selectedPlace.geometry.location;
      const latitude = location.lat();
      const longitude = location.lng();

      const { error: updateError } = await supabase
        .from('users')
        .update({
          address: selectedPlace.formatted_address,
          latitude: latitude,
          longitude: longitude,
          place_id: selectedPlace.place_id,
          address_components: selectedPlace.address_components,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      onSave(selectedPlace.formatted_address);
    } catch (err) {
      console.error('Error saving address:', err);
      setError(err instanceof Error ? err.message : 'Failed to save address');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <MapPin className="w-6 h-6 mr-3 text-blue-600" />
            Select Your Address
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0">
          {/* Left Panel - Search and Controls */}
          <div className="lg:w-1/3 p-6 border-r border-gray-200 flex flex-col">
            {/* Action Buttons - Moved to Top */}
            <div className="flex space-x-3 mb-6 pb-4 border-b border-gray-200">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !selectedPlace}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium"
              >
                {isSaving ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </button>
            </div>

            <div className="space-y-4 flex-1">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search for your address
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={address}
                    onChange={handleInputChange}
                    placeholder="Start typing your address..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    disabled={!googleLoaded}
                  />
                  {!googleLoaded && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader className="w-5 h-5 text-gray-400 animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Current Location Button */}
              <button
                onClick={handleUseCurrentLocation}
                disabled={gettingLocation || !googleLoaded}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {gettingLocation ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Navigation className="w-5 h-5" />
                )}
                <span>{gettingLocation ? 'Getting location...' : 'Use Current Location'}</span>
              </button>

              {/* Selected Address Display */}
              {selectedPlace && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-800 mb-1">Selected Address:</p>
                      <p className="text-sm text-green-700 leading-relaxed">
                        {selectedPlace.formatted_address}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Map */}
          <div className="lg:w-2/3 relative">
            {!googleLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Loading Google Maps...</p>
                </div>
              </div>
            )}
            <div 
              ref={mapRef} 
              className="w-full h-full bg-gray-100"
              style={{ minHeight: '100%' }}
            />
            
            {/* Map Instructions Overlay */}
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
              <p className="text-sm text-gray-700">
                <strong>Click</strong> on the map or <strong>drag</strong> the marker to select your exact address location.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressEditor;