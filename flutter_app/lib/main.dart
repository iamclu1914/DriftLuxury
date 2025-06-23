import 'package:flutter/material.dart';
import 'package:flutter_app/screens/luxury_welcome.dart';
import 'package:flutter_app/screens/main_navigation_screen.dart';
import 'package:flutter_app/theme.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Drift',
      debugShowCheckedModeBanner: false,
      theme: DriftTheme.themeData(),
      home: const AuthGate(),
    );
  }
}

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  bool isAuthenticated = false;

  void handleAuthSuccess() {
    setState(() {
      isAuthenticated = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    return isAuthenticated
        ? const MainNavigationScreen()
        : LuxuryWelcome(onAuthSuccess: handleAuthSuccess);
  }
}
