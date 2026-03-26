import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import CartButton from "../components/CartButton";
import CharityCard from "../components/CharityCard";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/authContext";
import {
  getCharities,
  getCharityContributionSummary,
  getUserCharitySelection,
  saveCharitySelection,
} from "../services/charityService";

export default function CharitySelection() {
  const { profile, saveProfile, user } = useAuth();
  const [charities, setCharities] = useState([]);
  const [selectedCharityId, setSelectedCharityId] = useState(
    profile?.charity_id || null
  );
  const [percentage, setPercentage] = useState(profile?.charity_percentage || 10);
  const [summary, setSummary] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const [charityResult, summaryResult] = await Promise.all([
        getCharities(),
        getCharityContributionSummary(),
      ]);

      if (!isMounted) {
        return;
      }

      setCharities(charityResult.data);
      setSummary(summaryResult.data);
      setError(charityResult.error || summaryResult.error || "");

      if (user?.id) {
        const selectionResult = await getUserCharitySelection(user.id);

        if (!isMounted) {
          return;
        }

        if (selectionResult.data?.charity_id) {
          setSelectedCharityId(selectionResult.data.charity_id);
        }

        if (selectionResult.error) {
          setError(selectionResult.error);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const selectedCharity = useMemo(
    () => charities.find((charity) => charity.id === selectedCharityId) || null,
    [charities, selectedCharityId]
  );

  async function handleSave() {
    if (!user?.id || !selectedCharityId) {
      setError("Choose a charity before saving.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const result = await saveCharitySelection({
      charityId: selectedCharityId,
      charityPercentage: percentage,
      userId: user.id,
    });

    if (result.error) {
      setSaving(false);
      setError(result.error);
      return;
    }

    const profileResult = await saveProfile({
      charity_id: selectedCharityId,
      charity_percentage: percentage,
    });

    setSaving(false);

    if (profileResult.error) {
      setError(profileResult.error);
      return;
    }

    setMessage("Charity preference saved.");
  }

  return (
    <div className="min-h-screen bg-bg px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl lg:flex lg:items-start lg:gap-6">
        <Sidebar />
        <div className="mt-6 flex-1 lg:mt-0">
          <Header
            actions={[
              <CartButton key="save" onClick={handleSave}>
                {saving ? "Saving..." : "Save preference"}
              </CartButton>,
            ]}
            description="Pick the charity that should receive part of your subscription and choose the percentage split."
            eyebrow="Charity"
            title="Set your giving preference"
          />

          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <Card eyebrow="Contribution split" title="Your current allocation">
              <div className="rounded-[1.5rem] border border-accent/20 bg-accent/10 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.28em] text-accent">
                  Current percentage
                </p>
                <p className="mt-3 font-display text-5xl font-black text-white">
                  {percentage}%
                </p>
              </div>
              <div className="mt-6">
                <input
                  className="w-full accent-[#00e5a0]"
                  max="50"
                  min="10"
                  onChange={(event) => setPercentage(Number(event.target.value))}
                  type="range"
                  value={percentage}
                />
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Minimum allocation is 10%. You can increase it up to 50%.
              </p>

              {selectedCharity ? (
                <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4 text-sm text-slate-300">
                  Selected charity:{" "}
                  <span className="font-semibold text-white">
                    {selectedCharity.name}
                  </span>
                </div>
              ) : null}

              {error ? (
                <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : message ? (
                <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                  {message}
                </div>
              ) : null}
            </Card>

            <div className="space-y-6">
              <Card eyebrow="Available charities" title="Choose one of the active causes">
                <div className="grid gap-4 md:grid-cols-2">
                  {charities.map((charity) => (
                    <CharityCard
                      charity={charity}
                      isSelected={charity.id === selectedCharityId}
                      key={charity.id}
                      onSelect={() => setSelectedCharityId(charity.id)}
                      percentage={percentage}
                    />
                  ))}
                </div>
              </Card>

              <Card eyebrow="Platform view" title="Current charity support levels">
                <div className="space-y-3">
                  {summary.map((item) => (
                    <div
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                      key={item.charity_id}
                    >
                      <div>
                        <p className="font-semibold text-white">
                          {item.charities?.name || "Unknown charity"}
                        </p>
                        <p className="text-sm text-slate-400">
                          {item.activeSubscribers} supporters
                        </p>
                      </div>
                      <p className="font-display text-2xl font-black text-accent">
                        {Math.round(item.averagePercentage || 0)}%
                      </p>
                    </div>
                  ))}

                  {!summary.length ? (
                    <p className="text-sm text-slate-400">
                      Contribution summary will appear once selections are saved.
                    </p>
                  ) : null}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
