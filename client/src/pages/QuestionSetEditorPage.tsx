import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { questionApi } from '../services/questionApi';
import { questionSetApi } from '../services/questionSetApi';
import type { Question, QuestionOption, QuestionSet, QuestionSetInput, QuestionType } from '../types/questionSet';

const emptyForm: QuestionSetInput = {
  title: '',
  description: '',
  weekLabel: '',
  openAt: '',
  dueAt: '',
};

function toLocalDateTime(value: string) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function fromLocalDateTime(value: string) {
  return new Date(value).toISOString();
}

function formFromQuestionSet(questionSet: QuestionSet): QuestionSetInput {
  return {
    title: questionSet.title,
    description: questionSet.description ?? '',
    weekLabel: questionSet.weekLabel,
    openAt: toLocalDateTime(questionSet.openAt),
    dueAt: toLocalDateTime(questionSet.dueAt),
  };
}

export function QuestionSetEditorPage() {
  const { groupId, questionSetId } = useParams<{ groupId: string; questionSetId: string }>();
  const navigate = useNavigate();
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [form, setForm] = useState<QuestionSetInput>(emptyForm);
  const [questionDrafts, setQuestionDrafts] = useState<Record<string, string>>({});
  const [optionDrafts, setOptionDrafts] = useState<Record<string, string>>({});
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>('MULTIPLE_CHOICE');
  const [newQuestionPrompt, setNewQuestionPrompt] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(Boolean(questionSetId));
  const [isSaving, setIsSaving] = useState(false);

  async function loadQuestionSet(id: string) {
    const response = await questionSetApi.get(id);
    setQuestionSet(response.questionSet);
    setForm(formFromQuestionSet(response.questionSet));
    setQuestionDrafts(Object.fromEntries(response.questionSet.questions.map((question) => [question.id, question.prompt])));
    setOptionDrafts(Object.fromEntries(response.questionSet.questions.flatMap((question) => question.options.map((option) => [option.id, option.text]))));
  }

  useEffect(() => {
    if (!questionSetId) {
      return;
    }

    void loadQuestionSet(questionSetId)
      .catch((loadError: Error) => setError(loadError.message))
      .finally(() => setIsLoading(false));
  }, [questionSetId]);

  function updateForm<K extends keyof QuestionSetInput>(key: K, value: QuestionSetInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSaveQuestionSet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    const payload = {
      ...form,
      description: form.description || null,
      openAt: fromLocalDateTime(form.openAt),
      dueAt: fromLocalDateTime(form.dueAt),
    };

    try {
      if (questionSetId) {
        const response = await questionSetApi.update(questionSetId, payload);
        setQuestionSet(response.questionSet);
        setForm(formFromQuestionSet(response.questionSet));
        setSuccess('Question set saved.');
      } else if (groupId) {
        const response = await questionSetApi.create(groupId, payload);
        navigate(`/admin/question-sets/${response.questionSet.id}/edit`, { replace: true });
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save question set');
    } finally {
      setIsSaving(false);
    }
  }

  async function refreshCurrentQuestionSet() {
    const id = questionSetId ?? questionSet?.id;
    if (id) {
      await loadQuestionSet(id);
    }
  }

  async function handlePublish() {
    if (!questionSet) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      const response = await questionSetApi.publish(questionSet.id);
      setQuestionSet(response.questionSet);
      setSuccess('Question set published.');
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Unable to publish question set');
    }
  }

  async function handleAddQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!questionSet) {
      return;
    }

    setError('');
    try {
      await questionApi.create(questionSet.id, {
        type: newQuestionType,
        prompt: newQuestionPrompt,
        order: questionSet.questions.length,
      });
      setNewQuestionPrompt('');
      await refreshCurrentQuestionSet();
    } catch (questionError) {
      setError(questionError instanceof Error ? questionError.message : 'Unable to add question');
    }
  }

  async function handleSaveQuestion(question: Question) {
    setError('');
    try {
      await questionApi.update(question.id, { prompt: questionDrafts[question.id], type: question.type, order: question.order });
      await refreshCurrentQuestionSet();
      setSuccess('Question saved.');
    } catch (questionError) {
      setError(questionError instanceof Error ? questionError.message : 'Unable to save question');
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    setError('');
    try {
      await questionApi.delete(questionId);
      await refreshCurrentQuestionSet();
    } catch (questionError) {
      setError(questionError instanceof Error ? questionError.message : 'Unable to delete question');
    }
  }

  async function handleAddOption(question: Question) {
    setError('');
    try {
      await questionApi.createOption(question.id, { text: 'New option', isCorrect: question.options.length === 0, order: question.options.length });
      await refreshCurrentQuestionSet();
    } catch (optionError) {
      setError(optionError instanceof Error ? optionError.message : 'Unable to add option');
    }
  }

  async function handleSaveOption(option: QuestionOption) {
    setError('');
    try {
      await questionApi.updateOption(option.id, { text: optionDrafts[option.id], isCorrect: option.isCorrect, order: option.order });
      await refreshCurrentQuestionSet();
      setSuccess('Option saved.');
    } catch (optionError) {
      setError(optionError instanceof Error ? optionError.message : 'Unable to save option');
    }
  }

  async function handleCorrectOption(option: QuestionOption) {
    setError('');
    try {
      await questionApi.updateOption(option.id, { isCorrect: true });
      await refreshCurrentQuestionSet();
    } catch (optionError) {
      setError(optionError instanceof Error ? optionError.message : 'Unable to update correct option');
    }
  }

  async function handleDeleteOption(optionId: string) {
    setError('');
    try {
      await questionApi.deleteOption(optionId);
      await refreshCurrentQuestionSet();
    } catch (optionError) {
      setError(optionError instanceof Error ? optionError.message : 'Unable to delete option');
    }
  }

  if (isLoading) {
    return <p className="text-slate-600">Loading question set...</p>;
  }

  const backGroupId = groupId ?? questionSet?.groupId;

  return (
    <section className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Question set editor</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{questionSet ? questionSet.title : 'Create question set'}</h1>
          {questionSet ? <p className="mt-2 text-sm font-medium text-slate-500">Status: {questionSet.status}</p> : null}
        </div>
        {backGroupId ? <Link className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" to={`/admin/groups/${backGroupId}`}>Back to group</Link> : null}
      </div>

      {error ? <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}
      {success ? <p className="mt-6 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{success}</p> : null}

      <form className="mt-8 grid gap-4 rounded-lg bg-slate-50 p-5 ring-1 ring-slate-200" onSubmit={handleSaveQuestionSet}>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Title
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900" value={form.title} onChange={(event) => updateForm('title', event.target.value)} required />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Description
          <textarea className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900" value={form.description ?? ''} onChange={(event) => updateForm('description', event.target.value)} rows={3} />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Week label
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900" value={form.weekLabel} onChange={(event) => updateForm('weekLabel', event.target.value)} required />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Opens at
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900" type="datetime-local" value={form.openAt} onChange={(event) => updateForm('openAt', event.target.value)} required />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Due at
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900" type="datetime-local" value={form.dueAt} onChange={(event) => updateForm('dueAt', event.target.value)} required />
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:bg-indigo-300" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save question set'}</button>
          {questionSet ? <button className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700" type="button" onClick={() => void handlePublish()}>Publish</button> : null}
        </div>
      </form>

      {questionSet ? (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-slate-900">Questions</h2>
          <form className="mt-4 grid gap-3 rounded-lg border border-dashed border-slate-300 p-4 sm:grid-cols-[180px_1fr_auto]" onSubmit={handleAddQuestion}>
            <select className="rounded-lg border border-slate-300 px-3 py-2" value={newQuestionType} onChange={(event) => setNewQuestionType(event.target.value as QuestionType)}>
              <option value="MULTIPLE_CHOICE">Multiple choice</option>
              <option value="TRUE_FALSE">True/false</option>
            </select>
            <input className="rounded-lg border border-slate-300 px-3 py-2" value={newQuestionPrompt} onChange={(event) => setNewQuestionPrompt(event.target.value)} placeholder="Question prompt" required />
            <button className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700" type="submit">Add question</button>
          </form>

          <div className="mt-4 grid gap-4">
            {questionSet.questions.map((question) => (
              <article className="rounded-lg border border-slate-200 p-4" key={question.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">{question.type.replace('_', ' ')}</p>
                    <textarea className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" value={questionDrafts[question.id] ?? question.prompt} onChange={(event) => setQuestionDrafts((current) => ({ ...current, [question.id]: event.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" type="button" onClick={() => void handleSaveQuestion(question)}>Save</button>
                    <button className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50" type="button" onClick={() => void handleDeleteQuestion(question.id)}>Delete</button>
                  </div>
                </div>

                <div className="mt-4 grid gap-2">
                  {question.options.map((option) => (
                    <div className="grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-[auto_1fr_auto_auto] sm:items-center" key={option.id}>
                      <input type="radio" name={`correct-${question.id}`} checked={option.isCorrect} onChange={() => void handleCorrectOption(option)} title="Mark correct" />
                      <input className="rounded-lg border border-slate-300 px-3 py-2" value={optionDrafts[option.id] ?? option.text} onChange={(event) => setOptionDrafts((current) => ({ ...current, [option.id]: event.target.value }))} />
                      <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white" type="button" onClick={() => void handleSaveOption(option)}>Save</button>
                      <button className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50" type="button" onClick={() => void handleDeleteOption(option.id)}>Delete</button>
                    </div>
                  ))}
                </div>
                <button className="mt-3 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100" type="button" onClick={() => void handleAddOption(question)}>Add option</button>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
