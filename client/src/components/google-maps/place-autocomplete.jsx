import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Loader } from "@googlemaps/js-api-loader";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const DEFAULT_SEARCH_TYPES = [];

const extractAddressComponents = (components = []) => {
  const findComponent = (types) => {
    return components.find((component) => types.every((type) => component.types.includes(type)));
  };

  const streetNumber = findComponent(["street_number"])?.long_name || "";
  const route = findComponent(["route"])?.long_name || "";
  const city =
    findComponent(["locality"])?.long_name ||
    findComponent(["sublocality", "sublocality_level_1"])?.long_name ||
    findComponent(["administrative_area_level_2"])?.long_name ||
    "";
  const state = findComponent(["administrative_area_level_1"])?.short_name || "";
  const zip = findComponent(["postal_code"])?.long_name || "";

  const street = [streetNumber, route].filter(Boolean).join(" ");

  return {
    street,
    city,
    state,
    zip,
  };
};

const buildPlaceDetails = (place, prediction) => {
  if (!place) {
    return null;
  }

  const lat = place.geometry?.location?.lat?.();
  const lng = place.geometry?.location?.lng?.();
  const coordinates = lat != null && lng != null ? [lng, lat] : null;

  const formattedAddress =
    place.formatted_address || prediction?.description || place.vicinity || "";

  const mapUrl =
    place.url ||
    (place.place_id ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}` : "");

  return {
    placeId: place.place_id || prediction?.place_id || "",
    name: place.name || prediction?.structured_formatting?.main_text || formattedAddress,
    formattedAddress,
    address: extractAddressComponents(place.address_components || []),
    coordinates,
    location: coordinates ? { lat: coordinates[1], lng: coordinates[0] } : null,
    mapUrl,
    phoneNumber: place.formatted_phone_number || place.international_phone_number || "",
    website: place.website || "",
    raw: place,
  };
};

export const GooglePlaceAutocomplete = ({
  label = "Search Venue",
  placeholder = "Search for a venue or address",
  helperText,
  error,
  onPlaceSelected,
  onLoadingChange,
  onError,
  initialValue = "",
  types = DEFAULT_SEARCH_TYPES,
  componentRestrictions,
  disabled,
  fullWidth = true,
}) => {
  const [googleMaps, setGoogleMaps] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const requestAbortRef = useRef({ predictions: null });
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState(initialValue || "");
  const [selectedOption, setSelectedOption] = useState(null);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    setInputValue(initialValue || "");
  }, [initialValue]);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      const message = "Google Maps API key is not configured.";
      setLoadError(message);
      onError?.(message);
      return;
    }

    let isMounted = true;

    const loader = new Loader({
      apiKey,
      libraries: ["places"],
      version: "weekly",
    });

    loader
      .load()
      .then((google) => {
        if (!isMounted) {
          return;
        }
        setGoogleMaps(google);
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        placesServiceRef.current = new google.maps.places.PlacesService(document.createElement("div"));
      })
      .catch((err) => {
        console.error("Failed to load Google Maps", err);
        const message = "Failed to load Google Maps";
        setLoadError(message);
        onError?.(message);
      });

    return () => {
      isMounted = false;
      if (requestAbortRef.current.predictions) {
        clearTimeout(requestAbortRef.current.predictions);
      }
    };
  }, [onError]);

  const fetchPredictions = (value) => {
    if (!value) {
      setOptions([]);
      return;
    }

    if (!autocompleteServiceRef.current || !googleMaps) {
      return;
    }

    setLoadingPredictions(true);
    const request = { input: value };
    if (Array.isArray(types) && types.length > 0) {
      request.types = types;
    }
    if (componentRestrictions) {
      request.componentRestrictions = componentRestrictions;
    }
    autocompleteServiceRef.current.getPlacePredictions(
      request,
      (predictions, status) => {
        setLoadingPredictions(false);
        if (status !== googleMaps.maps.places.PlacesServiceStatus.OK || !predictions) {
          setOptions([]);
          return;
        }
        setOptions(predictions);
      }
    );
  };

  const handleInputChange = (event, newInputValue, reason) => {
    setInputValue(newInputValue);

    if (reason === "reset") {
      return;
    }

    if (requestAbortRef.current.predictions) {
      clearTimeout(requestAbortRef.current.predictions);
    }

    requestAbortRef.current.predictions = setTimeout(() => {
      fetchPredictions(newInputValue);
      requestAbortRef.current.predictions = null;
    }, 250);
  };

  const fetchPlaceDetails = (prediction) => {
    if (!prediction || !placesServiceRef.current || !googleMaps) {
      return;
    }

    setLoadingDetails(true);
    onLoadingChange?.(true);

    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: [
          "place_id",
          "name",
          "formatted_address",
          "address_components",
          "geometry",
          "url",
          "formatted_phone_number",
          "international_phone_number",
          "website",
          "vicinity",
        ],
      },
      (place, status) => {
        setLoadingDetails(false);
        onLoadingChange?.(false);

        if (status !== googleMaps.maps.places.PlacesServiceStatus.OK || !place) {
          const message = "Unable to retrieve place details.";
          onError?.(message);
          return;
        }

        const details = buildPlaceDetails(place, prediction);
        if (!details) {
          const message = "Place details were incomplete.";
          onError?.(message);
          return;
        }

        setSelectedOption(prediction);
        setInputValue(details.name || details.formattedAddress || prediction.description || "");
        setOptions([prediction]);
        onPlaceSelected?.(details);
      }
    );
  };

  const handleOptionChange = (event, newValue, reason) => {
    if (reason === "clear") {
      setSelectedOption(null);
      setInputValue("");
      setOptions([]);
      onPlaceSelected?.(null);
      return;
    }

    if (!newValue) {
      return;
    }

    setSelectedOption(newValue);
    fetchPlaceDetails(newValue);
  };

  const isDisabled = disabled || !!loadError || !googleMaps;
  const isLoading = loadingPredictions || loadingDetails;

  return (
    <Box>
      <Autocomplete
        options={options}
        value={selectedOption}
        onChange={handleOptionChange}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        getOptionLabel={(option) => option?.description || ""}
        filterOptions={(x) => x}
        loading={isLoading}
        disabled={isDisabled}
        fullWidth={fullWidth}
        clearOnEscape
        blurOnSelect
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.place_id}>
            <Box>
              <Typography variant="subtitle2">
                {option.structured_formatting?.main_text || option.description}
              </Typography>
              {option.structured_formatting?.secondary_text && (
                <Typography variant="body2" color="text.secondary">
                  {option.structured_formatting.secondary_text}
                </Typography>
              )}
            </Box>
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            error={!!error || !!loadError}
            helperText={loadError || error || helperText}
          />
        )}
      />
    </Box>
  );
};

GooglePlaceAutocomplete.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string,
  helperText: PropTypes.string,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  onPlaceSelected: PropTypes.func,
  onLoadingChange: PropTypes.func,
  onError: PropTypes.func,
  initialValue: PropTypes.string,
  types: PropTypes.arrayOf(PropTypes.string),
  componentRestrictions: PropTypes.object,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
};

export default GooglePlaceAutocomplete;
