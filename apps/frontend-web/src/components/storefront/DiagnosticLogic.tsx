'use client';
import Link from 'next/link';
import { useCallback, useRef, useState, type FormEvent } from 'react';
import { money, type StorefrontProduct } from '@/lib/storefront/model';
import { useDialog } from './hooks';
import { useStorefront } from './StorefrontProvider';

type AnswerKey = 'family' | 'intensity' | 'occasion';
export function useDiagnostic() {
  const { products, error } = useStorefront(); const [open, setOpen] = useState(false); const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<AnswerKey,string>>({family:'', intensity:'', occasion:''});
  const [result, setResult] = useState<StorefrontProduct | null>(null); const [resultError, setResultError] = useState('');
  const dialog = useRef<HTMLDivElement>(null); const close = useCallback(() => setOpen(false), []); useDialog(open, close, dialog);
  function reset() { setStep(0); setAnswers({family:'',intensity:'',occasion:''}); setResult(null); setResultError(''); }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!answers.family || !answers.intensity || !answers.occasion) return;
    const candidates = products.filter(p => p.category !== 'accessoire' && p.stock !== 0);
    const score = (p: StorefrontProduct) => (p.category === answers.family ? 5 : 0) + (p.occasions.includes(answers.occasion) ? 2 : 0) + (answers.intensity === 'intense' && p.category === 'oriental' ? 1 : 0);
    const recommendation = [...candidates].sort((a,b) => score(b) - score(a))[0];
    setResult(recommendation || null); setResultError(recommendation ? '' : error || 'Aucune création disponible pour cette recommandation.');
  }
  return {open, show: () => setOpen(true), close, dialog, step, setStep, answers, answer: (key: AnswerKey,value: string) => setAnswers(a => ({...a,[key]:value})), selected: !!answers[(['family','intensity','occasion'] as AnswerKey[])[step]], reset, submit, result, resultError};
}
export function DiagnosticResult({ product, error }: { product: StorefrontProduct | null; error: string }) {
  const { add } = useStorefront();
  if (!product) return error ? <p role="status">{error}</p> : null;
  return <><img src={product.imageUrl} alt={product.name} width="900" height="1125"/><div><p className="eyebrow">Votre signature</p><h3>{product.name}</h3><p>{product.notes}</p><p className="diagnostic-match">Une sélection proposée selon vos préférences olfactives.</p><strong>{money(product.price)}</strong><div className="olfactory-result__actions"><button className="btn solid" onClick={() => add(product)}>Ajouter au panier</button><Link className="btn" href="/collections">Voir la sélection</Link></div></div></>;
}
