"use client";

import { useEffect, useState } from "react";
import liff from "@line/liff";

export default function ReservePage() {
  const [loading, setLoading] = useState(true);
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState("テストサービス");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [result, setResult] = useState("");

  // --- LIFF 初期化 ---
  useEffect(() => {
    async function init() {
      try {
        await liff.init({
          liffId: process.env.NEXT_PUBLIC_LIFF_ID!,
        });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const profile = await liff.getProfile();
        setLineUserId(profile.userId);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // --- ローディング中 ---
  if (loading) {
    return <div>Loading...</div>;
  }

  // --- 予約ボタン押下 ---
  async function handleReserve() {
    if (!startAt || !endAt) {
      alert("開始・終了時間を入力してください");
      return;
    }

    const idToken = liff.getIDToken();
    if (!idToken) {
    alert("LINEログインに問題があります（idTokenが取得できません）");
    return;
    }

    // datetime-local → ISO(+09:00) に変換（超重要）
    const startISO = new Date(startAt + ":00+09:00").toISOString();
    const endISO = new Date(endAt + ":00+09:00").toISOString();

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken,
        serviceType,
      startAt: startISO,
      endAt: endISO,
      }),
    });

    const json = await res.json();
    setResult(JSON.stringify(json, null, 2));
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>予約画面</h1>

      <p>LINEユーザーID: {lineUserId}</p>

      <div>
        <label>サービス名：</label>
        <input
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
        />
      </div>

      <div>
        <label>開始時刻：</label>
        <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
      </div>

      <div>
        <label>終了時刻：</label>
        <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
      </div>

      <button onClick={handleReserve}>予約する</button>

      {result && (
        <pre style={{ marginTop: 20, background: "#eee", padding: 10 }}>
          {result}
        </pre>
      )}
    </div>
  );
}