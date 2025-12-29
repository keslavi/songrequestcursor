import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy, Suspense } from "react";

import App from "./App"; //router displays here

//things that are always loaded
//prettier-ignore
import { 
  Home, 
  About 
} from "./pages";

/*
  some codesplitting examples... 
  prevent overly large page loads from happening up front

  tasks, scratchpad aren't usually needed.
*/
const Tasks = lazy(() => import("./pages/-example-task-section/tasks/tasks"));
const Task = lazy(() => import("./pages/-example-task-section/task/task"));
// const Login = lazy(() => import("./pages/auth/login"));
import Login from "./pages/auth/login";

//const Register = lazy(() => import("./pages/auth/register"));
import Register from "./pages/auth/register";
// prettier-ignore
//const Contacts = lazy(() => import("./pages/-example-contact/contacts/contacts"));
//const Contact = lazy(() => import("./pages/-example-contact/contact/contact"));
const Scratchpad = lazy(() => import("./pages/dev-section/scratchpad"));
const Formhelper = lazy(() =>
  import("./components/formhelper/test/formhelper")
);

import AuthCallback from "./components/auth/auth-callback";
import { store } from "@/store/store";
import { CreateShow } from "./pages/createShow";
import { ProtectedRoute } from "./components/auth/protected-route";
import ShowDetail from "./pages/show-detail/show-detail";
import { ShowRequests } from "./pages/show-requests/show-requests";
import { ShowViewRequests } from "./pages/show-view-requests";
import { Profile, ProfileEdit } from "./pages/profile";
import { Songs, Song } from "./pages/profile/songs";

// Menu configurations per auth state/role
const unauthenticatedMenu = [
  { text: "Home", link: "/" },
  { text: "About", link: "/about" },
  { text: "Performer Login", link: "/auth/login" },
  { text: "Performer Register", link: "/auth/register" },
];

const guestMenu = [
  { text: "Home", link: "/" },
  { text: "About", link: "/about" },
  { text: "Tasks", link: "/dev/tasks" },
];

// Menu for authenticated performer/admin style users (with extended options)
const authenticatedMenu = [
  { text: "Home", link: "/" },
  { text: "About", link: "/about" },
  { text: "Create Show", link: "/shows/create" },
  {
    text: "Dev",
    items: [
      { text: "Tasks", link: "/dev/tasks" },
      //{ text: "Contacts", link: "/dev/contacts" },
      { text: "Scratchpad", link: "/dev/scratchpad" },
      { text: "FormHelper", link: "/dev/formhelper" },
    ],
  },
];

// Wrapper component that provides the appropriate menu based on auth status
const AppWrapper = () => {
  const isAuthenticated = store.use.isAuthenticated();
  const user = store.use.user();
  const role = user?.role;

  const isGuestRole = role === "guest" || role === "user";
  const isPerformerRole = ['admin', 'performer', 'organizer'].includes(role);

  let menu;
  if (!isAuthenticated) {
    menu = unauthenticatedMenu;
  } else if (isGuestRole && !isPerformerRole) {
    menu = guestMenu;
  } else {
    menu = authenticatedMenu;
  }
  
  return <App menu={menu} />;
};

const Route404 = () => {
  return (
    <div>
      <h4>404</h4>
    </div>
  );
};

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <AppWrapper />,
      children: [
        { path: "home", element: <Home /> },
        { path: "about", element: <About /> },
        {
          path: "auth",
          children: [
            {
              path: "login",
              element: <Login />,
              // element: (
              //   <Suspense fallback={<div>Loading...</div>}>
              //     <Login />
              //   </Suspense>
              // ),
            },
            {
              path: "register",
              element: <Register />,
              // element: (
              //   <Suspense fallback={<div>Loading...</div>}>
              //     <Register />
              //   </Suspense>
              // ),
            },
            {
              path: "callback",
              element: <AuthCallback />,
            },
          ],
        },
        {
          path: "shows",
          children: [
            {
              path: "create",
              element: (
                <ProtectedRoute>
                  <CreateShow />
                </ProtectedRoute>
              ),
            },
            {
              path: ":showId/requests",
              element: (
                <ProtectedRoute>
                  <ShowRequests />
                </ProtectedRoute>
              ),
            },
            {
              path: ":id/view-requests",
              element: <ShowViewRequests />,
            },
            {
              path: ":id",
              element: <ShowDetail />,
            },
          ],
        },
        {
          path: "profile",
          element: (
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          ),
        },
        {
          path: "profile/edit",
          element: (
            <ProtectedRoute>
              <ProfileEdit />
            </ProtectedRoute>
          ),
        },
        {
          path: "profile/songs",
          element: (
            <ProtectedRoute>
              <Songs />
            </ProtectedRoute>
          ),
        },
        {
          path: "profile/songs/:id",
          element: (
            <ProtectedRoute>
              <Song />
            </ProtectedRoute>
          ),
        },
        {
          path: "dev",
          children: [
            {
              path: "formhelper",
              element: (
                <Suspense fallback={<div>Loading...</div>}>
                  <Formhelper />
                </Suspense>
              ),
            },
            {
              path: "tasks",
              element: (
                <Suspense fallback={<div>Loading...</div>}>
                  <Tasks />
                </Suspense>
              ),
            },
            {
              path: "tasks/:id",
              element: (
                <Suspense fallback={<div>Loading...</div>}>
                  <Task />
                </Suspense>
              ),
            },
            {
              path: "scratchpad",
              element: (
                <Suspense fallback={<div>Loading...</div>}>
                  <Scratchpad />
                </Suspense>
              ),
            },
          ],
        },
        { path: "", element: <Home /> },
        { path: "*", element: <Route404 /> },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
    },
  }
);

export const Router = () => {
  return <RouterProvider router={router} />;
};
