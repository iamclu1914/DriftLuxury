import 'package:flutter/material.dart';
import '../theme.dart';

class RecommendationFeedScreen extends StatefulWidget {
  final String mood;
  final String city;
  final void Function(List<Map<String, dynamic>> savedItems) onSave;

  const RecommendationFeedScreen({
    super.key,
    required this.mood,
    required this.city,
    required this.onSave,
  });

  @override
  State<RecommendationFeedScreen> createState() => _RecommendationFeedScreenState();
}

class _RecommendationFeedScreenState extends State<RecommendationFeedScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  String selectedCategory = 'All';
  final List<String> categories = ['All', 'Food', 'Experiences', 'Views', 'Culture', 'Shopping'];
  
  // Sample recommendation data
  late final List<Map<String, dynamic>> recommendations;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _animationController.forward();
    
    // Initialize sample data based on mood and city
    _initializeRecommendations();
  }

  void _initializeRecommendations() {
    // In a real app, you would fetch recommendations from an API based on mood and city
    recommendations = [
      {
        'id': '1',
        'title': 'Sunset Rooftop Lounge',
        'description': 'Enjoy breathtaking views of the city skyline while sipping craft cocktails.',
        'imageUrl': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7',
        'category': 'Food',
        'tags': ['Romantic', 'Upscale'],
        'isSaved': false,
      },
      {
        'id': '2',
        'title': 'Hidden Garden Café',
        'description': 'A secluded spot with artisanal coffee and fresh pastries.',
        'imageUrl': 'https://images.unsplash.com/photo-1521017432531-fbd92d768814',
        'category': 'Food',
        'tags': ['Relaxed', 'Hidden Gem'],
        'isSaved': false,
      },
      {
        'id': '3',
        'title': 'Moonlight Kayaking',
        'description': 'Paddle under the stars through the city waterways.',
        'imageUrl': 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce',
        'category': 'Experiences',
        'tags': ['Adventurous', 'Romantic'],
        'isSaved': false,
      },
      {
        'id': '4',
        'title': 'Museum of Contemporary Art',
        'description': 'Explore thought-provoking exhibitions from international artists.',
        'imageUrl': 'https://images.unsplash.com/photo-1554907984-15263bfd63bd',
        'category': 'Culture',
        'tags': ['Curious', 'Cultured'],
        'isSaved': false,
      },
      {
        'id': '5',
        'title': 'Mountain Overlook',
        'description': 'A stunning viewpoint offering panoramic city vistas.',
        'imageUrl': 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
        'category': 'Views',
        'tags': ['Relaxed', 'Scenic'],
        'isSaved': false,
      },
      {
        'id': '6',
        'title': 'Luxury Designer Mall',
        'description': 'Shop premium brands in an elegant atmosphere.',
        'imageUrl': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
        'category': 'Shopping',
        'tags': ['Upscale', 'Trendy'],
        'isSaved': false,
      },
    ];
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _showSaveOptions(int index) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => SaveOptionsOverlay(
        recommendation: recommendations[index],
        onSaveTo: (option) {
          Navigator.pop(context);
          setState(() {
            recommendations[index]['isSaved'] = true;
          });
          
          // Show a snackbar to confirm
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Added to $option'),
              backgroundColor: DriftTheme.surface,
              duration: const Duration(seconds: 2),
            ),
          );
          
          if (option == 'Itinerary') {
            // Navigate to build itinerary screen
            widget.onSave(recommendations.where((rec) => rec['isSaved']).toList());
          }
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Filter recommendations based on selected category
    final filteredRecommendations = selectedCategory == 'All'
        ? recommendations
        : recommendations.where((rec) => rec['category'] == selectedCategory).toList();
    
    return Scaffold(
      backgroundColor: DriftTheme.background,
      body: SafeArea(
        child: Column(
          children: [
            // App bar
            Padding(
              padding: const EdgeInsets.fromLTRB(24.0, 24.0, 24.0, 0.0),
              child: Row(
                children: [
                  SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(-0.2, 0),
                      end: Offset.zero,
                    ).animate(CurvedAnimation(
                      parent: _animationController,
                      curve: const Interval(0.0, 0.4, curve: Curves.easeOut),
                    )),
                    child: FadeTransition(
                      opacity: Tween<double>(begin: 0.0, end: 1.0).animate(
                        CurvedAnimation(
                          parent: _animationController,
                          curve: const Interval(0.0, 0.4, curve: Curves.easeOut),
                        ),
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.arrow_back_ios, color: DriftTheme.textPrimary),
                        onPressed: () => Navigator.pop(context),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        iconSize: 20,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0, -0.2),
                        end: Offset.zero,
                      ).animate(CurvedAnimation(
                        parent: _animationController,
                        curve: const Interval(0.1, 0.5, curve: Curves.easeOut),
                      )),
                      child: FadeTransition(
                        opacity: Tween<double>(begin: 0.0, end: 1.0).animate(
                          CurvedAnimation(
                            parent: _animationController,
                            curve: const Interval(0.1, 0.5, curve: Curves.easeOut),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.city,
                              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                    color: DriftTheme.textPrimary,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'Serif',
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Based on your ${widget.mood.toLowerCase()} mood',
                              style: const TextStyle(
                                color: DriftTheme.textMuted,
                                fontSize: 14,
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
            const SizedBox(height: 24),
            
            // Categories
            SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(0, 0.2),
                end: Offset.zero,
              ).animate(CurvedAnimation(
                parent: _animationController,
                curve: const Interval(0.2, 0.6, curve: Curves.easeOut),
              )),
              child: FadeTransition(
                opacity: Tween<double>(begin: 0.0, end: 1.0).animate(
                  CurvedAnimation(
                    parent: _animationController,
                    curve: const Interval(0.2, 0.6, curve: Curves.easeOut),
                  ),
                ),
                child: SizedBox(
                  height: 40,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    itemCount: categories.length,
                    itemBuilder: (context, index) {
                      final category = categories[index];
                      final isSelected = category == selectedCategory;
                      
                      return Padding(
                        padding: const EdgeInsets.only(right: 12.0),
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              selectedCategory = category;
                            });
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: isSelected ? DriftTheme.gold : DriftTheme.surface,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: isSelected ? DriftTheme.gold : DriftTheme.surfaceHover,
                                width: 1,
                              ),
                            ),
                            child: Text(
                              category,
                              style: TextStyle(
                                color: isSelected ? Colors.black : DriftTheme.textPrimary,
                                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            
            // Recommendations
            Expanded(
              child: filteredRecommendations.isEmpty
                  ? const Center(
                      child: Text(
                        'No recommendations found',
                        style: TextStyle(color: DriftTheme.textMuted),
                      ),
                    )
                  : ListView.builder(
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                      itemCount: filteredRecommendations.length,
                      itemBuilder: (context, index) {
                        final recommendation = filteredRecommendations[index];
                        
                        return AnimatedBuilder(
                          animation: _animationController,
                          builder: (context, child) {
                            final delay = 0.3 + index * 0.05;
                            final slideAnimation = Tween<Offset>(
                              begin: const Offset(0, 0.2),
                              end: Offset.zero,
                            ).animate(
                              CurvedAnimation(
                                parent: _animationController,
                                curve: Interval(
                                  delay.clamp(0.0, 1.0),
                                  (delay + 0.4).clamp(0.0, 1.0),
                                  curve: Curves.easeOutQuart,
                                ),
                              ),
                            );
                            
                            final fadeAnimation = Tween<double>(
                              begin: 0.0,
                              end: 1.0,
                            ).animate(
                              CurvedAnimation(
                                parent: _animationController,
                                curve: Interval(
                                  delay.clamp(0.0, 1.0),
                                  (delay + 0.4).clamp(0.0, 1.0),
                                  curve: Curves.easeOut,
                                ),
                              ),
                            );
                            
                            return FadeTransition(
                              opacity: fadeAnimation,
                              child: SlideTransition(
                                position: slideAnimation,
                                child: child,
                              ),
                            );
                          },
                          child: Padding(
                            padding: const EdgeInsets.only(bottom: 20.0),
                            child: RecommendationCard(
                              recommendation: recommendation,
                              onSave: () => _showSaveOptions(recommendations.indexOf(recommendation)),
                              onExplain: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Recommended because you are feeling ${widget.mood.toLowerCase()}'),
                                    backgroundColor: DriftTheme.surface,
                                  ),
                                );
                              },
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class RecommendationCard extends StatelessWidget {
  final Map<String, dynamic> recommendation;
  final VoidCallback onSave;
  final VoidCallback onExplain;

  const RecommendationCard({
    super.key,
    required this.recommendation,
    required this.onSave,
    required this.onExplain,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      // Removed fixed height to allow flexible sizing
      decoration: BoxDecoration(
        color: DriftTheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image
          Stack(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                child: Image.network(
                  recommendation['imageUrl'],
                  height: 180,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  loadingBuilder: (context, child, loadingProgress) {
                    if (loadingProgress == null) return child;
                    return Container(
                      height: 180,
                      color: DriftTheme.surfaceVariant,
                      child: const Center(
                        child: CircularProgressIndicator(
                          color: DriftTheme.gold,
                          strokeWidth: 2,
                        ),
                      ),
                    );
                  },
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      height: 180,
                      color: DriftTheme.surfaceVariant,
                      child: const Center(
                        child: Icon(
                          Icons.error_outline,
                          color: DriftTheme.textMuted,
                          size: 40,
                        ),
                      ),
                    );
                  },
                ),
              ),
              // Tags
              Positioned(
                top: 16,
                left: 16,
                child: Wrap(
                  spacing: 8,
                  children: List<Widget>.from(
                    (recommendation['tags'] as List<String>).map(
                      (tag) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: DriftTheme.surface.withOpacity(0.9),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          tag,
                          style: const TextStyle(
                            color: DriftTheme.textPrimary,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              // Save button
              Positioned(
                top: 16,
                right: 16,
                child: GestureDetector(
                  onTap: onSave,
                  child: Container(
                    height: 36,
                    width: 36,
                    decoration: BoxDecoration(
                      color: DriftTheme.surface.withOpacity(0.9),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Icon(
                      recommendation['isSaved'] ? Icons.bookmark : Icons.bookmark_outline,
                      color: recommendation['isSaved'] ? DriftTheme.gold : DriftTheme.textPrimary,
                      size: 20,
                    ),
                  ),
                ),
              ),
            ],
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  recommendation['title'],
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: DriftTheme.textPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Text(
                  recommendation['description'],
                  style: const TextStyle(
                    color: DriftTheme.textMuted,
                    fontSize: 14,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      recommendation['category'],
                      style: const TextStyle(
                        color: DriftTheme.gold,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    GestureDetector(
                      onTap: onExplain,
                      child: const Row(
                        children: [
                          Text(
                            'Why this?',
                            style: TextStyle(
                              color: DriftTheme.textMuted,
                              decoration: TextDecoration.underline,
                            ),
                          ),
                          SizedBox(width: 4),
                          Icon(
                            Icons.help_outline,
                            size: 16,
                            color: DriftTheme.textMuted,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class SaveOptionsOverlay extends StatelessWidget {
  final Map<String, dynamic> recommendation;
  final Function(String) onSaveTo;

  const SaveOptionsOverlay({
    super.key,
    required this.recommendation,
    required this.onSaveTo,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: DriftTheme.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 12),
          Container(
            height: 4,
            width: 40,
            decoration: BoxDecoration(
              color: DriftTheme.textMuted.withOpacity(0.5),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Save to',
            style: TextStyle(
              color: DriftTheme.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 24),
          _buildOption(
            context,
            'Add to Itinerary',
            Icons.calendar_today,
            () => onSaveTo('Itinerary'),
          ),
          const Divider(color: DriftTheme.surfaceHover, height: 1),
          _buildOption(
            context,
            'Explore Similar',
            Icons.travel_explore,
            () => onSaveTo('Similar'),
          ),
          const Divider(color: DriftTheme.surfaceHover, height: 1),
          _buildOption(
            context,
            'Plan Later',
            Icons.access_time,
            () => onSaveTo('Later'),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildOption(BuildContext context, String title, IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
        child: Row(
          children: [
            Icon(icon, color: DriftTheme.gold, size: 24),
            const SizedBox(width: 16),
            Text(
              title,
              style: const TextStyle(
                color: DriftTheme.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
