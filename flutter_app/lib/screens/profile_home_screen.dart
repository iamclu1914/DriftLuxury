import 'package:flutter/material.dart';
import '../theme.dart';
import 'trip_gallery_screen.dart';
import 'memory_card_screen.dart';
import 'share_sheet_screen.dart';

class ProfileHomeScreen extends StatefulWidget {
  const ProfileHomeScreen({super.key});

  @override
  State<ProfileHomeScreen> createState() => _ProfileHomeScreenState();
}

class _ProfileHomeScreenState extends State<ProfileHomeScreen> with TickerProviderStateMixin {
  int _tabIndex = 0;
  bool _showMemoryCard = false;
  bool _showShareSheet = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: DriftTheme.background,
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Welcome, Name!', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          _buildStat('Trips Taken', '12'),
                          _buildStat('Moods Logged', '34'),
                          _buildStat('Countries', '7'),
                        ],
                      ),
                    ],
                  ),
                ),
                TabBar(
                  controller: TabController(length: 3, vsync: this, initialIndex: _tabIndex),
                  onTap: (i) => setState(() => _tabIndex = i),
                  tabs: const [
                    Tab(text: 'History'),
                    Tab(text: 'Wishlist'),
                    Tab(text: 'Settings'),
                  ],
                  labelColor: DriftTheme.gold,
                  unselectedLabelColor: DriftTheme.textMuted,
                  indicatorColor: DriftTheme.gold,
                ),
                Expanded(
                  child: IndexedStack(
                    index: _tabIndex,
                    children: [
                      // History Tab
                      TripGalleryScreen(
                        onTripTap: () {
                          setState(() => _showMemoryCard = true);
                        },
                      ),
                      const Center(child: Text('Wishlist')), // Placeholder
                      const Center(child: Text('Settings')), // Placeholder
                    ],
                  ),
                ),
              ],
            ),
            if (_showMemoryCard)
              MemoryCardScreen(
                onShare: () => setState(() => _showShareSheet = true),
              ),
            if (_showShareSheet)
              const Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: ShareSheetScreen(),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStat(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(right: 24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: DriftTheme.gold)),
          Text(label, style: const TextStyle(fontSize: 12, color: DriftTheme.textMuted)),
        ],
      ),
    );
  }
}
