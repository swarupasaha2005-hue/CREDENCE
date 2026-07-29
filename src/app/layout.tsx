import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import { WalletProvider } from "../context/WalletContext";
import { QueryProvider } from "../lib/providers/query-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const instrumentSerif = Instrument_Serif({ 
  weight: "400", 
  subsets: ["latin"], 
  variable: "--font-instrument-serif" 
});

export const metadata: Metadata = {
  title: "Credence | Lending Reimagined",
  description: "A decentralized liquidity protocol built on Stellar Soroban.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${instrumentSerif.variable} font-sans antialiased overflow-x-hidden`}>
        <QueryProvider>
          <WalletProvider>
            <Navbar />
            <main>{children}</main>
            <Footer />
          </WalletProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
