const links = [
  { label: "Events", href: "https://lu.ma/openclaw" },
  { label: "OpenClaw", href: "https://openclaw.ai" },
  { label: "Discord", href: "https://discord.com/channels/1456350064065904867/1464825842264703221" },
  { label: "GitHub", href: "https://github.com/openclaw/openclaw" },
  { label: "Contribute", href: "https://github.com/Purple-Horizons/openclawmiami" },
  { label: "Purple Horizons", href: "https://purplehorizons.io" },
];

const Footer = () => {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <nav className="flex flex-wrap justify-center gap-6 mb-6">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <p className="text-sm text-muted-foreground">
          Built in Miami by{" "}
          <a href="https://purplehorizons.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Purple Horizons
          </a>{" "}
          🌴🦞
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          OpenClaw Miami © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
