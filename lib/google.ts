import { google } from "googleapis";

// 「サービスアカウントとして」「サービス用の共有カレンダー」にアクセスするためのクライアント
let serviceCalendarClient: any = null;

/**
 * サービスアカウントで Google カレンダー API に接続するためのクライアントを返す。
 * 今は「1つの共有カレンダー（GCAL_ID）」を操作する想定。
 *
 * 将来、ユーザーごとの個人カレンダーを扱う場合は、
 * getUserCalendar(...) のような別関数を用意して使い分ける想定。
 */
export async function getServiceCalendar() {
  // 一度作ったクライアントは再利用する（サーバーレス環境のウォーム状態を活用）
  if (serviceCalendarClient) return serviceCalendarClient;

  const b64 = process.env.GOOGLE_SA_JSON_B64;
  if (!b64) {
    throw new Error("GOOGLE_SA_JSON_B64 is not set");
  }

  // Base64 → JSONテキスト → オブジェクト
  const json = Buffer.from(b64, "base64").toString("utf8");
  const creds = JSON.parse(json);

  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  const client = await auth.getClient();

  // 「サービスカレンダー用」クライアントとしてキャッシュ
  serviceCalendarClient = google.calendar({
    version: "v3",
    auth, // ← auth object を渡すのが正解
  });
  return serviceCalendarClient;
}