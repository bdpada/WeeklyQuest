import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { leaderboardApi } from '../services/leaderboardApi';
import type { ScoreHistoryRow } from '../types/leaderboard';

export function ScoreHistoryPage() {
  const [scores, setScores] = useState<ScoreHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void leaderboardApi.getMyScores().then((r) => setScores(r.scores)).catch((e: Error) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  return <section className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200"><h1 className="text-2xl font-bold">Your score history</h1>
    {loading ? <p className='mt-4 text-slate-600'>Loading scores...</p> : null}
    {error ? <p className='mt-4 text-red-700'>{error}</p> : null}
    {!loading && !error && scores.length===0 ? <p className='mt-4 text-slate-600'>No scored results yet.</p> : null}
    <div className='mt-4 grid gap-3'>{scores.map((s)=><article key={s.submissionId} className='rounded-lg border p-4'><p className='font-semibold'>{s.questionSetTitle}</p><p className='text-sm text-slate-600'>{s.groupName}</p><p className='text-sm'>Score: {s.totalScore}/{s.maxScore}</p><p className='text-xs text-slate-500'>Graded: {s.gradedAt ? new Date(s.gradedAt).toLocaleString() : 'Not graded'}</p><Link className='text-indigo-700 underline text-sm' to={`/question-sets/${s.questionSetId}`}>View result</Link></article>)}</div></section>;
}
