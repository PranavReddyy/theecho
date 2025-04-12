import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/news'); // or display a home message/landing
}
