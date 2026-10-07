import AuthLeft from "./AuthLeft";

export default function AuthRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen w-full font-sans bg-white overflow-hidden">
      <AuthLeft />
      <div className="flex basis-full flex-col items-center justify-center lg:basis-[50%] px-4 py-12 lg:px-6">
        {children}
      </div>
    </main>
  );
}
