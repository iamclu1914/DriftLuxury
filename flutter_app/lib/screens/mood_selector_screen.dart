import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme.dart';
import 'itinerary_screen.dart';

class MoodSelectorScreen extends StatefulWidget {
  final void Function(String mood) onMoodSelected;
  const MoodSelectorScreen({super.key, required this.onMoodSelected});

  @override
  State<MoodSelectorScreen> createState() => _MoodSelectorScreenState();
}

class _MoodSelectorScreenState extends State<MoodSelectorScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  String? selectedMood;
  String _userName = 'Guest';
  String _currentLocation = 'Loading location...';
  String _greeting = 'Good day';
  bool _isLoading = true;
  double? _latitude;
  double? _longitude;
  String _cityName = '';
  
  final List<Map<String, dynamic>> moods = [
    {'name': 'Adventurous', 'icon': Icons.terrain, 'color': const Color(0xFF7EFF9C)},
    {'name': 'Relaxed', 'icon': Icons.spa, 'color': const Color(0xFF7EB6FF)},
    {'name': 'Romantic', 'icon': Icons.favorite, 'color': const Color(0xFFFF7E7E)},
    {'name': 'Social', 'icon': Icons.people, 'color': const Color(0xFFFFD700)},
  ];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _initializeUserData();
  }

  Future<void> _initializeUserData() async {
    await _loadUserName();
    _setGreeting();
    await _getCurrentLocation();
    _animationController.forward();
    setState(() {
      _isLoading = false;
    });
  }

  Future<void> _loadUserName() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _userName = prefs.getString('name') ?? 'Guest';
    });
  }

  void _setGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) {
      _greeting = 'Good morning';
    } else if (hour < 17) {
      _greeting = 'Good afternoon';
    } else {
      _greeting = 'Good evening';
    }
  }

  Future<void> _getCurrentLocation() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _currentLocation = 'Location access denied';
          });
          return;
        }
      }
      
      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _currentLocation = 'Location access denied';
        });
        return;
      }      final position = await Geolocator.getCurrentPosition();
      _latitude = position.latitude;
      _longitude = position.longitude;
      
      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude, 
        position.longitude
      );

      if (placemarks.isNotEmpty) {
        Placemark place = placemarks.first;
        final city = place.locality ?? place.subAdministrativeArea ?? 'Unknown City';
        final state = place.administrativeArea ?? '';
        _cityName = city;
        setState(() {
          _currentLocation = state.isNotEmpty ? '$city, $state' : city;
        });
      }
    } catch (e) {
      // Fallback for simulator
      _latitude = 33.7490;
      _longitude = -84.3880;
      _cityName = 'Atlanta';
      setState(() {
        _currentLocation = 'Atlanta, GA';
      });
    }
  }
  void _navigateToItinerary() {
    if (selectedMood != null && _latitude != null && _longitude != null) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => ItineraryScreen(
            mood: selectedMood!,
            cityName: _cityName.isNotEmpty ? _cityName : 'Current Location',
            latitude: _latitude!,
            longitude: _longitude!,
          ),
        ),
      );
      // Also call the original callback for any additional handling
      widget.onMoodSelected(selectedMood!);
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
      backgroundColor: DriftTheme.background,
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                color: DriftTheme.gold,
              ),
            )
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 40.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Greeting and location
                    SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0, -0.2),
                        end: Offset.zero,
                      ).animate(CurvedAnimation(
                        parent: _animationController,
                        curve: Curves.easeOutQuart,
                      )),
                      child: FadeTransition(
                        opacity: Tween<double>(begin: 0.0, end: 1.0).animate(
                          CurvedAnimation(
                            parent: _animationController,
                            curve: const Interval(0.0, 0.6, curve: Curves.easeOut),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '$_greeting, $_userName',
                              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                    color: DriftTheme.textPrimary,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'Serif',
                                  ),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(
                                  Icons.location_on,
                                  color: DriftTheme.gold,
                                  size: 18,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  _currentLocation,
                                  style: const TextStyle(
                                    color: DriftTheme.textSecondary,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),                            ],                        ),
                      ),
                    ),
                    const SizedBox(height: 48),
                    SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0, -0.2),
                        end: Offset.zero,
                      ).animate(CurvedAnimation(
                        parent: _animationController,
                        curve: const Interval(0.2, 0.8, curve: Curves.easeOutQuart),
                      )),
                      child: FadeTransition(
                        opacity: Tween<double>(begin: 0.0, end: 1.0).animate(
                          CurvedAnimation(
                            parent: _animationController,
                            curve: const Interval(0.2, 0.8, curve: Curves.easeOut),
                          ),                        ),                        child: Center(
                          child: Text(
                            'What\'s Your Vibe?',
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  color: DriftTheme.textPrimary,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'Serif',
                                ),
                          ),                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                    Expanded(
                      child: GridView.builder(
                        physics: const BouncingScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 1.2,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                        ),
                        itemCount: moods.length,
                        itemBuilder: (context, index) {
                          final mood = moods[index];
                          final isSelected = mood['name'] == selectedMood;
                          
                          return AnimatedBuilder(
                            animation: _animationController,
                            builder: (context, child) {
                              final delay = 0.4 + index * 0.1;
                              final slideAnimation = Tween<Offset>(
                                begin: const Offset(0, 0.5),
                                end: Offset.zero,
                              ).animate(
                                CurvedAnimation(
                                  parent: _animationController,
                                  curve: Interval(
                                    delay.clamp(0.0, 1.0),
                                    (delay + 0.5).clamp(0.0, 1.0),
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
                                    (delay + 0.5).clamp(0.0, 1.0),
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
                            child: GestureDetector(
                              onTap: () {
                                setState(() {
                                  selectedMood = mood['name'];
                                });
                              },
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 300),
                                decoration: BoxDecoration(                                  color: isSelected ? mood['color'].withValues(alpha: 0.3) : DriftTheme.surface,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: isSelected ? mood['color'] : Colors.transparent,
                                    width: 2,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: isSelected ? mood['color'].withValues(alpha: 0.3) : Colors.black.withValues(alpha: 0.1),
                                      blurRadius: 10,
                                      spreadRadius: 0,
                                      offset: const Offset(0, 5),
                                    ),
                                  ],
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      mood['icon'],
                                      size: 40,
                                      color: isSelected ? mood['color'] : DriftTheme.textMuted,
                                    ),
                                    const SizedBox(height: 12),
                                    Text(
                                      mood['name'],
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                        color: isSelected ? mood['color'] : DriftTheme.textPrimary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),                            ),
                          );                        },
                      ),
                    ),
                    const SizedBox(height: 8),
                    SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0, 0.5),
                        end: Offset.zero,
                      ).animate(
                        CurvedAnimation(
                          parent: _animationController,
                          curve: const Interval(0.6, 1.0, curve: Curves.easeOutQuart),
                        ),
                      ),
                      child: FadeTransition(
                        opacity: Tween<double>(begin: 0.0, end: 1.0).animate(
                          CurvedAnimation(
                            parent: _animationController,
                            curve: const Interval(0.6, 1.0, curve: Curves.easeOut),
                          ),                        ),                        child: Container(
                          padding: const EdgeInsets.only(bottom: 0),
                          child: Center(
                            child: SizedBox(
                              width: MediaQuery.of(context).size.width > 600 ? 240 : 200,
                              child: ElevatedButton(                              onPressed: selectedMood != null && _latitude != null && _longitude != null
                                  ? () => _navigateToItinerary()
                                  : null,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: DriftTheme.gold,
                                foregroundColor: Colors.black,
                                disabledBackgroundColor: DriftTheme.gold.withValues(alpha: 0.3),
                                disabledForegroundColor: Colors.black45,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                              ),
                              child: Text(
                                'Continue',                                style: TextStyle(
                                  fontSize: 15, // Reduced from 16 for better proportion
                                  fontWeight: FontWeight.w600,
                                  color: selectedMood != null ? Colors.black : Colors.black45,
                                ),
                              ),
                            ),
                          ),                        ),
                      ),
                    ),
                  ),
                  ],
                ),
              ),
            ),
    );
  }
}
