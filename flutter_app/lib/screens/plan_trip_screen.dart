import 'package:flutter/material.dart';
import 'package:flutter_app/theme.dart';

class PlanTripScreen extends StatelessWidget {
  const PlanTripScreen({super.key});

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
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const SizedBox(height: 40),
                  
                  // Header Section
                  _buildHeader(),
                  const SizedBox(height: 48),
                  
                  // Planning Options
                  _buildPlanningOptions(),
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
        const SizedBox(height: 24),
        
        // Title
        ShaderMask(
          shaderCallback: (bounds) => DriftTheme.goldGradient.createShader(bounds),
          child: const Text(
            'Plan a Trip',
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ),
        const SizedBox(height: 16),
        
        // Subtitle
        const Text(
          'Start planning your next adventure with DRIFT\'s AI-powered tools.',
          style: TextStyle(
            fontSize: 16,
            color: DriftTheme.textSecondary,
            height: 1.5,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildPlanningOptions() {
    return Column(
      children: [
        // Here & Now Option
        _buildPlanningCard(
          title: 'Here & Now',
          description: 'Discover what\'s around you right now and get instant recommendations',
          emoji: '🌆',
          onTap: () {
            // Navigator.push(
            //   context,
            //   MaterialPageRoute(builder: (context) => const HereNowPlanner()),
            // );
          },
        ),
        const SizedBox(height: 24),
        
        // Trip Mode Option
        _buildPlanningCard(
          title: 'Trip Mode',
          description: 'Plan your multi-day trips with flights, accommodations, and custom itineraries',
          emoji: '✈️',
          onTap: () {
            // Navigator.push(
            //   context,
            //   MaterialPageRoute(builder: (context) => const TripModeScreen()),
            // );
          },
        ),
      ],
    );
  }

  Widget _buildPlanningCard({
    required String title,
    required String description,
    required String emoji,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: DriftTheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: DriftTheme.gold.withAlpha(51),
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
          children: [
            // Emoji
            Text(
              emoji,
              style: const TextStyle(fontSize: 48),
            ),
            const SizedBox(height: 16),
            
            // Title
            Text(
              title,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: DriftTheme.gold,
              ),
            ),
            const SizedBox(height: 12),
            
            // Description
            Text(
              description,
              style: const TextStyle(
                fontSize: 16,
                color: DriftTheme.textSecondary,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
