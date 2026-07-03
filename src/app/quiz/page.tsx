import type { Metadata } from 'next';
import { getConditions, getItems } from '@/lib/content';
import { Quiz } from '@/components/Quiz';
import { LastResults } from '@/components/LastResults';

export const metadata: Metadata = {
  title: 'Symptom & goal quiz',
  description:
    'Tell NutriDex what you’re dealing with — hair loss, low iron, high blood pressure, lung or kidney support — and get matched to foods whose benefits target it.',
  alternates: { canonical: '/quiz' },
};

export default function QuizPage() {
  const conditions = getConditions();
  const items = getItems();
  return (
    <section className="py-6">
      <h1 className="text-3xl font-bold text-neutral-900">What are you dealing with?</h1>
      <p className="mt-2 max-w-2xl text-neutral-600">
        Pick your goals, answer a few quick symptom questions, and we&apos;ll match foods whose
        benefits are tagged to them. Your results are saved in your browser so you can come back to
        them here — nothing is sent anywhere.
      </p>

      <div className="mt-8">
        <LastResults conditions={conditions} items={items} />
      </div>

      <div className="max-w-2xl">
        <Quiz conditions={conditions} items={items} persist />
      </div>
    </section>
  );
}
