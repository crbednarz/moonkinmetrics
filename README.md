# Moonkin Metrics

This repository holds the source for [moonkinmetrics.com](https://moonkinmetrics.com), a website for exploring talent selection in World of Warcraft's rated PvP.

There are two distinct pieces to the site:
- A Go service which scrapes the Blizzard API for information about talents, pvp leaderboards, and spell icons.
- A Next.js front-end which can be rendered to static pages.

## Working with the site

At a high-level, development setup consists of:
1. Run `go run cmd/cli/cli.go talents` to collect information about talent trees.
2. Run `go run cmd/cli/cli.go ladder --region <region> --bracket <bracket>` to collect leaderboard data.
3. Run the development server with `npm run dev` from the `ui/` directory.

### Prerequisite

- Go 1.21.1
- Node
- [Battle.net API key](https://develop.battle.net/)

### Quick start

Let's look at the fastest way to get the site up and running for local development:

```sh
#!/bin/bash
git clone https://github.com/crbednarz/moonkinmetrics
cd moonkinmetrics

# Both `WOW_CLIENT_ID` and `WOW_CLIENT_SECRET` should be set using your Battle.net API key.
# https://develop.battle.net/
export WOW_CLIENT_ID="<client_id>"
export WOW_CLIENT_SECRET="<client_secret>"

# Install Go dependencies
go mod download

# Capture current talent trees
go run cmd/cli/cli.go talents

# Scan a brackets
for region in us eu; do
    go run cmd/cli/cli.go ladder --region "$region" --bracket 2v2
    go run cmd/cli/cli.go ladder --region "$region" --bracket 3v3
    go run cmd/cli/cli.go ladder --region "$region" --bracket rbg
    go run cmd/cli/cli.go ladder --region "$region" --bracket shuffle
done

# Run the UI
cd ui
npm install
npm run dev
```

With that, the site is up and running. Changes made to source should be seen live on the development server at `http://localhost:3000/`.

If you've finished scanning all brackets, you may also render the static pages with:
```
npm run build
npm run export
```

Which will dump the rendered site to the `ui/out/` directory.

## Contributing

Contribution are now welcome. However, fair warning: Much of the project is missing sufficient documentation and testing, which could make it challenging to work on. This is something I'm actively working to improve, but in the meantime, feel free to reach out directly either as a GitHub discussion or on [discord](https://discord.gg/t7XmtxwNNF) if you have any questions.

## License

GNU Affero General Public License v3.0, see [LICENSE](https://github.com/crbednarz/moonkinmetrics/blob/master/LICENSE).
