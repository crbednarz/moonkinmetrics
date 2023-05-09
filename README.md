# Moonkin Metrics

This repository holds the source for [moonkinmetrics.com](https://moonkinmetrics.com), a website for exploring talent selection in World of Warcraft's rated PvP.

There are two distinct pieces to the site:
- `api-scanner` - A Python project which scrapes the Blizzard API for information about talents, pvp leaderboards, and spell icons.
- `ui` - A Next.js front-end which can be rendered to static pages.

## Working with the site

At a high-level, development setup consists of:
1. Run `api-scanner/cli.py talents` to collect information about talent trees.
2. Run `api-scanner/cli.py -r <region> ladder <bracket>` to collect leaderboard data.
3. Run the development server with `npm run dev` from the `ui/` directory.

### Prerequisite

- Python 3.10 (venv recommended)
- Node
- [Battle.net API key](https://develop.battle.net/)

### Quick start

Let's look at the fastest way to get the site up and running for local development:

Before starting, ensure that your environment is configured correctly.
Both `WOW_CLIENT_ID` and `WOW_CLIENT_SECRET` should be set using your Battle.net API key [Battle.net developer portal](https://develop.battle.net/).

```sh
export WOW_CLIENT_ID="<client id>"
export WOW_CLIENT_SECRET="<client id>"
```

Start by cloning and entering the repository.

```
git clone https://github.com/crbednarz/moonkinmetrics
cd moonkinmetrics
```

From here we'll want to setup Python so we can run the scanner. While you can do a direct `pip install`, we'll be using venv here to manage dependencies better.  
```
python3.10 -m venv venv
. venv/bin/activate
pip install -r ./api-scanner/requirements.txt
```

With the scanner setup out of the way, we can start scanning. However before grabbing the leaderboard, we need initial information about the talent trees themselves. This will include positions, icons, tooltips and so on.  
```
python api-scanner/cli.py talents
```

Now we simply grab a single bracket we're interested in. In this case, `3v3`, although `shuffle`, `2v2`, and `rgb` are all valid.
```
python api-scanner/cli.py -r us ladder 3v3
python api-scanner/cli.py -r eu ladder 3v3
```

While we'll go into more detail below, there's a couple of important things to note here:  
- Both `us` and `eu` region scans must be done for a bracket to work.
- The `shuffle` bracket covers an enormous amount of data and is likely to take 1-2 hours to complete.
- The Battle.net API has rate limiting features which make scanning all leaderboards in a row impractical. ([See "Throttling"](https://develop.battle.net/documentation/guides/getting-started))
- Missing brackets will error when visited within the development server and cause the static build process to fail.

With our data collected, we can move on to running the UI.

Simply install dependencies.

```
cd ui
npm install
```

Then run the server.
```
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
