import { useMemo, useState } from "react";
import Card from "../components/Card";
import CartButton from "../components/CartButton";
import Header from "../components/Header";
import InputField from "../components/InputField";
import ScoreCard from "../components/ScoreCard";
import Sidebar from "../components/Sidebar";
import { useScores } from "../hooks/useScores";

function getInitialFormState() {
  return {
    playedAt: new Date().toISOString().slice(0, 10),
    score: "",
  };
}

export default function ScoreEntry() {
  const { addScore, error, loading, removeScore, scores, updateScore } = useScores();
  const [editingScore, setEditingScore] = useState(null);
  const [form, setForm] = useState(getInitialFormState());
  const [status, setStatus] = useState("");

  const averageScore = useMemo(() => {
    if (!scores.length) {
      return null;
    }

    return (
      scores.reduce((total, entry) => total + Number(entry.score || 0), 0) /
      scores.length
    ).toFixed(1);
  }, [scores]);

  function resetForm() {
    setEditingScore(null);
    setForm(getInitialFormState());
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      playedAt: form.playedAt,
      score: Number(form.score),
    };

    const result = editingScore
      ? await updateScore({ ...payload, scoreId: editingScore.id })
      : await addScore(payload);

    if (result.error) {
      setStatus("");
      return;
    }

    setStatus(editingScore ? "Score updated." : "Score saved.");
    resetForm();
  }

  function handleEdit(score) {
    setEditingScore(score);
    setForm({
      playedAt: score.played_at?.slice(0, 10) || getInitialFormState().playedAt,
      score: String(score.score),
    });
  }

  return (
    <div className="min-h-screen bg-bg px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl lg:flex lg:items-start lg:gap-6">
        <Sidebar />
        <div className="mt-6 flex-1 lg:mt-0">
          <Header
            actions={[
              <CartButton key="reset" onClick={resetForm} variant="secondary">
                Reset form
              </CartButton>,
            ]}
            description="Add and edit the five Stableford rounds used for your profile."
            eyebrow="Scores"
            title="Manage your latest golf rounds"
          />

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card eyebrow="Entry form" title={editingScore ? "Edit score" : "Add score"}>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <InputField
                  label="Stableford score"
                  max="45"
                  min="1"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, score: event.target.value }))
                  }
                  placeholder="36"
                  type="number"
                  value={form.score}
                />
                <InputField
                  label="Date played"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      playedAt: event.target.value,
                    }))
                  }
                  type="date"
                  value={form.playedAt}
                />

                {error ? (
                  <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                    {error}
                  </div>
                ) : status ? (
                  <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                    {status}
                  </div>
                ) : null}

                <CartButton className="w-full" type="submit">
                  {editingScore ? "Update score" : "Save score"}
                </CartButton>
              </form>
            </Card>

            <Card eyebrow="Latest five" title="Saved score history">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                    Stored rounds
                  </p>
                  <p className="mt-3 font-display text-4xl font-black text-white">
                    {loading ? "..." : `${scores.length}/5`}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                    Average
                  </p>
                  <p className="mt-3 font-display text-4xl font-black text-white">
                    {averageScore || "--"}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {scores.map((score) => (
                  <ScoreCard
                    key={score.id}
                    onDelete={removeScore}
                    onEdit={handleEdit}
                    score={score}
                  />
                ))}

                {!loading && !scores.length ? (
                  <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-black/10 px-4 py-10 text-center text-sm text-slate-400">
                    No rounds yet. Add your first score from the form on the left.
                  </div>
                ) : null}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
