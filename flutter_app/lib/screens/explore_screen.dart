import 'package:flutter/material.dart';
import 'package:flutter_app/theme.dart';

class ExploreScreen extends StatelessWidget {
  const ExploreScreen({super.key});

  final List<Map<String, String>> destinations = const [
    {'name': 'Paris', 'emoji': '🗼', 'description': 'City of Light'},
    {'name': 'Tokyo', 'emoji': '🗾', 'description': 'Modern meets Traditional'},
    {'name': 'New York', 'emoji': '🗽', 'description': 'The Big Apple'},
    {'name': 'Venice', 'emoji': '🚤', 'description': 'Floating City'},
    {'name': 'Bali', 'emoji': '🏝️', 'description': 'Tropical Paradise'},
    {'name': 'Santorini', 'emoji': '🏛️', 'description': 'Greek Island Beauty'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: DriftTheme.background,
      body: Container(
        decoration: const BoxDecoration(
          gradient: DriftTheme.backgroundGradient,
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header Section
                  _buildHeader(),
                  const SizedBox(height: 32),
                  
                  // Destinations Grid
                  _buildDestinationsGrid(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Gold accent line
        Container(
          width: 60,
          height: 4,
          decoration: BoxDecoration(
            gradient: DriftTheme.goldGradient,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(height: 16),
        
        // Title
        ShaderMask(
          shaderCallback: (bounds) => DriftTheme.goldGradient.createShader(bounds),
          child: const Text(
            'Explore Destinations',
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ),
        const SizedBox(height: 12),
        
        // Subtitle
        const Text(
          'Discover new places, trending spots, and curated experiences crafted for the discerning traveler.',
          style: TextStyle(
            fontSize: 16,
            color: DriftTheme.textSecondary,
            height: 1.5,
          ),
        ),
      ],
    );
  }

  Widget _buildDestinationsGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 0.85,
      ),
      itemCount: destinations.length,
      itemBuilder: (context, index) {
        final destination = destinations[index];
        return _buildDestinationCard(destination);
      },
    );
  }

  Widget _buildDestinationCard(Map<String, String> destination) {
    return Container(
      decoration: BoxDecoration(
        color: DriftTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.white.withAlpha(13),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(51),
            blurRadius: 10,
            spreadRadius: 0,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image section with emoji
          Expanded(
            flex: 3,
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: DriftTheme.surfaceVariant,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
                gradient: LinearGradient(
                  colors: [
                    DriftTheme.gold.withAlpha(25),
                    DriftTheme.surface,
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: Center(
                child: Text(
                  destination['emoji']!,
                  style: const TextStyle(fontSize: 60),
                ),
              ),
            ),
          ),
          
          // Content section
          Expanded(
            flex: 2,
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    destination['name']!,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: DriftTheme.gold,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    destination['description']!,
                    style: const TextStyle(
                      fontSize: 14,
                      color: DriftTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
