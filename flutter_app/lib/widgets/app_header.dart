import 'package:flutter/material.dart';
import 'package:flutter_app/theme.dart';

class AppHeader extends StatelessWidget {
  const AppHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: DriftTheme.surface,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Logo
                Row(
                  children: [
                    ShaderMask(
                      shaderCallback: (bounds) => DriftTheme.goldGradient.createShader(bounds),
                      child: const Text(
                        'DRIFT',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
                
                // Nav Icons
                Row(
                  children: [
                    _buildNavButton(icon: Icons.home_outlined, label: 'Home', isActive: true),
                    _buildNavButton(icon: Icons.explore_outlined, label: 'Plan', isActive: false),
                    _buildNavButton(icon: Icons.people_alt_outlined, label: 'Social', isActive: false),
                    _buildNavButton(icon: Icons.account_circle_outlined, label: 'Account', isActive: false),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildNavButton({
    required IconData icon,
    required String label,
    required bool isActive,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            color: isActive ? DriftTheme.gold : DriftTheme.textSecondary,
            size: 24,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: isActive ? DriftTheme.gold : DriftTheme.textSecondary,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
