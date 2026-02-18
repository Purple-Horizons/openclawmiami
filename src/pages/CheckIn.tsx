import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchCheckinStats,
  lookupAttendee,
  registerWalkIn,
  submitCheckin,
  type StatsResponse,
} from "@/lib/checkin-api";

type LookupState = {
  found: boolean;
  name: string;
  alreadyCheckedIn: boolean;
};

const EMPTY_STATS: StatsResponse = {
  deployedYes: 0,
  deployedNo: 0,
  total: 0,
  obstacles: [],
  topThemes: [],
};

const CheckIn = () => {
  const [email, setEmail] = useState("");
  const [lookupState, setLookupState] = useState<LookupState | null>(null);
  const [registrationNeeded, setRegistrationNeeded] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [referredBy, setReferredBy] = useState("");

  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hasDeployedAgent, setHasDeployedAgent] = useState<boolean | null>(null);
  const [obstacle, setObstacle] = useState("");

  const [stats, setStats] = useState<StatsResponse>(EMPTY_STATS);
  const [showStats, setShowStats] = useState(false);

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

  async function loadStats() {
    const snapshot = await fetchCheckinStats();
    setStats(snapshot);
    setShowStats(true);
  }

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLookupState(null);
    setRegistrationNeeded(false);
    setShowStats(false);

    const trimmedEmail = email.trim();
    if (!trimmedEmail.includes("@")) {
      setError("Enter a valid email to check in.");
      return;
    }

    setIsLookupLoading(true);
    try {
      const result = await lookupAttendee(trimmedEmail);
      if (!result.found) {
        setRegistrationNeeded(true);
        setError(
          "No RSVP found. Bold move. Very main character. Drop your info below and we’ll pretend this was always the plan.",
        );
        return;
      }

      const nextLookupState = {
        found: true,
        name: result.name ?? "Attendee",
        alreadyCheckedIn: Boolean(result.alreadyCheckedIn),
      };

      setLookupState(nextLookupState);
      setHasDeployedAgent(null);
      setObstacle("");

      if (nextLookupState.alreadyCheckedIn) {
        await loadStats();
      }
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : "Unable to find attendee.");
    } finally {
      setIsLookupLoading(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim().includes("@")) {
      setError("Enter a valid email before registering.");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please add first and last name.");
      return;
    }

    setIsRegisterLoading(true);

    try {
      const result = await registerWalkIn({
        firstName,
        lastName,
        email,
        referredBy,
      });

      setLookupState({
        found: true,
        name: result.name,
        alreadyCheckedIn: Boolean(result.alreadyCheckedIn),
      });
      setRegistrationNeeded(false);

      if (result.alreadyCheckedIn) {
        await loadStats();
      }
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "Unable to register attendee.");
    } finally {
      setIsRegisterLoading(false);
    }
  }

  async function handleCheckIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!lookupState?.found) {
      return;
    }

    if (hasDeployedAgent === null) {
      setError("Please answer whether you deployed an OpenClaw agent yet.");
      return;
    }

    if (hasDeployedAgent && !obstacle.trim()) {
      setError("Please add your biggest obstacle before checking in.");
      return;
    }

    setError(null);
    setIsSubmitLoading(true);

    try {
      await submitCheckin({
        email,
        deployedAgent: hasDeployedAgent,
        obstacle,
      });
      await loadStats();
      setLookupState((previous) =>
        previous
          ? {
              ...previous,
              alreadyCheckedIn: true,
            }
          : previous,
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to complete check-in.");
    } finally {
      setIsSubmitLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-glow" />
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full bg-primary/10 blur-[120px]" />

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">OpenClaw Miami</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mt-3">
            Self <span className="text-gradient-sunset">Check-In</span>
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Scan your QR code, then use the email you used on your Lu.ma RSVP to check in.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-card/80 backdrop-blur border-primary/20">
            <CardHeader>
              <CardTitle>Email Lookup</CardTitle>
              <CardDescription>Use the same email from your Lu.ma RSVP.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLookup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={isLookupLoading}>
                  {isLookupLoading ? "Searching..." : "Find attendee"}
                </Button>
              </form>

              {lookupState?.found && (
                <div className="mt-5 rounded-md border border-accent/30 bg-accent/10 p-3 text-sm">
                  {lookupState.name && lookupState.name !== "Attendee"
                    ? `Attendee found: ${lookupState.name}`
                    : "Attendee found. You are on the list."}
                </div>
              )}

              {error && <div className="mt-4 text-sm text-destructive">{error}</div>}
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur border-primary/20">
            <CardHeader>
              <CardTitle>{registrationNeeded ? "Quick Registration" : "Check-In Questions"}</CardTitle>
              <CardDescription>
                {registrationNeeded
                  ? "No RSVP on file. Let’s do the 20-second origin story and get you in."
                  : "Answer these and tap check in."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {registrationNeeded ? (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First name</Label>
                      <Input
                        id="first-name"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last name</Label>
                      <Input
                        id="last-name"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referred-by">Who referred you?</Label>
                    <Input
                      id="referred-by"
                      value={referredBy}
                      onChange={(event) => setReferredBy(event.target.value)}
                      placeholder="Friend, Discord, X, etc."
                    />
                  </div>

                  <Button type="submit" variant="hero" className="w-full" disabled={isRegisterLoading}>
                    {isRegisterLoading ? "Registering..." : "Register and continue"}
                  </Button>
                </form>
              ) : !lookupState?.found ? (
                <p className="text-sm text-muted-foreground">Find your attendee record first.</p>
              ) : lookupState.alreadyCheckedIn ? (
                <p className="text-sm text-accent">You are already checked in. Thanks for being here.</p>
              ) : (
                <form onSubmit={handleCheckIn} className="space-y-5">
                  <div className="space-y-3">
                    <Label>Have you deployed an OpenClaw agent yet?</Label>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        variant={hasDeployedAgent === true ? "hero" : "outline"}
                        onClick={() => setHasDeployedAgent(true)}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant={hasDeployedAgent === false ? "hero" : "outline"}
                        onClick={() => setHasDeployedAgent(false)}
                      >
                        No
                      </Button>
                    </div>
                  </div>

                  {hasDeployedAgent && (
                    <div className="space-y-2">
                      <Label htmlFor="obstacle">If yes, what is your biggest obstacle?</Label>
                      <Textarea
                        id="obstacle"
                        value={obstacle}
                        onChange={(event) => setObstacle(event.target.value)}
                        placeholder="Share the one blocker you want solved today"
                        maxLength={240}
                        required
                      />
                    </div>
                  )}

                  <Button type="submit" variant="hero" className="w-full" disabled={isSubmitLoading}>
                    {isSubmitLoading ? "Checking in..." : "Check in"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {showStats && (
          <Card className="mt-6 bg-card/80 backdrop-blur border-primary/20">
            <CardHeader>
              <CardTitle>Live Event Snapshot</CardTitle>
              <CardDescription>
                Anonymous responses only. Total check-ins: <strong>{stats.total}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-md border border-border p-4">
                  <div className="text-sm text-muted-foreground">Deployed an agent</div>
                  <div className="text-2xl font-display font-bold mt-1">{stats.deployedYes}</div>
                  <div className="text-xs text-muted-foreground mt-1">{yesPercent}% of check-ins</div>
                </div>
                <div className="rounded-md border border-border p-4">
                  <div className="text-sm text-muted-foreground">Not yet deployed</div>
                  <div className="text-2xl font-display font-bold mt-1">{stats.deployedNo}</div>
                  <div className="text-xs text-muted-foreground mt-1">{noPercent}% of check-ins</div>
                </div>
              </div>

              <div>
                <h2 className="font-display text-lg">Biggest obstacles people reported</h2>
                {stats.obstacles.length ? (
                  <ul className="mt-3 space-y-2">
                    {stats.obstacles.map((item, index) => (
                      <li key={`${item}-${index}`} className="rounded-md border border-border/80 bg-background/40 px-3 py-2 text-sm">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">No obstacles submitted yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default CheckIn;
