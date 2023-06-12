// Package jsonpatch implements a thin wrapper around github.com/mattbaird/jsonpatch,
// working around some issues
package jsonpatch

import (
	"regexp"
	"sort"
	"strconv"

	"github.com/mattbaird/jsonpatch"
)

var (
	numberRegex = regexp.MustCompile(`(.*/)(\d+)`)
)

func sortJSONPatch(patch []jsonpatch.JsonPatchOperation) []jsonpatch.JsonPatchOperation {
	// The problem we need to solve is that "github.com/mattbaird/jsonpatch produces outputs like:
	//
	// # delete the last 2 elements of an array with 4 values
	// remove a[2], remove a[3]
	//
	// This results in the library that we use in the TS side removing the first element by
	// applying the first instruction, then trying to apply the second instruction to an array that
	// no longer has 4 elements.
	//
	// This has been already reported to the library at https://github.com/mattbaird/jsonpatch/issues/30,
	// but it seems there's no interesting in changing the behavior.
	//
	// To workaround this, we reorder consecutive remove statements
	// pointing the same path so the higher indices always come first. Other elements
	// in the array of instructions remain in their previous places. For this reason, we
	// must ensure we use a stable sorting algorithm.
	sort.SliceStable(patch, func(i, j int) bool {
		pi, pj := patch[i], patch[j]
		if pi.Operation == "remove" && pj.Operation == "remove" {
			mi, mj := numberRegex.FindStringSubmatch(pi.Path), numberRegex.FindStringSubmatch(pj.Path)
			if len(mi) > 0 && len(mj) > 0 {
				if mi[1] == mj[1] {
					ni, err := strconv.Atoi(mi[2])
					// These errors should never happen, since these strings have previously
					// matched \d+
					if err != nil {
						panic(err)
					}
					nj, err := strconv.Atoi(mj[2])
					if err != nil {
						panic(err)
					}
					return ni > nj
				}
			}
		}
		return i < j
	})
	return patch

}

// Create produces a jsonpatch using github.com/mattbaird/jsonpatch.Create and then reorders
// the removes so they can be applied by the TS library that we use.
func Create(from []byte, to []byte) ([]jsonpatch.JsonPatchOperation, error) {
	patch, err := jsonpatch.CreatePatch(from, to)
	if err != nil {
		return nil, err
	}
	return sortJSONPatch(patch), nil
}
