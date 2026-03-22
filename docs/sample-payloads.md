# Coaching Institute MVP - Sample Payloads

## 1. Webhooks (n8n Triggers)

### `attendance_absent`
```json
{
  "event_type": "attendance_absent",
  "student_name": "Rohan Sharma",
  "parent_phone": "+919876543210",
  "date": "2023-11-20"
}
```

### `fee_due`
```json
{
  "event_type": "fee_due",
  "student_name": "Rohan Sharma",
  "parent_phone": "+919876543210",
  "due_amount": 5000,
  "bank_details": "HDFC Bank - 5010023456789 (HDFC0001234)",
  "upi_id": "institute@upi",
  "qr_image_url": "https://example.com/qr.png"
}
```

### `payment_confirmation`
```json
{
  "event_type": "payment_confirmation",
  "student_name": "Rohan Sharma",
  "parent_phone": "+919876543210",
  "amount": 5000
}
```

## 2. API Routes

### POST `/api/students`
```json
{
  "name": "Rohan Sharma",
  "phoneOrEmail": "rohan@example.com",
  "batch_id": "60d5ecb54... (ObjectId)",
  "parent_name": "Rajesh Sharma",
  "parent_phone": "+919876543210"
}
```

### POST `/api/fees`
```json
{
  "student_id": "60d5ecb54... (ObjectId)",
  "total_amount": 5000,
  "due_date": "2023-12-01T00:00:00Z"
}
```

### POST `/api/payments/[id]/confirm` (PUT request to confirm payment)
```json
{} // empty body required if method takes only params
```

### POST `/api/attendance/mark`
```json
{
  "student_id": "60d5ecb54...",
  "batch_id": "60d5ecb54...",
  "date": "2023-11-20",
  "status": "ABSENT"
}
```
