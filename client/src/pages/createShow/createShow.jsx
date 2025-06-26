import { useEffect, useState } from "react";
import { isEmpty } from "lodash";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Button, CircularProgress, Box, Typography } from "@mui/material";
import { store } from "store";
import { getPlaceDetailsFromLink } from "@/helpers";
import dayjs from "dayjs";

//prettier-ignore
import {
  Col,
  FormProvider,
  useFormProvider,
  Input,
  NavSticky,
  Row,
  TextareaDebug,
  Fieldset,
  BtnContinueSave,
} from "components";

//prettier-ignore
import {
  resolver,
  errorNotification
} from "./validation";

export const CreateShow = () => {
  const user = store.use.user();
  const showCreate = store.use.showCreate();
  const performers = store.use.performers();
  const fetchPerformers = store.use.fetchPerformers();
  const navigate = useNavigate();
  const [loadingPlace, setLoadingPlace] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Initial form values
  const initialFormValues = {
    name: "",
    dateFrom: dayjs().hour(19).minute(0).second(0).millisecond(0).format("YYYY-MM-DDTHH:mm"), // 7pm today
    dateTo: dayjs().hour(22).minute(0).second(0).millisecond(0).format("YYYY-MM-DDTHH:mm"), // 10pm today
    location: "",
    description: "",
    status: "draft",
    additionalPerformers: [],
    venue: {
      name: "",
      phone: "",
      mapUrl: "",
      address: {
        street: "",
        city: "",
        state: "",
        zip: ""
      },
      location: {
        coordinates: [0, 0],
        mapsLink: ""
      }
    },
    settings: {
      allowRequests: true,
      maxRequestsPerUser: 3,
      requestDeadline: null
    }
  };

  // Check if user has permission to create shows
  useEffect(() => {
    if (user && !['admin', 'performer', 'organizer'].includes(user.role)) {
      toast.error("You don't have permission to create shows");
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch performers on component mount
  useEffect(() => {
    fetchPerformers();
  }, [fetchPerformers]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth <= 768;
    };
    setIsMobile(checkMobile());
  }, []);

  // Get form methods for use outside the form
  const formMethods = useFormProvider({
    resolver,
    defaultValues: initialFormValues
  });
  const { watch, setValue } = formMethods;

  // Watch the mapsLink field for changes
  const mapsLink = watch('venue.location.mapsLink');
  // Watch the dateFrom field for changes
  const dateFrom = watch('dateFrom');

  // Effect to handle dateFrom changes - adjust dateTo to be 3 hours later
  useEffect(() => {
    if (dateFrom) {
      const newDateTo = dayjs(dateFrom).add(3, 'hour').format("YYYY-MM-DDTHH:mm");
      setValue('dateTo', newDateTo);
    }
  }, [dateFrom, setValue]);

  // Effect to handle mapsLink changes
  useEffect(() => {
    const updateVenueDetails = async () => {
      if (!mapsLink) return;

      setLoadingPlace(true);
      try {
        const placeDetails = await getPlaceDetailsFromLink(mapsLink);

        // Update form fields with place details
        setValue('venue.name', placeDetails.name);
        setValue('venue.mapUrl', mapsLink); // Store the original maps URL
        setValue('venue.address.street', placeDetails.address.street);
        setValue('venue.address.city', placeDetails.address.city);
        setValue('venue.address.state', placeDetails.address.state);
        setValue('venue.address.zip', placeDetails.address.zip);
        setValue('venue.location.coordinates', placeDetails.location.coordinates);

        // Also update the main location field for backward compatibility
        setValue('location', placeDetails.name);

        toast.success('Venue details loaded from Google Maps!');
      } catch (error) {
        toast.error('Failed to get venue details from Google Maps link');
      } finally {
        setLoadingPlace(false);
      }
    };

    updateVenueDetails();
  }, [mapsLink, setValue]);

  // Function to open Google Maps app and get current location
  const openGoogleMapsForLocation = () => {
    if (!isMobile) {
      toast.info('This feature is available on mobile devices');
      return;
    }

    // Try to get current location first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          // Open Google Maps app with current location
          const mapsUrl = `https://maps.google.com/maps?q=${latitude},${longitude}`;

          // Try to open native app first
          const nativeMapsUrl = `comgooglemaps://?q=${latitude},${longitude}`;

          // Check if Google Maps app is installed
          const link = document.createElement('a');
          link.href = nativeMapsUrl;
          link.style.display = 'none';
          document.body.appendChild(link);

          // Try to open native app, fallback to web
          try {
            link.click();
            toast.info('Google Maps app opened. Please search for your venue and share the location.');
          } catch (error) {
            // Fallback to web version
            window.open(mapsUrl, '_blank');
            toast.info('Google Maps opened in browser. Please search for your venue and share the location.');
          }

          document.body.removeChild(link);
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Open Google Maps without location
          const mapsUrl = 'https://maps.google.com/';
          const nativeMapsUrl = 'comgooglemaps://';

          try {
            window.location.href = nativeMapsUrl;
            toast.info('Google Maps app opened. Please search for your venue and share the location.');
          } catch (error) {
            window.open(mapsUrl, '_blank');
            toast.info('Google Maps opened in browser. Please search for your venue and share the location.');
          }
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser');
    }
  };

  // Function to open Google Maps for venue search
  const openGoogleMapsForSearch = () => {
    if (!isMobile) {
      toast.info('This feature is available on mobile devices');
      return;
    }

    // Open Google Maps app for search
    const nativeMapsUrl = 'comgooglemaps://?q=';

    try {
      window.location.href = nativeMapsUrl;
      toast.info('Google Maps app opened. Please search for your venue and share the location.');
    } catch (error) {
      // Fallback to web version
      window.open('https://maps.google.com/', '_blank');
      toast.info('Google Maps opened in browser. Please search for your venue and share the location.');
    }
  };

  // DO NOT SUBMIT HERE; it's done in BtnContinueSave
  const onClickContinueSave = (e) => {
    const id = e.currentTarget.id;
    switch (id) {
      case "btnContinue":
        e.currentTarget.form.requestSubmit();
        break;
      case "btnSave":
        alert("btnSave. additional logic here if needed");
        break;
      default:
        toast.error(`onClickContinueSave: unknown id: ${id}`);
    }
  }

  const onSubmit = async (values) => {
    try {
      // Transform form data to match server API
      const showData = {
        name: values.name,
        dateFrom: values.dateFrom.toISOString(), // Convert Date to ISO string
        dateTo: values.dateTo.toISOString(), // Convert Date to ISO string
        location: values.location,
        description: values.description || "",
        status: values.status,
        additionalPerformers: values.additionalPerformers || [],
        venue: values.venue, // Include venue data
        settings: {
          allowRequests: values.settings.allowRequests,
          maxRequestsPerUser: values.settings.maxRequestsPerUser,
          requestDeadline: values.settings.requestDeadline ? values.settings.requestDeadline.toISOString() : null
        }
      };

      const show = await showCreate(showData);
      if (show) {
        toast.success("Show created successfully!");
        navigate("/shows");
      } else {
        toast.error("Failed to create show");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred while creating the show");
    }
  };

  const onCancel = () => {
    navigate("/shows");
  };

  // Show loading or redirect if user doesn't have permission
  if (!user || !['admin', 'performer', 'organizer'].includes(user.role)) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Row>
        <Col size={{ xs: 12 }}>
          <h2>Create Show</h2>
        </Col>
      </Row>
      <FormProvider
        onSubmit={onSubmit}
        formMethods={formMethods}
      >
        <BtnContinueSave
          onClickContinueSave={onClickContinueSave}
        />
        {/* Venue Information Section */}
        <Fieldset>
          <Row>
            <Col size={{ xs: 12 }}>
              <h3>Venue Information</h3>
            </Col>
          </Row>
          <Row>
            <Input size={{ xs: 12 }}
              name="venue.location.mapsLink"
              label="Google Maps Link"
              placeholder="Paste the venue's Google Maps share link here"
              info="Right-click the venue on Google Maps and select 'Share' to get the link"
              InputProps={{
                endAdornment: loadingPlace && (
                  <CircularProgress color="inherit" size={20} />
                )
              }}
            />
          </Row>

          {/* Mobile Google Maps Integration */}
          {isMobile && (
            <Row>
              <Col size={{ xs: 12 }}>
                <Box sx={{ mt: 2, mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    📱 Mobile Google Maps Integration
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Use your device's Google Maps app to find and share venue locations
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={openGoogleMapsForLocation}
                      sx={{ fontSize: '0.8rem' }}
                    >
                      📍 Use Current Location
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={openGoogleMapsForSearch}
                      sx={{ fontSize: '0.8rem' }}
                    >
                      🔍 Search for Venue
                    </Button>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    After opening Google Maps, search for your venue, tap the share button, and paste the link above.
                  </Typography>
                </Box>
              </Col>
            </Row>
          )}
        </Fieldset>
        {/* Show Details Section */}
        <Fieldset legend="Show Details">
          <Row>
            <Input
              name="status"
              label="Status"
              size={{ xs: 12, xm: 6 }}
              options={[
                { key: "draft", text: "Draft" },
                { key: "published", text: "Published" },
                { key: "cancelled", text: "Cancelled" }
              ]}
              info="Draft shows are not visible to the public"
            />
          </Row>

          <Row>
            <Input
              size={{ xs: 12, xm: 6 }}
              name="name"
              label="Show Name"
            />
            <Input
              size={{ xs: 12, xm: 6 }}
              name="location"
              label="Location"
            />
          </Row>
          <Row>
            <Input
              size={{ xs: 7, xm: 6 }}
              datetimepicker
              name="dateFrom"
              label="Show Start Date & Time"
            />
            <Input
              size={{ xs: 7, xm: 6 }}
              datetimepicker
              name="dateTo"
              label="Show End Date & Time"
            />
          <Row>
            <Input
              size={7}
              datetimepicker
              name="settings.requestDeadline"
              label="Request Deadline"
              info="When should requests close? (optional)"
            />
            <Input
              size={3}
              name="settings.maxRequestsPerUser"
              label="Requests"
              info="Max requests per user"
            />
          </Row>

          </Row>
          <Row>
            <Input 
              size={{ xs: 12, xm: 6 }}
              name="description"
              label="Description"
              textarea
            />
          </Row>
          <Row>
            <Input
              size={{ xs: 12 }}
              name="additionalPerformers"
              label="Additional Performers"
              optionsMulti={performers}
              info="Select additional performers for this show (optional)"
            />
          </Row>
        </Fieldset>

        <br />
        <Fieldset>
          <Row>
            <Input
              size={{ xs: 12, xm: 6 }}
              name="venue.name"
              label="Venue Name"
            />
            <Input
              size={{ xs: 12, xm: 6 }}
              name="venue.phone"
              label="Venue Phone"
            />
          </Row>
          <Row>
            <Input
              size={{ xs: 12, xm: 6 }}
              name="venue.address.street"
              label="Street Address"
            />
          </Row>
          <Row>
            <Input
              size={{ xs: 6, xm: 3 }}
              name="venue.address.city"
              label="City"
            />
            <Input
              size={{ xs: 6, xm: 4 }}
              name="venue.address.state"
              label="State"
            />
            <Input
              size={{ xs: 4, xm: 3 }}
              name="venue.address.zip"
              label="ZIP Code"
            />
          </Row>
        </Fieldset>




        <br />
      </FormProvider>
      <br /><br />
      {/* <TextareaDebug value={{ user }} /> */}
    </>
  );
};

export default CreateShow; 