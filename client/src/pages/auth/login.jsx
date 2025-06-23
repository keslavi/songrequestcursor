import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isEmpty } from "lodash";
import { toast } from "react-toastify";
import { Button } from "@mui/material";
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
  const login = store.use.login();

  const frmMethods = useFormProvider({
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

  return (
    <>
      <Row>
        <Col size={{ xs: 12 }}>
          <h2>Login</h2>
        </Col>
      </Row>
      <SocialAuth />
      <FormProvider {...frmMethods}>
        <form onSubmit={onSubmit}>
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
        </form>
      </FormProvider>
    </>
  );
};

export default Login;