import 'package:flutter/material.dart';

class TripModeScreen extends StatefulWidget {
  const TripModeScreen({super.key});

  @override
  State<TripModeScreen> createState() => _TripModeScreenState();
}

class _TripModeScreenState extends State<TripModeScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _selectedCategory = 'Flights';
  final List<String> _categories = ['Flights', 'Hotels', 'Both'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Trip Mode'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.search), text: 'Search'),
            Tab(icon: Icon(Icons.person), text: 'Profile'),
            Tab(icon: Icon(Icons.photo_library), text: 'Gallery'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildSearchTab(),
          _buildProfileTab(),
          _buildGalleryTab(),
        ],
      ),
    );
  }

  Widget _buildSearchTab() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Where are you heading to?',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Enter destination',
              prefixIcon: const Icon(Icons.location_on),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            value: _selectedCategory,
            decoration: InputDecoration(
              labelText: 'What are you looking for?',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            items: _categories.map((category) {
              return DropdownMenuItem(
                value: category,
                child: Text(category),
              );
            }).toList(),
            onChanged: (value) {
              if (value != null) {
                setState(() {
                  _selectedCategory = value;
                });
              }
            },
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: () {
                // Handle search action
              },
              style: ElevatedButton.styleFrom(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Search'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Welcome, Alex',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),
          
          // Stats Section
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatItem('Trips Taken', '12'),
                _buildStatItem('Moods Logged', '48'),
                _buildStatItem('Countries', '7'),
              ],
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Profile Tabs
          DefaultTabController(
            length: 3,
            child: Column(
              children: [
                const TabBar(
                  labelColor: Colors.black,
                  tabs: [
                    Tab(text: 'History'),
                    Tab(text: 'Wishlist'),
                    Tab(text: 'Settings'),
                  ],
                ),
                SizedBox(
                  height: 300,
                  child: TabBarView(
                    children: [
                      _buildHistoryTab(),
                      _buildWishlistTab(),
                      _buildSettingsTab(),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            color: Colors.grey.shade600,
          ),
        ),
      ],
    );
  }

  Widget _buildHistoryTab() {
    return ListView.builder(
      itemCount: 5,
      itemBuilder: (context, index) {
        return ListTile(
          leading: CircleAvatar(
            backgroundImage: NetworkImage('https://picsum.photos/200?random=$index'),
          ),
          title: const Text('Trip to Paris'),
          subtitle: const Text('June 15-22, 2023'),
          trailing: const Icon(Icons.mood),
        );
      },
    );
  }

  Widget _buildWishlistTab() {
    return ListView.builder(
      itemCount: 3,
      itemBuilder: (context, index) {
        return ListTile(
          leading: CircleAvatar(
            backgroundImage: NetworkImage('https://picsum.photos/200?random=${index + 10}'),
          ),
          title: Text('Dream Destination ${index + 1}'),
          subtitle: const Text('Planned for 2024'),
          trailing: const Icon(Icons.favorite, color: Colors.red),
        );
      },
    );
  }

  Widget _buildSettingsTab() {
    return ListView(
      children: const [
        ListTile(
          leading: Icon(Icons.person),
          title: Text('Edit Profile'),
        ),
        ListTile(
          leading: Icon(Icons.notifications),
          title: Text('Notifications'),
        ),
        ListTile(
          leading: Icon(Icons.privacy_tip),
          title: Text('Privacy'),
        ),
        ListTile(
          leading: Icon(Icons.help),
          title: Text('Help & Support'),
        ),
        ListTile(
          leading: Icon(Icons.logout),
          title: Text('Log Out'),
        ),
      ],
    );
  }

  Widget _buildGalleryTab() {
    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          const TabBar(
            labelColor: Colors.black,
            tabs: [
              Tab(text: 'Trip Gallery'),
              Tab(text: 'Memory Card'),
            ],
          ),
          Expanded(
            child: TabBarView(
              children: [
                _buildTripGalleryGrid(),
                _buildMemoryCardView(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTripGalleryGrid() {
    return GridView.builder(
      padding: const EdgeInsets.all(8.0),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: 10,
      itemBuilder: (context, index) {
        return GestureDetector(
          onTap: () {
            // Navigate to trip details
          },
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Stack(
              fit: StackFit.expand,
              children: [
                Image.network(
                  'https://picsum.photos/300/300?random=$index',
                  fit: BoxFit.cover,
                ),
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(8.0),
                    color: Colors.black54,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.location_on, color: Colors.white, size: 16),
                            const SizedBox(width: 4),
                            Text(
                              'City ${index + 1}',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            ),
                            const Spacer(),
                            const Icon(Icons.mood, color: Colors.yellow, size: 16),
                          ],
                        ),
                        Text(
                          'May ${index + 1}-${index + 5}, 2023',
                          style: const TextStyle(color: Colors.white, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildMemoryCardView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Mood badges
          SizedBox(
            height: 60,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: 5,
              itemBuilder: (context, index) {
                final List<IconData> moodIcons = [
                  Icons.sentiment_very_satisfied,
                  Icons.sentiment_satisfied,
                  Icons.sentiment_neutral,
                  Icons.sentiment_dissatisfied,
                  Icons.sentiment_very_dissatisfied,
                ];
                final List<Color> moodColors = [
                  Colors.green,
                  Colors.lightGreen,
                  Colors.amber,
                  Colors.orange,
                  Colors.red,
                ];
                
                return Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: Chip(
                    avatar: Icon(moodIcons[index], color: Colors.white),
                    label: Text('Day ${index + 1}'),
                    backgroundColor: moodColors[index],
                    labelStyle: const TextStyle(color: Colors.white),
                  ),
                );
              },
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Photos
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: 5,
            itemBuilder: (context, index) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(
                        'https://picsum.photos/600/400?random=${index + 20}',
                        fit: BoxFit.cover,
                        width: double.infinity,
                        height: 200,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.location_on),
                        const SizedBox(width: 4),
                        Text('Saved Spot ${index + 1}', style: const TextStyle(fontWeight: FontWeight.bold)),
                        const Spacer(),
                        Text('Day ${index + 1}'),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
          
          const SizedBox(height: 16),
          
          // Notes field
          TextField(
            maxLines: 5,
            decoration: InputDecoration(
              hintText: 'Write your trip story or notes...',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Action buttons
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    _showShareSheet(context);
                  },
                  icon: const Icon(Icons.movie),
                  label: const Text('Turn Into Reel'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    _showShareSheet(context);
                  },
                  icon: const Icon(Icons.share),
                  label: const Text('Share on Feed'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showShareSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Share Your Experience',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 24),
            _buildShareOption(
              icon: Icons.public,
              title: 'Post to Drift Feed',
              onTap: () {
                Navigator.pop(context);
                // Handle post to feed
              },
            ),
            const Divider(),
            _buildShareOption(
              icon: Icons.picture_as_pdf,
              title: 'Download as PDF',
              onTap: () {
                Navigator.pop(context);
                // Handle PDF download
              },
            ),
            const Divider(),
            _buildShareOption(
              icon: Icons.people,
              title: 'Send to Friends',
              onTap: () {
                Navigator.pop(context);
                // Handle send to friends
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShareOption({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, size: 28),
      title: Text(title),
      onTap: onTap,
    );
  }
}