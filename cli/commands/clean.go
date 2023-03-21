package commands

import (
	"errors"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/cli/helpers"
	"github.com/wundergraph/wundergraph/pkg/files"
)

// cleanCmd represents the introspect command
var cleanCmd = &cobra.Command{
	Use:   "clean",
	Short: "Clean caches and generated data",
	RunE: func(cmd *cobra.Command, args []string) error {
		wunderGraphDir, err := files.FindWunderGraphDir(_wunderGraphDirConfig)
		if err != nil {
			return err
		}
		if cacheDir, _ := helpers.LocalWunderGraphCacheDir(wunderGraphDir); cacheDir != "" {
			if err := os.RemoveAll(cacheDir); err != nil && !errors.Is(err, os.ErrNotExist) {
				return err
			}
		}
		generatedDir := filepath.Join(wunderGraphDir, "generated")
		if err := os.RemoveAll(generatedDir); err != nil && !errors.Is(err, os.ErrNotExist) {
			return err
		}
		return nil
	},
}

func init() {
	rootCmd.AddCommand(cleanCmd)
}
