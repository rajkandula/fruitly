/** Seed catalog for Fruitly. Prices in cents. Product photos live in /public/images/products (see /credits for licenses). */
export const CATEGORIES = [
  { slug: "tropical", name: "Tropical", emoji: "🥭", description: "Sun-ripened mangoes, pineapples, bananas and more.", sort_order: 1 },
  { slug: "citrus", name: "Citrus", emoji: "🍊", description: "Zesty oranges, lemons and mandarins.", sort_order: 2 },
  { slug: "berries", name: "Berries & Grapes", emoji: "🍓", description: "Hand-picked berries and sweet grapes.", sort_order: 3 },
  { slug: "stone-fruits", name: "Stone Fruits", emoji: "🍑", description: "Peaches, cherries and plums at peak season.", sort_order: 4 },
  { slug: "apples-pears", name: "Apples & Pears", emoji: "🍎", description: "Crisp orchard favourites.", sort_order: 5 },
  { slug: "melons", name: "Melons", emoji: "🍉", description: "Juicy, refreshing and big enough to share.", sort_order: 6 },
  { slug: "exotic", name: "Exotic", emoji: "🥝", description: "Something a little different.", sort_order: 7 },
  { slug: "boxes", name: "Boxes & Baskets", emoji: "🧺", description: "Curated bundles and gift baskets.", sort_order: 8 },
];

export interface SeedProduct {
  slug: string; name: string; category: string; emoji: string; colors: [string, string]; price_cents: number; compare_at_cents?: number;
  unit: string; stock: number; badge?: string; origin: string; description: string; nutrition: Record<string, string>; featured?: boolean;
}

export const PRODUCTS: SeedProduct[] = [
  { slug: "alphonso-mango", name: "Alphonso Mangoes", category: "tropical", emoji: "🥭", colors: ["#fde68a", "#f97316"], price_cents: 1299, compare_at_cents: 1599, unit: "box", stock: 40, badge: "Seasonal", origin: "Ratnagiri, India", featured: true,
    description: "The king of mangoes. Saffron-coloured, silky flesh with honeyed, floral sweetness and almost no fibre. Each box holds 6 hand-graded fruits picked at the ideal stage to ripen on your counter in 2–3 days.", nutrition: { serving: "1 mango (200g)", calories: "120", sugar: "27g", fiber: "3g", vitaminC: "67% DV" } },
  { slug: "cavendish-bananas", name: "Cavendish Bananas", category: "tropical", emoji: "🍌", colors: ["#fef9c3", "#facc15"], price_cents: 249, unit: "bunch", stock: 200, origin: "Ecuador", featured: true,
    description: "Everyday bananas with a creamy texture and classic flavour. Sold in bunches of 6–7. Buy them slightly green and they'll be perfect in a couple of days.", nutrition: { serving: "1 banana (118g)", calories: "105", sugar: "14g", fiber: "3g", potassium: "9% DV" } },
  { slug: "gold-pineapple", name: "Gold Pineapple", category: "tropical", emoji: "🍍", colors: ["#fef3c7", "#f59e0b"], price_cents: 449, unit: "each", stock: 60, origin: "Costa Rica",
    description: "Extra-sweet MD-2 gold pineapple with low acidity and deep golden flesh. Ready to eat — no need to wait. Great grilled, juiced or straight from the core.", nutrition: { serving: "1 cup (165g)", calories: "82", sugar: "16g", fiber: "2g", vitaminC: "131% DV" } },
  { slug: "young-coconut", name: "Young Coconut", category: "tropical", emoji: "🥥", colors: ["#ecfccb", "#84cc16"], price_cents: 399, unit: "each", stock: 45, origin: "Thailand",
    description: "Trimmed young Thai coconut full of sweet, electrolyte-rich water and soft jelly flesh. Chill, crack, and sip.", nutrition: { serving: "1 cup water (240ml)", calories: "46", sugar: "6g", potassium: "17% DV" } },
  { slug: "papaya-formosa", name: "Formosa Papaya", category: "tropical", emoji: "🍈", colors: ["#ffedd5", "#fb923c"], price_cents: 599, unit: "each", stock: 30, origin: "Brazil",
    description: "Large, musky-sweet papaya with coral-orange flesh. Squeeze of lime recommended. Ripe when the skin turns mostly yellow and gives slightly.", nutrition: { serving: "1 cup (145g)", calories: "62", sugar: "11g", vitaminC: "98% DV" } },

  { slug: "navel-oranges", name: "Navel Oranges", category: "citrus", emoji: "🍊", colors: ["#ffedd5", "#f97316"], price_cents: 499, unit: "kg", stock: 150, origin: "Valencia, Spain", featured: true,
    description: "Seedless, easy-peel navels with bright, juicy segments. The perfect snacking orange, and our go-to for fresh juice.", nutrition: { serving: "1 orange (140g)", calories: "73", sugar: "12g", fiber: "3g", vitaminC: "92% DV" } },
  { slug: "meyer-lemons", name: "Meyer Lemons", category: "citrus", emoji: "🍋", colors: ["#fef9c3", "#eab308"], price_cents: 349, unit: "pack", stock: 80, origin: "California, USA", badge: "Chef's pick",
    description: "A lemon–mandarin cross with thin, fragrant skin and gentler acidity. Pack of 4. Ideal for desserts, dressings and cocktails.", nutrition: { serving: "1 lemon (58g)", calories: "17", sugar: "1g", vitaminC: "51% DV" } },
  { slug: "clementines", name: "Clementines", category: "citrus", emoji: "🍊", colors: ["#fff7ed", "#fb923c"], price_cents: 649, unit: "kg", stock: 120, origin: "Morocco",
    description: "Tiny, seedless and super sweet — clementines peel in seconds and disappear just as fast. A lunchbox essential.", nutrition: { serving: "1 clementine (74g)", calories: "35", sugar: "7g", vitaminC: "40% DV" } },
  { slug: "pink-grapefruit", name: "Pink Grapefruit", category: "citrus", emoji: "🍊", colors: ["#ffe4e6", "#fb7185"], price_cents: 279, unit: "each", stock: 70, origin: "Florida, USA",
    description: "Ruby-blushed grapefruit with a sweet-tart balance. Halve and spoon for breakfast, or segment into salads.", nutrition: { serving: "½ grapefruit (123g)", calories: "52", sugar: "8g", vitaminC: "64% DV" } },

  { slug: "strawberries", name: "Strawberries", category: "berries", emoji: "🍓", colors: ["#ffe4e6", "#ef4444"], price_cents: 549, unit: "pack", stock: 90, origin: "Jersey farms", badge: "Fresh today", featured: true,
    description: "Picked this morning, delivered today. Fragrant, deep-red strawberries in a 400g punnet. Keep chilled and eat within 2 days for peak flavour.", nutrition: { serving: "1 cup (152g)", calories: "49", sugar: "7g", fiber: "3g", vitaminC: "149% DV" } },
  { slug: "blueberries", name: "Blueberries", category: "berries", emoji: "🫐", colors: ["#e0e7ff", "#4f46e5"], price_cents: 499, unit: "pack", stock: 110, origin: "Hammonton, New Jersey", featured: true,
    description: "Plump, dusty-blue berries with a sweet pop. 250g punnet. Brilliant in yoghurt, pancakes or by the handful.", nutrition: { serving: "1 cup (148g)", calories: "84", sugar: "15g", fiber: "4g", vitaminK: "36% DV" } },
  { slug: "red-seedless-grapes", name: "Red Seedless Grapes", category: "berries", emoji: "🍇", colors: ["#f3e8ff", "#a21caf"], price_cents: 699, unit: "kg", stock: 85, origin: "Chile",
    description: "Crisp, crunchy red grapes with a honeyed finish. Freeze a bunch for an instant summer treat.", nutrition: { serving: "1 cup (151g)", calories: "104", sugar: "23g", fiber: "1g" } },
  { slug: "raspberries", name: "Raspberries", category: "berries", emoji: "🍓", colors: ["#fce7f3", "#db2777"], price_cents: 599, unit: "pack", stock: 40, origin: "Jersey farms",
    description: "Delicate, velvety raspberries with the perfect tart-sweet balance. 170g punnet. Handle gently and enjoy soon.", nutrition: { serving: "1 cup (123g)", calories: "64", sugar: "5g", fiber: "8g", vitaminC: "54% DV" } },

  { slug: "bing-cherries", name: "Bing Cherries", category: "stone-fruits", emoji: "🍒", colors: ["#fee2e2", "#b91c1c"], price_cents: 1199, unit: "kg", stock: 50, origin: "Washington, USA", badge: "Limited",
    description: "Deep-mahogany Bing cherries — firm, snappy and intensely sweet. The short season makes every bag count.", nutrition: { serving: "1 cup (138g)", calories: "87", sugar: "18g", fiber: "3g" } },
  { slug: "yellow-peaches", name: "Yellow Peaches", category: "stone-fruits", emoji: "🍑", colors: ["#ffedd5", "#f472b6"], price_cents: 799, unit: "kg", stock: 65, origin: "Gloucester County, New Jersey", featured: true,
    description: "Tree-ripened freestone peaches that drip down your chin. Ready in 1–2 days on the counter; refrigerate once soft.", nutrition: { serving: "1 peach (150g)", calories: "59", sugar: "13g", fiber: "2g", vitaminC: "17% DV" } },
  { slug: "black-plums", name: "Black Plums", category: "stone-fruits", emoji: "🍑", colors: ["#ede9fe", "#6d28d9"], price_cents: 649, unit: "kg", stock: 55, origin: "South Africa",
    description: "Glossy, dark-skinned plums with juicy amber flesh and a tangy skin. Great fresh or roasted with a little honey.", nutrition: { serving: "2 plums (132g)", calories: "61", sugar: "13g", fiber: "2g" } },
  { slug: "apricots", name: "Apricots", category: "stone-fruits", emoji: "🍑", colors: ["#fef3c7", "#fb923c"], price_cents: 899, unit: "kg", stock: 35, origin: "Turkey",
    description: "Small, velvety apricots with a floral perfume and a tender bite. Perfect for jam, tarts or snacking.", nutrition: { serving: "3 apricots (105g)", calories: "50", sugar: "10g", fiber: "2g", vitaminA: "20% DV" } },

  { slug: "honeycrisp-apples", name: "Honeycrisp Apples", category: "apples-pears", emoji: "🍎", colors: ["#fee2e2", "#dc2626"], price_cents: 599, unit: "kg", stock: 140, origin: "Hudson Valley, New York", featured: true,
    description: "Explosively crisp and juicy with a balanced sweet-tart flavour. The apple that converts apple-sceptics.", nutrition: { serving: "1 apple (182g)", calories: "95", sugar: "19g", fiber: "4g" } },
  { slug: "granny-smith-apples", name: "Granny Smith Apples", category: "apples-pears", emoji: "🍏", colors: ["#ecfccb", "#65a30d"], price_cents: 449, unit: "kg", stock: 130, origin: "New Zealand",
    description: "Bright green, bracingly tart and wonderfully crunchy. The baker's apple — holds its shape in pies and crumbles.", nutrition: { serving: "1 apple (182g)", calories: "95", sugar: "19g", fiber: "4g" } },
  { slug: "bartlett-pears", name: "Bartlett Pears", category: "apples-pears", emoji: "🍐", colors: ["#f7fee7", "#a3e635"], price_cents: 529, unit: "kg", stock: 75, origin: "Oregon, USA",
    description: "Classic bell-shaped pears that turn from green to golden as they ripen, becoming buttery, juicy and aromatic.", nutrition: { serving: "1 pear (178g)", calories: "101", sugar: "17g", fiber: "6g" } },

  { slug: "seedless-watermelon", name: "Seedless Watermelon", category: "melons", emoji: "🍉", colors: ["#dcfce7", "#16a34a"], price_cents: 799, unit: "each", stock: 40, origin: "Mexico", featured: true,
    description: "A whole 4–5kg seedless watermelon, deep red and ultra-refreshing. Thumps hollow, tastes like summer.", nutrition: { serving: "1 cup (152g)", calories: "46", sugar: "9g", vitaminC: "21% DV" } },
  { slug: "cantaloupe", name: "Cantaloupe", category: "melons", emoji: "🍈", colors: ["#ffedd5", "#f59e0b"], price_cents: 449, unit: "each", stock: 50, origin: "California, USA",
    description: "Fragrant, netted cantaloupe with sweet orange flesh. Ripe when it smells sweet at the stem end.", nutrition: { serving: "1 cup (160g)", calories: "54", sugar: "13g", vitaminA: "120% DV" } },
  { slug: "honeydew-melon", name: "Honeydew Melon", category: "melons", emoji: "🍈", colors: ["#f0fdf4", "#4ade80"], price_cents: 499, unit: "each", stock: 45, origin: "Guatemala",
    description: "Smooth, pale-green honeydew with mellow, honeyed sweetness. Lovely with prosciutto or in fruit salads.", nutrition: { serving: "1 cup (170g)", calories: "61", sugar: "14g", vitaminC: "34% DV" } },

  { slug: "golden-kiwi", name: "Golden Kiwi", category: "exotic", emoji: "🥝", colors: ["#fef9c3", "#ca8a04"], price_cents: 549, unit: "pack", stock: 70, origin: "New Zealand", badge: "New",
    description: "Smooth-skinned golden kiwis — sweeter and less tangy than green, with tropical notes. Pack of 4. Scoop with a spoon.", nutrition: { serving: "1 kiwi (81g)", calories: "51", sugar: "10g", vitaminC: "100%+ DV" } },
  { slug: "hass-avocados", name: "Hass Avocados", category: "exotic", emoji: "🥑", colors: ["#ecfccb", "#3f6212"], price_cents: 699, unit: "pack", stock: 95, origin: "Michoacán, Mexico", featured: true,
    description: "Creamy, nutty Hass avocados, pack of 4 at mixed ripeness so you have one ready every day. Yes — botanically a fruit.", nutrition: { serving: "½ avocado (68g)", calories: "114", fat: "10g", fiber: "5g", potassium: "7% DV" } },
  { slug: "heirloom-tomatoes", name: "Heirloom Tomatoes", category: "exotic", emoji: "🍅", colors: ["#fee2e2", "#dc2626"], price_cents: 749, unit: "kg", stock: 40, origin: "Jersey greenhouses",
    description: "A rainbow mix of heirloom varieties — Brandywine, Green Zebra, Cherokee Purple. Intensely flavoured. Never refrigerate.", nutrition: { serving: "1 tomato (123g)", calories: "22", sugar: "3g", vitaminC: "28% DV" } },
  { slug: "pomegranate", name: "Pomegranate", category: "exotic", emoji: "🍎", colors: ["#fce7f3", "#9f1239"], price_cents: 399, unit: "each", stock: 60, origin: "Turkey",
    description: "Heavy, ruby-red pomegranates packed with jewel-like arils. Tap out the seeds with a wooden spoon over a bowl.", nutrition: { serving: "½ cup arils (87g)", calories: "72", sugar: "12g", fiber: "3g" } },

  { slug: "seasonal-fruit-basket", name: "Seasonal Fruit Basket", category: "boxes", emoji: "🧺", colors: ["#fef3c7", "#d97706"], price_cents: 3999, compare_at_cents: 4699, unit: "basket", stock: 25, badge: "Best seller", origin: "Mixed", featured: true,
    description: "Our most popular gift. A woven basket with 12–14 pieces of the best fruit of the week — always including something tropical, something crisp and a punnet of berries. Add a gift note at checkout.", nutrition: { serving: "Varies", note: "Contents change weekly" } },
  { slug: "tropical-box", name: "Tropical Box", category: "boxes", emoji: "📦", colors: ["#fef9c3", "#f97316"], price_cents: 2999, unit: "box", stock: 30, origin: "Mixed",
    description: "Mango, pineapple, papaya, young coconut, bananas and golden kiwis — a week of sunshine in one box.", nutrition: { serving: "Varies", note: "6 varieties" } },
  { slug: "berry-lovers-box", name: "Berry Lovers Box", category: "boxes", emoji: "🍓", colors: ["#fce7f3", "#be185d"], price_cents: 2499, unit: "box", stock: 30, origin: "Mixed",
    description: "Strawberries, blueberries, raspberries and red grapes — delivered chilled. Perfect for brunch or a very good week of breakfasts.", nutrition: { serving: "Varies", note: "4 punnets" } },
  { slug: "office-fruit-box", name: "Office Fruit Box", category: "boxes", emoji: "🏢", colors: ["#dbeafe", "#2563eb"], price_cents: 5499, unit: "box", stock: 20, origin: "Mixed",
    description: "Around 40 pieces of easy-eating fruit — bananas, apples, clementines, pears and grapes — for a team of 10–15. Weekly subscriptions available on request.", nutrition: { serving: "Varies", note: "~40 pieces" } },
];

export const COUPONS = [
  { code: "WELCOME10", type: "percent" as const, value: 10, min_subtotal_cents: 1500, max_uses: null, expires_at: null, is_active: 1 },
  { code: "FRESH5", type: "fixed" as const, value: 500, min_subtotal_cents: 3000, max_uses: 500, expires_at: null, is_active: 1 },
];
