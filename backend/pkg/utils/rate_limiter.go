// pkg/utils/rate_limiter.go
package utils

import (
	"sync"
	"time"
)

// FailureRecord menyimpan catatan upaya gagal.
type FailureRecord struct {
	Count      int
	LastAttempt time.Time
}

// LoginRateLimiter adalah struktur thread-safe untuk melacak upaya login yang gagal.
type LoginRateLimiter struct {
	attempts    map[string]FailureRecord
	mu          sync.Mutex
	maxAttempts int
	blockTime   time.Duration
	findTime    time.Duration
}

// NewLoginRateLimiter membuat instance baru dari rate limiter.
func NewLoginRateLimiter(maxAttempts int, blockTime, findTime time.Duration) *LoginRateLimiter {
	return &LoginRateLimiter{
		attempts:    make(map[string]FailureRecord),
		maxAttempts: maxAttempts,
		blockTime:   blockTime,
		findTime:    findTime,
	}
}

// IsBlocked memeriksa apakah sebuah kunci (misal: "email|ip") sedang diblokir.
func (l *LoginRateLimiter) IsBlocked(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	record, exists := l.attempts[key]
	if !exists {
		return false
	}

	// Jika jumlah percobaan sudah melebihi batas
	if record.Count >= l.maxAttempts {
		// Cek apakah waktu blokir sudah lewat
		if time.Since(record.LastAttempt) < l.blockTime {
			return true // Masih dalam masa blokir
		}
		// Jika waktu blokir sudah lewat, reset record
		delete(l.attempts, key)
		return false
	}

	return false
}

// RecordFailure mencatat upaya gagal untuk sebuah kunci.
func (l *LoginRateLimiter) RecordFailure(key string) {
	l.mu.Lock()
	defer l.mu.Unlock()

	record, exists := l.attempts[key]
	if !exists {
		l.attempts[key] = FailureRecord{Count: 1, LastAttempt: time.Now()}
		return
	}

	// Jika percobaan terakhir sudah terlalu lama, reset
	if time.Since(record.LastAttempt) > l.findTime {
		record.Count = 1
	} else {
		record.Count++
	}
	record.LastAttempt = time.Now()
	l.attempts[key] = record
}

// ClearFailures membersihkan catatan gagal untuk sebuah kunci (setelah login sukses).
func (l *LoginRateLimiter) ClearFailures(key string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	delete(l.attempts, key)
}