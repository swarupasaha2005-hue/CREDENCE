import AppNavbar from "@/components/app/AppNavbar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AppNavbar />
      <main>{children}</main>
    </>
  );
}
