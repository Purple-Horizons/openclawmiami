# OpenClaw Miami

Miami's community hub for [OpenClaw](https://github.com/anthropics/claude-code) — the open-source AI assistant with 145K+ GitHub stars.

We bring together local builders, developers, and AI enthusiasts to explore and build with personal AI agents. Monthly meetups, setup assistance, and a growing community of 50+ Miami-based builders.

## Getting Started

**Prerequisites:** Node.js 18+ and npm

```bash
# Clone the repo
git clone https://github.com/anthropics/openclawmiami.git
cd openclawmiami

# Install dependencies
npm install

# Start development server (port 8080)
npm run dev
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR on port 8080 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

## Tech Stack

- **Build:** [Vite](https://vitejs.dev/)
- **Framework:** [React 18](https://react.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)

## Project Structure

```
src/
├── components/          # Page sections & UI components
│   ├── ui/              # shadcn/ui primitives
│   ├── HeroSection.tsx
│   ├── EventsSection.tsx
│   └── ...
├── pages/               # Route pages
├── hooks/               # Custom React hooks
├── lib/                 # Utilities
└── App.tsx              # Root component with routing
```

## Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

- **Report bugs** — Open an issue describing the problem
- **Suggest features** — Share ideas for improving the site
- **Submit PRs** — Fix bugs, add features, improve docs
- **Spread the word** — Tell Miami builders about OpenClaw

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run linting and tests (`npm run lint && npm run test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- TypeScript strict mode
- Tailwind CSS for styling (use existing design tokens)
- Components in `src/components/`, pages in `src/pages/`
- Follow existing patterns in the codebase

## Community

- **Discord** — [Join the conversation](https://discord.com/channels/1456350064065904867/1464825842264703221)
- **Meetups** — Monthly in Miami, check the site for upcoming events
- **OpenClaw** — [Main project repo](https://github.com/anthropics/claude-code)

## Contact

**Organizers:**

| Name | GitHub | Socials |
|------|--------|---------|
| Gianni Dalerta | [@gianni-dalerta](https://github.com/gianni-dalerta) | [@giannidalerta](https://twitter.com/giannidalerta) everywhere |
| Ralph Quintero | — | — |

**Hosted by:** [Purple Horizons](https://purplehorizons.io)

For questions, sponsorship inquiries, or partnership opportunities, reach out through any of the channels above.

## License

MIT

---

Built with caffeine and curiosity in Miami.
