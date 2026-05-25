import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { leaderboardApi } from '../services/leaderboardApi';
import type { QuestionSetLeaderboardRow } from '../types/leaderboard';

export function QuestionSetLeaderboardPage() {
  const { questionSetId = '' } = useParams();
  const [rows, setRows] = useState<QuestionSetLeaderboardRow[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { void leaderboardApi.getQuestionSet(questionSetId).then((r)=>setRows(r.leaderboard)).catch((e: Error)=>setError(e.message)).finally(()=>setLoading(false)); }, [questionSetId]);
  return <section className='rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200'><h1 className='text-2xl font-bold'>Question Set Leaderboard</h1>{loading?<p className='mt-3'>Loading...</p>:null}{error?<p className='mt-3 text-red-700'>{error}</p>:null}<div className='mt-4 grid gap-2'>{rows.map((r)=><div className='rounded border p-3 text-sm' key={r.submissionId}>#{r.rank} · {r.user.displayName} · {r.totalScore} · submitted {r.submittedAt?new Date(r.submittedAt).toLocaleString():'-'} · graded {r.gradedAt?new Date(r.gradedAt).toLocaleString():'-'}</div>)}</div></section>;
}
