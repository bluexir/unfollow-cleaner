export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { neynarClientRaw, neynarClientVisible } from "@/lib/neynar";

type NeynarUser = {
  fid?: number;
  username?: string;
  display_name?: string;
  pfp_url?: string;
  follower_count?: number;
  power_badge?: boolean;
  score?: number;
  experimental?: {
    neynar_user_score?: number;
    spam_label?: string;
    spam_label_score?: number;
  };
  spam_label?: string;
  spam_label_score?: number;
};

type NeynarUserEdge = {
  user?: NeynarUser;
};

function nowMs() {
  return Date.now();
}

function toNumber(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getScore(u?: NeynarUser): number | null {
  if (!u) return null;
  const a = toNumber((u as any).score);
  if (a !== null) return a;
  const b = toNumber((u as any)?.experimental?.neynar_user_score);
  if (b !== null) return b;
  const c = toNumber((u as any).neynar_user_score);
  if (c !== null) return c;
  return null;
}

function getSpamLabel(u?: NeynarUser): string | null {
  if (!u) return null;
  const a = (u as any)?.spam_label;
  if (typeof a === "string" && a.trim()) return a.trim();
  const b = (u as any)?.experimental?.spam_label;
  if (typeof b === "string" && b.trim()) return b.trim();
  return null;
}

function isSpamLabel(label: string | null) {
  if (!label) return false;
  const s = label.toLowerCase();
  return s.includes("spam") || s.includes("bot") || s.includes("scam");
}

function formatEdge(edge: NeynarUserEdge) {
  const u = edge.user || {};
  return {
    fid: u.fid,
    username: u.username,
    display_name: u.display_name || u.username,
    pfp_url: u.pfp_url,
    follower_count: u.follower_count || 0,
    power_badge: u.power_badge || false,
    neynar_score: getScore(u),
    spam_label: getSpamLabel(u),
  };
}

function getStrictMinScore(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("strict_min_score");
  const fromQuery = toNumber(q);
  if (fromQuery !== null) return Math.max(0, Math.min(1, fromQuery));
  const fromEnv = toNumber(process.env.STRICT_MIN_SCORE);
  if (fromEnv !== null) return Math.max(0, Math.min(1, fromEnv));
  return 0.6;
}

function isStrictVisibleFollower(edge: NeynarUserEdge, minScore: number) {
  const u = edge.user;
  if (!u?.fid) return false;
  if (isSpamLabel(getSpamLabel(u))) return false;
  if (u.power_badge) return true;
  const score = getScore(u);
  if (score === null) return false;
  return score >= minScore;
}

async function fetchAllFollowing(args: { requestId: string; fid: number; viewerFid?: number }) {
  const { requestId, fid, viewerFid } = args;
  const started = nowMs();

  let cursor: string | null = null;
  let total = 0;
  let pages = 0;
  const list: NeynarUserEdge[] = [];

  do {
    pages += 1;

    const params: any = { fid, limit: 100 };
    if (cursor) params.cursor = cursor;
    if (typeof viewerFid === "number") {
      params.viewerFid = viewerFid;
      params.viewer_fid = viewerFid;
    }

    const resp: any = await neynarClientRaw.fetchUserFollowing(params);
    const batch: NeynarUserEdge[] = resp?.users || [];
    list.push(...batch);
    total += batch.length;
    cursor = resp?.next?.cursor || null;

    console.log(
      JSON.stringify({
        request_id: requestId,
        event: "following_page",
        page: pages,
        batch: batch.length,
        total,
        next_cursor: Boolean(cursor),
      })
    );
  } while (cursor);

  console.log(
    JSON.stringify({
      request_id: requestId,
      event: "following_done",
      total,
      pages,
      ms: nowMs() - started,
    })
  );

  return { list, total, pages };
}

async function fetchAllFollowers(args: {
  requestId: string;
  fid: number;
  mode: "raw" | "visible";
  viewerFid?: number;
}) {
  const { requestId, fid, mode, viewerFid } = args;
  const started = nowMs();

  const client = mode === "visible" ? neynarClientVisible : neynarClientRaw;

  let cursor: string | null = null;
  let total = 0;
  let pages = 0;
  const list: NeynarUserEdge[] = [];

  do {
    pages += 1;

    const params: any = { fid, limit: 100 };
    if (cursor) params.cursor = cursor;
    if (typeof viewerFid === "number") {
      params.viewerFid = viewerFid;
      params.viewer_fid = viewerFid;
    }

    const resp: any = await client.fetchUserFollowers(params);
    const batch: NeynarUserEdge[] = resp?.users || [];
    list.push(...batch);
    total += batch.length;
    cursor = resp?.next?.cursor || null;

    console.log(
      JSON.stringify({
        request_id: requestId,
        event: "followers_page",
        mode,
        page: pages,
        batch: batch.length,
        total,
        next_cursor: Boolean(cursor),
      })
    );
  } while (cursor);

  console.log(
    JSON.stringify({
      request_id: requestId,
      event: "followers_done",
      mode,
      total,
      pages,
      ms: nowMs() - started,
    })
  );

  return { list, total, pages };
}

export async function GET(req: NextRequest) {
  const requestId = randomUUID();
  const started = nowMs();

  try {
    const fidStr = req.nextUrl.searchParams.get("fid");
    const userFid = toNumber(fidStr);

    if (!userFid) {
      console.log(JSON.stringify({ request_id: requestId, event: "bad_request", reason: "missing_fid" }));
      return NextResponse.json({ error: "FID required", request_id: requestId }, { status: 400 });
    }

    const strictMinScore = getStrictMinScore(req);

    console.log(
      JSON.stringify({
        request_id: requestId,
        event: "start",
        fid: userFid,
        strict_min_score: strictMinScore,
      })
    );

    const { users: userProfiles }: any = await neynarClientVisible.fetchBulkUsers({ fids: [userFid] } as any);
    const userProfile = userProfiles?.[0];

    if (!userProfile) {
      console.log(JSON.stringify({ request_id: requestId, event: "profile_missing", fid: userFid }));
      return NextResponse.json({ error: "User not found", request_id: requestId }, { status: 404 });
    }

    const following = await fetchAllFollowing({ requestId, fid: userFid, viewerFid: userFid });

    const rawFollowers = await fetchAllFollowers({
      requestId,
      fid: userFid,
      mode: "raw",
      viewerFid: userFid,
    });

    const visibleFollowers = await fetchAllFollowers({
      requestId,
      fid: userFid,
      mode: "visible",
      viewerFid: userFid,
    });

    const followingByFid = new Map<number, NeynarUserEdge>();
    for (const edge of following.list) {
      const f = toNumber(edge?.user?.fid);
      if (f) followingByFid.set(f, edge);
    }

    const rawFollowerFids = new Set<number>();
    const rawFollowersByFid = new Map<number, NeynarUserEdge>();
    for (const edge of rawFollowers.list) {
      const f = toNumber(edge?.user?.fid);
      if (f) {
        rawFollowerFids.add(f);
        rawFollowersByFid.set(f, edge);
      }
    }

    const strictVisibleFollowerFids = new Set<number>();
    const strictLabelCounts: Record<string, number> = {};
    let strictVisibleCount = 0;
    let strictSpamRejected = 0;
    let strictScoreRejected = 0;
    let strictMissingScore = 0;

    for (const edge of rawFollowers.list) {
      const u = edge.user;
      const fid = toNumber(u?.fid);
      if (!fid) continue;

      const label = getSpamLabel(u);
      if (label) strictLabelCounts[label] = (strictLabelCounts[label] || 0) + 1;

      if (isSpamLabel(label)) {
        strictSpamRejected += 1;
        continue;
      }

      if (u?.power_badge) {
        strictVisibleFollowerFids.add(fid);
        strictVisibleCount += 1;
        continue;
      }

      const score = getScore(u);
      if (score === null) {
        strictMissingScore += 1;
        continue;
      }

      if (score < strictMinScore) {
        strictScoreRejected += 1;
        continue;
      }

      strictVisibleFollowerFids.add(fid);
      strictVisibleCount += 1;
    }

    console.log(
      JSON.stringify({
        request_id: requestId,
        event: "sets_ready",
        following: followingByFid.size,
        followers_raw: rawFollowerFids.size,
        followers_visible_experimental: visibleFollowers.total,
        followers_strict_visible: strictVisibleFollowerFids.size,
        strict_spam_rejected: strictSpamRejected,
        strict_score_rejected: strictScoreRejected,
        strict_missing_score: strictMissingScore,
        strict_labels: strictLabelCounts,
      })
    );

    const realNonFollowersEdges: NeynarUserEdge[] = [];
    for (const [fid, edge] of followingByFid.entries()) {
      if (!rawFollowerFids.has(fid)) realNonFollowersEdges.push(edge);
    }

    const filteredInvisibleEdges: NeynarUserEdge[] = [];
    for (const [fid, edge] of followingByFid.entries()) {
      if (rawFollowerFids.has(fid) && !strictVisibleFollowerFids.has(fid)) {
        const followerEdge = rawFollowersByFid.get(fid);
        filteredInvisibleEdges.push(followerEdge || edge);
      }
    }

    console.log(
      JSON.stringify({
        request_id: requestId,
        event: "computed",
        non_followers_real: realNonFollowersEdges.length,
        filtered_invisible: filteredInvisibleEdges.length,
      })
    );

    const response = {
      request_id: requestId,
      nonFollowers: realNonFollowersEdges.map(formatEdge),
      filteredInvisible: filteredInvisibleEdges.map(formatEdge),
      stats: {
        following: following.total,
        followers_raw: rawFollowers.total,
        followers_visible_experimental: visibleFollowers.total,
        followers_strict_visible: strictVisibleFollowerFids.size,
        nonFollowersCount: realNonFollowersEdges.length,
        filteredInvisibleCount: filteredInvisibleEdges.length,
        strict_min_score: strictMinScore,
      },
      userProfile: {
        fid: userProfile.fid,
        username: userProfile.username,
        display_name: userProfile.display_name || userProfile.username,
        pfp_url: userProfile.pfp_url,
        neynar_score: userProfile.score || userProfile.experimental?.neynar_user_score || null,
      },
    };

    console.log(JSON.stringify({ request_id: requestId, event: "done", ms: nowMs() - started }));

    return NextResponse.json(response);
  } catch (error: any) {
    console.error(
      JSON.stringify({
        request_id: requestId,
        event: "error",
        message: error?.message,
        stack: error?.stack,
      })
    );
    return NextResponse.json({ error: error?.message || "Failed", request_id: requestId }, { status: 500 });
  }
}
