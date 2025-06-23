import 'package:flutter/material.dart';
import '../theme.dart';
import '../services/itinerary_service.dart' as service;
import 'image_gallery_screen.dart';
import 'mood_selector_screen.dart';

class ItineraryScreen extends StatefulWidget {
  final String mood;
  final String cityName;
  final double latitude;
  final double longitude;

  const ItineraryScreen({
    super.key,
    required this.mood,
    required this.cityName,
    required this.latitude,
    required this.longitude,
  });

  @override
  State<ItineraryScreen> createState() => _ItineraryScreenState();
}

class _ItineraryScreenState extends State<ItineraryScreen> 
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  Map<String, dynamic>? _itineraryData;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _generateItinerary();
  }

  Future<void> _generateItinerary() async {
    try {
      final itineraryService = service.ItineraryService();
      final result = await itineraryService.generateItinerary(
        mood: widget.mood,
        latitude: widget.latitude,
        longitude: widget.longitude,
        cityName: widget.cityName,
      );

      if (mounted) {
        setState(() {
          if (result['success'] == true) {
            _itineraryData = result;
            _isLoading = false;
            _animationController.forward();
          } else {
            _error = result['error'] ?? 'Failed to generate itinerary';
            _isLoading = false;
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: DriftTheme.background,      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Container(
          margin: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: DriftTheme.surface,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 8,
                spreadRadius: 0,
                offset: const Offset(0, 2),
              ),
            ],
          ),          child: IconButton(
            icon: const Icon(Icons.arrow_back, color: DriftTheme.textPrimary),
            onPressed: () => Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => MoodSelectorScreen(
                  onMoodSelected: (mood) {
                    // This callback won't be used since we're replacing the current screen
                  },
                ),
              ),
            ),
            tooltip: 'Back to mood selection',
          ),
        ),
        title: Text(
          '${widget.mood} Experience',
          style: const TextStyle(
            color: DriftTheme.textPrimary,
            fontWeight: FontWeight.bold,
            fontFamily: 'Serif',
          ),
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: DriftTheme.gold),
            SizedBox(height: 24),
            Text(
              'Curating your luxury experience...',
              style: TextStyle(
                color: DriftTheme.textSecondary,
                fontSize: 16,
              ),
            ),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                color: DriftTheme.textMuted,
                size: 48,
              ),
              const SizedBox(height: 16),
              Text(
                'Unable to create your itinerary',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: DriftTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: DriftTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    _isLoading = true;
                    _error = null;
                  });
                  _generateItinerary();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: DriftTheme.gold,
                  foregroundColor: Colors.black,
                ),
                child: const Text('Try Again'),
              ),
            ],
          ),
        ),
      );
    }

    final itinerary = _itineraryData?['itinerary'] as Map<String, dynamic>?;
    if (itinerary == null) {
      return const Center(
        child: Text(
          'No itinerary data available',
          style: TextStyle(color: DriftTheme.textSecondary),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: FadeTransition(
        opacity: _animationController,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(itinerary),
            const SizedBox(height: 32),
            _buildActivities(itinerary),
            const SizedBox(height: 32),
            _buildTips(itinerary),
            const SizedBox(height: 32),
            _buildVenues(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(Map<String, dynamic> itinerary) {
    return SlideTransition(
      position: Tween<Offset>(
        begin: const Offset(0, 0.2),
        end: Offset.zero,
      ).animate(CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.0, 0.6, curve: Curves.easeOut),
      )),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: DriftTheme.surface,
          borderRadius: BorderRadius.circular(20),          border: Border.all(color: DriftTheme.gold.withValues(alpha: 0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: DriftTheme.gold.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    widget.mood.toUpperCase(),
                    style: const TextStyle(
                      color: DriftTheme.gold,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const Spacer(),
                const Icon(Icons.location_on, color: DriftTheme.gold, size: 16),
                const SizedBox(width: 4),
                Text(
                  widget.cityName,
                  style: const TextStyle(
                    color: DriftTheme.textSecondary,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              itinerary['title'] ?? 'Your Luxury Experience',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                color: DriftTheme.textPrimary,
                fontWeight: FontWeight.bold,
                fontFamily: 'Serif',
              ),
            ),
            const SizedBox(height: 12),
            Text(
              itinerary['description'] ?? 'A curated experience just for you.',
              style: const TextStyle(
                color: DriftTheme.textSecondary,
                fontSize: 16,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActivities(Map<String, dynamic> itinerary) {
    final activities = itinerary['activities'] as List? ?? [];
    
    return SlideTransition(
      position: Tween<Offset>(
        begin: const Offset(0, 0.2),
        end: Offset.zero,
      ).animate(CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.2, 0.8, curve: Curves.easeOut),
      )),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Your Itinerary',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: DriftTheme.textPrimary,
              fontWeight: FontWeight.bold,
              fontFamily: 'Serif',
            ),
          ),
          const SizedBox(height: 16),
          ...activities.asMap().entries.map((entry) {
            final index = entry.key;
            final activity = entry.value as Map<String, dynamic>;
            return _buildActivityCard(activity, index);
          }),
        ],
      ),
    );
  }  Widget _buildActivityCard(Map<String, dynamic> activity, int index) {
    // Find venue or event in our data to get the image
    final venueName = activity['venue'] as String? ?? '';
    final venues = _itineraryData?['venues'] as List? ?? [];
    final events = _itineraryData?['events'] as List? ?? [];
    
    // First try to find matching venue
    final venueData = venues.cast<Map<String, dynamic>>().firstWhere(
      (venue) => (venue['name'] as String? ?? '').toLowerCase().contains(venueName.toLowerCase()),
      orElse: () => <String, dynamic>{},
    );
    
    // If no venue found, try to find matching event
    final eventData = venueData.isEmpty ? events.cast<Map<String, dynamic>>().firstWhere(
      (event) => (event['name']?['text'] as String? ?? '').toLowerCase().contains(venueName.toLowerCase()) ||
                  (activity['title'] as String? ?? '').toLowerCase().contains((event['name']?['text'] as String? ?? '').toLowerCase()),
      orElse: () => <String, dynamic>{},
    ) : <String, dynamic>{};
      // Get image URL from venue or event
    final imageUrl = venueData['image_url'] as String? ?? eventData['image_url'] as String? ?? _getFallbackImage(activity);
    
    return GestureDetector(
      onTap: () {
        _showImageGallery(context, imageUrl, activity['title'] ?? 'Activity');
      },      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: DriftTheme.surface,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 10,
              spreadRadius: 0,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: DriftTheme.gold.withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          '${index + 1}',
                          style: const TextStyle(
                            color: DriftTheme.gold,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            activity['time'] ?? '',
                            style: const TextStyle(
                              color: DriftTheme.gold,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            activity['title'] ?? '',
                            style: const TextStyle(
                              color: DriftTheme.textPrimary,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  activity['description'] ?? '',
                  style: const TextStyle(
                    color: DriftTheme.textSecondary,
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),
                if (activity['venue'] != null && activity['venue'].isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.place, color: DriftTheme.textMuted, size: 16),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${activity['venue']} - ${activity['address'] ?? ''}',
                          style: const TextStyle(
                            color: DriftTheme.textMuted,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),            // Tap indicator (all activities now have images)
            Positioned(
              top: 8,
              right: 8,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: DriftTheme.gold.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Icon(
                  Icons.photo_camera,
                  color: DriftTheme.gold,
                  size: 16,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTips(Map<String, dynamic> itinerary) {
    final tips = itinerary['tips'] as List? ?? [];
    if (tips.isEmpty) return const SizedBox.shrink();

    return SlideTransition(
      position: Tween<Offset>(
        begin: const Offset(0, 0.2),
        end: Offset.zero,
      ).animate(CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.4, 1.0, curve: Curves.easeOut),
      )),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: DriftTheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: DriftTheme.gold.withValues(alpha: 0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.lightbulb, color: DriftTheme.gold, size: 20),
                const SizedBox(width: 8),
                Text(
                  'Luxury Travel Tips',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: DriftTheme.textPrimary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ...tips.map((tip) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '•',
                    style: TextStyle(color: DriftTheme.gold, fontSize: 16),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      tip.toString(),
                      style: const TextStyle(
                        color: DriftTheme.textSecondary,
                        fontSize: 14,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildVenues() {
    final venues = _itineraryData?['venues'] as List? ?? [];
    if (venues.isEmpty) return const SizedBox.shrink();

    return SlideTransition(
      position: Tween<Offset>(
        begin: const Offset(0, 0.2),
        end: Offset.zero,
      ).animate(CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.6, 1.0, curve: Curves.easeOut),
      )),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Recommended Venues',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: DriftTheme.textPrimary,
              fontWeight: FontWeight.bold,
              fontFamily: 'Serif',
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: venues.length,
              itemBuilder: (context, index) {
                final venue = venues[index] as Map<String, dynamic>;
                return _buildVenueCard(venue);
              },
            ),
          ),
        ],
      ),
    );
  }  Widget _buildVenueCard(Map<String, dynamic> venue) {
    final location = venue['location'] as Map<String, dynamic>? ?? {};
    final imageUrl = venue['image_url'] as String? ?? _getVenueFallbackImage(venue);
    
    return GestureDetector(
      onTap: () {
        _showImageGallery(context, imageUrl, venue['name'] ?? 'Venue');
      },
      child: Container(
        width: 180,
        margin: const EdgeInsets.only(right: 16),        decoration: BoxDecoration(
          color: DriftTheme.surface,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 10,
              spreadRadius: 0,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [                Container(
                  height: 100,
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                    color: DriftTheme.surfaceHover,
                    image: DecorationImage(
                      image: NetworkImage(imageUrl),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          venue['name'] ?? 'Venue',
                          style: const TextStyle(
                            color: DriftTheme.textPrimary,
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 3),
                        if (venue['rating'] != null)
                          Row(
                            children: [
                              const Icon(Icons.star, color: DriftTheme.gold, size: 11),
                              const SizedBox(width: 2),
                              Text(
                                venue['rating'].toString(),
                                style: const TextStyle(
                                  color: DriftTheme.textSecondary,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        const Spacer(),
                        Text(
                          location['locality'] ?? location['region'] ?? '',
                          style: const TextStyle(
                            color: DriftTheme.textMuted,
                            fontSize: 10,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),            // Tap indicator for venues with images (all venues now have images)
            Positioned(
              top: 8,
              right: 8,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Icon(
                  Icons.zoom_in,
                  color: Colors.white,
                  size: 14,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getVenueFallbackImage(Map<String, dynamic> venue) {
    final venueName = (venue['name'] as String? ?? '').toLowerCase();
    
    // Generate fallback based on venue name/type
    if (venueName.contains('restaurant') || venueName.contains('dining') || venueName.contains('cafe') || venueName.contains('food')) {
      return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';
    } else if (venueName.contains('hotel') || venueName.contains('resort') || venueName.contains('accommodation')) {
      return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop';
    } else if (venueName.contains('bar') || venueName.contains('lounge') || venueName.contains('club')) {
      return 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&h=300&fit=crop';
    } else if (venueName.contains('spa') || venueName.contains('wellness') || venueName.contains('massage')) {
      return 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&h=300&fit=crop';
    } else if (venueName.contains('park') || venueName.contains('garden') || venueName.contains('nature')) {
      return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop';
    } else if (venueName.contains('museum') || venueName.contains('gallery') || venueName.contains('art')) {
      return 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop';
    } else if (venueName.contains('beach') || venueName.contains('ocean') || venueName.contains('sea')) {
      return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop';
    } else {
      // Generic luxury venue placeholder
      return 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop';
    }
  }

  String _getFallbackImage(Map<String, dynamic> activity) {
    final title = (activity['title'] as String? ?? '').toLowerCase();
    final venue = (activity['venue'] as String? ?? '').toLowerCase();
    final description = (activity['description'] as String? ?? '').toLowerCase();
    final combined = '$title $venue $description';
    
    // Generate fallback based on activity content
    if (combined.contains('restaurant') || combined.contains('dining') || combined.contains('food') || combined.contains('eat')) {
      return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';
    } else if (combined.contains('bar') || combined.contains('drink') || combined.contains('cocktail') || combined.contains('wine')) {
      return 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&h=300&fit=crop';
    } else if (combined.contains('spa') || combined.contains('wellness') || combined.contains('massage') || combined.contains('relax')) {
      return 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&h=300&fit=crop';
    } else if (combined.contains('music') || combined.contains('concert') || combined.contains('show') || combined.contains('performance')) {
      return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop';
    } else if (combined.contains('art') || combined.contains('museum') || combined.contains('gallery') || combined.contains('exhibition')) {
      return 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop';
    } else if (combined.contains('outdoor') || combined.contains('park') || combined.contains('nature') || combined.contains('adventure')) {
      return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop';
    } else if (combined.contains('beach') || combined.contains('ocean') || combined.contains('sea') || combined.contains('water')) {
      return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop';
    } else if (combined.contains('hotel') || combined.contains('accommodation') || combined.contains('stay')) {
      return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop';
    } else {
      // Generic luxury experience placeholder
      return 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop';
    }
  }

  void _showImageGallery(BuildContext context, String? imageUrl, String title) {
    // All activities now have images, so no need to check for null
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ImageGalleryScreen(
          imageUrl: imageUrl!,
          title: title,
        ),
      ),
    );
  }
}
