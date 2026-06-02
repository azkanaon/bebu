package utils

import (
	"regexp"
	"strings"
)

func NormalizeCategory(s string) string {
	s = strings.TrimSpace(strings.ToLower(s))
	s = regexp.MustCompile(`\s+`).ReplaceAllString(s, " ")
	return s
}