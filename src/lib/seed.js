// Three example recipes so the app isn't empty on first run. Clearly deletable.
import { uid, toDateInputValue } from './util.js'

// Local "YYYY-MM-DD" for N days ago, for seeding cook history.
const daysAgoStr = (n) => toDateInputValue(new Date(Date.now() - n * 86400000))

export function seedRecipes() {
  const t = new Date().toISOString()
  return [
    {
      id: uid(),
      name: 'Sheet-Pan Chicken Thighs & Veg',
      category: 'Chicken',
      sourceUrl: null,
      ingredients: [
        { name: 'chicken thighs', quantity: 1, unit: 'lb' },
        { name: 'baby potatoes', quantity: 12, unit: null },
        { name: 'red onion', quantity: 1, unit: null },
        { name: 'olive oil', quantity: 2, unit: 'tbsp' },
        { name: 'garlic', quantity: 3, unit: 'clove' },
        { name: 'smoked paprika', quantity: 1, unit: 'tsp' },
        { name: 'salt', quantity: null, unit: null },
      ],
      steps: [
        'Heat oven to 425°F.',
        'Toss potatoes, onion, garlic with oil, paprika, and salt on a sheet pan.',
        'Nestle chicken thighs on top and roast 35 minutes until cooked through.',
      ],
      servings: 2,
      timesCooked: 2,
      createdAt: t,
      lastCookedAt: new Date(Date.now() - 21 * 86400000).toISOString(),
      cookLog: [daysAgoStr(21), daysAgoStr(40)],
      _seed: true,
    },
    {
      id: uid(),
      name: 'Weeknight Tomato Pasta',
      category: 'Pasta',
      sourceUrl: null,
      ingredients: [
        { name: 'spaghetti', quantity: 6, unit: 'oz' },
        { name: 'canned crushed tomatoes', quantity: 1, unit: 'can' },
        { name: 'garlic', quantity: 2, unit: 'clove' },
        { name: 'olive oil', quantity: 2, unit: 'tbsp' },
        { name: 'parmesan', quantity: 0.5, unit: 'cup' },
        { name: 'basil', quantity: 0.25, unit: 'cup' },
      ],
      steps: [
        'Boil spaghetti in salted water until al dente.',
        'Sizzle sliced garlic in olive oil, add tomatoes, simmer 10 minutes.',
        'Toss pasta with sauce; finish with parmesan and torn basil.',
      ],
      servings: 2,
      timesCooked: 0,
      createdAt: t,
      lastCookedAt: null,
      cookLog: [],
      _seed: true,
    },
    {
      id: uid(),
      name: 'Black Bean Quesadillas',
      category: 'Vegetarian',
      sourceUrl: null,
      ingredients: [
        { name: 'flour tortillas', quantity: 4, unit: null },
        { name: 'canned black beans', quantity: 1, unit: 'can' },
        { name: 'cheddar cheese', quantity: 1, unit: 'cup' },
        { name: 'bell pepper', quantity: 1, unit: null },
        { name: 'cumin', quantity: 1, unit: 'tsp' },
      ],
      steps: [
        'Mash beans lightly with cumin.',
        'Fill tortillas with beans, diced pepper, and cheese.',
        'Griddle in a dry pan until golden and melty, about 3 minutes per side.',
      ],
      servings: 2,
      timesCooked: 1,
      createdAt: t,
      lastCookedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      cookLog: [daysAgoStr(5)],
      _seed: true,
    },
  ]
}
