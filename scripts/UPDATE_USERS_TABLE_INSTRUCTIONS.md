# راهنمای به‌روزرسانی جدول Users در Supabase

## مراحل اجرا:

### 1. ورود به Supabase Dashboard

- به [dashboard.supabase.com](https://dashboard.supabase.com) بروید
- پروژه Stylisto را انتخاب کنید
- از منوی سمت چپ، بخش "SQL Editor" را کلیک کنید

### 2. اجرای اسکریپت

- فایل `scripts/enhance_users_table_complete.sql` را باز کنید
- تمام محتوای فایل را کپی کنید
- در SQL Editor سوپابیس، محتوا را paste کنید
- دکمه "RUN" را کلیک کنید

### 3. تأیید نتیجه

پس از اجرای موفقیت‌آمیز، باید خروجی مشابه زیر را ببینید:

```
column_name                 | data_type                   | is_nullable | column_default
id                         | uuid                        | NO          |
email                      | text                        | NO          |
created_at                 | timestamp with time zone    | NO          | now()
updated_at                 | timestamp with time zone    | NO          | now()
first_name                 | text                        | YES         |
last_name                  | text                        | YES         |
username                   | text                        | YES         |
date_of_birth             | date                        | YES         |
gender                    | text                        | YES         |
phone                     | text                        | YES         |
avatar_url                | text                        | YES         |
country                   | text                        | YES         |
city                      | text                        | YES         |
timezone                  | text                        | YES         | 'Australia/Sydney'::text
preferred_language        | text                        | YES         | 'en'::text
preferred_currency        | text                        | YES         | 'AUD'::text
height_cm                 | integer                     | YES         |
weight_kg                 | numeric                     | YES         |
clothing_size_top         | text                        | YES         |
clothing_size_bottom      | text                        | YES         |
clothing_size_shoes       | text                        | YES         |
body_type                 | text                        | YES         |
style_preferences         | jsonb                       | YES         | '{}'::jsonb
color_preferences         | jsonb                       | YES         | '{}'::jsonb
brand_preferences         | jsonb                       | YES         | '{}'::jsonb
budget_range              | jsonb                       | YES         | '{"min": 0, "max": 1000, "currency": "AUD"}'::jsonb
privacy_settings          | jsonb                       | YES         | '{"profile_visibility": "private", "data_sharing": false}'::jsonb
notification_settings     | jsonb                       | YES         | '{"push_notifications": true, "email_notifications": true, "outfit_recommendations": true, "weather_alerts": true}'::jsonb
profile_completed         | boolean                     | YES         | false
onboarding_completed      | boolean                     | YES         | false
last_login_at             | timestamp with time zone    | YES         |
is_active                 | boolean                     | YES         | true
subscription_tier         | text                        | YES         | 'free'::text
bio                       | text                        | YES         |
website_url               | text                        | YES         |
social_links              | jsonb                       | YES         | '{}'::jsonb
```

## ستون‌های اضافه شده:

### اطلاعات شخصی:

- `first_name`: نام کاربر
- `last_name`: نام خانوادگی کاربر
- `username`: نام کاربری منحصر به فرد
- `date_of_birth`: تاریخ تولد
- `gender`: جنسیت (male, female, non-binary, prefer-not-to-say)
- `phone`: شماره تلفن
- `avatar_url`: لینک تصویر پروفایل

### مکان و منطقه زمانی:

- `country`: کشور
- `city`: شهر
- `timezone`: منطقه زمانی (پیش‌فرض: Australia/Sydney)

### تنظیمات زبان و ارز:

- `preferred_language`: زبان مورد علاقه (پیش‌فرض: en)
- `preferred_currency`: ارز مورد علاقه (پیش‌فرض: AUD)

### اندازه‌های بدن:

- `height_cm`: قد به سانتیمتر
- `weight_kg`: وزن به کیلوگرم
- `clothing_size_top`: سایز لباس بالا تنه
- `clothing_size_bottom`: سایز لباس پایین تنه
- `clothing_size_shoes`: سایز کفش
- `body_type`: نوع بدن (pear, apple, hourglass, rectangle, inverted-triangle)

### ترجیحات استایل (JSON):

- `style_preferences`: ترجیحات سبک پوشش
- `color_preferences`: ترجیحات رنگ
- `brand_preferences`: ترجیحات برند
- `budget_range`: محدوده بودجه

### تنظیمات حریم خصوصی و اعلان‌ها (JSON):

- `privacy_settings`: تنظیمات حریم خصوصی
- `notification_settings`: تنظیمات اعلان‌ها

### متادیتای حساب:

- `profile_completed`: آیا پروفایل تکمیل شده؟
- `onboarding_completed`: آیا روند آشنایی تکمیل شده؟
- `last_login_at`: آخرین زمان ورود
- `is_active`: آیا حساب فعال است؟
- `subscription_tier`: نوع اشتراک (free, premium, pro)

### بیو و لینک‌های اجتماعی:

- `bio`: بیوگرافی کاربر
- `website_url`: وب‌سایت شخصی
- `social_links`: لینک‌های شبکه‌های اجتماعی (JSON)

## ویژگی‌های اضافی:

### Indexes برای بهبود عملکرد:

- Index روی username
- Index روی country
- Index روی subscription_tier
- Index روی profile_completed
- Index روی is_active
- Index روی last_login_at

### RLS Policies:

- کاربران فقط پروفایل خود را می‌بینند
- کاربران فقط پروفایل خود را ویرایش می‌کنند
- کاربران فقط برای خود پروفایل ایجاد می‌کنند

### Functions و Triggers:

- Function برای به‌روزرسانی خودکار `updated_at`
- Function برای بررسی تکمیل پروفایل
- Trigger برای اجرای خودکار این functions

## تست عملکرد:

پس از اجرای اسکریپت، می‌توانید با Query زیر ساختار جدول را بررسی کنید:

```sql
\d users
```

یا

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;
```

## نکات مهم:

1. **امنیت**: تمام فیلدهای جدید تحت RLS محافظت می‌شوند
2. **سازگاری**: تمام تغییرات با کدهای موجود سازگار هستند
3. **مقادیر پیش‌فرض**: کاربران موجود مقادیر پیش‌فرض مناسب دریافت می‌کنند
4. **Performance**: Indexes مناسب برای جستجوهای سریع اضافه شده‌اند
