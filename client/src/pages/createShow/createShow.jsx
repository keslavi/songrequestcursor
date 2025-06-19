import { useEffect, useState } from "react";
import { isEmpty } from "lodash";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Button, CircularProgress } from "@mui/material";
import { store } from "store";
import { getPlaceDetailsFromLink } from "@/utils/googleMaps";

//prettier-ignore
import {
  Col,
  FormProvider,
  useFormProvider,
  Input,
  Row,
  //TextareaDebug,
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
  const navigate = useNavigate();
  const [loadingPlace, setLoadingPlace] = useState(false);

  // Check if user has permission to create shows
  useEffect(() => {
    if (user && !['admin', 'performer', 'organizer'].includes(user.role)) {
      toast.error("You don't have permission to create shows");
      navigate("/");
    }
  }, [user, navigate]);

  const frmMethods = useFormProvider({
    resolver,
    defaultValues: {
      name: "",
      date: new Date(),
      location: "",
      description: "",
      status: "draft",
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
    }
  });
  const { errors, handleSubmit, reset, watch, setValue } = frmMethods;

  // Watch the mapsLink field for changes
  const mapsLink = watch('venue.location.mapsLink');

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

  useEffect(() => {
    if (errors) {
      errorNotification(errors);
    }
  }, [errors]);

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
        date: values.date.toISOString(), // Convert Date to ISO string
        location: values.location,
        description: values.description || "",
        status: values.status,
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
      <FormProvider {...frmMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <BtnContinueSave
            onClickContinueSave={onClickContinueSave}
          />
          <div className="hidden">
            <Row>
              <Input name="id" />
            </Row>
          </div>

          {/* Venue Information Section */}
          <Fieldset legend="Venue Information">
            {/* <Row>
              <Col xs={12}>
                <h3>Venue Information</h3>
              </Col>
            </Row> */}
            <Row>
              <Input
                size={{ xs: 12 }}
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
            <Row>
              <Input
                size={{ xs: 6, xm: 7 }}
                name="venue.name"
                label="Venue Name"
                //info="Enter the name of the venue"
              />
              <Input
                size={{ xs: 6, xm: 7 }}
                name="venue.phone"
                label="Venue Phone"
                //info="Contact number for the venue"
              />
            </Row>
            <Row>
              <Input
                size={{ xs: 12 }}
                name="venue.address.street"
                label="Street Address"
                //info="Street address of the venue"
              />
            </Row>
            <Row>
              <Input
                size={{ xs: 6, xm: 3 }}
                name="venue.address.city"
                label="City"
                //info="City where the venue is located"
              />
              <Input
                size={{ xs: 6, xm: 3 }}
                name="venue.address.state"
                label="State"
                //info="State or province"
              />
              <Input
                size={{ xs: 6, xm: 3 }}
                name="venue.address.zip"
                label="ZIP Code"
                //info="Postal/ZIP code"
              />
            </Row>
          </Fieldset>

          {/* Show Details Section */}
          <Fieldset>
            <Row>
              <Col xs={12}>
                <h3>Show Details</h3>
              </Col>
            </Row>
            <Row>
              <Input
                size={{ xs: 6, xm: 7 }}
                name="name"
                label="Show Name"
                //info="Enter the name of your show"
              />
              <Input
                name="location"
                label="Location"
                //info="Where will the show take place?"
              />
            </Row>
            <Row>
              <Input
                datepicker
                name="date"
                label="Show Date & Time"
                //info="When will the show happen?"
              />
              <Input
                name="description"
                label="Description"
                textarea
                //info="Tell people about your show"
              />
            </Row>
          </Fieldset>

          <br />
          <Fieldset>
            <Row>
              <Input
                name="status"
                label="Status"
                options={[
                  { key: "draft", text: "Draft" },
                  { key: "published", text: "Published" },
                  { key: "cancelled", text: "Cancelled" }
                ]}
                info="Draft shows are not visible to the public"
              />
            </Row>
          </Fieldset>
          <br />
          <Fieldset>
            <Row>
              <Input
                name="settings.allowRequests"
                label="Allow Song Requests"
                checkbox
                info="Enable song requests for this show"
              />
              <Input
                name="settings.maxRequestsPerUser"
                label="Max Requests Per User"
                info="How many songs can each person request?"
              />
            </Row>
            <Row>
              <Input
                datepicker
                name="settings.requestDeadline"
                label="Request Deadline"
                info="When should requests close? (optional)"
              />
            </Row>
          </Fieldset>
        </form>
      </FormProvider>
      {/* <TextareaDebug value={{ user }} /> */}
    </>
  );
};

export default CreateShow; 