import { redirect } from 'next/navigation';

export default function RootPage() {
  // Middleware handles the actual auth branching. This page just hands off.
  redirect('/calendar');
}
