import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shimmer/shimmer.dart';
import 'package:intl/intl.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../theme.dart';
import 'mood_selector_screen.dart';

class HereNowPlannerScreen extends StatefulWidget {
  const HereNowPlannerScreen({super.key});

  @override
  State<HereNowPlannerScreen> createState() => _HereNowPlannerScreenState();
}

class _HereNowPlannerScreenState extends State<HereNowPlannerScreen> {
  String _currentCity = 'Loading...';
  String _currentWeather = '';
  String _weatherIcon = '';
  String _userName = 'Guest';
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserDataAndLocation();
  }

  Future<void> _loadUserDataAndLocation() async {
    await _loadUserName();
    await _getCurrentLocation();
  }

  Future<void> _loadUserName() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _userName = prefs.getString('name') ?? 'Guest';
    });
  }

  Future<void> _getCurrentLocation() async {
    setState(() {
      _isLoading = true;
    });
    try {
      Position position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high);
      List<Placemark> placemarks =
          await placemarkFromCoordinates(position.latitude, position.longitude);
      if (placemarks.isNotEmpty) {
        final placemark = placemarks.first;
        setState(() {
          _currentCity = placemark.locality ?? 'Unknown City';
        });
        await _getWeather(placemark.locality!);
      } else {
        setState(() {
          _currentCity = 'Unknown City';
        });
      }
    } catch (e) {
      debugPrint("Error getting location: $e");
      // Fallback for simulator
      setState(() {
        _currentCity = 'Atlanta';
      });
      await _getWeather('Atlanta');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _getWeather(String city) async {
    const apiKey = 'YOUR_API_KEY'; // Replace with your OpenWeatherMap API key
    final url =
        'https://api.openweathermap.org/data/2.5/weather?q=$city&appid=$apiKey&units=metric';

    try {
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          _currentWeather = "${data['main']['temp']}°C";
          _weatherIcon = data['weather'][0]['icon'];
        });
      } else {
        setState(() {
          _currentWeather = 'N/A';
        });
      }
    } catch (e) {
      debugPrint("Error getting weather: $e");
      setState(() {
        _currentWeather = 'N/A';
      });
    }
  }

  String _formatDate() {
    return DateFormat('EEEE, MMMM d').format(DateTime.now());
  }

  Widget _buildWeatherIcon(String iconCode) {
    if (iconCode.isEmpty) {
      return const SizedBox(width: 50, height: 50);
    }
    return SvgPicture.network(
      'http://openweathermap.org/img/wn/$iconCode.svg',
      width: 50,
      height: 50,
      placeholderBuilder: (BuildContext context) =>
          const CircularProgressIndicator(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: DriftTheme.background,
      appBar: AppBar(
        title: const Text('DRIFT', style: TextStyle(fontFamily: 'Poppins', fontWeight: FontWeight.bold)),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildPersonalizedGreeting(),
                    const SizedBox(height: 20),
                    _buildLocationAndWeather(),
                    const SizedBox(height: 30),
                    _buildCardCarousel(),
                    const SizedBox(height: 30),
                    _buildLuxuryCategoryGrid(),
                    const SizedBox(height: 30),
                    _buildMoodBasedDiscovery(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildPersonalizedGreeting() {
    return Text(
      'Good Morning, $_userName',
      style: const TextStyle(
        fontFamily: 'Poppins',
        fontSize: 28,
        fontWeight: FontWeight.bold,
        color: Colors.white,
      ),
    );
  }

  Widget _buildLocationAndWeather() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _currentCity,
              style: const TextStyle(
                fontFamily: 'Poppins',
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 5),
            Text(
              _formatDate(),
              style: TextStyle(
                fontFamily: 'Poppins',
                fontSize: 16,
                color: Colors.grey[400],
              ),
            ),
          ],
        ),
        Row(
          children: [
            _buildWeatherIcon(_weatherIcon),
            const SizedBox(width: 10),
            Text(
              _currentWeather,
              style: const TextStyle(
                fontFamily: 'Poppins',
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCardCarousel() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Curated for You',
          style: TextStyle(
            fontFamily: 'Poppins',
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 15),
        SizedBox(
          height: 200,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              _buildExperienceCard('https://images.unsplash.com/photo-1540575467063-178a50c2df87', 'Exclusive Event'),
              _buildExperienceCard('https://images.unsplash.com/photo-1414235077428-338989a2e8c0', 'Luxury Dining'),
              _buildExperienceCard('https://images.unsplash.com/photo-1540962351504-03099e0a754b', 'Private Jet'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildExperienceCard(String imageUrl, String title) {
    return Container(
      width: 160,
      margin: const EdgeInsets.only(right: 15),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        image: DecorationImage(
          image: NetworkImage(imageUrl),
          fit: BoxFit.cover,
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(15),
          gradient: LinearGradient(
            begin: Alignment.bottomRight,            colors: [
              Colors.black.withValues(alpha: 0.8),
              Colors.black.withValues(alpha: 0.2),
            ],
          ),
        ),
        child: Align(
          alignment: Alignment.bottomLeft,
          child: Padding(
            padding: const EdgeInsets.all(12.0),
            child: Text(
              title,
              style: const TextStyle(
                fontFamily: 'Poppins',
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLuxuryCategoryGrid() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Explore Luxury',
          style: TextStyle(
            fontFamily: 'Poppins',
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 15),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 15,
          mainAxisSpacing: 15,
          children: [
            _buildCategoryItem(Icons.airplanemode_active, 'Travel'),
            _buildCategoryItem(Icons.restaurant, 'Dining'),
            _buildCategoryItem(Icons.king_bed, 'Stays'),
            _buildCategoryItem(Icons.shopping_bag, 'Shopping'),
          ],
        ),
      ],
    );
  }

  Widget _buildCategoryItem(IconData icon, String title) {
    return Container(
      decoration: BoxDecoration(
        color: DriftTheme.surface,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            spreadRadius: 2,
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 40, color: DriftTheme.gold),
          const SizedBox(height: 10),
          Text(
            title,
            style: const TextStyle(
              fontFamily: 'Poppins',
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMoodBasedDiscovery() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'How do you feel today?',
          style: TextStyle(
            fontFamily: 'Serif',
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 16),
        GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => MoodSelectorScreen(
                  onMoodSelected: (mood) {
                    // You can handle the selected mood here or use a callback to MainNavigationScreen
                  },
                ),
              ),
            );
          },
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 24),
            decoration: BoxDecoration(
              gradient: LinearGradient(                colors: [
                  DriftTheme.gold.withValues(alpha: 0.8),
                  DriftTheme.gold,
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: DriftTheme.gold.withValues(alpha: 0.3),
                  blurRadius: 12,
                  spreadRadius: 0,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Mood-Based Discovery',
                      style: TextStyle(
                        fontFamily: 'Poppins',
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Find experiences tailored to your mood',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 14,
                        color: Colors.black.withValues(alpha: 0.8),
                      ),
                    ),
                  ],
                ),
                const CircleAvatar(
                  backgroundColor: Colors.black26,
                  radius: 24,
                  child: Icon(
                    Icons.arrow_forward_ios,
                    color: Colors.white,
                    size: 18,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class LuxuryShimmerEffect extends StatelessWidget {
  final Widget child;

  const LuxuryShimmerEffect({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey[800]!,
      highlightColor: Colors.grey[700]!,
      child: child,
    );
  }
}
