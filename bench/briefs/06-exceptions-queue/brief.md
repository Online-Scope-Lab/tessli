# Order exceptions queue for a wholesale supplier

Ovenhouse Supply is a fictional company; any resemblance to a real company is unintended. Use only the content below as data.

## The product

Ovenhouse Supply delivers flour, dairy and packaging to about 300 cafés and bakeries. Its ordering system holds back orders that need a person to check them: unusually large orders, customers over their credit limit, items out of stock, and addresses the courier rejected. Those orders wait in an exceptions queue.

## Who uses this screen

Joel Amankwah, an operations coordinator. He works through the queue several times a day on a desktop, and sometimes checks it on his phone. For each order he decides to release it (send it to the warehouse), hold it (wait for the customer), or cancel it. He often releases several similar orders at once.

## What the screen must do

- List the orders in the queue with the information Joel needs to decide: order number, customer, reason held, order value, number of lines, time in queue and delivery date.
- Let him search by order number or customer, filter by reason held, and sort by value, time in queue or delivery date.
- Let him select several orders and release or hold them together; cancelling is one order at a time and must be confirmed.
- Open one order to see its detail (lines, the reason it was held, customer notes) without losing his place in the list.
- Make the oldest and most urgent orders (delivery tomorrow) easy to spot.

## Content to use

Today is Wednesday 15 October, 14:30. Queue: 12 orders.

| Order | Customer | Reason held | Value (GBP) | Lines | In queue | Delivery |
| --- | --- | --- | --- | --- | --- | --- |
| OH-20418 | Little Fig Café | Over credit limit | 642.80 | 9 | 26 h | Thu 16 Oct |
| OH-20422 | Bramble & Rye | Unusually large | 3,915.00 | 22 | 21 h | Fri 17 Oct |
| OH-20425 | Harbour Street Bakery | Item out of stock | 288.40 | 6 | 19 h | Thu 16 Oct |
| OH-20431 | The Daily Crumb | Address rejected | 154.10 | 3 | 7 h | Thu 16 Oct |
| OH-20433 | Copper Kettle Tea Room | Over credit limit | 1,208.55 | 14 | 6 h | Mon 20 Oct |
| OH-20434 | Bramble & Rye | Unusually large | 4,102.75 | 25 | 6 h | Mon 20 Oct |
| OH-20436 | Kiln Coffee | Item out of stock | 96.00 | 2 | 5 h | Fri 17 Oct |
| OH-20437 | Northgate Deli | Item out of stock | 431.20 | 8 | 4 h | Thu 16 Oct |
| OH-20439 | Saltmarsh Kitchen | Address rejected | 212.65 | 4 | 3 h | Fri 17 Oct |
| OH-20440 | Little Fig Café | Over credit limit | 118.30 | 2 | 2 h | Fri 17 Oct |
| OH-20441 | Wren's Patisserie | Unusually large | 2,760.00 | 18 | 1 h | Tue 21 Oct |
| OH-20442 | Kiln Coffee | Item out of stock | 74.50 | 1 | 25 min | Mon 20 Oct |

Detail for OH-20425 (use it for the open order): Harbour Street Bakery, account HSB-118, credit limit GBP 2,000 (GBP 1,410 used). Held because "Strong white flour 16 kg" is out of stock until Mon 20 Oct. Lines include Strong white flour 16 kg × 4, Unsalted butter 10 kg × 2, Cake boxes 10 in × 200. Customer note: "Please call before substituting anything."

## States

- `default`: the queue as above.
- `filtered-no-results`: a search for "OH-1999" with no matching order; offer a way back to the full queue.
- `rows-selected`: three orders selected, with the bulk actions available.
- `order-open`: the detail of OH-20425 open.
- `loading`: the queue is loading.
- `error`: the queue failed to load; say what failed and how to retry.
- `queue-empty`: no orders need checking.

## Out of scope

Editing order lines, customer records, other pages and real data loading.
