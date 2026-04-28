package utils

import "strconv"

func ParseUint(val string) uint {
	n, _ := strconv.Atoi(val)
	return uint(n)
}

func ParseFloat(val string) float64 {
	f, _ := strconv.ParseFloat(val, 64)
	return f
}