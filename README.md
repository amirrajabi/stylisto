# Stylisto - AI-Powered Wardrobe Management App

Stylisto is a React Native application built with Expo that helps users manage their wardrobe with AI-powered outfit recommendations, clothing categorization, and style suggestions.

## 🚀 Features

- **Wardrobe Management**: Organize and categorize your clothing items
- **AI-Powered Outfit Generation**: Get personalized outfit recommendations
- **Clothing Analysis**: Automatic categorization and tagging using AI
- **Saved Outfits**: Save and manage your favorite outfit combinations
- **Weather Integration**: Weather-appropriate outfit suggestions
- **User Profile**: Personalized settings and preferences

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.18.0 or higher)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **Git**

For mobile development:

- **Expo Go** app on your mobile device
- **Android Studio** (for Android development)
- **Xcode** (for iOS development on macOS)

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/stylisto.git
   cd stylisto
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env` and fill in the required values
   - Configure your Supabase credentials
   - Add your OpenAI API key
   - Set up other necessary API keys

4. **Start the development server**
   ```bash
   npm start
   ```

## 📁 Project Structure

```
stylisto/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Screen components
│   ├── navigation/         # Navigation configuration
│   ├── store/             # Redux store and slices
│   ├── services/          # API services and external integrations
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript type definitions
├── app/                   # Expo Router app directory
├── assets/               # Static assets (images, fonts, etc.)
├── constants/            # App constants and configuration
├── hooks/               # Custom React hooks
├── tasks/               # Project management and PRD
├── .env.example         # Environment variables template
├── .eslintrc.js         # ESLint configuration
├── .prettierrc          # Prettier configuration
├── app.json             # Expo app configuration
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## 🔧 Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run on web browser
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run reset-project` - Reset project to clean state

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate coverage report:

```bash
npm run test:coverage
```

## 🏗️ Tech Stack

- **Frontend**: React Native, Expo, TypeScript
- **Navigation**: React Navigation v6
- **State Management**: Redux Toolkit, React Query
- **UI Components**: React Native Paper
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **AI Services**: OpenAI GPT, Google Cloud Vision AI
- **Styling**: StyleSheet, Expo themes
- **Testing**: Jest, React Native Testing Library

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Google Cloud Vision API
GOOGLE_CLOUD_VISION_API_KEY=your_google_cloud_api_key

# Other APIs
WEATHER_API_KEY=your_weather_api_key
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Getting Started

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Follow the coding standards**
   - Run `npm run lint` to check for linting errors
   - Run `npm run format` to format your code
   - Ensure all tests pass with `npm test`

### Code Style

- We use **ESLint** and **Prettier** for code consistency
- Follow **TypeScript** best practices
- Use **semantic commit messages**:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation changes
  - `style:` for formatting changes
  - `refactor:` for code refactoring
  - `test:` for adding tests
  - `chore:` for maintenance tasks

### Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**
4. **Update the README.md** if necessary
5. **Create a pull request** with a clear description

### Development Workflow

1. **Start the development server**

   ```bash
   npm start
   ```

2. **Run linting and formatting**

   ```bash
   npm run lint
   npm run format
   ```

3. **Run tests**

   ```bash
   npm test
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 📱 Deployment

### Development Build

```bash
eas build --profile development
```

### Production Build

```bash
eas build --profile production
```

### Submit to App Stores

```bash
eas submit --platform ios
eas submit --platform android
```

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues**

   ```bash
   npx expo start --clear
   ```

2. **Node modules issues**

   ```bash
   rm -rf node_modules
   npm install
   ```

3. **Expo CLI issues**
   ```bash
   npm install -g @expo/cli@latest
   ```

### Getting Help

- Check the [Expo Documentation](https://docs.expo.dev/)
- Visit [React Native Documentation](https://reactnative.dev/)
- Create an issue in this repository
- Join our community Discord server

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Expo** for the amazing development platform
- **React Native** community for the excellent ecosystem
- **Supabase** for backend services
- **OpenAI** for AI capabilities
- All contributors who help improve this project

## 📞 Support

If you need help or have questions:

- Create an issue in this repository
- Email: support@stylisto.app
- Documentation: [docs.stylisto.app](https://docs.stylisto.app)

---

Made with ❤️ by the Stylisto team

🚀 فلو اصلی استفاده از اپلیکیشن:
1️⃣ ورود و احراز هویت
کاربر با صفحه login/register شروع می‌کنه
امکان ورود با ایمیل/پسورد یا شبکه‌های اجتماعی
پس از ورود موفق، کاربر به صفحه اصلی هدایت میشه
2️⃣ صفحه اصلی - Wardrobe (کمد لباس)
نقطه شروع اصلی اپلیکیشن
مدیریت و مشاهده کلکشن لباس‌های شخصی
امکان اضافه کردن آیتم‌های جدید از طریق دوربین
دسته‌بندی و فیلتر کردن لباس‌ها
جستجو در میان آیتم‌ها
3️⃣ Generate (تولید ست)
استفاده از هوش مصنوعی برای پیشنهاد ست لباس
در نظر گیری آب و هوا
تنظیمات شخصی‌سازی برای مناسبت‌ها
انتخاب ترجیحات سبک و رنگ
4️⃣ Outfits (ست‌های لباس)
مشاهده ست‌های پیشنهادی
امکان ویرایش و سفارشی‌سازی ست‌ها
جزئیات هر ست شامل ترکیب لباس‌ها
5️⃣ Saved (ذخیره شده‌ها)
ست‌های محبوب و ذخیره شده
دسترسی سریع به ست‌های مورد علاقه
مدیریت لیست‌های شخصی
6️⃣ Analytics (آنالیتیک)
آمار استفاده از لباس‌ها
ترندهای شخصی در انتخاب لباس
بینش‌هایی درباره عادات پوشش
7️⃣ Profile (پروفایل)
تنظیمات شخصی
مدیریت حساب کاربری
تنظیمات دسترسی و حریم خصوصی
تنظیمات هوش مصنوعی
🔄 جریان کاری معمولی کاربر:
ساخت کمد دیجیتال → عکس گرفتن از لباس‌ها با دوربین
دریافت پیشنهادات → استفاده از بخش Generate برای ست‌سازی
انتخاب و ذخیره → انتخاب ست‌های مورد علاقه و ذخیره آن‌ها
پیگیری عادات → مشاهده آمارها در بخش Analytics
این اپلیکیشن یک دستیار هوشمند برای انتخاب لباس هست که با استفاده از هوش مصنوعی و در نظر گیری عوامل مختلف مثل آب و هوا، مناسبت، و سلیقه شخصی، بهترین ست‌های لباس رو پیشنهاد می‌ده.
