# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Previewing the Production Build

Preview the production build locally:

```bash
npm run preview
```

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

Deployment is done using the Wrangler CLI.

To build and deploy directly to production:

```sh
npm run deploy
```

To deploy a preview URL:

```sh
npx wrangler versions upload
```

You can then promote a version to production after verification or roll it out progressively.

```sh
npx wrangler versions deploy
```

## CI/CD

The GitHub Actions workflow in `.github/workflows/ci.yml` runs three stages:

1. **Validate** — installs dependencies, then runs typecheck, ESLint, and a
   Prettier formatting check.
2. **Test & Build** — runs the Vitest suite with coverage and creates a
   production build, which is uploaded as a workflow artifact.
3. **Deploy** — pull requests from this repository get a Cloudflare preview
   version and a sticky comment with its URL. Pushes to `main` deploy to
   production through the `production` GitHub Environment.

### Required repository setup

Add these secrets under **Settings → Secrets and variables → Actions**:

| Secret                  | Description                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID.                                                                                                                    |
| `CLOUDFLARE_API_TOKEN`  | API token with **Workers Scripts: Edit** and **Account Settings: Read** permissions (add **Workers Routes: Edit** if you use a custom domain). |

Then create two environments under **Settings → Environments**:

- `preview` — used by preview deployments. No protection rules are required.
- `production` — used by production deployments. Add required reviewers here if
  you want a manual approval before each production release.

Finally, protect the `main` branch under **Settings → Branches** and require the
`Validate` and `Test & Build` status checks before merging.

> Pull requests opened from forks do not receive repository secrets, so preview
> deployments are skipped for them.

### Local checks

Run the same checks locally before pushing:

```sh
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
```

Use `npm run format` to apply Prettier fixes and `npm run test:watch` while
developing tests.

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
