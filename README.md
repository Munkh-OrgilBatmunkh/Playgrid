# PLAYGRID — тоглоомын кредит цэнэглэх сайт (React + Vite + Supabase)

## Ажиллуулах
1. Supabase дээр шинэ project үүсгэнэ.
2. **SQL Editor** → шинэ өгөгдлийн сан бол `supabase/schema.sql`, одоо ажиллаж буй сан бол `supabase/migration_v3.sql`-ийг paste хийж **Run** дарна.
3. **Project Settings → API** хэсгээс `Project URL` болон `anon public` түлхүүрийг `.env` файлд бөглөнө.
4. (Хөгжүүлэлтийн үед) **Authentication → Providers → Email** хэсэгт "Confirm email"-ийг унтраавал бүртгүүлмэгц шууд нэвтэрнэ.
5. Терминалд:
   npm install
   npm run dev

## Carousel-ийн постер
`public/posters/` хавтаст `valorant.jpg`, `cs2.jpg`, `dota2.jpg`, `pubg-mobile.jpg` нэрээр хуулна (1600×600 санал болгоно).
Carousel-д харагдах тоглоом: Supabase → Table Editor → `games` → `is_featured = true`.
Слайд солигдох хугацаа: `src/components/ComingSoonCarousel.jsx` дахь `INTERVAL_MS`.

## Аюулгүй байдал
- `.env`-д ЗӨВХӨН anon түлхүүр. `service_role` түлхүүрийг frontend-д хэзээ ч бүү тавь. `.env` нь `.gitignore`-д орсон.
- Оноо, захиалгыг зөвхөн `place_order()` / `daily_checkin()` функц өөрчилнэ (RLS-ээр хамгаалсан) — хэрэглэгч өөрийн оноог засаж чадахгүй.

## Төлбөр (ДЕМО)
QPay QR болон картын төлбөр одоогоор туршилтын горимтой — жинхэнэ мөнгө шилжихгүй. Картын мэдээлэл хөтөч дээр шалгагдаад хаагдана, хаана ч хадгалагдахгүй.
Бодит төлбөр холбохдоо: (1) QPay merchant API-г Supabase Edge Function-аар дуудаж invoice/QR үүсгэнэ (нууц түлхүүр зөвхөн сервер талд),
(2) QPay callback (webhook)-оор `confirm_payment`-ийг service role-оор дуудна, (3) `revoke execute on function confirm_payment from authenticated`.
Картын төлбөрийг Stripe зэрэг процессороор хийнэ — картын дугаарыг өөрийн сервер/DB-д хэзээ ч бүү хадгал.
