// app/(auth)/sign-in/page.jsx
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <>
      <style>{`
        body {
          background-color: #1e40af !important;
        }
      `}</style>

      <div className="min-h-screen flex items-center justify-center">
        <SignIn
          forceRedirectUrl="/"
          fallbackRedirectUrl="/"
        />
      </div>
    </>
  );
}