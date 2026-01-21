export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { neynarClientRaw, neynarClientVisible } from "@/lib/neynar";

type NeynarUserEdge = {
  user?: {
    fid?: number;
    username?: string;
    display_name?: string;
    pfp_url?: string;
    follower_count?: number;
    power_badge?: boolean;
    score?: number;
    experimental?: {
      neynar_user_score?: number;
    };
  };
};

function nowMs() {
  return Date.now();
}

function safeNumber(n: any): number | null {
  const v = Number(n);
  return Number.isFinite(v) ? v : null;
}

function formatEdge(edge: NeynarUserEdge) {
  const user = edge.user || {};
  return {
    fid: user.fid,
    username: user.username,
    display_name: user.display_name || user.username,
    pfp_url: user.pfp_url,
    follower_count: user.follower_count || 0,
    power_badge: user.power_badge || false,
    neynar_score: user.score || user.experimental?.neynar_user_score || null,
  };
}

async function fetchAllFollowing(args: { requestId: string; fid: number }) {
  const { requestId, fid } = args;
  const started = nowMs();

  let cursor: string | null = null;
  let total = 0;
  let pages = 0;
  const list: NeynarUserEdge[] = [];

  do {
    pages += 1;

    const resp: any = await neynarClientRaw.fetchUserFollowing({
      fid,
      limit: 100,
      ...(cursor && { cursor }),
    } as any);

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

    const params: any = {
      fid,
      limit: 100,
      ...(cursor && { cursor }),
    };

    // Bazı SDK sürümlerinde camelCase / snake_case farkı olabiliyor.
    // İkisini de gönderiyoruz; SDK hangisini destekliyorsa onu kullanacaktır.
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
    const searchParams = req.nextUrl.searchParams;
    const fidStr = searchParams.get("fid");

    const userFid = safeNumber(fidStr);
    if (!userFid) {
      console.log(
        JSON.stringify({
          request_id: requestId,
          event: "bad_request",
          reason: "missing_fid",
        })
      );
      return NextResponse.json(
        { error: "FID required", request_id: requestId },
        { status: 400 }
      );
    }

    console.log(
      JSON.stringify({
        request_id: requestId,
        event: "start",
        fid: userFid,
      })
    );

    // 0) User profile (score/pp) - visible client kullanıyoruz (daha zengin alanlar dönebiliyor)
    const { users: userProfiles }: any = await neynarClientVisible.fetchBulkUsers(
      { fids: [userFid] } as any
    );

    const userProfile = userProfiles?.[0];
    if (!userProfile) {
      console.log(
        JSON.stringify({
          request_id: requestId,
          event: "profile_missing",
          fid: userFid,
        })
      );
      return NextResponse.json(
        { error: "User not found", request_id: requestId },
        { status: 404 }
      );
    }

    // 1) Following (raw)
    const following = await fetchAllFollowing({ requestId, fid: userFid });

    // 2a) Followers RAW (ham)
    const rawFollowers = await fetchAllFollowers({
      requestId,
      fid: userFid,
      mode: "raw",
    });

    // 2b) Followers VISIBLE (client-visible)
    // viewerFid: kullanıcının kendi fid'i ile "kendi profil görünümü"ne yaklaşmak için
    const visibleFollowers = await fetchAllFollowers({
      requestId,
      fid: userFid,
      mode: "visible",
      viewerFid: userFid,
    });

    // 3) Set'ler
    const followingByFid = new Map<number, NeynarUserEdge>();
    for (const edge of following.list) {
      const f = safeNumber(edge?.user?.fid);
      if (f) followingByFid.set(f, edge);
    }

    const rawFollowerFids = new Set<number>();
    for (const edge of rawFollowers.list) {
      const f = safeNumber(edge?.user?.fid);
      if (f) rawFollowerFids.add(f);
    }

    const visibleFollowerFids = new Set<number>();
    for (const edge of visibleFollowers.list) {
      const f = safeNumber(edge?.user?.fid);
      if (f) visibleFollowerFids.add(f);
    }

    console.log(
      JSON.stringify({
        request_id: requestId,
        event: "sets_ready",
        following: followingByFid.size,
        followers_raw: rawFollowerFids.size,
        followers_visible: visibleFollowerFids.size,
      })
    );

    // 4) Liste 1: Geri takip etmeyenler (client-visible bazlı)
    const nonFollowersVisibleEdges: NeynarUserEdge[] = [];
    for (const [fid, edge] of followingByFid.entries()) {
      if (!visibleFollowerFids.has(fid)) nonFollowersVisibleEdges.push(edge);
    }

    // 5) Liste 2: Farcaster tarafından görünür olmayan (filtreli) hesaplar
    // = following ∩ (rawFollowers - visibleFollowers)
    const filteredInvisibleEdges: NeynarUserEdge[] = [];
    for (const edge of nonFollowersVisibleEdges) {
      const f = safeNumber(edge?.user?.fid);
      if (f && rawFollowerFids.has(f) && !visibleFollowerFids.has(f)) {
        filteredInvisibleEdges.push(edge);
      }
    }

    console.log(
      JSON.stringify({
        request_id: requestId,
        event: "computed",
        non_followers_visible: nonFollowersVisibleEdges.length,
        filtered_invisible: filteredInvisibleEdges.length,
      })
    );
    
    const formattedNonFollowers = nonFollowersVisibleEdges.map(formatEdge);
    const formattedFilteredInvisible = filteredInvisibleEdges.map(formatEdge);

    const response = {
      request_id: requestId,
      nonFollowers: formattedNonFollowers,
      // Yeni sekme için:
      filteredInvisible: formattedFilteredInvisible,
      stats: {
        following: following.total,
        // Geriye dönük alan: UI bunu kullanıyor
        followers: visibleFollowers.total,
        nonFollowersCount: nonFollowersVisibleEdges.length,
        // Yeni alanlar:
        followers_visible: visibleFollowers.total,
        followers_raw: rawFollowers.total,
        filteredInvisibleCount: filteredInvisibleEdges.length,
      },
      userProfile: {
        fid: userProfile.fid,
        username: userProfile.username,
        display_name: userProfile.display_name || userProfile.username,
        pfp_url: userProfile.pfp_url,
        neynar_score:
          userProfile.score ||
          userProfile.experimental?.neynar_user_score ||
          null,
      },
    };

    console.log(
      JSON.stringify({
        request_id: requestId,
        event: "done",
        ms: nowMs() - started,
      })
    );

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
    return NextResponse.json(
      { error: error?.message || "Failed to fetch list", request_id: requestId },
      { status: 500 }
    );
  }
}
