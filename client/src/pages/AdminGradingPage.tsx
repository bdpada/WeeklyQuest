import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { gradingApi } from '../services/gradingApi';
import { questionSetApi } from '../services/questionSetApi';
import { submissionApi } from '../services/submissionApi';
import type { QuestionSet } from '../types/questionSet';
import type { Submission } from '../types/submission';

export function AdminGradingPage() {
  const { questionSetId = '' } = useParams();
  const [qs, setQs] = useState<QuestionSet | null>(null);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [msg, setMsg] = useState('');
  const [manualMsg, setManualMsg] = useState('');
  const [manualErr, setManualErr] = useState('');
  const [finalizeMsg, setFinalizeMsg] = useState('');
  const [finalizeErr, setFinalizeErr] = useState('');
  const [recalcMsg, setRecalcMsg] = useState('');
  const [recalcErr, setRecalcErr] = useState('');
  const [savingAnswerId, setSavingAnswerId] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const byQuestion = useMemo(() => {
    const m: Record<string, { submission: Submission; answer: Submission['answers'][number] }[]> = {};
    subs.forEach((s) => s.answers.forEach((a) => { (m[a.questionId] ||= []).push({ submission: s, answer: a }); }));
    return m;
  }, [subs]);

  const load = async () => {
    setQs((await questionSetApi.get(questionSetId)).questionSet);
    setSubs((await submissionApi.listForQuestionSet(questionSetId)).submissions);
  };

  useEffect(() => { void load().catch((e: Error) => setMsg(e.message)); }, [questionSetId]);

  const gradeInputAnswer = async (answerId: string, isCorrect: boolean, pointsAwarded: number) => {
    setManualMsg(''); setManualErr(''); setSavingAnswerId(answerId);
    try { await gradingApi.gradeInputAnswer(answerId, isCorrect, pointsAwarded); await load(); setManualMsg('Manual grade saved.'); }
    catch (error) { setManualErr((error as Error).message); } finally { setSavingAnswerId(null); }
  };

  const finalizeScores = async () => {
    setFinalizeMsg(''); setFinalizeErr(''); setIsFinalizing(true);
    try { await gradingApi.finalizeScores(questionSetId); await load(); setFinalizeMsg('Scores finalized successfully. Results are now visible to users.'); }
    catch (error) { setFinalizeErr((error as Error).message); } finally { setIsFinalizing(false); }
  };

  const recalculateScores = async () => {
    setRecalcMsg(''); setRecalcErr(''); setIsRecalculating(true);
    try {
      const result = await gradingApi.recalculateScores(questionSetId);
      await load();
      setRecalcMsg(`Scores recalculated for ${result.recalculatedSubmissions} submissions. Updated ${result.totalAnswersUpdated} objective answers.`);
    } catch (error) { setRecalcErr((error as Error).message); } finally { setIsRecalculating(false); }
  };

  if (!qs) return <p>Loading...</p>;
  const isScored = qs.status === 'SCORED';

  return <section className='rounded-xl bg-white p-6'><h1 className='text-2xl font-bold'>Grading: {qs.title}</h1><Link className='text-indigo-600 underline' to='/admin'>Back</Link>
    {isScored ? <p className='mt-3 rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800'>This question set has already been scored. Changes made here may affect released user results.</p> : null}
    {qs.scoresNeedReview ? <p className='mt-2 rounded border border-rose-300 bg-rose-50 p-2 text-sm text-rose-800'>Scores need recalculation. User totals may be out of date.</p> : null}
    <div className='my-4 flex gap-3'>
      <button className='rounded bg-slate-200 px-3 py-2' onClick={() => void gradingApi.autoGradeOptionAnswers(questionSetId).then(() => load())}>Auto-grade option answers</button>
      {!isScored ? <button className='rounded bg-indigo-600 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60' disabled={isFinalizing} onClick={() => { if (confirm('Finalize scores? This will release results to users.')) void finalizeScores(); }}>{isFinalizing ? 'Finalizing...' : 'Finalize scores'}</button> : null}
      {isScored ? <button className='rounded bg-amber-600 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60' disabled={isRecalculating} onClick={() => { if (confirm('Recalculate scores now? This may change released user totals.')) void recalculateScores(); }}>{isRecalculating ? 'Recalculating...' : 'Recalculate Scores'}</button> : null}
    </div>
    {finalizeMsg ? <p className='mb-2 text-sm text-emerald-700'>{finalizeMsg}</p> : null}
    {finalizeErr ? <p className='mb-2 text-sm text-rose-700'>{finalizeErr}</p> : null}
    {recalcMsg ? <p className='mb-2 text-sm text-emerald-700'>{recalcMsg}</p> : null}
    {recalcErr ? <p className='mb-2 text-sm text-rose-700'>{recalcErr}</p> : null}
    {qs.questions.map((q) => <div key={q.id} className='mb-4 rounded border p-3'><p className='font-semibold'>{q.prompt} ({q.points} pts)</p>{q.type === 'INPUT_ANSWER' ? <div className='mt-2 space-y-2'>{(byQuestion[q.id] || []).map(({ submission, answer }) => {
      const isSaving = savingAnswerId === answer.id;
      const isCorrect = answer.isCorrect === true;
      const isIncorrect = answer.isCorrect === false;
      return <div key={answer.id} className='rounded bg-slate-50 p-2 text-sm'><p><strong>{submission.user?.displayName || 'Unnamed User'}</strong> <span className='text-slate-500'>({submission.user?.email || submission.userId})</span>: {answer.textAnswer}</p><div className='mt-2 flex gap-2'><button disabled={isSaving} className={`rounded px-2 py-1 text-white disabled:cursor-not-allowed disabled:opacity-60 ${isCorrect ? 'bg-emerald-700 ring-2 ring-emerald-300' : 'bg-emerald-600'}`} onClick={() => void gradeInputAnswer(answer.id, true, q.points)}>{isSaving ? 'Saving...' : 'Correct'}</button><button disabled={isSaving} className={`rounded px-2 py-1 text-white disabled:cursor-not-allowed disabled:opacity-60 ${isIncorrect ? 'bg-rose-700 ring-2 ring-rose-300' : 'bg-rose-600'}`} onClick={() => void gradeInputAnswer(answer.id, false, 0)}>{isSaving ? 'Saving...' : 'Incorrect'}</button></div></div>;
    })}</div> : <div className='mt-2 space-y-1'>{q.options.map((o) => <label key={o.id} className='block'><input type='radio' name={`correct-${q.id}`} checked={o.isCorrect} onChange={() => void gradingApi.setCorrectOption(q.id, o.id).then(() => load())} /> {o.text}</label>)}</div>}</div>)}
    {manualMsg ? <p className='text-sm text-emerald-700'>{manualMsg}</p> : null}
    {manualErr ? <p className='text-sm text-rose-700'>{manualErr}</p> : null}
    {msg ? <p>{msg}</p> : null}
  </section>;
}
