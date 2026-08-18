/* =====================================================================
   Sample database for the SQL course — a small online shop.
   One schema, reused by every lesson (consistency + interleaving).

   Deliberate "teaching hooks" baked into the data:
     - customers.country and customers.email contain NULLs  -> NULL logic
     - customer #10 (Jack) has NO orders                    -> anti-joins
     - category #7 (Garden) has NO products                 -> LEFT JOIN gaps
     - products #4, #10 have stock = 0                       -> filters / CASE
     - orders have statuses paid/shipped/pending/cancelled
     - only paid & shipped orders have a payment row         -> orders w/o payment
   Exported as a single SQL string; run once with db.exec().
   ===================================================================== */

export const SEED_SQL = `
DROP TABLE IF EXISTS order_items, payments, orders, products, categories, customers CASCADE;

CREATE TABLE customers (
  customer_id  int PRIMARY KEY,
  name         text NOT NULL,
  email        text UNIQUE,
  country      text,
  created_at   date NOT NULL
);

CREATE TABLE categories (
  category_id  int PRIMARY KEY,
  name         text NOT NULL
);

CREATE TABLE products (
  product_id   int PRIMARY KEY,
  name         text NOT NULL,
  category_id  int REFERENCES categories(category_id),
  price        numeric(10,2) NOT NULL,
  stock        int NOT NULL DEFAULT 0
);

CREATE TABLE orders (
  order_id     int PRIMARY KEY,
  customer_id  int REFERENCES customers(customer_id),
  status       text NOT NULL,
  created_at   date NOT NULL
);

CREATE TABLE order_items (
  order_item_id int PRIMARY KEY,
  order_id      int REFERENCES orders(order_id),
  product_id    int REFERENCES products(product_id),
  quantity      int NOT NULL,
  unit_price    numeric(10,2) NOT NULL
);

CREATE TABLE payments (
  payment_id   int PRIMARY KEY,
  order_id     int REFERENCES orders(order_id),
  amount       numeric(10,2) NOT NULL,
  method       text NOT NULL,
  paid_at      date NOT NULL
);

INSERT INTO customers (customer_id, name, email, country, created_at) VALUES
  (1,  'Alice Johnson', 'alice@example.com',  'USA',     '2024-01-05'),
  (2,  'Bob Smith',     'bob@example.com',    'USA',     '2024-02-11'),
  (3,  'Carla Diaz',    'carla@example.com',  'Spain',   '2024-02-20'),
  (4,  'Dmitry Ivanov', 'dmitry@example.com', NULL,      '2024-03-02'),
  (5,  'Emma Brown',    'emma@example.com',   'UK',      '2024-03-15'),
  (6,  'Farid Khan',    'farid@example.com',  'India',   '2024-04-01'),
  (7,  'Grace Lee',     'grace@example.com',  NULL,      '2024-04-18'),
  (8,  'Hugo Martin',   'hugo@example.com',   'France',  '2024-05-09'),
  (9,  'Iryna Koval',   'iryna@example.com',  'Ukraine', '2024-06-01'),
  (10, 'Jack Wilson',   NULL,                 'USA',     '2024-06-20');

INSERT INTO categories (category_id, name) VALUES
  (1, 'Electronics'),
  (2, 'Books'),
  (3, 'Clothing'),
  (4, 'Home'),
  (5, 'Toys'),
  (6, 'Sports'),
  (7, 'Garden');

INSERT INTO products (product_id, name, category_id, price, stock) VALUES
  (1,  'Wireless Mouse',           1, 25.00, 120),
  (2,  'Mechanical Keyboard',      1, 75.00,  60),
  (3,  'USB-C Cable',              1,  9.50, 300),
  (4,  'Noise-Cancel Headphones',  1, 199.00,  0),
  (5,  'SQL Cookbook',             2, 39.90,  40),
  (6,  'Clean Code',               2, 33.50,  55),
  (7,  'The Pragmatic Programmer', 2, 42.00,  30),
  (8,  'T-Shirt',                  3, 15.00, 200),
  (9,  'Hoodie',                   3, 45.00,  80),
  (10, 'Jeans',                    3, 60.00,   0),
  (11, 'Coffee Mug',               4, 12.00, 150),
  (12, 'Desk Lamp',                4, 29.99,  45),
  (13, 'Throw Pillow',             4, 22.00,  60),
  (14, 'Lego Set',                 5, 89.00,  25),
  (15, 'Puzzle 1000',              5, 18.00,  70),
  (16, 'Yoga Mat',                 6, 35.00,  90),
  (17, 'Dumbbell 5kg',             6, 27.50,  40),
  (18, 'Water Bottle',             6, 14.00, 110);

INSERT INTO orders (order_id, customer_id, status, created_at) VALUES
  (100, 1, 'paid',      '2024-03-01'),
  (101, 1, 'shipped',   '2024-05-10'),
  (102, 2, 'paid',      '2024-03-05'),
  (103, 3, 'pending',   '2024-03-20'),
  (104, 3, 'cancelled', '2024-04-02'),
  (105, 4, 'paid',      '2024-04-10'),
  (106, 5, 'shipped',   '2024-04-22'),
  (107, 6, 'paid',      '2024-05-01'),
  (108, 6, 'paid',      '2024-06-15'),
  (109, 7, 'pending',   '2024-05-18'),
  (110, 8, 'paid',      '2024-05-25'),
  (111, 9, 'shipped',   '2024-06-05'),
  (112, 1, 'paid',      '2024-07-01'),
  (113, 2, 'cancelled', '2024-07-08');

INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price) VALUES
  (1,  100, 1,  2, 25.00),
  (2,  100, 5,  1, 39.90),
  (3,  101, 2,  1, 75.00),
  (4,  101, 3,  3,  9.50),
  (5,  102, 4,  1, 199.00),
  (6,  103, 8,  2, 15.00),
  (7,  103, 9,  1, 45.00),
  (8,  104, 10, 1, 60.00),
  (9,  105, 6,  1, 33.50),
  (10, 105, 7,  1, 42.00),
  (11, 105, 11, 2, 12.00),
  (12, 106, 12, 1, 29.99),
  (13, 106, 13, 2, 22.00),
  (14, 107, 14, 1, 89.00),
  (15, 108, 15, 3, 18.00),
  (16, 108, 16, 1, 35.00),
  (17, 109, 18, 2, 14.00),
  (18, 110, 17, 2, 27.50),
  (19, 110, 16, 1, 35.00),
  (20, 111, 2,  1, 75.00),
  (21, 111, 1,  1, 25.00),
  (22, 112, 5,  1, 39.90),
  (23, 112, 6,  1, 33.50),
  (24, 113, 9,  2, 45.00);

INSERT INTO payments (payment_id, order_id, amount, method, paid_at) VALUES
  (1,  100,  89.90, 'card',   '2024-03-01'),
  (2,  101, 103.50, 'paypal', '2024-05-11'),
  (3,  102, 199.00, 'card',   '2024-03-06'),
  (4,  105,  99.50, 'wire',   '2024-04-11'),
  (5,  106,  73.99, 'card',   '2024-04-23'),
  (6,  107,  89.00, 'paypal', '2024-05-01'),
  (7,  108,  89.00, 'card',   '2024-06-16'),
  (8,  110,  90.00, 'card',   '2024-05-26'),
  (9,  111, 100.00, 'wire',   '2024-06-06'),
  (10, 112,  73.40, 'paypal', '2024-07-02');
`;
