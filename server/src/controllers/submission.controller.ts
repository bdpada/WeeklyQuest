import type { Request, Response } from 'express';
import { HttpError } from '../utils/httpError.js';
import { createSubmission, getMySubmission, getSubmission, listQuestionSetSubmissions, saveSubmissionAnswers, submitSubmission } from '../services/submission.service.js';

type SaveBody = { answers: { questionId: string; selectedOptionId?: string; textAnswer?: string }[] };
const currentUser = (req: { user?: Request['user'] }) => { if (!req.user) throw new HttpError(401, 'Authentication required'); return req.user; };

export async function mySubmission(req: Request<{ questionSetId: string }>, res: Response) { res.status(200).json({ submission: await getMySubmission(req.params.questionSetId, currentUser(req)) }); }
export async function create(req: Request<{ questionSetId: string }>, res: Response) { res.status(201).json({ submission: await createSubmission(req.params.questionSetId, currentUser(req)) }); }
export async function update(req: Request<{ submissionId: string }, object, SaveBody>, res: Response) { res.status(200).json({ submission: await saveSubmissionAnswers(req.params.submissionId, req.body.answers, currentUser(req)) }); }
export async function submit(req: Request<{ submissionId: string }>, res: Response) { res.status(200).json({ submission: await submitSubmission(req.params.submissionId, currentUser(req)) }); }
export async function listForQuestionSet(req: Request<{ questionSetId: string }>, res: Response) { res.status(200).json({ submissions: await listQuestionSetSubmissions(req.params.questionSetId, currentUser(req)) }); }
export async function show(req: Request<{ submissionId: string }>, res: Response) { res.status(200).json({ submission: await getSubmission(req.params.submissionId, currentUser(req)) }); }
