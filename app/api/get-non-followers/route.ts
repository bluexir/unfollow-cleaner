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
  neynar_user_score?: number;
  experimental?: {
    neynar_user_score?: number;
  };
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

function clamp01(n: number) {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function getQualityScore(u?: NeynarUser): number | null {
  if (!u) return null;

  const e = toNumber((u as any)?.experimental?.neynar_user_score);
  if (e !== null) return clamp01(e);

  const a = toNumber((u as any)?.neynar_user_score);
  if (a !== null) return clamp01(a);

  const b = toNumber((u as any)?.score);
  if (b !== null && b >= 0 && b <= 1) return b;

  return null;
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
    neynar_score: getQualityScore(u),
  };
}

function getOptionalNumber(req: NextRequest, key: string): number | null {
  const q = req.nextUrl.searchParams.get(key);
  if (q === null || q === undefined || q === "") return null;
  const n = toNumber(q);
  return n === null ? null : n;
}

function getOptionalBool(req: NextRequest, key: string, fallback: boolean) {
  const q = req.nextUrl.searchParams.get(key);
  if (!q) return fallback;
  const s = q.trim().toLowerCase();
  if (s === "1" || s === "true" || s === "yes" || s === "y") return true;
  if (s === "0" || s === "false" || s === "no" || s === "n") return false;
  return fallback;
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
    if (typeof viewerFid === "number") params.viewer_fid = viewerFid;

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
  sortType?: "desc_chron" | "algorithmic";
}) {
  const { requestId, fid, mode, viewerFid, sortType } = args;
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
    if (typeof viewerFid === "number") params.viewer_fid = viewerFid;
    if (sortType) params.sort_type = sortType;

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

async function fetchBulkUsersVisible(args: { requestId: string; fids: number[]; viewerFid?: number }) {
  const { requestId, fids, viewerFid } = args;
  const started = nowMs();

  const map = new Map<number, NeynarUser>();
  const chunks: number[][] = [];
  for (let i = 0; i < fids.length; i += 100) chunks.push(fids.slice(i, i + 100));

  let chunkIndex = 0;
  let requestedTotal = 0;
  let returnedTotal = 0;

  for (const chunk of chunks) {
    chunkIndex += 1;
    requestedTotal += chunk.length;

    const params: any = { fids: chunk.join(",") };
    if (typeof viewerFid === "number") params.viewer_fid = viewerFid;

    const resp: any = await neynarClientVisible.fetchBulkUsers(params);
    const users: NeynarUser[] = resp?.users || [];

    for (const u of users) {
      const fid = toNumber(u?.fid);
      if (fid) map.set(fid, u);
    }

    returnedTotal += users.length;

    console.log(
      JSON.stringify({
        request_id: requestId,
        event: "bulk_users_chunk",
        chunk: chunkIndex,
        requested: chunk.length,
        returned: users.length,
      })
    );
  }

  console.log(
    JSON.stringify({
      request_id: requestId,
      event: "bulk_users_done",
      requested_total: requestedTotal,
      returned_total: returnedTotal,
      chunks: chunks.length,
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

    const strictMinScoreRaw = getOptionalNumber(req, "strict_min_score");
    const strictMinScore = strictMinScoreRaw === null ? null : clamp01(strictMinScoreRaw);

    const lowQualityMaxScoreRaw = getOptionalNumber(req, "low_quality_max_score");
    const lowQualityMaxScore = lowQualityMaxScoreRaw === null ? null : clamp01(lowQualityMaxScoreRaw);

    const includeMissingScore = getOptionalBool(req, "include_missing_score", true);

    console.log(
      JSON.stringify({
        request_id: requestId,
        event: "start",
        fid: userFid,
        strict_min_score: strictMinScore,
        low_quality_max_score: lowQualityMaxScore,
        include_missing_score: includeMissingScore,
      })
    );

    const { users: userProfiles }: any = await neynarClientVisible.fetchBulkUsers({ fids: String(userFid) } as any);
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
      sortType: "desc_chron",
    });

    const visibleFollowers = await fetchAllFollowers({
      requestId,
      fid: userFid,
      mode: "visible",
      viewerFid: userFid,
      sortType: "desc_chron",
    });

    const followingByFid = new Map<number, NeynarUserEdge>();
    for (const edge of following.list) {
      const f = toNumber(edge?.user?.fid);
      if (f) followingByFid.set(f, edge);
    }

    const rawFollowersByFid = new Map<number, NeynarUserEdge>();
    for (const edge of rawFollowers.list) {
      const f = toNumber(edge?.user?.fid);
      if (f) rawFollowersByFid.set(f, edge);
    }

    const profileFollowersByFid = new Map<number, NeynarUserEdge>();
    for (const edge of visibleFollowers.list) {
      const f = toNumber(edge?.user?.fid);
      if (f) profileFollowersByFid.set(f, edge);
    }

    let profileSource: "visible_experimental" | "visible_experimental_strict" = "visible_experimental";
    if (strictMinScore !== null) {
      profileSource = "visible_experimental_strict";
      for (const [fid, edge] of Array.from(profileFollowersByFid.entries())) {
        const score = getQualityScore(edge.user);
        if (score === null) {
          profileFollowersByFid.delete(fid);
          continue;
        }
        if (score < strictMinScore) {
          profileFollowersByFid.delete(fid);
        }
      }
    }

    const followingFids = new Set<number>(followingByFid.keys());
    const rawFollowerFids = new Set<number>(rawFollowersByFid.keys());
    const profileFollowerFids = new Set<number>(profileFollowersByFid.keys());

    const nonFollowersProfileEdges: NeynarUserEdge[] = [];
    for (const [fid, edge] of followingByFid.entries()) {
      if (!profileFollowerFids.has(fid)) nonFollowersProfileEdges.push(edge);
    }

    const hiddenFollowersEdges: NeynarUserEdge[] = [];
    for (const [fid, edge] of rawFollowersByFid.entries()) {
      if (!profileFollowerFids.has(fid)) hiddenFollowersEdges.push(edge);
    }

    const hiddenMutualEdges: NeynarUserEdge[] = [];
    for (const edge of hiddenFollowersEdges) {
      const fid = toNumber(edge?.user?.fid);
      if (!fid) continue;
      if (followingFids.has(fid)) {
        hiddenMutualEdges.push(followingByFid.get(fid) || edge);
      }
    }

    let lowQualityFollowingEdges: NeynarUserEdge[] = [];
    let reasons = { low_score: 0, missing_score: 0 };
    if (lowQualityMaxScore !== null) {
      const fids = Array.from(followingByFid.keys());
      const bulk = await fetchBulkUsersVisible({ requestId, fids, viewerFid: userFid });

      for (const fid of fids) {
        const u = bulk.get(fid);
        const score = getQualityScore(u);
        if (score === null) {
          if (includeMissingScore) {
            const edge = followingByFid.get(fid);
            if (edge) lowQualityFollowingEdges.push(edge);
            reasons.missing_score += 1;
          }
          continue;
        }
        if (score <= lowQualityMaxScore) {
          const edge = followingByFid.get(fid);
          if (edge) lowQualityFollowingEdges.push(edge);
          reasons.low_score += 1;
        }
      }
    }

    console.log(
      JSON.stringify({
        request_id: requestId,
        event: "sets_ready",
        following: followingByFid.size,
        followers_raw: rawFollowerFids.size,
        followers_visible_experimental: visibleFollowers.total,
        profile_source: profileSource,
        followers_profile: profileFollowerFids.size,
        hidden_followers_total: hiddenFollowersEdges.length,
        strict_min_score: strictMinScore,
      })
    );

    console.log(
      JSON.stringify({
        request_id: requestId,
        event: "computed",
        non_followers_profile: nonFollowersProfileEdges.length,
        hidden_followers: hiddenFollowersEdges.length,
        hidden_mutuals: hiddenMutualEdges.length,
        low_quality_following: lowQualityFollowingEdges.length,
        reasons,
        low_quality_max_score: lowQualityMaxScore,
        include_missing_score: includeMissingScore,
      })
    );

    const response = {
      request_id: requestId,
      nonFollowers: nonFollowersProfileEdges.map(formatEdge),
      hiddenFollowers: hiddenFollowersEdges.map(formatEdge),
      hiddenMutuals: hiddenMutualEdges.map(formatEdge),
      lowQualityFollowing: lowQualityFollowingEdges.map(formatEdge),
      stats: {
        following: following.total,
        followers: profileFollowerFids.size,
        followers_raw: rawFollowers.total,
        followers_visible_experimental: visibleFollowers.total,
        followers_profile: profileFollowerFids.size,
        nonFollowersCount: nonFollowersProfileEdges.length,
        hiddenFollowersCount: hiddenFollowersEdges.length,
        hiddenMutualsCount: hiddenMutualEdges.length,
        lowQualityFollowingCount: lowQualityFollowingEdges.length,
        strict_min_score: strictMinScore,
        low_quality_max_score: lowQualityMaxScore,
        include_missing_score: includeMissingScore,
      },
      userProfile: {
        fid: userProfile.fid,
        username: userProfile.username,
        display_name: userProfile.display_name || userProfile.username,
        pfp_url: userProfile.pfp_url,
        neynar_score: getQualityScore(userProfile) ?? null,
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
