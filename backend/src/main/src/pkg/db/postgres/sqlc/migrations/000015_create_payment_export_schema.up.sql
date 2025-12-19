-- Create payment_export schema for clean separation
CREATE SCHEMA IF NOT EXISTS payment_export;

-- Create payment_exports table for tracking export operations
CREATE TABLE payment_export.payment_exports (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    export_type VARCHAR(20) NOT NULL CHECK (export_type IN ('QBO', 'XERO')),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NULL,
    total_payments INTEGER NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    error_message TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL
);

-- Create exported_payments table for tracking individual payments in exports
CREATE TABLE payment_export.exported_payments (
    id SERIAL PRIMARY KEY,
    export_id INTEGER NOT NULL REFERENCES payment_export.payment_exports(id) ON DELETE CASCADE,
    payment_schedule_id INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    executed BOOLEAN NOT NULL DEFAULT FALSE,
    executed_date TIMESTAMP WITH TIME ZONE NULL,
    execution_reference VARCHAR(100) NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_payment_exports_org_created ON payment_export.payment_exports(organization_id, created_at DESC);
CREATE INDEX idx_payment_exports_status ON payment_export.payment_exports(status);
CREATE INDEX idx_exported_payments_export_id ON payment_export.exported_payments(export_id);
CREATE INDEX idx_exported_payments_schedule_id ON payment_export.exported_payments(payment_schedule_id);
CREATE INDEX idx_exported_payments_executed ON payment_export.exported_payments(executed);
