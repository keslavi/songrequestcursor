import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isEmpty } from "lodash";
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
  errorNotification
} from "./validation";
import SocialAuth from "@/components/auth/social-auth";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = store.use.login();

  // Check for error parameters in URL
  const error = searchParams.get('error');

  // Get form methods for use outside the form
  const formMethods = useFormProvider({
    resolver: resolverLogin,
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit= async (data) => {
    const success = await login(data.email, data.password);
    if (success) {
      navigate("/");
    }
  }

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
    }
  }, [error]);

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
            <Col className="text-center">
              <Button type="submit" variant="contained" color="primary">
                Login
              </Button>
            </Col>
          </Row>
        </Fieldset>
      </FormProvider>
    </>
  );
};

export default Login;