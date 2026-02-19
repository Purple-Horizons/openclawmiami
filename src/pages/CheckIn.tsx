import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchCheckinImageJob, lookupAttendee, registerWalkIn, startCheckinImageJob, submitCheckin } from "@/lib/checkin-api";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

type LookupState = {
  found: boolean;
  name: string;
  alreadyCheckedIn: boolean;
};

type SuccessState = {
  name: string;
  checkedInAt: string;
};

type ImageState = {
  jobId: string;
  status: "queued" | "completed" | "failed";
  imageUrl: string;
  error: string;
};

const CONFETTI_COLORS = ["#22c55e", "#14b8a6", "#f97316", "#ec4899", "#facc15", "#60a5fa"];

function toTitleCase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function toAbsoluteUrl(value: string) {
  if (!value) {
    return "";
  }
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  if (typeof window === "undefined") {
    return value;
  }
  return `${window.location.origin}${value}`;
}

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
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [imageState, setImageState] = useState<ImageState | null>(null);

  useEffect(() => {
    if (!imageState?.jobId || imageState.status !== "queued") {
      return;
    }

    const timer = window.setInterval(async () => {
      try {
        const latest = await fetchCheckinImageJob(imageState.jobId);
        if (latest.status === "completed") {
          setImageState({
            jobId: imageState.jobId,
            status: "completed",
            imageUrl: latest.imageProxyUrl ?? latest.imageUrl ?? "",
            error: "",
          });
        } else if (latest.status === "failed") {
          setImageState({
            jobId: imageState.jobId,
            status: "failed",
            imageUrl: "",
            error: latest.error ?? "Image generation failed.",
          });
        }
      } catch {
        // Keep polling; transient failures are expected.
      }
    }, 2200);

    return () => window.clearInterval(timer);
  }, [imageState?.jobId, imageState?.status]);

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLookupState(null);
    setRegistrationNeeded(false);
    setSuccess(null);

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
          "No Lu.ma RSVP found yet. Side quest unlocked. Enter your details below so we can patch you into the matrix. 🤖",
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
      const result = await submitCheckin({
        email,
        deployedAgent: hasDeployedAgent,
        obstacle,
      });
      setSuccess({
        name: toTitleCase(lookupState.name || "Attendee"),
        checkedInAt: result.checkedInAt ?? new Date().toISOString(),
      });
      try {
        const job = await startCheckinImageJob(toTitleCase(lookupState.name || "Builder"));
        setImageState({
          jobId: job.jobId,
          status: "queued",
          imageUrl: "",
          error: "",
        });
      } catch {
        setImageState({
          jobId: "",
          status: "failed",
          imageUrl: "",
          error: "We checked you in, but the share image generator is taking a coffee break.",
        });
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to complete check-in.");
    } finally {
      setIsSubmitLoading(false);
    }
  }

  if (success) {
    const shareImageUrl = toAbsoluteUrl(imageState?.imageUrl ?? "");
    const downloadName = `openclawmiami-${toSlug(success.name) || "attendee"}.png`;

    return (
      <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-glow" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full bg-green-500/20 blur-[140px]" />

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 36 }).map((_, index) => (
            <motion.div
              key={index}
              className="absolute h-2 w-2 rounded-sm"
              style={{
                left: `${(index * 17) % 100}%`,
                backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
              }}
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: [0, 460], opacity: [0, 1, 1, 0], rotate: [0, 180, 360] }}
              transition={{
                duration: 2.6 + (index % 7) * 0.2,
                repeat: Infinity,
                ease: "easeIn",
                delay: (index % 9) * 0.12,
              }}
            />
          ))}
        </div>

        <main className="relative z-10 min-h-screen flex items-center justify-center px-6 py-10">
          <Card className="w-full max-w-2xl bg-card/85 backdrop-blur border-green-400/50 shadow-[0_0_60px_rgba(34,197,94,0.22)] text-center">
            <CardHeader className="items-center">
              <div className="rounded-full bg-green-500/20 p-4 border border-green-400/60">
                <CheckCircle2 className="h-16 w-16 text-green-400" />
              </div>
              <CardTitle className="font-display text-4xl sm:text-5xl mt-4 text-green-300">Checked In</CardTitle>
              <CardDescription className="text-base sm:text-lg text-foreground/90">
                <span className="font-display text-2xl text-foreground">{success.name}</span>
              </CardDescription>
              <p className="text-sm text-muted-foreground mt-2">Show this screen to the team at the door.</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <p className="text-xs text-muted-foreground">
                Verified at {new Date(success.checkedInAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </p>
              <div className="w-full max-w-sm">
                {imageState?.status === "completed" && imageState.imageUrl ? (
                  <motion.div
                    className="relative mx-auto w-full aspect-square rounded-2xl overflow-hidden border border-primary/50 shadow-[0_45px_140px_rgba(34,197,94,0.36)]"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1, y: [0, -5, 0] }}
                    transition={{ duration: 0.45, y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" } }}
                    whileHover={{ rotateX: 14, rotateY: -14, scale: 1.04 }}
                    style={{ transformStyle: "preserve-3d", perspective: 1200 }}
                  >
                    <motion.div
                      className="pointer-events-none absolute inset-0 rounded-2xl"
                      style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35), inset 0 0 36px rgba(34,197,94,0.35)" }}
                      initial={{ opacity: 0.55 }}
                      animate={{ opacity: [0.45, 0.78, 0.45] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <img src={imageState.imageUrl} alt={`${success.name} OpenClaw check-in`} className="h-full w-full object-cover" />
                    <motion.div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(120deg, rgba(255,255,255,0) 28%, rgba(255,255,255,0.34) 50%, rgba(255,255,255,0) 72%)",
                      }}
                      initial={{ x: "-120%" }}
                      animate={{ x: "130%" }}
                      transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
                    />
                  </motion.div>
                ) : (
                  <div className="mx-auto w-full aspect-square rounded-2xl border border-primary/25 bg-background/50 flex flex-col items-center justify-center gap-3 px-6">
                    <div className="h-10 w-10 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
                    <p className="text-sm text-muted-foreground text-center">
                      Something special is being generated...
                    </p>
                    {imageState?.status === "failed" && (
                      <p className="text-xs text-destructive text-center">{imageState.error || "Image generation failed."}</p>
                    )}
                  </div>
                )}
              </div>

              {imageState?.status === "completed" && imageState.imageUrl && (
                <div className="flex flex-wrap justify-center gap-3">
                  <Button variant="hero" asChild>
                    <a href={imageState.imageUrl} download={downloadName}>
                      Download Image
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareImageUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Share on LinkedIn
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a
                      href={`https://x.com/intent/tweet?text=${encodeURIComponent(`Checked in at OpenClaw Miami with ${success.name} 🦞`)}&url=${encodeURIComponent(shareImageUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Share on X
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
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

              {error && registrationNeeded && !lookupState?.found ? (
                <div className="mt-4 rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
                  <span className="mr-1" aria-hidden="true">🦞</span>
                  {error}
                </div>
              ) : error ? (
                <div className="mt-4 text-sm text-destructive">{error}</div>
              ) : null}
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

      </main>
    </div>
  );
};

export default CheckIn;
