import bcrypt from 'bcryptjs';
import { addDays, addMonths, monthOf, parseDate } from '../lib/calendar.js';
import { BillModel } from '../modules/bills/bill.model.js';
import { BudgetModel } from '../modules/budgets/budget.model.js';
import { ExpenseModel } from '../modules/expenses/expense.model.js';
import { GroceryItemModel, GroceryListModel } from '../modules/groceries/grocery.model.js';
import { NoteModel } from '../modules/notes/note.model.js';
import { TaskModel } from '../modules/tasks/task.model.js';
import { UserModel } from '../modules/users/user.model.js';

/** Demo accounts for local development and the university demo only. */
export const DEMO_USERS = {
  primary: { name: 'Sifat', email: 'demo@lifemate.app', password: 'LifeMate2026' },
  flatmate: { name: 'Limon', email: 'flatmate@lifemate.app', password: 'LifeMate2026' },
} as const;

/** Today's date in the demo timezone (Bangladesh by default). */
export function localToday(timeZone = process.env.SEED_TZ ?? 'Asia/Dhaka'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(),
  );
}

const tk = (taka: number) => Math.round(taka * 100);

export async function seedDemoData(rounds = 10): Promise<void> {
  const today = localToday();
  const month = monthOf(today);
  const prevMonth = monthOf(addMonths(`${month}-01`, -1, 1));
  const passwordHash = await bcrypt.hash(DEMO_USERS.primary.password, rounds);

  const [user, flatmate] = await UserModel.create([
    { name: DEMO_USERS.primary.name, email: DEMO_USERS.primary.email, passwordHash },
    { name: DEMO_USERS.flatmate.name, email: DEMO_USERS.flatmate.email, passwordHash },
  ]);
  const uid = user!._id;

  await TaskModel.insertMany(
    [
      { title: 'Submit SDP progress report', priority: 'high', dueDate: today, dueTime: '17:00', reminderMinutesBefore: 30 },
      { title: 'Call Ammu after class', priority: 'medium', dueDate: today, dueTime: '20:30', reminderMinutesBefore: 0 },
      { title: 'Evening walk', priority: 'low', dueDate: today, recurrence: 'daily' },
      { title: 'Review Software Engineering lecture notes', priority: 'medium', dueDate: addDays(today, -1) },
      { title: "Buy a birthday gift for Nusrat", priority: 'medium', dueDate: addDays(today, 1) },
      { title: 'Sprint review with the team', priority: 'high', dueDate: addDays(today, 2), dueTime: '21:00', reminderMinutesBefore: 60, recurrence: 'weekly' },
      { title: 'Renew library card', priority: 'low', dueDate: addDays(today, 6) },
      { title: 'Plan weekend trip to Sreemangal', priority: 'low', dueDate: null },
      { title: 'Morning revision session', priority: 'medium', dueDate: today, completed: true, completedAt: new Date(), completedOn: today },
    ].map((t) => ({ ...t, user: uid, anchorDay: null })),
  );

  const day = parseDate(today).d;
  const thisMonth = (d: number) => `${month}-${String(Math.min(d, day)).padStart(2, '0')}`;
  await ExpenseModel.insertMany(
    [
      { amount: tk(12000), category: 'housing', note: 'Flat rent share', date: thisMonth(1) },
      { amount: tk(1450), category: 'food', note: 'Weekly bazar', date: thisMonth(2) },
      { amount: tk(180), category: 'food', note: 'Lunch at campus', date: thisMonth(3) },
      { amount: tk(60), category: 'transport', note: 'Rickshaw', date: thisMonth(3) },
      { amount: tk(320), category: 'transport', note: 'Uber to Mirpur', date: thisMonth(4) },
      { amount: tk(299), category: 'bills', note: 'Mobile recharge', date: thisMonth(5) },
      { amount: tk(850), category: 'education', note: 'Reference book', date: thisMonth(6) },
      { amount: tk(520), category: 'health', note: 'Pharmacy', date: thisMonth(7) },
      { amount: tk(1250), category: 'entertainment', note: 'Movie with friends', date: thisMonth(8) },
      { amount: tk(2380), category: 'food', note: 'Groceries', date: thisMonth(9) },
      { amount: tk(240), category: 'food', note: 'Tea and snacks', date: thisMonth(10) },
      { amount: tk(1650), category: 'shopping', note: 'T-shirt', date: thisMonth(10) },
      { amount: tk(95.5), category: 'transport', note: 'Bus fare', date: today },
      { amount: tk(210), category: 'food', note: 'Dinner', date: today },
      // Previous month for history and charts
      { amount: tk(12000), category: 'housing', note: 'Flat rent share', date: `${prevMonth}-01` },
      { amount: tk(6100), category: 'food', note: 'Food total', date: `${prevMonth}-15` },
      { amount: tk(1900), category: 'transport', note: 'Transport total', date: `${prevMonth}-20` },
    ].map((e) => ({ ...e, user: uid })),
  );

  await BudgetModel.create({
    user: uid,
    month,
    overall: tk(25000),
    categories: [
      { category: 'food', limit: tk(8000) },
      { category: 'transport', limit: tk(2500) },
      { category: 'entertainment', limit: tk(1500) },
    ],
  });

  const bill = (name: string, amount: number, dueDate: string, extra: Record<string, unknown> = {}) => ({
    user: uid,
    name,
    amount: tk(amount),
    dueDate,
    anchorDay: parseDate(dueDate).d,
    recurrence: 'monthly',
    ...extra,
  });
  await BillModel.insertMany([
    bill('Gas bill (Titas)', 1080, addDays(today, -2), { category: 'bills' }),
    bill('Internet (Link3)', 1200, addDays(today, 3), { category: 'bills', reminderDaysBefore: 2 }),
    bill('Electricity (DESCO)', 1850, addDays(today, 9), { category: 'bills' }),
    bill('Spotify Premium', 199, addDays(today, 12), { category: 'entertainment' }),
    bill('Flat rent', 12000, addMonths(`${month}-01`, 1, 1), { category: 'housing', reminderDaysBefore: 3 }),
    bill('Semester fee instalment', 18500, addDays(today, 24), { category: 'education', recurrence: 'none' }),
  ]);

  const [bazar, flat] = await GroceryListModel.create([
    { owner: uid, name: 'Weekly bazar', members: [flatmate!._id] },
    { owner: uid, name: 'Flat essentials' },
  ]);
  const item = (list: typeof bazar, name: string, quantity: number, unit: string, purchased = false) => ({
    list: list!._id,
    name,
    quantity,
    unit,
    purchased,
    purchasedAt: purchased ? new Date() : null,
    addedBy: uid,
  });
  await GroceryItemModel.create([
    item(bazar, 'Miniket rice', 5, 'kg'),
    item(bazar, 'Eggs', 12, 'pcs'),
    item(bazar, 'Potatoes', 2, 'kg'),
    item(bazar, 'Masoor dal', 1, 'kg'),
    item(bazar, 'Onions', 1, 'kg', true),
    item(bazar, 'Milk', 1, 'L', true),
    item(flat, 'Dish soap', 1, ''),
    item(flat, 'Toilet paper', 4, 'rolls'),
    item(flat, 'Detergent', 1, 'kg'),
  ]);

  await NoteModel.create([
    {
      user: uid,
      title: 'Final exam prep',
      pinned: true,
      checklist: [
        { text: 'Finish DBMS assignment', done: true },
        { text: 'Revise OS scheduling', done: false },
        { text: 'Past papers: Software Engineering', done: false },
      ],
    },
    { user: uid, title: 'Gift ideas', body: 'Nusrat: a plant, a book by Humayun Ahmed, or a sketchbook.' },
  ]);
}
