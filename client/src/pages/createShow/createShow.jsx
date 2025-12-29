import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Button, Box, Typography } from "@mui/material";
import { store } from "store";
import dayjs from "dayjs";

//prettier-ignore
import {
  Col,
  FormProvider,
  useFormProvider,
  Input,
  Row,
  TextareaDebug,
  Fieldset,
  BtnContinueSave,
  GooglePlaceAutocomplete,
} from "components";
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
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [isSelectingVenue, setIsSelectingVenue] = useState(false);

  const defaultDateFrom = dayjs().hour(19).minute(0).second(0).millisecond(0);
  const defaultDateTo = defaultDateFrom.add(3, "hour");
  const defaultRequestDeadline = defaultDateTo.subtract(30, "minute");

  // Initial form values
  const initialFormValues = {
    name: "",
    dateFrom: defaultDateFrom.format("YYYY-MM-DDTHH:mm"), // 7pm today
    dateTo: defaultDateTo.format("YYYY-MM-DDTHH:mm"), // 10pm today
    location: "",
    description: "",
    status: "draft",
    showType: "private",
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
        mapsLink: "",
        placeId: ""
      }
    },
    settings: {
      allowRequests: true,
      maxRequestsPerUser: 1,
      requestDeadline: defaultRequestDeadline.format("YYYY-MM-DDTHH:mm")
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

  // Get form methods for use outside the form
  const formMethods = useFormProvider({
    resolver,
    defaultValues: initialFormValues
  });
  const { watch, setValue, getValues, formState } = formMethods;

  // Watch the dateFrom field for changes
  const dateFrom = watch('dateFrom');
  const dateTo = watch('dateTo');
  const requestDeadlineDirty = formState?.dirtyFields?.settings?.requestDeadline;

  // Effect to handle dateFrom changes - adjust dateTo to be 3 hours later
  useEffect(() => {
    if (dateFrom) {
      const newDateTo = dayjs(dateFrom).add(3, 'hour').format("YYYY-MM-DDTHH:mm");
      setValue('dateTo', newDateTo);
    }
  }, [dateFrom, setValue]);

  useEffect(() => {
    if (!dateTo) return;

    const autoDeadline = dayjs(dateTo).subtract(30, 'minute').format("YYYY-MM-DDTHH:mm");
    const currentDeadline = getValues('settings.requestDeadline');

    if (!requestDeadlineDirty && currentDeadline !== autoDeadline) {
      setValue('settings.requestDeadline', autoDeadline, { shouldDirty: false, shouldValidate: true });
    }
  }, [dateTo, requestDeadlineDirty, getValues, setValue]);

  const locationErrorMessage = formState?.errors?.location?.message;
  const selectedVenueCoordinates = Array.isArray(selectedVenue?.coordinates) ? selectedVenue.coordinates : null;
  const hasValidCoordinates = Array.isArray(selectedVenueCoordinates)
    && selectedVenueCoordinates.length === 2
    && selectedVenueCoordinates.every((value) => typeof value === "number" && Number.isFinite(value))
    && !(selectedVenueCoordinates[0] === 0 && selectedVenueCoordinates[1] === 0);

  const resetVenueFields = () => {
    setSelectedVenue(null);
    setIsSelectingVenue(false);
    setValue('venue.name', '', { shouldDirty: true });
    setValue('venue.mapUrl', '', { shouldDirty: true });
    setValue('venue.phone', '', { shouldDirty: true });
    setValue('venue.address.street', '', { shouldDirty: true });
    setValue('venue.address.city', '', { shouldDirty: true });
    setValue('venue.address.state', '', { shouldDirty: true });
    setValue('venue.address.zip', '', { shouldDirty: true });
    setValue('venue.location.mapsLink', '', { shouldDirty: true });
    setValue('venue.location.placeId', '', { shouldDirty: true });
    setValue('venue.location.coordinates', [0, 0], { shouldDirty: true });
    setValue('location', '', { shouldDirty: true, shouldValidate: true });
  };

  const handleVenueSelected = (details) => {
    if (!details) {
      resetVenueFields();
      return;
    }

    setSelectedVenue(details);

    const address = details.address || {};
    const coordinates = Array.isArray(details.coordinates) && details.coordinates.length === 2
      ? details.coordinates
      : [0, 0];

    const venueName = details.name || '';
  const generatedShowName = venueName ? `${venueName} Dueling Pianos` : '';
    const currentShowName = getValues('name');

    setValue('location', details.name || details.formattedAddress || '', { shouldDirty: true, shouldValidate: true });
    setValue('venue.name', details.name || '', { shouldDirty: true });
    setValue('venue.mapUrl', details.mapUrl || '', { shouldDirty: true });
    setValue('venue.phone', details.phoneNumber || '', { shouldDirty: true });
    setValue('venue.address.street', address.street || '', { shouldDirty: true });
    setValue('venue.address.city', address.city || '', { shouldDirty: true });
    setValue('venue.address.state', address.state || '', { shouldDirty: true });
    setValue('venue.address.zip', address.zip || '', { shouldDirty: true });
    setValue('venue.location.mapsLink', details.mapUrl || '', { shouldDirty: true });
    setValue('venue.location.placeId', details.placeId || '', { shouldDirty: true });
    setValue('venue.location.coordinates', coordinates, { shouldDirty: true });

    if (generatedShowName && (!currentShowName || currentShowName.endsWith(' Dueling Pianos'))) {
      setValue('name', generatedShowName, { shouldDirty: true });
    }

    toast.success('Venue details loaded from Google Maps!');
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
    showType: values.showType,
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
            <Col size={{ xs: 12 }}>
              <GooglePlaceAutocomplete
                label="Venue Location"
                placeholder="Search by venue name or address"
                helperText="Select a location to auto-fill venue details"
                error={locationErrorMessage}
                onPlaceSelected={handleVenueSelected}
                onLoadingChange={setIsSelectingVenue}
                onError={(message) => toast.error(message)}
              />
            </Col>
          </Row>

          {isSelectingVenue && (
            <Row>
              <Col size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  Fetching venue details...
                </Typography>
              </Col>
            </Row>
          )}

          {selectedVenue && (
            <Row>
              <Col size={{ xs: 12 }}>
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {selectedVenue.name}
                  </Typography>
                  {selectedVenue.formattedAddress && (
                    <Typography variant="body2" color="text.secondary">
                      {selectedVenue.formattedAddress}
                    </Typography>
                  )}
                  <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {selectedVenue.phoneNumber && (
                      <Typography variant="body2">
                        Phone: {selectedVenue.phoneNumber}
                      </Typography>
                    )}
                    {hasValidCoordinates && (
                      <Typography variant="body2" color="text.secondary">
                        Lat/Lng: {selectedVenueCoordinates[1].toFixed(5)}, {selectedVenueCoordinates[0].toFixed(5)}
                      </Typography>
                    )}
                  </Box>
                  {selectedVenue.mapUrl && (
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ mt: 1 }}
                      onClick={() => window.open(selectedVenue.mapUrl, '_blank', 'noopener,noreferrer')}
                    >
                      View in Google Maps
                    </Button>
                  )}
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
            <Input
              name="showType"
              label="Show Type"
              size={{ xs: 12, xm: 6 }}
              options={[
                { key: "private", text: "Private" },
                { key: "public", text: "Public" }
              ]}
              info="Choose whether this show is private or public"
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