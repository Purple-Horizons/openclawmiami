import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCheckinStats, type StatsResponse } from "@/lib/checkin-api";

const EMPTY_STATS: StatsResponse = {
  deployedYes: 0,
  deployedNo: 0,
  total: 0,
  obstacles: [],
  topThemes: [],
};

const REFRESH_MS = 10000;

const CheckInSnapshot = () => {
  const [stats, setStats] = useState<StatsResponse>(EMPTY_STATS);
  const [error, setError] = useState<string | null>(null);

  const yesPercent = useMemo(() => {
    if (!stats.total) {
      return 0;
    }
    return Math.round((stats.deployedYes / stats.total) * 100);
  }, [stats.deployedYes, stats.total]);

  const noPercent = useMemo(() => {
    if (!stats.total) {
      return 0;
    }
    return Math.round((stats.deployedNo / stats.total) * 100);
  }, [stats.deployedNo, stats.total]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const snapshot = await fetchCheckinStats();
        if (!mounted) {
          return;
        }
        setStats(snapshot);
        setError(null);
      } catch (loadError) {
        if (!mounted) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load snapshot");
      }
    };

    run();
    const timer = window.setInterval(run, REFRESH_MS);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-glow" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full bg-primary/10 blur-[160px]" />

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <Card className="bg-card/80 backdrop-blur border-primary/20">
          <CardHeader>
            <CardTitle className="text-3xl font-display">Live Event Snapshot</CardTitle>
            <CardDescription>
              Auto-refresh every {Math.floor(REFRESH_MS / 1000)} seconds. Anonymous responses only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-4">
                <div className="text-sm text-muted-foreground">Total check-ins</div>
                <div className="text-4xl font-display font-bold mt-1">{stats.total}</div>
              </div>
              <div className="rounded-lg border border-border p-4">
                <div className="text-sm text-muted-foreground">Deployed</div>
                <div className="text-4xl font-display font-bold mt-1">{stats.deployedYes}</div>
                <div className="text-xs text-muted-foreground mt-1">{yesPercent}%</div>
              </div>
              <div className="rounded-lg border border-border p-4">
                <div className="text-sm text-muted-foreground">Not deployed yet</div>
                <div className="text-4xl font-display font-bold mt-1">{stats.deployedNo}</div>
                <div className="text-xs text-muted-foreground mt-1">{noPercent}%</div>
              </div>
            </div>

            <div>
              <h2 className="font-display text-xl">Top 3 themes from attendee blockers</h2>
              {stats.topThemes?.length ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {stats.topThemes.slice(0, 3).map((item) => (
                    <div key={item.theme} className="rounded-md border border-border/80 bg-background/40 px-3 py-3">
                      <div className="text-sm text-muted-foreground">Theme</div>
                      <div className="font-display text-lg mt-1">{item.theme}</div>
                      <div className="text-xs text-muted-foreground mt-2">{item.count} mentions</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">Not enough responses to group themes yet.</p>
              )}
            </div>

            <div>
              <h2 className="font-display text-xl">Questions and obstacles from attendees</h2>
              {stats.obstacles.length ? (
                <div className="mt-3 max-h-[22rem] overflow-y-auto pr-1">
                  <ul className="space-y-2">
                    {stats.obstacles.map((item, index) => (
                      <li key={`${item}-${index}`} className="rounded-md border border-border/80 bg-background/40 px-3 py-2 text-base">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">No questions submitted yet.</p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CheckInSnapshot;
