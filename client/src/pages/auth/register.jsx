import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isEmpty } from "lodash";
import { toast } from "react-toastify";
import { Button } from "@mui/material";
import { store } from "@/store";

import {
  Col,
  FormProvider,
  useFormProvider,
  Input,
  Row,
  Fieldset,
} from "components";

import {
  resolverRegister,
  errorNotification
} from "./validation";

export const Register = () => {
  const navigate = useNavigate();
  const register = store.use.register();
  const isAuthenticated = store.use.isAuthenticated();

  // Get form methods for use outside the form
  const formMethods = useFormProvider({
    resolver: resolverRegister,
  });
  const { formState: { errors } } = formMethods;

  useEffect(() => {
    if (errors) {
      errorNotification(errors);
    }
  }, [errors]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (values) => {
    const { confirmPassword, ...userData } = values;
    const success = await register(userData);
    if (success) {
      navigate("/");
    }
  };

  return (
    <>
      <Row>
        <Col size={12}>
          <h2>Register</h2>
        </Col>
      </Row>

      <FormProvider 
        onSubmit={onSubmit}
        formMethods={formMethods}
      >
        <Fieldset>
          <Row>
            <Input
              size={{ xs: 12, xm: 7 }}
              name="email"
              label="Email"
              type="email"
            />
          </Row>
          <Row>
            <Input
              size={{ xs: 12, xm: 7 }}
              name="password"
              label="Password"
              type="password"
              password
            />
          </Row>
          <Row>
            <Input
              size={{ xs: 12, xm: 7 }}
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              password
            />
          </Row>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button type="submit" variant="contained" color="primary">
              Register
            </Button>
          </div>
        </Fieldset>
      </FormProvider>
    </>
  );
};

export default Register;

/*
          <Fieldset>
            <Row>
              <Input
                name="username"
                label="Username"
              />
            </Row>
            <Row>
              <Input
                name="firstName"
                label="First Name"
              />
            </Row>
            <Row>
              <Input
                name="lastName"
                label="Last Name"
              />
            </Row>
            <Row>
              <Input
                name="phone"
                label="Phone"
              />
            </Row>
            <Row>
              <Input
                name="zipCode"
                label="Zip Code"
              />
            </Row>
            <Row>
              <Input
                name="comments"
                label="Comments"
              />
            </Row>
          </Fieldset>
*/