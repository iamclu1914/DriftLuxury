import 'package:flutter/material.dart';
import 'package:flutter_app/theme.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class LuxuryWelcome extends StatefulWidget {
  final Function onAuthSuccess;
  
  const LuxuryWelcome({super.key, required this.onAuthSuccess});

  @override
  State<LuxuryWelcome> createState() => _LuxuryWelcomeState();
}

class _LuxuryWelcomeState extends State<LuxuryWelcome> {
  bool isSignIn = true;
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  String? error;
  bool rememberMe = false;
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSavedCredentials();
  }

  Future<void> _loadSavedCredentials() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final shouldRemember = prefs.getBool('rememberMe') ?? false;
      
      if (shouldRemember) {
        final email = await _secureStorage.read(key: 'saved_email');
        final password = await _secureStorage.read(key: 'saved_password');
        
        if (email != null && password != null) {
          setState(() {
            emailController.text = email;
            passwordController.text = password;
            rememberMe = true;
          });
        }
      }
    } catch (e) {
      // Handle any errors silently
      debugPrint('Error loading saved credentials: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _saveCredentials() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('rememberMe', rememberMe);
      
      if (rememberMe) {
        await _secureStorage.write(
          key: 'saved_email',
          value: emailController.text,
        );
        await _secureStorage.write(
          key: 'saved_password',
          value: passwordController.text,
        );
      } else {
        await _secureStorage.delete(key: 'saved_email');
        await _secureStorage.delete(key: 'saved_password');
      }
    } catch (e) {
      debugPrint('Error saving credentials: $e');
    }
  }

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (emailController.text.isEmpty || passwordController.text.isEmpty) {
      setState(() {
        error = 'Please enter both email and password.';
      });
      return;
    }
    
    setState(() {
      error = null;
    });
    
    // Save credentials if "Remember me" is checked
    await _saveCredentials();
    
    // Simulate authentication (just like in the web version)
    widget.onAuthSuccess();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: DriftTheme.backgroundGradient,
        ),
        child: _isLoading 
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(DriftTheme.gold),
              ),
            )
          : Stack(
          children: [
            // Background decorative elements
            Positioned(
              top: 0,
              right: 0,
              child: Container(
                width: 300,
                height: 300,
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    colors: [DriftTheme.gold.withAlpha(38), Colors.transparent],
                    radius: 1.0,
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: 0,
              left: 0,
              child: Container(
                width: 200,
                height: 200,
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    colors: [DriftTheme.gold.withAlpha(25), Colors.transparent],
                    radius: 1.0,
                  ),
                ),
              ),
            ),
            
            // Main content
            Center(
              child: SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Logo and title
                      ShaderMask(
                        shaderCallback: (bounds) => DriftTheme.goldGradient.createShader(bounds),
                        child: const Text(
                          'DRIFT',
                          style: TextStyle(
                            fontSize: 48,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'LUXURY TRAVEL EXPERIENCE',
                        style: TextStyle(
                          fontSize: 12,
                          letterSpacing: 2,
                          color: DriftTheme.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 40),
                      
                      // Auth Card
                      Container(
                        width: 400,
                        constraints: const BoxConstraints(maxWidth: 400),
                        decoration: BoxDecoration(
                          color: DriftTheme.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: Colors.white.withAlpha(13),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withAlpha(77),
                              blurRadius: 20,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(24.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                isSignIn ? 'Welcome Back' : 'Create Account',
                                style: Theme.of(context).textTheme.headlineSmall,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                isSignIn 
                                  ? 'Sign in to continue your luxury travel experience'
                                  : 'Join DRIFT to begin your personalized travel journey',
                                style: const TextStyle(color: DriftTheme.textSecondary),
                              ),
                              const SizedBox(height: 24),
                              
                              // Email Field
                              const Text(
                                'Email',
                                style: TextStyle(
                                  fontSize: 14, 
                                  color: DriftTheme.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 8),
                              TextField(
                                controller: emailController,
                                decoration: const InputDecoration(
                                  hintText: 'Enter your email',
                                ),
                                style: const TextStyle(color: DriftTheme.textPrimary),
                                keyboardType: TextInputType.emailAddress,
                              ),
                              const SizedBox(height: 16),
                              
                              // Password Field
                              const Text(
                                'Password',
                                style: TextStyle(
                                  fontSize: 14, 
                                  color: DriftTheme.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 8),
                              TextField(
                                controller: passwordController,
                                decoration: const InputDecoration(
                                  hintText: 'Enter your password',
                                ),
                                style: const TextStyle(color: DriftTheme.textPrimary),
                                obscureText: true,
                              ),
                              const SizedBox(height: 16),
                              
                              // Remember me checkbox
                              if (isSignIn)
                                Row(
                                  children: [
                                    SizedBox(
                                      width: 24,
                                      height: 24,
                                      child: Checkbox(
                                        value: rememberMe,
                                        activeColor: DriftTheme.gold,
                                        checkColor: DriftTheme.background,
                                        side: BorderSide(color: DriftTheme.goldLight.withAlpha(128)),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        onChanged: (value) {
                                          setState(() {
                                            rememberMe = value ?? false;
                                          });
                                        },
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    GestureDetector(
                                      onTap: () {
                                        setState(() {
                                          rememberMe = !rememberMe;
                                        });
                                      },
                                      child: const Text(
                                        'Remember me',
                                        style: TextStyle(
                                          color: DriftTheme.textSecondary,
                                          fontSize: 14,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              const SizedBox(height: 16),
                              
                              // Error message
                              if (error != null)
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.red.withAlpha(25),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    error!,
                                    style: const TextStyle(color: Colors.red),
                                  ),
                                ),
                              const SizedBox(height: 24),
                              
                              // Sign In/Create Account Button
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: _handleSubmit,
                                  style: ElevatedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    backgroundColor: DriftTheme.gold,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                  child: Text(
                                    isSignIn ? 'Sign In' : 'Create Account',
                                    style: const TextStyle(
                                      color: Colors.black87,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 24),
                              
                              // Toggle between sign in and sign up
                              Divider(color: Colors.white.withAlpha(25)),
                              const SizedBox(height: 16),
                              Center(
                                child: Column(
                                  children: [
                                    Text(
                                      isSignIn ? 'New to DRIFT?' : 'Already have an account?',
                                      style: const TextStyle(color: DriftTheme.textSecondary),
                                    ),
                                    const SizedBox(height: 8),
                                    TextButton(
                                      onPressed: () {
                                        setState(() {
                                          isSignIn = !isSignIn;
                                          error = null;
                                          // Clear form when switching to sign up
                                          if (!isSignIn) {
                                            emailController.clear();
                                            passwordController.clear();
                                          }
                                        });
                                      },
                                      child: Text(
                                        isSignIn ? 'Create an account' : 'Sign in',
                                        style: const TextStyle(color: DriftTheme.goldLight),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
