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

function formatUser(u?: NeynarUser) {
  const user = u || {};
  return {
    fid: user.fid,
    username: user.username,
    display_name: user.display_name || user.username,
    pfp_url: user.pfp_url,
    follower_count: user.follower_count || 0,
    power_badge: user.power_badge || false,
    neynar_score: getScore(user),
    spam_label: getSpamLabel(user),
  };
}

function getLowQualityMaxScore(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("low_quality_max_score");
  const fromQuery = toNumber(q);
  if (fromQuery !== null) return Math.max(0, Math.min(1, fromQuery));
  const fromEnv = toNumber(process.env.LOW_QUALITY_MAX_SCORE);
  if (fromEnv !== null) return Math.max(0, Math.min(1, fromEnv));
  return 0.35;
}

function getIncludeMissingScore(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("include_missing_score");
  if (q === null) return true;
  const s = String(q).toLowerCase();
  if (s === "0" || s === "false" || s === "no") return false;
  return true;
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

async function fetchAllFollowersRaw(args: { requestId: string; fid: number; viewerFid?: number }) {
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

    const resp: any = await neynarClientRaw.fetchUserFollowers(params);
    const batch: NeynarUserEdge[] = resp?.users || [];
    list.push(...batch);
    total += batch.length;
    cursor = resp?.next?.cursor || null;

    console.log(
      JSON.stringify({
        request_id: requestId,
        event: "followers_page",
        mode: "raw",
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
      mode: "raw",
      total,
      pages,
      ms: nowMs() - started,
    })
  );

  return { list, total, pages };
}

async function fetchBulkUsersByFids(args: { requestId: string; fids: number[] }) {
  const { requestId, fids } = args;
  const started = nowMs();

  const map = new Map<number, NeynarUser>();
  const chunkSize = 100;
  let chunks = 0;

  for (let i = 0; i < fids.length; i += chunkSize) {
    chunks += 1;
    const chunk = fids.slice(i, i + chunkSize);

    const resp: any = await neynarClientVisible.fetchBulkUsers({ fids: chunk } as any);
    const users: NeynarUser[] = resp?.users || [];

    for (const u of users) {
      const fid = toNumber(u?.fid);
      if (fid) map.set(fid, u);
    }

    console.log(
      JSON.stringify({
        request_id: requestId,
        event: "bulk_users_chunk",
        chunk: chunks,
        requested: chunk.length,
        returned: users.length,
      })
    );
  }

  console.log(
    JSON.stringify({
      request_id: requestId,
      event: "bulk_users_done",
      requested_total: fids.length,
      returned_total: map.size,
      chunks,
      ms: nowMs() - started,
    })
  );

  return map;
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

    const lowQualityMaxScore = getLowQualityMaxScore(req);
    const includeMissingScore = getIncludeMissingScore(req);

    console.log(
      JSON.stringify({
        request_id: requestId,
        event: "start",
        fid: userFid,
        low_quality_max_score: lowQualityMaxScore,
        include_missing_score: includeMissingScore,
      })
    );

    const { users: userProfiles }: any = await neynarClientVisible.fetchBulkUsers({ fids: [userFid] } as any);
    const userProfile = userProfiles?.[0];

    if (!userProfile) {
      console.log(JSON.stringify({ request_id: requestId, event: "profile_missing", fid: userFid }));
      return NextResponse.json({ error: "User not found", request_id: requestId }, { status: 404 });
    }

    const following = await fetchAllFollowing({ requestId, fid: userFid, viewerFid: userFid });
    const rawFollowers = await fetchAllFollowersRaw({ requestId, fid: userFid, viewerFid: userFid });

    const followingByFid = new Map<number, NeynarUserEdge>();
    const followingFids: number[] = [];

    for (const edge of following.list) {
      const f = toNumber(edge?.user?.fid);
      if (f) {
        followingByFid.set(f, edge);
        followingFids.push(f);
      }
    }

    const rawFollowerFids = new Set<number>();
    for (const edge of rawFollowers.list) {
      const f = toNumber(edge?.user?.fid);
      if (f) rawFollowerFids.add(f);
    }

    const bulkFollowingUsers = await fetchBulkUsersByFids({ requestId, fids: followingFids });

    const nonFollowersEdges: NeynarUserEdge[] = [];
    for (const [fid, edge] of followingByFid.entries()) {
      if (!rawFollowerFids.has(fid)) nonFollowersEdges.push(edge);
    }

    const filteredFollowingEdges: NeynarUserEdge[] = [];
    const reasonCounts: Record<string, number> = {
      spam_label: 0,
      low_score: 0,
      missing_score: 0,
    };

    for (const fid of followingFids) {
      const u = bulkFollowingUsers.get(fid);
      const label = getSpamLabel(u);
      const score = getScore(u);

      let isFiltered = false;

      if (isSpamLabel(label)) {
        isFiltered = true;
        reasonCounts.spam_label += 1;
      } else if (score === null) {
        if (includeMissingScore) {
          isFiltered = true;
          reasonCounts.missing_score += 1;
        }
      } else if (score < lowQualityMaxScore) {
        isFiltered = true;
        reasonCounts.low_score += 1;
      }

      if (isFiltered) {
        filteredFollowingEdges.push({ user: u });
      }
    }

    console.log(
      JSON.stringify({
        request_id: requestId,
        event: "computed",
        following: followingByFid.size,
        followers_raw: rawFollowerFids.size,
        non_followers_real: nonFollowersEdges.length,
        filtered_following: filteredFollowingEdges.length,
        reasons: reasonCounts,
      })
    );

    const response = {
      request_id: requestId,
      nonFollowers: nonFollowersEdges.map((e) => {
        const fid = toNumber(e?.user?.fid);
        const u = fid ? bulkFollowingUsers.get(fid) : undefined;
        return formatUser(u || e.user);
      }),
      filteredFollowing: filteredFollowingEdges.map((e) => formatUser(e.user)),
      filteredInvisible: filteredFollowingEdges.map((e) => formatUser(e.user)),
      stats: {
        following: following.total,
        followers_raw: rawFollowers.total,
        nonFollowersCount: nonFollowersEdges.length,
        filteredFollowingCount: filteredFollowingEdges.length,
        low_quality_max_score: lowQualityMaxScore,
        include_missing_score: includeMissingScore,
        filtered_reason_counts: reasonCounts,
      },
      userProfile: formatUser(userProfile),
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
