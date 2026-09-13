import type { Metadata } from 'next';
import { ContactForm } from '@/components/ContactForm';

export const metadata: Metadata = {
  title: 'Contact | IMANA Signature',
  description: 'Contactez le service client IMANA Signature.',
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="font-disp text-5xl font-semibold text-marine">Contact</h1>
      <p className="mt-4 text-dk-2">
        Notre équipe vous accompagne dans le choix de votre prochaine signature.
      </p>
      <ContactForm />
    </div>
  );
}
