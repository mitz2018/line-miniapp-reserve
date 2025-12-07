export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getServiceCalendar } from "@/lib/google";
// import { verifyLineIdToken } from "@/lib/line";

const TZ = "Asia/Tokyo";
const CAL_ID = process.env.GCAL_ID!;

export async function POST(req: NextRequest) {
  try {
    const { idToken, serviceType, startAt, endAt } = await req.json();

    // LINE の idToken を検証
    // const { lineUserId } = await verifyLineIdToken(idToken);
    const lineUserId = "debug-user";

    // サービスアカウントでカレンダー接続
    const cal = await getServiceCalendar();

    // 空き時間の確認
    const fb = await cal.freebusy.query({
      requestBody: {
        timeMin: new Date(startAt).toISOString(),
        timeMax: new Date(endAt).toISOString(),
        items: [{ id: CAL_ID }],
        timeZone: TZ,
      },
    });

    const busy = fb.data.calendars?.[CAL_ID]?.busy ?? [];
    if (busy.length > 0) {
      return Response.json(
        { ok: false, error: "Slot not available" },
        { status: 409 }
      );
    }

    // イベント作成
    const ev = await cal.events.insert({
      calendarId: CAL_ID,
      requestBody: {
        summary: `予約: ${serviceType}`,
        description: `LINE user: ${lineUserId}`,
        start: { dateTime: startAt, timeZone: TZ },
        end: { dateTime: endAt, timeZone: TZ },
      },
    });

    return Response.json({
      ok: true,
      booking: {
        id: ev.data.id,
        serviceType,
        startAt,
        endAt,
        googleCalendarId: CAL_ID,
        googleEventId: ev.data.id,
      },
    });
  } catch (e) {
    console.error(e);
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}