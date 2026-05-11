WITH seed(id, name, type, icon, color) AS (
  VALUES
    ('sys_food_dining', 'Food & Dining', 'EXPENSE'::"TransactionType", 'utensils', '#16A34A'),
    ('sys_shopping_retail', 'Shopping & Retail', 'EXPENSE'::"TransactionType", 'shopping-bag', '#DB2777'),
    ('sys_transportation', 'Transportation', 'EXPENSE'::"TransactionType", 'car', '#2563EB'),
    ('sys_healthcare_medical', 'Healthcare & Medical', 'EXPENSE'::"TransactionType", 'heart-pulse', '#DC2626'),
    ('sys_utilities_bills', 'Utilities & Bills', 'EXPENSE'::"TransactionType", 'receipt', '#CA8A04'),
    ('sys_entertainment_recreation', 'Entertainment & Recreation', 'EXPENSE'::"TransactionType", 'ticket', '#7C3AED'),
    ('sys_financial_services', 'Financial Services', 'EXPENSE'::"TransactionType", 'landmark', '#0891B2'),
    ('sys_government_legal', 'Government & Legal', 'EXPENSE'::"TransactionType", 'scale', '#4B5563'),
    ('sys_charity_donations', 'Charity & Donations', 'EXPENSE'::"TransactionType", 'hand-heart', '#EA580C'),
    ('sys_income', 'Income', 'INCOME'::"TransactionType", 'wallet', '#059669'),
    ('sys_miscellaneous', 'Miscellaneous', 'EXPENSE'::"TransactionType", 'circle-help', '#64748B')
),
updated AS (
  UPDATE "categories" c
  SET
    "icon" = seed.icon,
    "color" = seed.color,
    "isSystem" = true,
    "isArchived" = false,
    "updatedAt" = CURRENT_TIMESTAMP
  FROM seed
  WHERE c."userId" IS NULL
    AND c."name" = seed.name
    AND c."type" = seed.type
  RETURNING c."name", c."type"
)
INSERT INTO "categories" (
  "id",
  "userId",
  "name",
  "type",
  "icon",
  "color",
  "isSystem",
  "isArchived",
  "createdAt",
  "updatedAt"
)
SELECT
  seed.id,
  NULL,
  seed.name,
  seed.type,
  seed.icon,
  seed.color,
  true,
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM seed
WHERE NOT EXISTS (
  SELECT 1
  FROM "categories" c
  WHERE c."userId" IS NULL
    AND c."name" = seed.name
    AND c."type" = seed.type
);
