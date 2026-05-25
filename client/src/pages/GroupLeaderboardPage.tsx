import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { leaderboardApi } from '../services/leaderboardApi';
import type { GroupLeaderboardRow } from '../types/leaderboard';

export function GroupLeaderboardPage() {
  const { groupId = '' } = useParams();
  const [rows, setRows] = useState<GroupLeaderboardRow[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { void leaderboardApi.getGroup(groupId).then((r)=>setRows(r.leaderboard)).catch((e: Error)=>setError(e.message)).finally(()=>setLoading(false)); }, [groupId]);
  return <section className='rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200'><h1 className='text-2xl font-bold'>Group Leaderboard</h1>{loading?<p className='mt-3'>Loading...</p>:null}{error?<p className='mt-3 text-red-700'>{error}</p>:null}<div className='mt-4 grid gap-2'>{rows.map((r)=><div className='rounded border p-3 text-sm' key={r.user.id}>#{r.rank} · {r.user.displayName} · {r.totalScore} · completed {r.completedQuestionSets} · last scored {r.lastScoredAt?new Date(r.lastScoredAt).toLocaleString():'-'}</div>)}</div></section>;
}
