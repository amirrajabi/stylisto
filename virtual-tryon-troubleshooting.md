# Virtual Try-On Troubleshooting Guide

## مشکل اصلی

عکس‌های خروجی Virtual Try-On با آیتم‌های انتخاب شده مطابقت ندارند. به جای لباس‌های انتخابی کاربر، عکس‌های نامربوط (مثل مرد با کت و شلوار) تولید می‌شود.

## علت ریشه‌ای

### 1. عدم ارسال عکس‌های لباس به API

- **مشکل**: فقط عکس کاربر به Flux API ارسال می‌شود
- **نتیجه**: API بدون دیدن لباس‌های واقعی، فقط بر اساس توضیحات متنی سعی می‌کند لباس تولید کند

### 2. محدودیت Flux Kontext API

- API فقط یک عکس می‌پذیرد (نه چندین عکس)
- نمی‌تواند چندین آیتم لباس را همزمان اعمال کند
- برای virtual try-on واقعی طراحی نشده است

### 3. عدم پیاده‌سازی Collage

- متد `createOpenArtStyleCollage` فقط عکس کاربر را برمی‌گرداند
- کولاژ واقعی از عکس کاربر و لباس‌ها ساخته نمی‌شود

## فرآیند فعلی (ناقص)

```
1. عکس‌های لباس → GPT-4 Vision → توضیحات متنی
2. فقط عکس کاربر + توضیحات → Flux API
3. نتیجه: لباس‌های عمومی و نامربوط
```

## راه‌حل‌های پیاده‌سازی شده

### 1. سرویس Image Composer

```typescript
// lib/imageComposer.ts
- ساخت کولاژ واقعی از عکس‌ها
- پشتیبانی از محیط web (Canvas API)
- fallback برای محیط native
```

### 2. سرویس Flask Backend

```typescript
// services/virtualTryOnService.ts
- ارتباط با Flask backend
- ارسال همه عکس‌ها به صورت base64
- پردازش virtual try-on واقعی
```

## نحوه استفاده از راه‌حل‌ها

### روش 1: استفاده از Collage (موقت)

```typescript
// در virtualTryOn.ts
const collageUri = await imageComposer.createOpenArtCollage({
  userImage,
  clothingImages,
  outputWidth: 1024,
  outputHeight: 1024,
});

// ارسال collage به Flux API
```

### روش 2: استفاده از Flask Backend (توصیه شده)

```typescript
// آماده‌سازی عکس‌ها
const base64Images = await virtualTryOnFlask.prepareImagesForFlask([
  userImage,
  ...clothingImages,
]);

// ارسال به Flask
const result = await virtualTryOnFlask.processVirtualTryOn({
  userImage: base64Images[0],
  clothingImages: base64Images.slice(1),
  prompt: enhancedPrompt,
  mode: 'multiple',
});
```

## راه‌اندازی Flask Backend

### 1. نصب Dependencies

```bash
pip install flask flask-cors pillow numpy opencv-python
pip install torch torchvision transformers diffusers
```

### 2. ساختار Flask API

```python
# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/virtual-tryon', methods=['POST'])
def virtual_tryon():
    data = request.json
    user_image = data.get('user_image')
    clothing_images = data.get('clothing_images', [])

    # Process with actual virtual try-on model
    # Options:
    # 1. OOTDiffusion
    # 2. HR-VITON
    # 3. DressCode
    # 4. Custom model

    return jsonify({
        'success': True,
        'result_image': processed_image_base64,
        'processing_time': time_taken
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

### 3. متغیرهای محیط

```bash
# .env
EXPO_PUBLIC_FLASK_API_URL=http://localhost:5000
```

## تست و Debug

### 1. بررسی ارسال عکس‌ها

```typescript
// در console logs بررسی کنید:
console.log('📤 AI API REQUEST - VIRTUAL TRY-ON');
// باید payload شامل همه عکس‌ها باشد
```

### 2. تست Flask Health

```bash
curl http://localhost:5000/health
```

### 3. Mock Mode

اگر Flask در دسترس نیست:

```typescript
const mockResult = await virtualTryOnFlask.createMockResponse(request);
```

## مدل‌های Virtual Try-On پیشنهادی

### 1. OOTDiffusion (بهترین)

- پشتیبانی از چندین آیتم
- کیفیت بالا
- [GitHub](https://github.com/levihsu/OOTDiffusion)

### 2. HR-VITON

- محبوب و پایدار
- مناسب برای تک آیتم
- [GitHub](https://github.com/sangyun884/HR-VITON)

### 3. DressCode

- سریع و سبک
- [GitHub](https://github.com/aimagelab/dress-code)

## نکات مهم

1. **CORS**: برای تست local، Flask باید CORS را فعال داشته باشد
2. **Image Size**: عکس‌ها را به 1024x1024 resize کنید
3. **Base64**: حجم base64 بالاست، برای production از upload مستقیم استفاده کنید
4. **GPU**: برای سرعت مناسب، Flask backend نیاز به GPU دارد

## وضعیت فعلی

- ✅ Image Composer service ایجاد شد
- ✅ Flask service ایجاد شد
- ⏳ نیاز به پیاده‌سازی Flask backend واقعی
- ⏳ نیاز به انتخاب و نصب مدل virtual try-on
- ⏳ نیاز به تست end-to-end
