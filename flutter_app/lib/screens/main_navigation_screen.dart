import 'package:flutter/material.dart';
import 'package:flutter_app/screens/account_screen.dart';
import 'package:flutter_app/screens/build_itinerary_screen.dart';
import 'package:flutter_app/screens/city_selector_screen.dart';
import 'package:flutter_app/screens/concierge_screen.dart';
import 'package:flutter_app/screens/mood_selector_screen.dart';
import 'package:flutter_app/screens/recommendation_feed_screen.dart';
import 'package:flutter_app/screens/trip_mode_screen.dart';
import 'package:flutter_app/widgets/bottom_navigation.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  // Onboarding/discovery flow state
  int _flowStep = 0; // 0: Mood, 1: City, 2: Feed, 3: Itinerary
  String? _selectedMood;
  String? _selectedCity;
  List<Map<String, dynamic>> _savedItems = [];

  Widget _buildFlowScreen() {
    switch (_flowStep) {
      case 0:
        return MoodSelectorScreen(
          onMoodSelected: (mood) {
            setState(() {
              _selectedMood = mood;
              _flowStep = 1;
            });
          },
        );
      case 1:
        return CitySelectorScreen(
          mood: _selectedMood!,
          onCitySelected: (city) {
            setState(() {
              _selectedCity = city;
              _flowStep = 2;
            });
          },
        );
      case 2:
        return RecommendationFeedScreen(
          mood: _selectedMood!,
          city: _selectedCity!,
          onSave: (savedItems) {
            setState(() {
              _savedItems = savedItems;
              _flowStep = 3;
            });
          },
        );
      case 3:
        return BuildItineraryScreen(
          city: _selectedCity!,
          savedItems: _savedItems,
          onBack: () {
            setState(() {
              _flowStep = 2; // Go back to the feed
            });
          },
        );
      default:
        return const SizedBox.shrink();
    }
  }

  void _onBottomNavTap(int index) {
    // If the user taps the "Here & Now" tab, reset the flow
    if (index == 0) {
      setState(() {
        _flowStep = 0;
      });
    }
    setState(() {
      _currentIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> pages = [
      _buildFlowScreen(),
      const Placeholder(child: Center(child: Text('Trip Mode Coming Soon'))), // Temporary placeholder
      const ConciergeScreen(),
      const AccountScreen(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: pages,
      ),
      bottomNavigationBar: BottomNavigation(
        currentIndex: _currentIndex,
        onTap: _onBottomNavTap,
      ),
    );
  }
}