import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Trips from "@/pages/Trips";
import TripNew from "@/pages/TripNew";
import TripDetail from "@/pages/TripDetail";
import AppLayout from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(16, 93%, 56%)",
    colorForeground: "hsl(200, 40%, 12%)",
    colorMutedForeground: "hsl(200, 20%, 45%)",
    colorDanger: "hsl(0, 84%, 60%)",
    colorBackground: "hsl(0, 0%, 100%)",
    colorInput: "hsl(200, 20%, 90%)",
    colorInputForeground: "hsl(200, 40%, 12%)",
    colorNeutral: "hsl(200, 20%, 90%)",
    fontFamily: "'Outfit', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-border",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none p-8",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none bg-muted/30 p-6",
    headerTitle: "font-serif text-2xl font-bold text-foreground",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary hover:text-primary/90 font-semibold",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground text-sm",
    identityPreviewEditButton: "text-primary hover:text-primary/90",
    formFieldSuccessText: "text-green-600",
    alertText: "text-destructive",
    logoBox: "mx-auto mb-6",
    logoImage: "w-12 h-12 object-contain",
    socialButtonsBlockButton: "border-border hover:bg-muted/50 transition-colors",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm transition-all",
    formFieldInput: "bg-white border-input text-foreground focus:ring-primary focus:border-primary rounded-md shadow-sm",
    footerAction: "flex gap-2 justify-center",
    dividerLine: "bg-border",
    alert: "bg-destructive/10 border-destructive/20",
    otpCodeFieldInput: "border-input focus:ring-primary focus:border-primary",
    formFieldRow: "space-y-4",
    main: "space-y-6",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClientLocal = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClientLocal.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClientLocal]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: any }) {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return <Component />;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to plan your next adventure",
          },
        },
        signUp: {
          start: {
            title: "Start exploring",
            subtitle: "Create an account to build your journey",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
            {/* Protected App Routes */}
            <Route path="/dashboard"><AppLayout><ProtectedRoute component={Dashboard} /></AppLayout></Route>
            <Route path="/trips"><AppLayout><ProtectedRoute component={Trips} /></AppLayout></Route>
            <Route path="/trips/new"><AppLayout><ProtectedRoute component={TripNew} /></AppLayout></Route>
            <Route path="/trips/:tripId"><AppLayout><ProtectedRoute component={TripDetail} /></AppLayout></Route>
            <Route path="/trips/:tripId/edit"><AppLayout><ProtectedRoute component={TripNew} /></AppLayout></Route>
            <Route path="/trips/:tripId/transportation"><AppLayout><ProtectedRoute component={TripDetail} /></AppLayout></Route>
            <Route path="/trips/:tripId/transportation/new"><AppLayout><ProtectedRoute component={TripDetail} /></AppLayout></Route>
            <Route path="/trips/:tripId/transportation/:transportationId/edit"><AppLayout><ProtectedRoute component={TripDetail} /></AppLayout></Route>
            <Route path="/trips/:tripId/accommodation"><AppLayout><ProtectedRoute component={TripDetail} /></AppLayout></Route>
            <Route path="/trips/:tripId/accommodation/new"><AppLayout><ProtectedRoute component={TripDetail} /></AppLayout></Route>
            <Route path="/trips/:tripId/accommodation/:accommodationId/edit"><AppLayout><ProtectedRoute component={TripDetail} /></AppLayout></Route>
            <Route path="/trips/:tripId/budget"><AppLayout><ProtectedRoute component={TripDetail} /></AppLayout></Route>
            <Route path="/trips/:tripId/budget/new"><AppLayout><ProtectedRoute component={TripDetail} /></AppLayout></Route>
            <Route path="/trips/:tripId/expenses/new"><AppLayout><ProtectedRoute component={TripDetail} /></AppLayout></Route>
            <Route path="/trips/:tripId/notifications"><AppLayout><ProtectedRoute component={TripDetail} /></AppLayout></Route>

            <Route><AppLayout><NotFound /></AppLayout></Route>
          </Switch>
        </TooltipProvider>
        <Toaster />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}
