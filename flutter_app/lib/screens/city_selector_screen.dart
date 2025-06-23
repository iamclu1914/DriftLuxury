import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:http/http.dart' as http;
import '../theme.dart';

class CitySelectorScreen extends StatefulWidget {
  final String mood;
  final void Function(String city) onCitySelected;

  const CitySelectorScreen({super.key, required this.mood, required this.onCitySelected});

  @override
  State<CitySelectorScreen> createState() => _CitySelectorScreenState();
}

class _CitySelectorScreenState extends State<CitySelectorScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  String? selectedCity;
  bool _isLoading = false;
  final TextEditingController _searchController = TextEditingController();

  final List<String> trendingCities = [
    'New York, USA',
    'Paris, France',
    'Tokyo, Japan',
    'London, UK',
    'Rome, Italy',
    'Dubai, UAE',
    'Barcelona, Spain',
    'Sydney, Australia',
  ];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _getCurrentLocation() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Check if location services are enabled
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _showError('Location services are disabled. Please enable them in settings.');
        return;
      }

      // Check location permissions
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          _showError('Location permissions are denied. Please grant permission to detect your location.');
          return;
        }
      }
      
      if (permission == LocationPermission.deniedForever) {
        _showError('Location permissions are permanently denied. Please enable them in settings.');
        return;
      }

      // Show loading feedback to user
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Detecting your location...'),
            backgroundColor: DriftTheme.surface,
            duration: Duration(seconds: 2),
          ),
        );
      }

      // Get current position with high accuracy and timeout
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 15),
      );
        // Debug: Print coordinates to help identify if it's simulator location
      debugPrint('Detected coordinates: ${position.latitude}, ${position.longitude}');
      
      // Check if this is likely a simulator location (Apple Park area)
      final isLikelySimulator = (position.latitude >= 37.3 && position.latitude <= 37.4) &&
                                (position.longitude >= -122.1 && position.longitude <= -122.0);
      
      if (isLikelySimulator) {
        // Show simulator location picker
        _showSimulatorLocationPicker();
        return;
      }
      
      await _getCityFromCoordinates(position.latitude, position.longitude);
      
      // Show success message
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Location detected: $selectedCity'),
            backgroundColor: DriftTheme.surface,
            duration: const Duration(seconds: 2),
          ),
        );
      }
      
    } catch (e) {
      debugPrint('Location error: $e'); // For debugging
      
      // Check if this is a simulator-related issue
      if (e.toString().contains('simulator') || 
          e.toString().contains('location') ||
          e.toString().contains('timeout') ||
          e.toString().contains('LocationServiceDisabledException')) {
        
        // For simulator, show location picker instead of just defaulting to Atlanta
        _showSimulatorLocationPicker();
        
      } else {
        _showError('Could not detect location. Please search manually or try again.');
      }
    } finally {
      // Don't set loading to false here if we're showing the picker
      // The picker method will handle it
    }
  }

  Future<void> _getCityFromCoordinates(double lat, double lon) async {
    try {
      // First try with native geocoding
      List<Placemark> placemarks = await placemarkFromCoordinates(lat, lon);

      if (placemarks.isNotEmpty) {
        Placemark place = placemarks.first;
        final cityName = place.locality ?? place.subAdministrativeArea ?? '';
        final state = place.administrativeArea ?? '';
        final country = place.country ?? '';

        String locationString = '';
        if (cityName.isNotEmpty) {
          locationString = cityName;
          if (state.isNotEmpty) {
            locationString += ', $state';
          }
          if (country.isNotEmpty) {
            locationString += ', $country';
          }
        } else if (state.isNotEmpty) {
          locationString = state;
          if (country.isNotEmpty) {
            locationString += ', $country';
          }
        } else if (country.isNotEmpty) {
          locationString = country;
        }

        if (locationString.isNotEmpty) {
          setState(() {
            selectedCity = locationString;
            _searchController.text = locationString; // Update search box
          });
          return;
        }
      }
      
      // If native geocoding fails, try with OpenStreetMap API
      throw Exception('Native geocoding failed, trying backup');
      
    } catch (e) {
      // Try reverse geocoding with OpenStreetMap API as fallback
      try {
        final url = 'https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lon&zoom=10&addressdetails=1';
        final response = await http.get(
          Uri.parse(url),
          headers: {
            'User-Agent': 'DriftLuxury/1.0 (contact@driftluxury.com)', // Required by Nominatim
          },
        );
        
        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          final address = data['address'] ?? {};
          
          String city = address['city'] ?? 
                        address['town'] ?? 
                        address['village'] ?? 
                        address['municipality'] ?? '';
          
          String state = address['state'] ?? 
                         address['province'] ?? 
                         address['region'] ?? '';
          
          String country = address['country'] ?? '';
          
          String locationString = '';
          if (city.isNotEmpty) {
            locationString = city;
            if (state.isNotEmpty) {
              locationString += ', $state';
            }
          } else if (state.isNotEmpty) {
            locationString = state;
          }
          
          if (country.isNotEmpty && locationString.isNotEmpty) {
            locationString += ', $country';
          } else if (country.isNotEmpty) {
            locationString = country;
          }
          
          if (locationString.isNotEmpty) {
            setState(() {
              selectedCity = locationString;
              _searchController.text = locationString; // Update search box
            });
          } else {
            throw Exception('Could not determine location name from coordinates');
          }
        } else {
          throw Exception('Failed to get location name from backup service');
        }
      } catch (e2) {
        debugPrint('Geocoding error: $e2'); // For debugging
        _showError('Could not determine city name from your location. Please search manually.');
      }
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.warning_amber_rounded, color: Colors.white),
            const SizedBox(width: 8),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: Colors.orange.shade800,
        duration: const Duration(seconds: 4),
        action: SnackBarAction(
          label: 'Dismiss',
          textColor: Colors.white,
          onPressed: () {
            ScaffoldMessenger.of(context).hideCurrentSnackBar();
          },
        ),
      ),
    );
    
    setState(() {
      _isLoading = false;
    });
  }

  void _search(String query) {
    // In a real app, you would use an API to search for cities
    if (query.isNotEmpty) {
      setState(() {
        selectedCity = query;
      });
    }
  }

  void _showSimulatorLocationPicker() {
    setState(() {
      _isLoading = false;
    });

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (BuildContext context) {
        return Container(
          decoration: const BoxDecoration(
            color: DriftTheme.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 12),
              Container(
                height: 4,
                width: 40,
                decoration: BoxDecoration(
                  color: DriftTheme.textMuted.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Simulator Detected',
                style: TextStyle(
                  color: DriftTheme.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 24.0),
                child: Text(
                  'Choose your actual location:',
                  style: TextStyle(
                    color: DriftTheme.textSecondary,
                    fontSize: 14,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 24),
              _buildLocationOption('Atlanta, GA, USA', Icons.location_city),
              _buildLocationOption('New York, NY, USA', Icons.location_city),
              _buildLocationOption('Los Angeles, CA, USA', Icons.location_city),
              _buildLocationOption('Chicago, IL, USA', Icons.location_city),
              _buildLocationOption('Miami, FL, USA', Icons.location_city),
              _buildLocationOption('Other (use search)', Icons.search),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  Widget _buildLocationOption(String location, IconData icon) {
    return InkWell(
      onTap: () {
        Navigator.pop(context);
        if (location == 'Other (use search)') {
          // Just close the modal and let user search manually
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Please type your city in the search box above'),
              backgroundColor: DriftTheme.surface,
            ),
          );
        } else {
          setState(() {
            selectedCity = location;
            _searchController.text = location;
          });
          
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Location set to: $location'),
              backgroundColor: DriftTheme.surface,
            ),
          );
        }
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
        child: Row(
          children: [
            Icon(icon, color: DriftTheme.gold, size: 20),
            const SizedBox(width: 16),
            Text(
              location,
              style: const TextStyle(
                color: DriftTheme.textPrimary,
                fontSize: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: DriftTheme.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 40.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Back button
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
                  ),                ),
              ),
              const SizedBox(height: 12),

              // Title
              SlideTransition(
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
                  child: Text(
                    'Where do you want to vibe today?',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          color: DriftTheme.textPrimary,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Serif',
                        ),                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Search bar with location button
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
                  child: Container(
                    height: 56,
                    decoration: BoxDecoration(
                      color: DriftTheme.surface,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _searchController,
                            onSubmitted: _search,
                            style: const TextStyle(color: DriftTheme.textPrimary),
                            decoration: const InputDecoration(
                              hintText: 'Search for a city',
                              hintStyle: TextStyle(color: DriftTheme.textMuted),
                              prefixIcon: Icon(Icons.search, color: DriftTheme.textMuted),
                              border: InputBorder.none,
                              contentPadding: EdgeInsets.symmetric(vertical: 16),
                            ),
                          ),
                        ),
                        Container(
                          height: 56,
                          width: 56,
                          decoration: BoxDecoration(
                            color: DriftTheme.surfaceVariant,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: IconButton(
                            icon: _isLoading
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      color: DriftTheme.gold,
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Icon(Icons.my_location),
                            color: DriftTheme.gold,
                            onPressed: _isLoading ? null : _getCurrentLocation,
                          ),
                        ),
                      ],
                    ),
                  ),                ),
              ),
              const SizedBox(height: 20),

              // Section title
              SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(0, 0.2),
                  end: Offset.zero,
                ).animate(CurvedAnimation(
                  parent: _animationController,
                  curve: const Interval(0.3, 0.7, curve: Curves.easeOut),
                )),
                child: FadeTransition(
                  opacity: Tween<double>(begin: 0.0, end: 1.0).animate(
                    CurvedAnimation(
                      parent: _animationController,
                      curve: const Interval(0.3, 0.7, curve: Curves.easeOut),
                    ),
                  ),
                  child: const Text(
                    'Trending Destinations',
                    style: TextStyle(
                      color: DriftTheme.textSecondary,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // City cards
              Expanded(
                child: ListView.builder(
                  physics: const BouncingScrollPhysics(),
                  itemCount: trendingCities.length,
                  itemBuilder: (context, index) {
                    final city = trendingCities[index];
                    final isSelected = city == selectedCity;
                    
                    return AnimatedBuilder(
                      animation: _animationController,
                      builder: (context, child) {
                        final delay = 0.4 + index * 0.05;
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
                        padding: const EdgeInsets.only(bottom: 12.0),
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              selectedCity = city;
                            });
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            decoration: BoxDecoration(
                              color: isSelected ? DriftTheme.surfaceHover : DriftTheme.surface,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isSelected ? DriftTheme.gold : Colors.transparent,
                                width: 2,
                              ),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 16.0, horizontal: 20.0),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.location_on,
                                  color: isSelected ? DriftTheme.gold : DriftTheme.textMuted,
                                  size: 20,
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  city,
                                  style: TextStyle(
                                    color: isSelected ? DriftTheme.gold : DriftTheme.textPrimary,
                                    fontSize: 16,
                                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                                  ),
                                ),
                                const Spacer(),
                                if (isSelected)
                                  const Icon(Icons.check_circle, color: DriftTheme.gold, size: 20),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );                  },
                ),              ),
              const SizedBox(height: 8),

              // Continue button
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
                    ),                  ),                  child: Container(
                    padding: const EdgeInsets.only(bottom: 0),
                    child: Center(
                      child: SizedBox(
                        width: MediaQuery.of(context).size.width > 600 ? 240 : 200,
                        child: ElevatedButton(
                        onPressed: selectedCity != null
                            ? () => widget.onCitySelected(selectedCity!)
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
                          'Continue',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,                            color: selectedCity != null ? Colors.black : Colors.black45,
                          ),
                        ),
                      ),
                    ),
                  ),                ),
              ),
            ),
            ],
          ),
        ),
      ),
    );
  }
}
