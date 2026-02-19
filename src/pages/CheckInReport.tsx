import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchCheckinReport, type CheckinReportRow } from "@/lib/checkin-api";

function csvCell(value: string | number | boolean) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, "\"\"")}"`;
}

function buildCsv(rows: CheckinReportRow[]) {
  const header = [
    "Name",
    "Email",
    "DeployedAgent",
    "Obstacle",
    "ReferredBy",
    "Source",
    "CheckedInAt",
    "GeneratedImageUrl",
    "GeneratedShareUrl",
  ];

  const lines = rows.map((row) =>
    [
      csvCell(row.name),
      csvCell(row.email),
      csvCell(row.deployedAgent ? "Yes" : "No"),
      csvCell(row.obstacle),
      csvCell(row.referredBy),
      csvCell(row.source),
      csvCell(row.checkedInAt),
      csvCell(row.generatedImageUrl ?? ""),
      csvCell(row.generatedShareUrl ?? ""),
    ].join(","),
  );

  return [header.join(","), ...lines].join("\n");
}

const CheckInReport = () => {
  const [token, setToken] = useState("");
  const [rows, setRows] = useState<CheckinReportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function downloadCsv() {
    const csv = buildCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `openclaw-checkins-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function loadReport(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const trimmedToken = token.trim();
      if (!trimmedToken) {
        setError("Report token is required.");
        setIsLoading(false);
        return;
      }

      const report = await fetchCheckinReport(trimmedToken);
      setRows(report.rows);
      setTotal(report.total);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load report");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-glow" />
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <Card className="bg-card/80 backdrop-blur border-primary/20">
          <CardHeader>
            <CardTitle>Check-In Report</CardTitle>
            <CardDescription>Who checked in, with survey responses and referral source.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={loadReport} className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="w-full sm:max-w-sm space-y-2">
                <Label htmlFor="report-token">Report token</Label>
                <Input
                  id="report-token"
                  type="password"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="Enter CHECKIN_REPORT_TOKEN"
                />
              </div>
              <Button type="submit" variant="hero" disabled={isLoading}>
                {isLoading ? "Loading..." : "Load report"}
              </Button>
            </form>

            <div className="mt-4 text-sm text-muted-foreground">Total checked in: {total}</div>
            {error && <div className="mt-2 text-sm text-destructive">{error}</div>}
            {!!rows.length && (
              <div className="mt-3">
                <Button type="button" variant="outline" onClick={downloadCsv}>
                  Download CSV
                </Button>
              </div>
            )}

            <div className="mt-4 overflow-x-auto rounded-md border border-border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Email</th>
                    <th className="text-left px-3 py-2">Deployed</th>
                    <th className="text-left px-3 py-2">Obstacle</th>
                    <th className="text-left px-3 py-2">Referred by</th>
                    <th className="text-left px-3 py-2">Source</th>
                    <th className="text-left px-3 py-2">Checked in at</th>
                    <th className="text-left px-3 py-2">Generated image</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`${row.email}-${row.checkedInAt}`} className="border-t border-border/70 align-top">
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2">{row.email}</td>
                      <td className="px-3 py-2">{row.deployedAgent ? "Yes" : "No"}</td>
                      <td className="px-3 py-2 max-w-xs whitespace-pre-wrap">{row.obstacle || "-"}</td>
                      <td className="px-3 py-2">{row.referredBy || "-"}</td>
                      <td className="px-3 py-2">{row.source}</td>
                      <td className="px-3 py-2">{row.checkedInAt}</td>
                      <td className="px-3 py-2 break-all">
                        {row.generatedImageUrl ? (
                          <a
                            className="text-primary underline-offset-2 hover:underline"
                            href={row.generatedImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {row.generatedImageUrl}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td className="px-3 py-4 text-muted-foreground" colSpan={8}>
                        No check-ins yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CheckInReport;
