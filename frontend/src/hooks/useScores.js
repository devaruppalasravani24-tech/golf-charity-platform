import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import {
  createScore,
  listScoresByUser,
  removeScoreById,
  subscribeToScoreChanges,
  updateScoreById,
} from "../services/scoreService";

export function useScores() {
  const { user } = useAuth();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => {};

    async function loadScores() {
      if (!user?.id) {
        setScores([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const result = await listScoresByUser(user.id);

      if (!isMounted) return;

      if (result.error) {
        setError(result.error);
      } else {
        setScores(result.data);
        setError("");
      }

      setLoading(false);
      unsubscribe = subscribeToScoreChanges(user.id, async () => {
        const refreshed = await listScoresByUser(user.id);
        if (!isMounted || refreshed.error) return;
        setScores(refreshed.data);
      });
    }

    loadScores();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user?.id]);

  async function addScore(payload) {
    if (!user?.id) {
      return { data: null, error: "You must be signed in to save scores." };
    }
    const result = await createScore({ ...payload, userId: user.id });
    if (!result.error) {
      const refreshed = await listScoresByUser(user.id);
      setScores(refreshed.data);
      setError("");
    } else {
      setError(result.error);
    }
    return result;
  }

  async function updateScore(payload) {
    const result = await updateScoreById(payload);
    if (!result.error && user?.id) {
      const refreshed = await listScoresByUser(user.id);
      setScores(refreshed.data);
      setError("");
    } else if (result.error) {
      setError(result.error);
    }
    return result;
  }

  async function removeScore(scoreId) {
    const result = await removeScoreById(scoreId);
    if (!result.error && user?.id) {
      const refreshed = await listScoresByUser(user.id);
      setScores(refreshed.data);
      setError("");
    } else if (result.error) {
      setError(result.error);
    }
    return result;
  }

  return {
    addScore,
    error,
    loading,
    removeScore,
    scores,
    updateScore,
  };
}
