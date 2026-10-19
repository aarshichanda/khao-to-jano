# Khao To Jano — Order API Test Results

**Date:** 12 October 2026

## Test 1: Create an order successfully

- **Test ID:** TC-ORDER-001
- **Endpoint:** POST `/api/orders`
- **Scenario:** Create an order using valid customer, restaurant, item, address, delivery charge, and payment details.
- **Expected result:** HTTP 201 Created; order is saved successfully.
- **Actual result:** Order created successfully. Total amount: ₹370.
- **Order ID:** `6acc9b066f1d0cf9834aa4f6`
- **Status:** PASS

## Test 2: Reject an order with missing payment method

- **Test ID:** TC-ORDER-002
- **Endpoint:** POST `/api/orders`
- **Scenario:** Submit an order without `paymentMethod`.
- **Expected result:** HTTP 400 Bad Request.
- **Actual result:** `Please provide all required order details`
- **Status:** PASS

## Test 3: Retrieve saved orders

- **Test ID:** TC-ORDER-003
- **Endpoint:** GET `/api/orders`
- **Scenario:** Retrieve saved orders from MongoDB.
- **Expected result:** HTTP 200 OK; saved orders are returned.
- **Actual result:** Retrieved 3 orders successfully. All three orders had a total amount of ₹370.
- **Status:** PASS

## Test 4: Retrieve a single order by ID

- **Test ID:** TC-ORDER-004
- **Endpoint:** GET `/api/orders/:id`
- **Scenario:** Retrieve an existing order using its MongoDB ObjectId.
- **Expected result:** HTTP 200 OK; the matching order is returned.
- **Actual result:** Order retrieved successfully. Total amount: ₹370. Order ID: `6acc9b066f1d0cf9834aa4f6`.
- **Status:** PASS

## Test 5: Reject an invalid order ID

- **Test ID:** TC-ORDER-005
- **Endpoint:** GET `/api/orders/:id`
- **Scenario:** Request an order using an invalid MongoDB ObjectId format.
- **Expected result:** HTTP 400 Bad Request.
- **Actual result:** Received `Invalid order ID`.
- **Status:** PASS

## Test 6: Handle a nonexistent order

- **Test ID:** TC-ORDER-006
- **Endpoint:** GET `/api/orders/:id`
- **Scenario:** Request an order using a validly formatted MongoDB ObjectId that does not match any saved order.
- **Expected result:** HTTP 404 Not Found.
- **Actual result:** Received `Order not found`.
- **Status:** PASS