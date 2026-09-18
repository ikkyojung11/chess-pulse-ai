import { NextRequest, NextResponse } from "next/server";

const USER_AGENT = "ChessPulseAI/1.0 (contact: support@chesspulse.ai)";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username")?.trim().toLowerCase();

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  try {
    // Fetch monthly archives list
    const archivesRes = await fetch(
      `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/archives`,
      {
        headers: {
          "User-Agent": USER_AGENT,
        },
        next: { revalidate: 60 },
      }
    );

    if (!archivesRes.ok) {
      if (archivesRes.status === 404) {
        return NextResponse.json(
          { error: "Chess.com 사용자를 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `Chess.com API 오류: ${archivesRes.status}` },
        { status: archivesRes.status }
      );
    }

    const archivesData = await archivesRes.json();
    const archives: string[] = archivesData.archives || [];

    if (archives.length === 0) {
      return NextResponse.json({ games: [] });
    }

    // Get the most recent month archive, or last two if recent has few games
    const recentArchiveUrls = archives.slice(-2);
    let allGames: any[] = [];

    for (let i = recentArchiveUrls.length - 1; i >= 0; i--) {
      const url = recentArchiveUrls[i];
      const monthRes = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        next: { revalidate: 60 },
      });

      if (monthRes.ok) {
        const monthData = await monthRes.json();
        const games = monthData.games || [];
        allGames = [...games, ...allGames];
        if (allGames.length >= 25) break;
      }
    }

    // Map into simplified game objects
    const formattedGames = allGames
      .filter((g) => g.rules === "chess" && g.pgn)
      .slice(-30) // up to 30 recent games
      .reverse() // latest first
      .map((g, idx) => ({
        id: g.url ? g.url.split("/").pop() || idx.toString() : idx.toString(),
        url: g.url,
        white: {
          username: g.white.username,
          rating: g.white.rating,
          result: g.white.result,
        },
        black: {
          username: g.black.username,
          rating: g.black.rating,
          result: g.black.result,
        },
        time_control: g.time_control,
        time_class: g.time_class, // bullet, blitz, rapid, daily
        end_time: g.end_time ? new Date(g.end_time * 1000).toISOString() : null,
        pgn: g.pgn,
      }));

    return NextResponse.json({ games: formattedGames });
  } catch (err: any) {
    console.error("Chess.com fetch error:", err);
    return NextResponse.json(
      { error: "대국 정보를 가져오는 도중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
