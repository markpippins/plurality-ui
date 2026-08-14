# Plurality UI — Reference Guide

## Configuration

| Property | Default | Description |
|----------|---------|-------------|
| `VITE_GEMINI_API_KEY` | — | Gemini API key (required) |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | — | Gemini API key (set in .env.local) |

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## Troubleshooting

- **API key not found**: Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY`
- **App not loading**: Ensure all dependencies are installed with `npm install`
- **Vite HMR not working**: Check that the dev server port is not blocked by a firewall
