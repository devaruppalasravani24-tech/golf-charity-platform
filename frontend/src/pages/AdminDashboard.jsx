import { useEffect, useMemo, useState } from "react";
import AdminCard from "../components/AdminCard";
import Card from "../components/Card";
import CartButton from "../components/CartButton";
import Header from "../components/Header";
import InputField from "../components/InputField";
import Sidebar from "../components/Sidebar";
import WinnerCard from "../components/WinnerCard";
import { useAuth } from "../context/authContext";
import { listUsers, updateUserStatus } from "../services/authService";
import {
  getCharities,
  getCharityContributionSummary,
  toggleCharityStatus,
  upsertCharity,
} from "../services/charityService";
import {
  createDrawRecord,
  getAllDraws,
  getAllWinners,
  updateDrawRecord,
  updateWinnerStatus,
} from "../services/drawService";
import { formatCurrency, formatDate } from "../utils/dateUtils";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [draws, setDraws] = useState([]);
  const [charities, setCharities] = useState([]);
  const [winners, setWinners] = useState([]);
  const [contributionSummary, setContributionSummary] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [drawForm, setDrawForm] = useState({
    draw_date: new Date().toISOString().slice(0, 10),
    draw_logic: "random",
    month: "",
    prize_pool_total: "",
    status: "pending",
    year: new Date().getFullYear(),
  });
  const [charityForm, setCharityForm] = useState({
    category: "",
    description: "",
    name: "",
    slug: "",
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    const [usersResult, drawsResult, charitiesResult, winnersResult, summaryResult] =
      await Promise.all([
        listUsers(),
        getAllDraws(),
        getCharities({ includeInactive: true }),
        getAllWinners(),
        getCharityContributionSummary(),
      ]);

    setUsers(usersResult.data);
    setDraws(drawsResult.data);
    setCharities(charitiesResult.data);
    setWinners(winnersResult.data);
    setContributionSummary(summaryResult.data);
  }

  const activeSubscribers = useMemo(
    () =>
      users.filter((user) => user.subscription_status === "active").length,
    [users]
  );

  async function handleUserStatusChange(userId, subscriptionStatus) {
    const result = await updateUserStatus(userId, { subscription_status: subscriptionStatus });

    if (result.error) {
      setStatusMessage(result.error);
      return;
    }

    setUsers((current) =>
      current.map((user) =>
        user.id === userId ? { ...user, subscription_status: subscriptionStatus } : user
      )
    );
    setStatusMessage("User subscription status updated.");
  }

  async function handleCreateDraw(event) {
    event.preventDefault();
    const result = await createDrawRecord({
      draw_date: drawForm.draw_date,
      draw_logic: drawForm.draw_logic,
      month: drawForm.month || undefined,
      prize_pool_total: Number(drawForm.prize_pool_total || 0),
      status: drawForm.status,
      year: Number(drawForm.year),
    });

    if (result.error) {
      setStatusMessage(result.error);
      return;
    }

    setDraws((current) => [result.data, ...current]);
    setStatusMessage("Draw record created.");
  }

  async function handleDrawStatusChange(drawId, status) {
    const result = await updateDrawRecord(drawId, { status });

    if (result.error) {
      setStatusMessage(result.error);
      return;
    }

    setDraws((current) =>
      current.map((draw) => (draw.id === drawId ? { ...draw, status } : draw))
    );
    setStatusMessage("Draw status updated.");
  }

  async function handleCreateCharity(event) {
    event.preventDefault();
    const result = await upsertCharity({
      category: charityForm.category,
      description: charityForm.description,
      is_active: true,
      name: charityForm.name,
      slug: charityForm.slug,
    });

    if (result.error) {
      setStatusMessage(result.error);
      return;
    }

    setCharities((current) => [result.data, ...current]);
    setCharityForm({ category: "", description: "", name: "", slug: "" });
    setStatusMessage("Charity saved.");
  }

  async function handleToggleCharity(charityId, isActive) {
    const result = await toggleCharityStatus(charityId, isActive);

    if (result.error) {
      setStatusMessage(result.error);
      return;
    }

    setCharities((current) =>
      current.map((charity) =>
        charity.id === charityId ? { ...charity, is_active: isActive } : charity
      )
    );
    setStatusMessage("Charity status updated.");
  }

  async function handleWinnerChange(winnerId, updates) {
    const result = await updateWinnerStatus(winnerId, updates);

    if (result.error) {
      setStatusMessage(result.error);
      return;
    }

    setWinners((current) =>
      current.map((winner) =>
        winner.id === winnerId ? { ...winner, ...updates } : winner
      )
    );
    setStatusMessage("Winner record updated.");
  }

  return (
    <div className="min-h-screen bg-bg px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl lg:flex lg:items-start lg:gap-6">
        <Sidebar isAdmin />
        <div className="mt-6 flex-1 lg:mt-0">
          <Header
            description="Manage members, draws, charities, and winner verification from one place."
            eyebrow="Admin dashboard"
            title={`Platform controls for ${profile?.full_name || "Admin"}`}
          />

          {statusMessage ? (
            <div className="mb-6 rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent">
              {statusMessage}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-5">
            <AdminCard label="Users" value={users.length} />
            <AdminCard label="Active subs" tone="text-emerald-300" value={activeSubscribers} />
            <AdminCard label="Draws" tone="text-gold" value={draws.length} />
            <AdminCard label="Charities" tone="text-accent" value={charities.length} />
            <AdminCard label="Winners" tone="text-accent2" value={winners.length} />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card eyebrow="Members" title="User management">
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 md:flex-row md:items-center md:justify-between"
                    key={user.id}
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {user.full_name || "Unnamed user"}
                      </p>
                      <p className="text-sm text-slate-400">{user.email}</p>
                    </div>
                    <InputField
                      as="select"
                      className="md:w-48"
                      onChange={(event) =>
                        handleUserStatusChange(user.id, event.target.value)
                      }
                      options={[
                        { label: "Inactive", value: "inactive" },
                        { label: "Active", value: "active" },
                        { label: "Cancelled", value: "cancelled" },
                        { label: "Lapsed", value: "lapsed" },
                      ]}
                      value={user.subscription_status || "inactive"}
                    />
                  </div>
                ))}
              </div>
            </Card>

            <Card eyebrow="Draws" title="Create and maintain draws">
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateDraw}>
                <InputField
                  label="Month label"
                  onChange={(event) =>
                    setDrawForm((current) => ({ ...current, month: event.target.value }))
                  }
                  placeholder="March"
                  value={drawForm.month}
                />
                <InputField
                  label="Year"
                  onChange={(event) =>
                    setDrawForm((current) => ({ ...current, year: event.target.value }))
                  }
                  type="number"
                  value={drawForm.year}
                />
                <InputField
                  label="Draw date"
                  onChange={(event) =>
                    setDrawForm((current) => ({
                      ...current,
                      draw_date: event.target.value,
                    }))
                  }
                  type="date"
                  value={drawForm.draw_date}
                />
                <InputField
                  as="select"
                  label="Logic"
                  onChange={(event) =>
                    setDrawForm((current) => ({
                      ...current,
                      draw_logic: event.target.value,
                    }))
                  }
                  options={[
                    { label: "Random", value: "random" },
                    { label: "Algorithmic", value: "algorithmic" },
                  ]}
                  value={drawForm.draw_logic}
                />
                <InputField
                  label="Prize pool"
                  onChange={(event) =>
                    setDrawForm((current) => ({
                      ...current,
                      prize_pool_total: event.target.value,
                    }))
                  }
                  placeholder="500"
                  type="number"
                  value={drawForm.prize_pool_total}
                />
                <InputField
                  as="select"
                  label="Status"
                  onChange={(event) =>
                    setDrawForm((current) => ({ ...current, status: event.target.value }))
                  }
                  options={[
                    { label: "Pending", value: "pending" },
                    { label: "Published", value: "published" },
                    { label: "Completed", value: "completed" },
                  ]}
                  value={drawForm.status}
                />
                <div className="md:col-span-2">
                  <CartButton className="w-full" type="submit">
                    Create draw
                  </CartButton>
                </div>
              </form>

              <div className="mt-6 space-y-3">
                {draws.map((draw) => (
                  <div
                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 md:flex-row md:items-center md:justify-between"
                    key={draw.id}
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {draw.month || formatDate(draw.draw_date)}
                      </p>
                      <p className="text-sm text-slate-400">
                        {formatCurrency(draw.prize_pool_total || 0)}
                      </p>
                    </div>
                    <InputField
                      as="select"
                      className="md:w-48"
                      onChange={(event) =>
                        handleDrawStatusChange(draw.id, event.target.value)
                      }
                      options={[
                        { label: "Pending", value: "pending" },
                        { label: "Published", value: "published" },
                        { label: "Completed", value: "completed" },
                      ]}
                      value={draw.status || "pending"}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card eyebrow="Charities" title="Manage active causes">
              <form className="space-y-4" onSubmit={handleCreateCharity}>
                <InputField
                  label="Name"
                  onChange={(event) =>
                    setCharityForm((current) => ({ ...current, name: event.target.value }))
                  }
                  value={charityForm.name}
                />
                <InputField
                  label="Slug"
                  onChange={(event) =>
                    setCharityForm((current) => ({ ...current, slug: event.target.value }))
                  }
                  value={charityForm.slug}
                />
                <InputField
                  label="Category"
                  onChange={(event) =>
                    setCharityForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  value={charityForm.category}
                />
                <InputField
                  as="textarea"
                  label="Description"
                  onChange={(event) =>
                    setCharityForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows="4"
                  value={charityForm.description}
                />
                <CartButton className="w-full" type="submit">
                  Save charity
                </CartButton>
              </form>

              <div className="mt-6 space-y-3">
                {charities.map((charity) => (
                  <div
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
                    key={charity.id}
                  >
                    <div>
                      <p className="font-semibold text-white">{charity.name}</p>
                      <p className="text-sm text-slate-400">
                        {charity.category || "General charity"}
                      </p>
                    </div>
                    <CartButton
                      onClick={() => handleToggleCharity(charity.id, !charity.is_active)}
                      variant={charity.is_active ? "secondary" : "primary"}
                    >
                      {charity.is_active ? "Disable" : "Enable"}
                    </CartButton>
                  </div>
                ))}
              </div>
            </Card>

            <Card eyebrow="Contribution trends" title="Charity allocation summary">
              <div className="space-y-3">
                {contributionSummary.map((item) => (
                  <div
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
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
              </div>
            </Card>
          </div>

          <div className="mt-6">
            <Card eyebrow="Winners" title="Verification and payout tracking">
              <div className="grid gap-4 xl:grid-cols-2">
                {winners.map((winner) => (
                  <WinnerCard
                    key={winner.id}
                    onChange={handleWinnerChange}
                    winner={winner}
                  />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
