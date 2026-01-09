# Payment Data Storage Flow for Coordinator Dashboard

## When a Coordinator Marks a Payment as "Paid"

### Route: POST /api/coordinator/registrations/mark-paid/:id
**File:** `backend/routes/coordinator.js` (lines 718-820)

### Data Storage Location:
**Collection:** `registrations` (MongoDB)

### Fields Updated in the Registration Document:

1. **`amount`** ← **PRIMARY FIELD** (Dashboard reads from this!)
   - Value: The payment amount (e.g., 150 or 200)
   - Used by: Dashboard aggregation queries

2. **`paidAmount`** ← Backup/consistency field
   - Value: Same as amount
   - Used by: Legacy code, consistency checks

3. **`paymentAmount`** ← Backup/consistency field
   - Value: Same as amount
   - Used by: Legacy code, consistency checks

4. **`paymentStatus`**
   - Value: 'paid'
   - Used by: Filtering paid vs unpaid

5. **`paymentDate`**
   - Value: Current timestamp
   - Used by: Tracking when payment was made

6. **`paymentMethod`**
   - Value: 'cash', 'upi', 'card', or 'bank_transfer'
   - Used by: Dashboard breakdown (Cash vs UPI)

7. **`paymentNotes`**
   - Value: Optional notes from coordinator
   - Used by: Additional payment information

8. **`processedBy`**
   - Value: Coordinator's MongoDB ObjectId
   - Used by: Tracking which coordinator processed the payment

---

## Dashboard Statistics Query

### Route: GET /api/coordinator/dashboard/stats
**File:** `backend/routes/coordinator.js` (lines 119-208)

### How it calculates "Total Amount Collected":

```javascript
// Aggregation query
Registration.aggregate([
  {
    $match: { paymentStatus: 'paid' }  // Get all paid registrations
  },
  {
    $group: {
      _id: '$paymentMethod',           // Group by payment method
      count: { $sum: 1 },              // Count transactions
      totalAmount: { $sum: '$amount' } // ← SUM THE 'amount' FIELD
    }
  }
])
```

### Result:
- **Cash Amount** = Sum of all `amount` where `paymentMethod` = 'cash'
- **UPI Amount** = Sum of all `amount` where `paymentMethod` = 'upi'
- **Total Amount Collected** = Cash Amount + UPI Amount

---

## Your Current Situation

### Problem:
Your 3 existing payments (MH26000479, MH26000149, MH26000005) have:
- ✅ `amount: 150` (or 200) - **CORRECT**
- ✅ `paymentStatus: 'paid'` - **CORRECT**
- ✅ `paymentMethod: 'cash'` - **CORRECT**
- ✅ `processedBy: [coordinator ID]` - **CORRECT**

### Why Dashboard Shows ₹0:
The backend server needs to be **restarted** for the code changes to take effect.
The old code was reading from `paidAmount` (which is 0), but now it reads from `amount` (which has the correct value).

### Solution:
1. **Restart backend server** (already done - running for 1m30s)
2. **Hard refresh browser** (Ctrl+Shift+R)
3. Dashboard should now show the correct total!

---

## Database Schema

**Collection:** `registrations`
**Model:** `backend/models/Registration.js`

Relevant fields:
```javascript
{
  userId: String,           // e.g., "MH26000479"
  name: String,
  paymentStatus: String,    // 'paid', 'unpaid', 'pending', 'failed'
  amount: Number,           // ← PRIMARY payment amount field
  paidAmount: Number,       // Backup field
  paymentAmount: Number,    // Backup field
  paymentMethod: String,    // 'cash', 'upi', 'card', 'bank_transfer'
  paymentDate: Date,
  processedBy: ObjectId,    // Reference to Coordinator
  paymentNotes: String
}
```
