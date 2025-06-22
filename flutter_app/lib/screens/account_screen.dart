import 'package:flutter/material.dart';
import 'package:flutter_app/theme.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  String activeTab = 'profile';
  final TextEditingController nameController = TextEditingController(text: 'Travel Enthusiast');
  final TextEditingController emailController = TextEditingController(text: 'traveler@example.com');
  final TextEditingController locationController = TextEditingController(text: 'San Francisco, CA');

  @override
  void dispose() {
    nameController.dispose();
    emailController.dispose();
    locationController.dispose();
    super.dispose();
  }

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
                  
                  // Tab Navigation
                  _buildTabNavigation(),
                  const SizedBox(height: 24),
                  
                  // Tab Content
                  _buildTabContent(),
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
            'Account',
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
          'Manage your profile and travel preferences.',
          style: TextStyle(
            fontSize: 16,
            color: DriftTheme.textSecondary,
            height: 1.5,
          ),
        ),
      ],
    );
  }

  Widget _buildTabNavigation() {
    final tabs = [
      {'key': 'profile', 'label': 'Profile'},
      {'key': 'preferences', 'label': 'Preferences'},
      {'key': 'trips', 'label': 'My Trips'},
    ];

    return Row(
      children: tabs.map((tab) {
        final isActive = activeTab == tab['key'];
        return Expanded(
          child: GestureDetector(
            onTap: () {
              setState(() {
                activeTab = tab['key']!;
              });
            },
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: isActive ? DriftTheme.gold.withAlpha(25) : Colors.transparent,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isActive ? DriftTheme.gold : Colors.transparent,
                ),
              ),
              child: Center(
                child: Text(
                  tab['label']!,
                  style: TextStyle(
                    color: isActive ? DriftTheme.gold : DriftTheme.textSecondary,
                    fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildTabContent() {
    switch (activeTab) {
      case 'profile':
        return _buildProfileTab();
      case 'preferences':
        return _buildPreferencesTab();
      case 'trips':
        return _buildTripsTab();
      default:
        return _buildProfileTab();
    }
  }

  Widget _buildProfileTab() {
    return Container(
      padding: const EdgeInsets.all(24),
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
        children: [
          // Profile Picture Section
          Column(
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: DriftTheme.gold,
                  borderRadius: BorderRadius.circular(40),
                ),
                child: const Center(
                  child: Text(
                    'T',
                    style: TextStyle(
                      color: Colors.black,
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () {},
                child: const Text(
                  'Change Photo',
                  style: TextStyle(
                    color: DriftTheme.gold,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
          
          // Profile Form
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildFormField(
                label: 'Full Name',
                controller: nameController,
              ),
              const SizedBox(height: 20),
              _buildFormField(
                label: 'Email',
                controller: emailController,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 20),
              _buildFormField(
                label: 'Home Location',
                controller: locationController,
              ),
              const SizedBox(height: 32),
              
              // Save Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: DriftTheme.gold,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'Save Changes',
                    style: TextStyle(
                      color: Colors.black87,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPreferencesTab() {
    return Container(
      padding: const EdgeInsets.all(24),
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
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Travel Preferences',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: DriftTheme.textPrimary,
            ),
          ),
          SizedBox(height: 24),
          Text(
            'Customize your travel experience preferences here.',
            style: TextStyle(
              fontSize: 16,
              color: DriftTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTripsTab() {
    return Container(
      padding: const EdgeInsets.all(24),
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
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'My Trips',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: DriftTheme.textPrimary,
            ),
          ),
          SizedBox(height: 24),
          Text(
            'View and manage your travel history here.',
            style: TextStyle(
              fontSize: 16,
              color: DriftTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormField({
    required String label,
    required TextEditingController controller,
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            color: DriftTheme.textSecondary,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          style: const TextStyle(color: DriftTheme.textPrimary),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.black26,
            contentPadding: const EdgeInsets.all(16),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: DriftTheme.goldLight, width: 1),
            ),
          ),
        ),
      ],
    );
  }
}
