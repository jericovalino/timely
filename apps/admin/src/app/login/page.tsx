import { createForm } from "@repo/utilities";
import { Button, ColoredLogo } from "@repo/multiverse-ui";
import { useAuthContext } from "@repo/app-providers";
import { loginSchema } from "./schemas";
import { useLoginMutation } from "./_hooks";

const { forwardFormContext, TextInput, PasswordInput } = createForm({
  zodSchema: loginSchema,
});

const Login = forwardFormContext((_, ctx) => {
  const loginMutation = useLoginMutation();
  const { setAuthData } = useAuthContext();

  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-950 via-neutral-900 to-zinc-900">
      {/* Decorative blobs — brand magenta + purple */}
      <div
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "hsla(313,95%,24%,0.25)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "hsla(280,70%,30%,0.2)" }}
      />
      <div
        className="pointer-events-none absolute top-1/3 left-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: "hsla(313,80%,40%,0.1)" }}
      />
      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-8 shadow-2xl ring-1 ring-white/10">
        <ColoredLogo className="w-40 mb-4" />
        <form
          className="flex flex-col"
          onSubmit={ctx.handleSubmit((values) => {
            loginMutation.mutate(values, {
              onSuccess: (resData) => {
                setAuthData({
                  token: resData.token,
                });
              },
            });
          })}
        >
          <TextInput
            name="email"
            label="Email"
            placeholder="Enter your email"
          />
          <PasswordInput
            name="password"
            label="Password"
            placeholder="Enter your password"
          />
          <Button
            type="submit"
            intent="primary"
            fullWidth
            loading={loginMutation.isPending}
            className="mt-2"
          >
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
});

export default Login;
