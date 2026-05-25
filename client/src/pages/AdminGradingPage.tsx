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
  const byQuestion = useMemo(() => {
    const m: Record<string, { submission: Submission; answer: Submission['answers'][number] }[]> = {};
    subs.forEach((s) => s.answers.forEach((a) => { (m[a.questionId] ||= []).push({ submission: s, answer: a }); }));
    return m;
  }, [subs]);
  const load = async () => { setQs((await questionSetApi.get(questionSetId)).questionSet); setSubs((await submissionApi.listForQuestionSet(questionSetId)).submissions); };
  useEffect(() => { void load().catch((e: Error) => setMsg(e.message)); }, [questionSetId]);
  if (!qs) return <p>Loading...</p>;
  return <section className='rounded-xl bg-white p-6'><h1 className='text-2xl font-bold'>Grading: {qs.title}</h1><Link className='text-indigo-600 underline' to='/admin'>Back</Link>
    <div className='my-4 flex gap-3'><button className='rounded bg-slate-200 px-3 py-2' onClick={()=>void gradingApi.autoGradeOptionAnswers(questionSetId).then(()=>load())}>Auto-grade option answers</button><button className='rounded bg-indigo-600 px-3 py-2 text-white' onClick={()=>{ if(confirm('Finalize scores? This will release results to users.')) void gradingApi.finalizeScores(questionSetId).then(()=>load()); }}>Finalize scores</button></div>
    {qs.questions.map((q)=><div key={q.id} className='mb-4 rounded border p-3'><p className='font-semibold'>{q.prompt} ({q.points} pts)</p>{q.type==='INPUT_ANSWER' ? <div className='mt-2 space-y-2'>{(byQuestion[q.id]||[]).map(({submission,answer})=><div key={answer.id} className='rounded bg-slate-50 p-2 text-sm'><p><strong>{submission.userId}</strong>: {answer.textAnswer}</p><div className='flex gap-2'><button className='rounded bg-emerald-600 px-2 py-1 text-white' onClick={()=>void gradingApi.gradeInputAnswer(answer.id,true,q.points).then(()=>load())}>Mark correct</button><button className='rounded bg-rose-600 px-2 py-1 text-white' onClick={()=>void gradingApi.gradeInputAnswer(answer.id,false,0).then(()=>load())}>Mark incorrect</button></div></div>)}</div> : <div className='mt-2 space-y-1'>{q.options.map((o)=><label key={o.id} className='block'><input type='radio' name={`correct-${q.id}`} checked={o.isCorrect} onChange={()=>void gradingApi.setCorrectOption(q.id,o.id).then(()=>load())}/> {o.text}</label>)}</div>}</div>)}
    {msg ? <p>{msg}</p> : null}
  </section>;
}
