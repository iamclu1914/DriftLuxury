import 'package:flutter/material.dart';
import 'package:flutter_app/theme.dart';
import 'package:flutter_app/widgets/app_header.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String selectedLocation = '';
  String selectedMood = 'adventurous';
  String selectedBudget = 'medium';
  double durationHours = 4;
  bool isLoading = false;
  
  final List<String> moodOptions = [
    'adventurous', 'romantic', 'relaxing', 'cultural', 'foodie'
  ];
  
  final List<String> budgetOptions = [
    'budget', 'medium', 'luxury'
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: DriftTheme.background,
      body: Column(
        children: [
          // Header
          const AppHeader(),
          
          // Main content
          Expanded(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    Text(
                      'Instant Trip Planner',
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: DriftTheme.textPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Let us create your perfect itinerary for right now',
                      style: TextStyle(
                        color: DriftTheme.textSecondary,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 32),
                    
                    // Location selection card
                    _buildCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Where are you?',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextField(
                            decoration: const InputDecoration(
                              hintText: 'Enter your location',
                              prefixIcon: Icon(Icons.location_on_outlined),
                              filled: true,
                            ),
                            onChanged: (value) {
                              setState(() {
                                selectedLocation = value;
                              });
                            },
                          ),
                          const SizedBox(height: 12),
                          Center(
                            child: TextButton.icon(
                              onPressed: () {
                                // Would implement current location detection
                              },
                              icon: const Icon(Icons.my_location),
                              label: const Text('Use my current location'),
                              style: TextButton.styleFrom(
                                foregroundColor: DriftTheme.goldLight,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    // Mood selection
                    _buildCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('What\'s your mood?',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Wrap(
                            spacing: 10,
                            runSpacing: 10,
                            children: moodOptions.map((mood) {
                              bool isSelected = mood == selectedMood;
                              return _buildSelectionChip(
                                text: mood.capitalize(),
                                isSelected: isSelected,
                                onTap: () {
                                  setState(() {
                                    selectedMood = mood;
                                  });
                                },
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    // Budget selection
                    _buildCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Your budget',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Wrap(
                            spacing: 10,
                            runSpacing: 10,
                            children: budgetOptions.map((budget) {
                              bool isSelected = budget == selectedBudget;
                              return _buildSelectionChip(
                                text: budget.capitalize(),
                                isSelected: isSelected,
                                onTap: () {
                                  setState(() {
                                    selectedBudget = budget;
                                  });
                                },
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    // Duration slider
                    _buildCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('How much time do you have?',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            '${durationHours.toInt()} hours',
                            style: const TextStyle(
                              fontSize: 16,
                              color: DriftTheme.goldLight,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Slider(
                            value: durationHours,
                            min: 1,
                            max: 12,
                            divisions: 11,
                            activeColor: DriftTheme.gold,
                            inactiveColor: DriftTheme.goldDark.withAlpha(77),
                            onChanged: (value) {
                              setState(() {
                                durationHours = value;
                              });
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                    
                    // Generate plan button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: isLoading || selectedLocation.isEmpty ? null : () {
                          setState(() {
                            isLoading = true;
                          });
                          
                          // Simulate API call
                          Future.delayed(const Duration(seconds: 2), () {
                            setState(() {
                              isLoading = false;
                              // Would show results here
                            });
                          });
                        },
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          backgroundColor: DriftTheme.gold,
                          foregroundColor: Colors.black87,
                          disabledBackgroundColor: DriftTheme.gold.withAlpha(77),
                          disabledForegroundColor: Colors.black45,
                        ),
                        child: isLoading
                            ? const SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  color: Colors.black45,
                                  strokeWidth: 3,
                                ),
                              )
                            : const Text(
                                'Generate My Personalized Plan',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
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
    );
  }
  
  Widget _buildCard({required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: DriftTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withAlpha(13)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(51),
            blurRadius: 10,
            spreadRadius: 0,
          ),
        ],
      ),
      child: child,
    );
  }
  
  Widget _buildSelectionChip({
    required String text,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? DriftTheme.gold : DriftTheme.surfaceVariant,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? DriftTheme.gold : Colors.white.withAlpha(25),
          ),
        ),
        child: Text(
          text,
          style: TextStyle(
            color: isSelected ? Colors.black87 : DriftTheme.textSecondary,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}

extension StringExtension on String {
  String capitalize() {
    return "${this[0].toUpperCase()}${substring(1)}";
  }
}
