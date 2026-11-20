import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SessionWrapper from "@/components/SessionWrapper";

export const metadata = {
  title: {
    default: "GetFunds Demo",
    template: "%s | GetFunds Demo",
  },
  description: "A portfolio crowdfunding demo with GitHub OAuth, Razorpay Test Checkout, creator search, GridFS projects, and MongoDB analytics.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className="bg-[#000000] bg-[radial-gradient(#ffffff33_1px,#00091d_1px)] bg-[size:20px_20px] text-white antialiased"
      >
        <SessionWrapper>
          <Navbar />
          <div className="min-h-[84vh]">{children}</div>
          <Footer />
        </SessionWrapper>
      </body>
    </html>
  );
}
