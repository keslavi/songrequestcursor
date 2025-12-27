import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isEmpty } from "lodash";
import { Box, Typography } from "@mui/material";
import { store } from "@/store";
import {
  Row,
  Col,
  Fieldset,
  Input,
  FormProvider,
  useFormProvider,
  BtnContinueSave,
} from "components";
import { resolverProfile } from "./validation";

export const ProfileEdit = () => {
  const performerProfile = store.use.performerProfile();
  const profileRetrieve = store.use.profileRetrieve();
  const profileUpsert = store.use.profileUpsert();
  const profileLoading = store.use.profileLoading();
  const isAuthenticated = store.use.isAuthenticated();

  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      profileRetrieve();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const formMethods = useFormProvider({
    resolver: resolverProfile,
    defaultValues: performerProfile,
  });
  const { reset } = formMethods;

  useEffect(() => {
    if (!isEmpty(performerProfile)) {
      reset(performerProfile);
    }
  }, [performerProfile, reset]);

  const onSubmit = async (values) => {
    const result = await profileUpsert(values);
    if (result) {
      navigate("/profile");
    }
  };

  const onClickContinueSave = (e) => {
    const id = e.currentTarget.id;
    switch (id) {
      case "btnContinue":
        e.currentTarget.form.requestSubmit();
        break;
      case "btnSave":
        e.currentTarget.form.requestSubmit();
        break;
      default:
        break;
    }
  };

  if (profileLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Row>
        <Col size={12}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" component="h1">
              Edit Performer Profile
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Keep your public contact and payment details up to date so fans know how to reach you.
            </Typography>
          </Box>
        </Col>
      </Row>

      <FormProvider onSubmit={onSubmit} formMethods={formMethods}>
        <BtnContinueSave onClickContinueSave={onClickContinueSave} />

  <Fieldset legend="Performer Profile">
          <Row>
            <Input
              name="stageName"
              label="Stage / Entertainer Name"
              size={{ xs: 12, md: 6 }}
            />
            <Input
              name="venmoHandle"
              label="Venmo Handle"
              size={{ xs: 12, md: 6 }}
              info="Include the @ symbol"
            />
          </Row>
          <Row>
            <Input
              name="venmoConfirmDigits"
              label="Venmo Confirmation Digits"
              size={{ xs: 12, md: 4 }}
              info="Last 4 digits shown in Venmo to confirm payment"
            />
            <Input
              name="contactEmail"
              label="Public Contact Email"
              type="email"
              size={{ xs: 12, md: 4 }}
            />
            <Input
              name="contactPhone"
              label="Contact Phone"
              size={{ xs: 12, md: 4 }}
            />
          </Row>
          <Row>
            <Input
              name="headshotUrl"
              label="Headshot Image URL"
              size={{ xs: 12, md: 6 }}
            />
          </Row>
          <Row>
            <Input
              name="description"
              label="Performer Description"
              textarea
              rows={5}
              size={{ xs: 12 }}
            />
          </Row>
        </Fieldset>
      </FormProvider>
    </>
  );
};

export default ProfileEdit;
