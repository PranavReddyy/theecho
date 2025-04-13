import './globals.css';
import { Tinos } from 'next/font/google';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TickerTape from '../components/TickerTape';
import ScrollToTop from '../components/ScrollToTop';

// Define the Tinos font (similar to Times New Roman)
const tinosFont = Tinos({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-times'
});

export const metadata = {
  title: 'The Echo',
  description: 'Official Newspaper of Mahindra University.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${tinosFont.variable} font-serif text-black min-h-screen`}
      >
        <Navbar />
        <TickerTape />
        <main className="flex-grow px-4 pt-6 mx-auto w-full max-w-[1200px]">
          {children}
        </main>
        <Footer />
        <ScrollToTop />
      </body>
    </html>
  );
}