package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"runtime/pprof"
	"strings"

	"github.com/urfave/cli/v2"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/retrieve/seasons"
	"github.com/crbednarz/moonkinmetrics/pkg/retrieve/talents"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/serialize"
	"github.com/crbednarz/moonkinmetrics/pkg/site"
	"github.com/crbednarz/moonkinmetrics/pkg/storage"
	"github.com/crbednarz/moonkinmetrics/pkg/wow"
)

type bracketScanOptions struct {
	Region    bnet.Region
	Bracket   string
	MinRating uint
	Output    string
}

func runTalentScan(c *cli.Context) error {
	scanner, err := buildScanner(c)
	if err != nil {
		return fmt.Errorf("unable to build API scanner: %w", err)
	}

	trees, err := talents.GetTalentTrees(scanner)
	if err != nil {
		return fmt.Errorf("unable to retrieve talent trees: %w", err)
	}

	for i := range trees {
		tree := &trees[i]
		err = writeTalents(tree, c.Path("output"))
		if err != nil {
			return fmt.Errorf("unable to write talents to file: %w", err)
		}
	}
	log.Printf("Talents retrieved: %d total", len(trees))
	return nil
}

func runLadderScan(c *cli.Context) error {
	region := bnet.Region(c.String("region"))

	scanner, err := buildScanner(c)
	if err != nil {
		return fmt.Errorf("unable to build API scanner: %w", err)
	}

	trees, err := talents.GetTalentTrees(scanner)
	if err != nil {
		return fmt.Errorf("unable to retrieve talent trees: %w", err)
	}

	bracketArg := c.String("bracket")
	brackets := []string{bracketArg}
	if bracketArg == "shuffle" || bracketArg == "blitz" {
		brackets = make([]string, 0, len(wow.SpecByClass)*3)
		for class, specs := range wow.SpecByClass {
			classSlug := strings.ReplaceAll(class, " ", "")
			for _, spec := range specs {
				specSlug := strings.ReplaceAll(spec, " ", "")
				slug := strings.ToLower(fmt.Sprintf("%s-%s-%s", bracketArg, classSlug, specSlug))
				brackets = append(brackets, slug)
			}
		}
	}
	for _, bracket := range brackets {
		log.Printf("Scanning bracket: %s", bracket)
		err = scanBracket(
			scanner,
			trees,
			bracketScanOptions{
				Region:    region,
				Bracket:   bracket,
				MinRating: c.Uint("min-rating"),
				Output:    c.Path("output"),
			},
		)
		if err != nil {
			return fmt.Errorf("failed to scan bracket %s: %w", bracket, err)
		}
	}
	return nil
}

func runClean(c *cli.Context) error {
	storage, err := buildStorage(c)
	if err != nil {
		return fmt.Errorf("unable to build storage: %w", err)
	}
	log.Printf("Storage initialized")

	result, err := storage.Clean()
	if err != nil {
		return fmt.Errorf("unable to clean storage: %w", err)
	}
	log.Printf("Storage cleaned: %d entries removed", result.Deleted)
	return nil
}

func scanBracket(scanner *scan.Scanner, trees []wow.TalentTree, options bracketScanOptions) error {
	leaderboard, err := seasons.GetCurrentLeaderboard(scanner, options.Bracket, options.Region)
	if err != nil {
		return fmt.Errorf("failed to retrieve leaderboard: %w", err)
	}
	log.Printf("Leaderboard retrieved: %v entries", len(leaderboard.Entries))

	leaderboard = leaderboard.FilterByMinRating(options.MinRating)

	enrichedLeaderboards, err := site.EnrichLeaderboard(scanner, &leaderboard, trees)
	if err != nil {
		return fmt.Errorf("failed to enrich leaderboard: %w", err)
	}

	for i := range enrichedLeaderboards {
		leaderboard := &enrichedLeaderboards[i]

		data, err := serialize.ExportLeaderboardToJson(leaderboard)
		if err != nil {
			return fmt.Errorf("failed to serialize leaderboard: %w", err)
		}

		fileName := fmt.Sprintf("%s-%s.%s.json", leaderboard.ClassName, leaderboard.SpecName, options.Region)
		fileName = strings.ReplaceAll(fileName, " ", "-")
		fileName = strings.ToLower(fileName)

		path := fmt.Sprintf("%s/pvp/%s", options.Output, leaderboard.Bracket)
		if strings.HasPrefix(leaderboard.Bracket, "shuffle") {
			path = fmt.Sprintf("%s/pvp/shuffle", options.Output)
		}
		if strings.HasPrefix(leaderboard.Bracket, "blitz") {
			path = fmt.Sprintf("%s/pvp/blitz", options.Output)
		}
		err = os.MkdirAll(path, 0755)
		if err != nil {
			return fmt.Errorf("unable to create pvp directory: %w", err)
		}
		path = fmt.Sprintf("%s/%s", path, fileName)
		os.WriteFile(path, data, 0644)
		log.Printf("Exported %s", path)
	}

	return nil
}

func buildScanner(c *cli.Context) (*scan.Scanner, error) {
	offline := c.Bool("offline")

	var httpClient bnet.HttpClient
	if offline {
		httpClient = &bnet.OfflineHttpClient{}
	} else {
		httpClient = &http.Client{}
	}
	client := bnet.NewClient(
		httpClient,
		bnet.WithCredentials(
			c.String("client-id"),
			c.String("client-secret"),
		),
		bnet.WithLimiter(!offline),
	)

	if !offline {
		err := client.Authenticate()
		if err != nil {
			return nil, fmt.Errorf("failed to authenticate: %v", err)
		}
		log.Printf("Authentication complete")
	}

	storage, err := buildStorage(c)
	if err != nil {
		return nil, fmt.Errorf("unable to build storage: %w", err)
	}
	log.Printf("Storage initialized")
	return scan.NewScanner(storage, client), nil
}

func buildStorage(c *cli.Context) (storage.ResponseStorage, error) {
	offline := c.Bool("offline")
	err := os.MkdirAll(c.Path("cache-dir"), 0755)
	if err != nil {
		return nil, fmt.Errorf("unable to create pvp directory: %w", err)
	}
	storagePath := fmt.Sprintf("%s/wow.db", c.Path("cache-dir"))
	return storage.NewSqlite(storagePath, storage.SqliteOptions{
		NoExpire: offline,
	})
}

func main() {
	app := &cli.App{
		Name:        "moonkinmetrics",
		Description: "Moonkin Metrics Scanning CLI",
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:    "client-id",
				Usage:   "Battle.net API client ID",
				EnvVars: []string{"WOW_CLIENT_ID"},
			},
			&cli.StringFlag{
				Name:    "client-secret",
				Usage:   "Battle.net API client secret",
				EnvVars: []string{"WOW_CLIENT_SECRET"},
			},
			&cli.BoolFlag{
				Name:  "offline",
				Usage: "Run in offline mode",
				Value: false,
			},
			&cli.PathFlag{
				Name:  "output",
				Usage: "Output path",
				Value: "ui/wow",
			},
			&cli.PathFlag{
				Name:  "cache-dir",
				Usage: "Cache directory",
				Value: ".",
			},
			&cli.PathFlag{
				Name:  "perf",
				Usage: "Enable performance profiling",
				Value: "",
			},
		},
		Before: func(c *cli.Context) error {
			if c.Path("perf") != "" {
				f, err := os.Create(c.Path("perf"))
				if err != nil {
					return err
				}

				err = pprof.StartCPUProfile(f)
				if err != nil {
					return err
				}
			}
			return nil
		},
		After: func(c *cli.Context) error {
			if c.String("perf") != "" {
				pprof.StopCPUProfile()
			}
			return nil
		},
		Commands: []*cli.Command{
			{
				Name:   "clean",
				Usage:  "Clean up expired cache entries",
				Action: runClean,
			},
			{
				Name:   "talents",
				Usage:  "Export talents to JSON",
				Action: runTalentScan,
			},
			{
				Name:   "ladder",
				Usage:  "Export ladder to JSON",
				Action: runLadderScan,
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name:  "bracket",
						Usage: "PvP bracket to scan",
					},
					&cli.StringFlag{
						Name:  "region",
						Usage: "Region to scan",
					},
					&cli.UintFlag{
						Name:  "min-rating",
						Usage: "Minimum rating to include",
						Value: 1600,
					},
					&cli.UintFlag{
						Name:  "max-entries",
						Usage: "Maximum entries to include",
						Value: 7500,
					},
				},
			},
		},
	}
	err := app.Run(os.Args)
	if err != nil {
		log.Fatal(err)
	}
}

func writeTalents(tree *wow.TalentTree, basePath string) error {
	serializedTalents, err := serialize.ExportTalentsToJson(tree)
	if err != nil {
		return fmt.Errorf("unable to serialize talents: %w", err)
	}
	err = os.MkdirAll(fmt.Sprintf("%s/talents/", basePath), 0755)
	if err != nil {
		return fmt.Errorf("unable to create talents directory: %w", err)
	}

	fileName := fmt.Sprintf("%s-%s.json", tree.ClassName, tree.SpecName)
	fileName = strings.ReplaceAll(fileName, " ", "-")
	fileName = strings.ToLower(fileName)

	err = os.WriteFile(
		fmt.Sprintf("%s/talents/%s", basePath, fileName),
		serializedTalents,
		0644,
	)
	if err != nil {
		return fmt.Errorf("unable to write talents to file: %w", err)
	}

	return nil
}
