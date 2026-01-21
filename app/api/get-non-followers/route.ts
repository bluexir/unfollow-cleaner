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

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function toBool(v: string | null, fallback: boolean) {
  if (v === null) return fallback;
  const s = v.trim().toLowerCase();
  if (s === "1" || s === "true" || s === "yes" || s === "y") return true;
  if (s === "0" || s === "false" || s === "no" || s === "n") return false;
  return fallback;
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

function getStrictMinScoreMaybe(req: NextRequest) {
  const hasQuery = req.nextUrl.searchParams.has("strict_min_score");
  const q = req.nextUrl.searchParams.get("strict_min_score");
  const fromQuery = toNumber(q);
  if (hasQuery) return clamp01(fromQuery ?? 0);

  const fromEnv = toNumber(process.env.STRICT_MIN_SCORE);
  if (fromEnv !== null) return clamp01(fromEnv);

  return null;
}

function getLowQualityMaxScore(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("low_quality_max_score");
  const fromQuery = toNumber(q);
  if (fromQuery !== null) return clamp01(fromQuery);
  const fromEnv = toNumber(process.env.LOW_QUALITY_MAX_SCORE);
  if (fromEnv !== null) return clamp01(fromEnv);
  return 0.35;
}

function getIncludeMissingScore(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("include_missing_score");
  const fromQuery = q === null ? null : toBool(q, true);
  if (fromQuery !== null) return fromQuery;
  const fromEnv = process.env.INCLUDE_MISSING_SCORE;
  if (typeof fromEnv === "string") return toBool(fromEnv, true);
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

async function fetchBulkUsersAll(args: { requestId: string; fids: number[] }) {
  const { requestId, fids } = args;
  const started = nowMs();

  const byFid = new Map<number, NeynarUser>();
  const chunkSize = 100;
  let chunk = 0;

  for (let i = 0; i < fids.length; i += chunkSize) {
    chunk += 1;
    const part = fids.slice(i, i + chunkSize);
    const resp: any = await neynarClientVisible.fetchBulkUsers({ fids: part } as any);
    const users: NeynarUser[] = resp?.users || [];

    for (const u of users) {
      const fid = toNumber(u?.fid);
      if (fid) byFid.set(fid, u);
    }

    console.log(
      JSON.stringify({
        request_id: requestId,
        event: "bulk_users_chunk",
        chunk,
        requested: part.length,
        returned: users.length,
      })
    );
  }

  console.log(
    JSON.stringify({
      request_id: requestId,
      event: "bulk_users_done",
      requested_total: fids.length,
      returned_total: byFid.size,
      chunks: chunk,
      ms: nowMs() - started,
    })
  );

  return byFid;
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

    const strictMinScore = getStrictMinScoreMaybe(req);
    const lowQualityMaxScore = getLowQualityMaxScore(req);
    const includeMissingScore = getIncludeMissingScore(req);

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

    const following = await fetchAllFollowing({ requestId, fid: userFid, viewerFid: userFid });
    const rawFollowers = await fetchAllFollowers({ requestId, fid: userFid, mode: "raw", viewerFid: userFid });
    const visibleFollowers = await fetchAllFollowers({
      requestId,
      fid: userFid,
      mode: "visible",
      viewerFid: userFid,
    });

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
    const rawFollowersByFid = new Map<number, NeynarUserEdge>();
    for (const edge of rawFollowers.list) {
      const f = toNumber(edge?.user?.fid);
      if (f) {
        rawFollowerFids.add(f);
        rawFollowersByFid.set(f, edge);
      }
    }

    const visibleFollowerFids = new Set<number>();
    for (const edge of visibleFollowers.list) {
      const f = toNumber(edge?.user?.fid);
      if (f) visibleFollowerFids.add(f);
    }

    let profileFollowerFids = visibleFollowerFids;

    const strictVisibleFollowerFids = new Set<number>();
    const strictLabelCounts: Record<string, number> = {};
    let strictSpamRejected = 0;
    let strictScoreRejected = 0;
    let strictMissingScore = 0;

    if (strictMinScore !== null) {
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
      }

      profileFollowerFids = strictVisibleFollowerFids;
    }

    const nonFollowersRealEdges: NeynarUserEdge[] = [];
    for (const [fid, edge] of followingByFid.entries()) {
      if (!rawFollowerFids.has(fid)) nonFollowersRealEdges.push(edge);
    }

    const nonFollowersProfileEdges: NeynarUserEdge[] = [];
    for (const [fid, edge] of followingByFid.entries()) {
      if (!profileFollowerFids.has(fid)) nonFollowersProfileEdges.push(edge);
    }

    const hiddenFollowerFids = new Set<number>();
    for (const fid of rawFollowerFids.values()) {
      if (!profileFollowerFids.has(fid)) hiddenFollowerFids.add(fid);
    }

    const hiddenFollowersEdges: NeynarUserEdge[] = [];
    for (const fid of hiddenFollowerFids.values()) {
      const e = rawFollowersByFid.get(fid);
      if (e) hiddenFollowersEdges.push(e);
    }

    const hiddenMutualEdges: NeynarUserEdge[] = [];
    for (const [fid] of followingByFid.entries()) {
      if (hiddenFollowerFids.has(fid)) {
        const followerEdge = rawFollowersByFid.get(fid);
        if (followerEdge) hiddenMutualEdges.push(followerEdge);
      }
    }

    const followingUsersByFid = await fetchBulkUsersAll({ requestId, fids: followingFids });

    const filteredFollowingEdges: NeynarUserEdge[] = [];
    const reasons = { spam_label: 0, low_score: 0, missing_score: 0 };

    for (const [fid, edge] of followingByFid.entries()) {
      const u = followingUsersByFid.get(fid);
      const label = getSpamLabel(u);
      const score = getScore(u);

      const spamHit = isSpamLabel(label);
      const missingHit = score === null && includeMissingScore;
      const lowHit = score !== null && score <= lowQualityMaxScore;

      if (spamHit || missingHit || lowHit) {
        if (spamHit) reasons.spam_label += 1;
        else if (missingHit) reasons.missing_score += 1;
        else if (lowHit) reasons.low_score += 1;

        filteredFollowingEdges.push({
          user: {
            ...(edge.user || {}),
            score: u?.score ?? (edge.user as any)?.score,
            experimental: u?.experimental ?? (edge.user as any)?.experimental,
            spam_label: (u as any)?.spam_label ?? (edge.user as any)?.spam_label,
            spam_label_score: (u as any)?.spam_label_score ?? (edge.user as any)?.spam_label_score,
          },
        });
      }
    }

    console.log(
      JSON.stringify({
        request_id: requestId,
        event: "sets_ready",
        following: followingByFid.size,
        followers_raw: rawFollowerFids.size,
        followers_visible_experimental: visibleFollowerFids.size,
        profile_source: strictMinScore !== null ? "strict" : "visible_experimental",
        followers_profile: profileFollowerFids.size,
        hidden_followers_total: hiddenFollowerFids.size,
        strict_min_score: strictMinScore,
        strict_spam_rejected: strictSpamRejected,
        strict_score_rejected: strictScoreRejected,
        strict_missing_score: strictMissingScore,
        strict_labels: strictLabelCounts,
      })
    );

    console.log(
      JSON.stringify({
        request_id: requestId,
        event: "computed",
        non_followers_real: nonFollowersRealEdges.length,
        non_followers_profile: nonFollowersProfileEdges.length,
        hidden_followers: hiddenFollowersEdges.length,
        hidden_mutuals: hiddenMutualEdges.length,
        filtered_following: filteredFollowingEdges.length,
        reasons,
        low_quality_max_score: lowQualityMaxScore,
        include_missing_score: includeMissingScore,
      })
    );

    const response = {
      request_id: requestId,
      nonFollowersReal: nonFollowersRealEdges.map(formatEdge),
      nonFollowersProfile: nonFollowersProfileEdges.map(formatEdge),
      hiddenFollowers: hiddenFollowersEdges.map(formatEdge),
      hiddenMutuals: hiddenMutualEdges.map(formatEdge),
      filteredFollowing: filteredFollowingEdges.map(formatEdge),
      stats: {
        following: followingByFid.size,
        followers_raw: rawFollowerFids.size,
        followers_visible_experimental: visibleFollowerFids.size,
        followers_profile: profileFollowerFids.size,
        hidden_followers_total: hiddenFollowerFids.size,
        nonFollowersRealCount: nonFollowersRealEdges.length,
        nonFollowersProfileCount: nonFollowersProfileEdges.length,
        hiddenFollowersCount: hiddenFollowersEdges.length,
        hiddenMutualsCount: hiddenMutualEdges.length,
        filteredFollowingCount: filteredFollowingEdges.length,
        profile_source: strictMinScore !== null ? "strict" : "visible_experimental",
        strict_min_score: strictMinScore,
        strict_spam_rejected: strictSpamRejected,
        strict_score_rejected: strictScoreRejected,
        strict_missing_score: strictMissingScore,
        low_quality_max_score: lowQualityMaxScore,
        include_missing_score: includeMissingScore,
        filteredFollowingReasons: reasons,
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
