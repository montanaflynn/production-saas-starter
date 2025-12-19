-- ============================================================================
-- EXPORT OPERATIONS
-- ============================================================================

-- name: CreateExport :one
INSERT INTO payment_export.payment_exports (
    organization_id, export_type, file_name, total_payments, total_amount, created_by
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: GetExportByID :one
SELECT * FROM payment_export.payment_exports 
WHERE id = $1 AND organization_id = $2;

-- name: UpdateExportFile :one
UPDATE payment_export.payment_exports 
SET file_path = $3, status = 'COMPLETED'
WHERE id = $1 AND organization_id = $2
RETURNING *;

-- name: ListExports :many
SELECT * FROM payment_export.payment_exports 
WHERE organization_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- ============================================================================
-- EXPORTED PAYMENT OPERATIONS
-- ============================================================================

-- name: AddExportedPayment :one
INSERT INTO payment_export.exported_payments (
    export_id, payment_schedule_id, amount, vendor_name, invoice_number, payment_date
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: GetExportedPayments :many
SELECT * FROM payment_export.exported_payments 
WHERE export_id = $1
ORDER BY created_at;

-- name: MarkPaymentExecuted :one
UPDATE payment_export.exported_payments 
SET executed = TRUE, executed_date = $3, execution_reference = $4
WHERE export_id = $1 AND payment_schedule_id = $2
RETURNING *;

-- ============================================================================
-- DATA RETRIEVAL FOR EXPORT
-- ============================================================================

-- name: GetExportablePaymentSchedules :many
SELECT 
    ps.id,
    ps.scheduled_execution_date,
    ps.amount,
    ps.invoice_id,
    i.invoice_number,
    v.vendor_name
FROM payment_optimization.payment_schedules ps
JOIN invoice_management.invoices i ON ps.invoice_id = i.id
LEFT JOIN invoice_management.vendors v ON i.vendor_id = v.id
WHERE ps.id = ANY($2::int[]) 
AND ps.organization_id = $1
AND ps.status IN ('SCHEDULED', 'PENDING')
ORDER BY ps.scheduled_execution_date;
