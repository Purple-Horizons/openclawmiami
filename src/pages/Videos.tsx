import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import StickyHeader from "@/components/StickyHeader";
import Footer from "@/components/Footer";

type VideoItem = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  url: string;
  thumbnail: string;
};

type VideosResponse = {
  channelId: string;
  channelHandle: string;
  channelTitle: string;
  videos: VideoItem[];
  error?: string;
  message?: string;
};

async function fetchVideos(): Promise<VideosResponse> {
  const response = await fetch("/api/youtube/feed?handle=OpenClawMiami");
  const payload = (await response.json()) as VideosResponse;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to fetch channel videos");
  }

  return payload;
}

function formatDate(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

const Videos = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["youtube-feed", "OpenClawMiami"],
    queryFn: fetchVideos,
    staleTime: 1000 * 60 * 10,
  });

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader />
      <main className="pt-28 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center">
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              OpenClaw <span className="text-gradient-sunset">Videos</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Latest uploads from {data?.channelHandle ?? "@OpenClawMiami"}. Watch demos, talks, and meetup recaps.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="hero" size="sm" asChild>
                <a href="https://www.youtube.com/@OpenClawMiami" target="_blank" rel="noopener noreferrer">
                  Visit YouTube Channel
                </a>
              </Button>
              <Button variant="hero-outline" size="sm" asChild>
                <a href="https://youtu.be/gGHBeFWV8sY" target="_blank" rel="noopener noreferrer">
                  Featured Video
                </a>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading channel videos...</p>
          ) : null}

          {isError ? (
            <p className="text-center text-destructive">{error instanceof Error ? error.message : "Failed to load videos."}</p>
          ) : null}

          {data?.videos?.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.videos.map((video) => (
                <article key={video.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <a href={video.url} target="_blank" rel="noopener noreferrer" className="block">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      loading="lazy"
                      className="w-full aspect-video object-cover"
                    />
                  </a>
                  <div className="p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{formatDate(video.publishedAt)}</p>
                    <h2 className="font-display font-semibold leading-tight line-clamp-2 mb-2">{video.title}</h2>
                    <p className="text-sm text-muted-foreground line-clamp-3">{video.description}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Videos;
