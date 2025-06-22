import 'package:flutter/material.dart';
<<<<<<< HEAD

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Drift Luxury Travel',
      theme: ThemeData(
        fontFamily: 'Inter',
        colorScheme: ColorScheme.fromSeed(seedColor: Color(0xFF1E40AF)),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Drift Luxury Travel'),
      ),
      body: const Center(
        child: Text(
          'Welcome to Drift!\nYour luxury travel experience starts here.',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w500),
          textAlign: TextAlign.center,
        ),
      ),
=======
import 'package:flutter_app/screens/luxury_welcome.dart';
import 'package:flutter_app/screens/main_navigation_screen.dart'; // Import MainNavigationScreen
import 'package:flutter_app/theme.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  bool isAuthenticated = false;

  void handleAuthSuccess() {
    setState(() {
      isAuthenticated = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Drift',
      debugShowCheckedModeBanner: false,
      theme: DriftTheme.themeData(),
      home: isAuthenticated
          ? const MainNavigationScreen()  // Start with main navigation after sign-in
          : LuxuryWelcome(onAuthSuccess: handleAuthSuccess),
>>>>>>> a6a069e (Integrate Booking.com RapidAPI for Trip Mode, luxury UI, and dependency updates)
    );
  }
}
