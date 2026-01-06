# 🧪 Quick Testing Guide

## How to Test the Fixes

### **Prerequisites:**
- Backend server running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- MongoDB connected
- Logged in as coordinator (username: akash, password: akash@12345)

---

## **Test 1: MHID Autocomplete Search** 🔍

### Steps:
1. Navigate to **"Proceed to Pay"** tab
2. Click on the search box at the top
3. Type: `MH`
4. **Expected Result:** 
   - Dropdown appears showing up to 8 participants
   - Each shows: MHID, Name, Event, Amount
   - Sorted alphabetically (MH26000001, MH26000002, etc.)

5. Type: `MH260`
6. **Expected Result:**
   - Suggestions filter to show only MHIDs starting with "MH260"
   - Still sorted in order

7. Click on any suggestion
8. **Expected Result:**
   - Search box fills with selected MHID
   - Participant details appear below

### What to Check:
- ✅ Suggestions appear within 300ms of typing
- ✅ Suggestions are sorted correctly
- ✅ Clicking fills the search box
- ✅ Shows payment status correctly
- ✅ Maximum 8 suggestions shown

---

## **Test 2: Sequential MHID Display** 📊

### Steps:
1. Go to **"Proceed to Pay"** tab
2. In search box, type: `MH2`
3. **Expected Result:**
   - All participants with MHID starting with "MH2" appear
   - Listed in order: MH26000001, MH26000002, MH26000003...
   - NOT random order

4. Clear search
5. **Expected Result:**
   - Shows all paid participants
   - Still in MHID order

### What to Check:
- ✅ MH26000001 appears before MH26000002
- ✅ MH26000010 appears after MH26000009
- ✅ Consistent ordering throughout

---

## **Test 3: Dropdown Without Visitor** 🎯

### Steps:
1. Go to **"Proceed to Pay"** tab
2. Find any unpaid participant row
3. Look at the "Type" dropdown column
4. Click the dropdown
5. **Expected Result:**
   - Only 3 options visible:
     - ⚽ Sports
     - 🎭 Cultural
     - 🌟 Both
   - NO "👥 Visitor" option

6. Select "Sports"
7. Check the "Amount Due" column
8. **Expected Result:**
   - Shows ₹200 (or ₹150 for Vignan colleges)

### What to Check:
- ✅ No "Visitor" option in dropdown
- ✅ Default selection is "Sports"
- ✅ Amount calculated correctly
- ✅ All three options work properly

---

## **Test 4: Search by Name** 👤

### Steps:
1. In "Proceed to Pay" search box
2. Type a participant's name (e.g., "John", "Mary")
3. **Expected Result:**
   - Shows all participants with that name
   - Results sorted by MHID
   - Shows both paid and unpaid if matching

### What to Check:
- ✅ Partial name matching works
- ✅ Case-insensitive search
- ✅ Results sorted correctly

---

## **Test 5: Backend API Direct Test** 🔌

### Using Browser/Postman:

**Test Autocomplete Endpoint:**
```
GET http://localhost:5000/api/coordinator/registrations/search?query=MH26
Headers:
  Authorization: Bearer <your-token>
```

**Expected Response:**
```json
[
  {
    "participantId": "MH26000001",
    "userId": "MH26000001",
    "name": "Participant Name",
    "email": "email@example.com",
    "phone": "9876543210",
    "paymentStatus": "unpaid",
    "isPaid": false,
    "paymentAmount": 200,
    "paidAmount": 0
  }
]
```

### What to Check:
- ✅ Status code: 200
- ✅ Results sorted by userId
- ✅ Maximum 10 results
- ✅ All fields present

---

## **Test 6: Performance Test** ⚡

### Steps:
1. Open "Proceed to Pay" tab
2. Rapidly type: `M`, `H`, `2`, `6`, `0`, `0`, `0`
3. **Expected Result:**
   - Only ONE API call made (after 300ms debounce)
   - No flickering
   - Smooth dropdown animation

### What to Check:
- ✅ Debouncing works (check Network tab in DevTools)
- ✅ No multiple API calls for each keystroke
- ✅ Smooth user experience

---

## **Test 7: Edge Cases** 🧩

### Test Empty Search:
1. Type 1 character (e.g., "M")
2. **Expected:** No dropdown (minimum 2 chars required)

### Test No Results:
1. Type: `ZZZZZ`
2. **Expected:** "No matching participants found" message

### Test Special Characters:
1. Type: `MH26@`
2. **Expected:** Handles gracefully, no errors

### Test Long Names:
1. Search for participant with very long name
2. **Expected:** Truncates properly in suggestion dropdown

---

## **Common Issues & Solutions** 🔧

### Issue: Autocomplete not showing
**Solution:**
- Check browser console for errors
- Verify backend is running
- Check authentication token is valid
- Ensure minimum 2 characters typed

### Issue: Wrong sorting
**Solution:**
- Hard refresh browser (Ctrl+F5)
- Clear localStorage
- Check backend sorting logic in Network tab

### Issue: Visitor option still showing
**Solution:**
- Hard refresh (Ctrl+Shift+R)
- Clear browser cache
- Rebuild frontend: `npm run build`

### Issue: API returning 401 Unauthorized
**Solution:**
- Login again
- Check token expiration (7 days)
- Verify .env JWT_SECRET matches

---

## **Browser Console Tests** 💻

### Open DevTools (F12) and run:

**Check if autocomplete endpoint is called:**
```javascript
// Type in search box and watch Network tab
// Should see: GET /api/coordinator/registrations/search?query=...
```

**Check sorting in suggestions:**
```javascript
// Suggestions should appear in console
// Look for sorted array of participants
```

---

## **Success Criteria** ✅

All fixes are working if:

1. ✅ Typing "MH" shows autocomplete dropdown
2. ✅ Suggestions sorted as MH26000001, MH26000002, ...
3. ✅ No "Visitor" option in Type dropdown
4. ✅ Clicking suggestion fills search box
5. ✅ Search by name works correctly
6. ✅ Results always in MHID order
7. ✅ Debouncing prevents excessive API calls
8. ✅ No console errors

---

## **If All Tests Pass** 🎉

The system is ready for production use! All critical fixes have been applied and verified.

**Next Steps:**
1. Perform user acceptance testing
2. Monitor for any edge cases
3. Gather user feedback
4. Consider additional enhancements

---

**Happy Testing! 🚀**
