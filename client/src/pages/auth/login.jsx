import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Button, Alert } from "@mui/material";
import { store } from "@/store/store";

import {
  Col,
  useFormProvider,
  FormProvider,
  Input,
  Row,
  Fieldset,
} from "components";

import {
  resolverLogin,
} from "./validation";
import SocialAuth from "@/components/auth/social-auth";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginWithPhone = store.use.loginWithPhone();

  // Check for error parameters in URL
  const error = searchParams.get('error');

  const defaultPhone = useMemo(() => {
    return localStorage.getItem('lastPhoneNumber') || "";
  }, []);

  // Get form methods for use outside the form
  const formMethods = useFormProvider({
    resolver: resolverLogin,
    defaultValues: {
      phoneNumber: defaultPhone,
    },
  });

  const onSubmit = async (data) => {
    const phoneNumber = data.phoneNumber;
    const success = await loginWithPhone(phoneNumber);
    if (success) navigate("/");
  };

  // Show error messages
  useEffect(() => {
    if (error) {
      let errorMessage = 'Authentication failed';
      
      switch (error) {
        case 'popup_token_error':
          errorMessage = 'Popup authentication was blocked by your browser. Please try again or use a different browser.';
          break;
        case 'auth0_error':
          errorMessage = 'Authentication service error. Please try again.';
          break;
        case 'token_error':
          errorMessage = 'Token retrieval failed. Please try logging in again.';
          break;
        default:
          errorMessage = `Authentication error: ${error}`;
      }
      
      toast.error(errorMessage);

      // Clear the error query param so the message doesn't persist on refresh/back/forward.
      navigate('/auth/login', { replace: true });
    }
  }, [error, navigate]);

  return (
    <>
      <Row>
        <Col size={{ xs: 12 }}>
          <h2>Login</h2>
        </Col>
      </Row>
      
      {error && (
        <Row>
          <Col size={{ xs: 12 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error === 'popup_token_error' && 
                'Popup authentication was blocked by your browser. Please try again or use a different browser.'
              }
              {error === 'auth0_error' && 
                'Authentication service error. Please try again.'
              }
              {error === 'token_error' && 
                'Token retrieval failed. Please try logging in again.'
              }
              {!['popup_token_error', 'auth0_error', 'token_error'].includes(error) && 
                `Authentication error: ${error}`
              }
            </Alert>
          </Col>
        </Row>
      )}
      
      {/* Social Auth outside of FormProvider to prevent form parameter leakage */}
      <SocialAuth />
      
      <FormProvider 
        onSubmit={onSubmit}
        formMethods={formMethods}
      >
        <Fieldset>
          <Row>
            <Input
              size={{ xs: 12, xm: 7 }}
              name="phoneNumber"
              label="Phone number"
              type="tel"
              inputProps={{ inputMode: "tel", autoComplete: "tel" }}
            />
          </Row>
          <Row>
            <Col className="text-center">
              <Button type="submit" variant="contained" color="primary">
                Continue
              </Button>
            </Col>
          </Row>
        </Fieldset>
      </FormProvider>
    </>
  );
};

export default Login;