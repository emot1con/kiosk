Open Questions
IMPORTANT

1. Soft Delete vs Hard Delete? Saat ini schema menggunakan ON DELETE CASCADE — menghapus user akan menghapus semua data terkait secara permanen. Apakah kamu ingin menambahkan deleted_at (soft delete) untuk memungkinkan recovery data? Atau hard delete sudah cukup untuk MVP?

soft delete

IMPORTANT

2. Apakah api_key perlu di-hash? Saat ini api_key disimpan sebagai plain text agar bisa ditampilkan di Settings page (sesuai flow frontend). Alternatifnya: simpan hash di DB, dan hanya tampilkan key sekali saat generate/regenerate (seperti GitHub Personal Access Token). Ini lebih aman tapi mengubah flow frontend. Mana yang kamu preferensikan?

NOTE

hash dan tampilkan sekali saja saat generate

3. Rate limiting data di DB? Di diskusi awal kamu menyebut rate limiting dengan Lua script + token bucket. Apakah state rate limit akan disimpan di Redis saja (ephemeral), atau perlu tabel rate_limit_logs di PostgreSQL untuk audit trail? Untuk MVP, Redis-only sudah cukup.

NOTE

redis saja dulu

4. Provider signature verification? Ai_AGENT.md menyebut signature verification "belum di-scope untuk MVP". Jika nanti ditambahkan, kita perlu kolom signing_secret di tabel endpoints. Apakah ini perlu disiapkan sekarang sebagai kolom nullable, atau ditambahkan nanti via migration?

tambahkan dan jadikan nullable
